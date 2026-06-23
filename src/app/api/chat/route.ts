import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeInput } from '@/lib/security'

// GET /api/chat?senderId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderId = searchParams.get('senderId')
    const userId = searchParams.get('userId')

    if (!senderId || !userId) {
      return NextResponse.json(
        { error: 'senderId and userId are required' },
        { status: 400 }
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
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, message } = body

    if (!senderId || !receiverId || !message) {
      return NextResponse.json(
        { error: 'senderId, receiverId, and message are required' },
        { status: 400 }
      )
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Sanitize the message (strip HTML tags)
    const sanitizedMessage = sanitizeInput(message.trim())

    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message contains invalid content' },
        { status: 400 }
      )
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        senderId,
        receiverId,
        message: sanitizedMessage,
      },
    })

    return NextResponse.json({ message: chatMessage }, { status: 201 })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
