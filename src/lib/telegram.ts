const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

interface TransactionInfo {
  orderId: string
  customerName: string
  customerPhone: string
  amount: number
  paymentMethod: 'bkash' | 'nagad' | 'cod' | 'rocket' | 'card'
  transactionId?: string
  items: string
}

export async function sendTransactionAlert(info: TransactionInfo): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('[Telegram] Bot not configured, skipping alert')
    return false
  }

  const methodLabel = info.paymentMethod === 'bkash' ? 'bKash' :
                      info.paymentMethod === 'nagad' ? 'Nagad' :
                      info.paymentMethod === 'rocket' ? 'Rocket' :
                      info.paymentMethod === 'card' ? 'Card' : 'Cash on Delivery'

  const text = [
    '🛍️ NEW ORDER - Bangla Bazar',
    '━━━━━━━━━━━━━━━',
    `Order: #${info.orderId}`,
    `Customer: ${info.customerName}`,
    `Phone: ${info.customerPhone}`,
    `Amount: ৳${info.amount.toLocaleString()}`,
    `Payment: ${methodLabel}`,
    info.transactionId ? `Txn ID: ${info.transactionId}` : '',
    `Items: ${info.items}`,
    '━━━━━━━━━━━━━━━',
    `Time: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}`,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    )
    const data = await res.json()
    return data.ok === true
  } catch (error) {
    console.error('[Telegram] Failed to send alert:', error)
    return false
  }
}
