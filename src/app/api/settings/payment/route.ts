import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAdminAccess, getSecurityHeaders } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

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

// PUT /api/settings/payment — Update payment settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const body = await request.json()
    const { bkashNumber, nagadNumber, codDeliveryCharge } = body

    // Validate inputs
    if (bkashNumber !== undefined) {
      if (typeof bkashNumber !== 'string' || bkashNumber.length > 20) {
        return NextResponse.json({ error: 'Invalid bKash number' }, { status: 400, headers })
      }
      await db.settings.upsert({
        where: { key: 'bkash_number' },
        update: { value: bkashNumber },
        create: { key: 'bkash_number', value: bkashNumber },
      })
    }

    if (nagadNumber !== undefined) {
      if (typeof nagadNumber !== 'string' || nagadNumber.length > 20) {
        return NextResponse.json({ error: 'Invalid Nagad number' }, { status: 400, headers })
      }
      await db.settings.upsert({
        where: { key: 'nagad_number' },
        update: { value: nagadNumber },
        create: { key: 'nagad_number', value: nagadNumber },
      })
    }

    if (codDeliveryCharge !== undefined) {
      const charge = Number(codDeliveryCharge)
      if (isNaN(charge) || charge < 0) {
        return NextResponse.json({ error: 'Invalid delivery charge' }, { status: 400, headers })
      }
      await db.settings.upsert({
        where: { key: 'cod_delivery_charge' },
        update: { value: charge },
        create: { key: 'cod_delivery_charge', value: charge },
      })
    }

    return NextResponse.json({ success: true }, { status: 200, headers })
  } catch (error) {
    console.error('Payment settings PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500, headers }
    )
  }
}
