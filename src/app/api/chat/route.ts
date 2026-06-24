import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeInput, getSecurityHeaders } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

// Helper: resolve 'admin' to actual admin user UUID
async function resolveAdminId(userId: string): Promise<string> {
  if (userId === 'admin') {
    const admin = await db.user.findFirst({
      where: { role: 'admin' },
      select: { id: true },
    })
    if (admin) return admin.id
  }
  return userId
}

// GET /api/chat?action=conversations&userId=xxx
// GET /api/chat?action=user_info&userId=xxx
// GET /api/chat?senderId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ── Get conversations list ──
    if (action === 'conversations') {
      const rawUserId = searchParams.get('userId') || ''
      const userId = await resolveAdminId(rawUserId)

      if (!rawUserId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400, headers })
      }

      // Get all unique conversations for this user
      const messages = await db.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, email: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, avatar: true, email: true, role: true },
          },
        },
      })

      // Group by conversation partner
      const conversationMap = new Map<string, {
        otherUserId: string
        otherUserName: string
        otherUserAvatar: string | null
        lastMessage: string
        lastMessageTime: string
        unreadCount: number
        senderType: string
        isOtherAdmin: boolean
      }>()

      for (const msg of messages) {
        const otherIsSender = msg.senderId !== userId
        const otherUser = otherIsSender ? msg.sender : msg.receiver
        const otherId = otherUser?.id || (otherIsSender ? msg.senderId : msg.receiverId || '')

        if (!otherId || !conversationMap.has(otherId)) {
          const isAdmin = otherUser?.role === 'admin' || rawUserId === 'admin'
          conversationMap.set(otherId, {
            otherUserId: otherId,
            otherUserName: otherUser?.name || (isAdmin ? 'Customer Support' : otherId.slice(-8).toUpperCase()),
            otherUserAvatar: otherUser?.avatar || null,
            lastMessage: msg.message.slice(0, 50),
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: 0,
            senderType: msg.senderType,
            isOtherAdmin: otherUser?.role === 'admin',
          })
        }

        // Count unread messages from the other user
        if (msg.senderId === otherId && !msg.read) {
          const conv = conversationMap.get(otherId)!
          conv.unreadCount++
        }
      }

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())

      return NextResponse.json({ conversations }, { status: 200, headers })
    }

    // ── Get user info ──
    if (action === 'user_info') {
      const rawUserId = searchParams.get('userId') || ''
      const userId = await resolveAdminId(rawUserId)

      if (!rawUserId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400, headers })
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, avatar: true, email: true },
      })

      if (!user) {
        // If it was 'admin' and no admin user found, return a placeholder
        if (rawUserId === 'admin') {
          return NextResponse.json({
            user: { id: 'admin', name: 'Customer Support', avatar: null, email: 'admin@banglabazar.com' }
          }, { status: 200, headers })
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers })
      }

      return NextResponse.json({ user }, { status: 200, headers })
    }

    // ── Get messages between two users ──
    const rawSenderId = searchParams.get('senderId') || ''
    const rawUserId = searchParams.get('userId') || ''

    if (!rawSenderId || !rawUserId) {
      return NextResponse.json(
        { error: 'senderId and userId are required' },
        { status: 400, headers }
      )
    }

    const senderId = await resolveAdminId(rawSenderId)
    const userId = await resolveAdminId(rawUserId)

    // Fetch messages between these two users (both directions)
    const messages = await db.chatMessage.findMany({
      where: {
        OR: [
          { senderId, receiverId: userId },
          { senderId: userId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ messages }, { status: 200, headers })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500, headers }
    )
  }
}

// POST /api/chat - Send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { senderId, receiverId, message } = body

    if (!senderId || !receiverId || !message) {
      return NextResponse.json(
        { error: 'senderId, receiverId, and message are required' },
        { status: 400, headers }
      )
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400, headers }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400, headers }
      )
    }

    // Sanitize the message (strip HTML tags)
    const sanitizedMessage = sanitizeInput(message.trim())

    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message contains invalid content' },
        { status: 400, headers }
      )
    }

    // Resolve 'admin' to actual UUIDs
    senderId = await resolveAdminId(senderId)
    receiverId = await resolveAdminId(receiverId)

    // Determine sender type
    const sender = await db.user.findUnique({ where: { id: senderId }, select: { role: true, name: true } })
    const senderType = sender?.role === 'admin' ? 'admin' : 'customer'

    const chatMessage = await db.chatMessage.create({
      data: {
        senderId,
        receiverId,
        message: sanitizedMessage,
        senderType,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ message: chatMessage }, { status: 201, headers })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500, headers }
    )
  }
}

// DELETE /api/chat - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, userId } = body

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'messageId and userId are required' },
        { status: 400, headers }
      )
    }

    const resolvedUserId = await resolveAdminId(userId)

    // Find the message first
    const message = await db.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404, headers }
      )
    }

    // Only allow deleting own messages
    if (message.senderId !== resolvedUserId) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403, headers }
      )
    }

    await db.chatMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ message: 'Message deleted' }, { status: 200, headers })
  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500, headers }
    )
  }
}

// PATCH /api/chat - Edit a message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, userId, message: newMessage } = body

    if (!messageId || !userId || !newMessage) {
      return NextResponse.json(
        { error: 'messageId, userId, and message are required' },
        { status: 400, headers }
      )
    }

    if (typeof newMessage !== 'string' || newMessage.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400, headers }
      )
    }

    if (newMessage.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400, headers }
      )
    }

    const resolvedUserId = await resolveAdminId(userId)
    const sanitizedMessage = sanitizeInput(newMessage.trim())

    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message contains invalid content' },
        { status: 400, headers }
      )
    }

    // Find the message first
    const existingMessage = await db.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404, headers }
      )
    }

    // Only allow editing own messages
    if (existingMessage.senderId !== resolvedUserId) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403, headers }
      )
    }

    const updatedMessage = await db.chatMessage.update({
      where: { id: messageId },
      data: { message: sanitizedMessage },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ message: updatedMessage }, { status: 200, headers })
  } catch (error) {
    console.error('Chat PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500, headers }
    )
  }
}

// PUT /api/chat - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let { action, senderId, receiverId } = body

    if (action === 'mark_read' && senderId && receiverId) {
      // Resolve 'admin' to actual UUIDs
      senderId = await resolveAdminId(senderId)
      receiverId = await resolveAdminId(receiverId)

      await db.chatMessage.updateMany({
        where: {
          senderId,
          receiverId,
          read: false,
        },
        data: { read: true },
      })

      return NextResponse.json({ message: 'Messages marked as read' }, { status: 200, headers })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400, headers }
    )
  } catch (error) {
    console.error('Chat PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update messages' },
      { status: 500, headers }
    )
  }
}
