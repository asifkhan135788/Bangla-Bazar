import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings/payment
export async function GET() {
  try {
    const bkashNumber = await db.settings.findUnique({
      where: { key: 'bkash_number' },
    })
    const nagadNumber = await db.settings.findUnique({
      where: { key: 'nagad_number' },
    })
    const codCharge = await db.settings.findUnique({
      where: { key: 'cod_delivery_charge' },
    })

    return NextResponse.json({
      bkashNumber: bkashNumber?.value ? String(bkashNumber.value) : '0171-0000000',
      nagadNumber: nagadNumber?.value ? String(nagadNumber.value) : '0181-0000000',
      codDeliveryCharge: codCharge?.value ? Number(codCharge.value) : 60,
    })
  } catch (error) {
    console.error('Payment settings GET error:', error)
    return NextResponse.json({
      bkashNumber: '0171-0000000',
      nagadNumber: '0181-0000000',
      codDeliveryCharge: 60,
    })
  }
}
