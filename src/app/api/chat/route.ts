import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeInput, getSecurityHeaders } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

// GET /api/chat?action=conversations&userId=xxx
// GET /api/chat?action=user_info&userId=xxx
// GET /api/chat?senderId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ── Get conversations list ──
    if (action === 'conversations') {
      const userId = searchParams.get('userId')
      if (!userId) {
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
            select: { id: true, name: true, avatar: true, email: true },
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
      }>()

      for (const msg of messages) {
        const otherId = msg.senderId === userId ? (msg.receiverId || 'admin') : msg.senderId
        if (!conversationMap.has(otherId)) {
          const isSender = msg.senderId === userId
          conversationMap.set(otherId, {
            otherUserId: otherId,
            otherUserName: otherId === 'admin'
              ? 'Customer Support'
              : (msg.sender?.name || otherId.slice(-8).toUpperCase()),
            otherUserAvatar: otherId === 'admin' ? null : (msg.sender?.avatar || null),
            lastMessage: msg.message.slice(0, 50),
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: 0,
            senderType: msg.senderType,
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
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400, headers })
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, avatar: true, email: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers })
      }

      return NextResponse.json({ user }, { status: 200, headers })
    }

    // ── Get messages between two users ──
    const senderId = searchParams.get('senderId')
    const userId = searchParams.get('userId')

    if (!senderId || !userId) {
      return NextResponse.json(
        { error: 'senderId and userId are required' },
        { status: 400, headers }
      )
    }

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
    const { senderId, receiverId, message } = body

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

// PUT /api/chat - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, senderId, receiverId } = body

    if (action === 'mark_read' && senderId && receiverId) {
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
