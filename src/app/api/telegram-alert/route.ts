import { NextResponse } from 'next/server'
import { sendTransactionAlert } from '@/lib/telegram'
import { getSecurityHeaders } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, customerName, customerPhone, amount, paymentMethod, transactionId, items } = body

    if (!orderId || !customerName || !customerPhone || !amount || !paymentMethod || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      )
    }

    const sent = await sendTransactionAlert({
      orderId,
      customerName,
      customerPhone,
      amount: Number(amount),
      paymentMethod,
      transactionId,
      items,
    })

    return NextResponse.json(
      { sent, message: sent ? 'Alert sent' : 'Alert skipped (bot not configured)' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Telegram alert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
