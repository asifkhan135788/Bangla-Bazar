import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { checkoutSchema, updateOrderStatusSchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, isValidId, sanitizeInput } from '@/lib/security'
import { sendTransactionAlert } from '@/lib/telegram'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const adminCheck = await validateAdminAccess(request)
    const isAdmin = adminCheck.valid

    if (isAdmin) {
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const status = searchParams.get('status')

      const where: Record<string, unknown> = {}
      if (status) where.status = status

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, phone: true } }, orderItems: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.order.count({ where }),
      ])

      return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) }, { status: 200, headers })
    }

    if (!userId || !isValidId(userId)) {
      return NextResponse.json({ error: 'Valid user ID is required' }, { status: 400, headers })
    }

    const orders = await db.order.findMany({
      where: { userId },
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders }, { status: 200, headers })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = checkoutSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400, headers })
    }

    const { userId, address, phone, paymentMethod, transactionId, note, deliveryFee, items } = result.data

    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400, headers })
    }

    // Look up product details from the database for each item
    let total = new Prisma.Decimal(0)
    const orderItemsData: Array<{ productId: string; quantity: number; price: Prisma.Decimal; name: string; image: string | null }> = []

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return NextResponse.json({ error: `Product not found (ID: ${item.productId})` }, { status: 400, headers })
      }
      if (!product.active) {
        return NextResponse.json({ error: `Product "${product.name}" is no longer available` }, { status: 400, headers })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for "${product.name}"`, available: product.stock }, { status: 400, headers })
      }

      const price = product.salePrice ?? product.price
      total = total.add(price.mul(item.quantity))
      const image: string | null = product.images?.[0] || null

      orderItemsData.push({ productId: product.id, quantity: item.quantity, price, name: product.name, image })
    }

    // Add delivery fee to total
    total = total.add(new Prisma.Decimal(deliveryFee))

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: { userId, total, status: 'pending', address: sanitizeInput(address), phone: sanitizeInput(phone), paymentMethod, transactionId: transactionId ? sanitizeInput(transactionId) : undefined, note: note ? sanitizeInput(note) : undefined },
      })
      for (const itemData of orderItemsData) {
        await tx.orderItem.create({ data: { orderId: newOrder.id, productId: itemData.productId, quantity: itemData.quantity, price: itemData.price, name: itemData.name, image: itemData.image } })
      }
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity }, buyCount: { increment: item.quantity } } })
      }
      // Also clear any stale DB cart items for this user
      await tx.cart.deleteMany({ where: { userId } })
      return newOrder
    })

    const completeOrder = await db.order.findUnique({ where: { id: order.id }, include: { orderItems: true } })
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } })

    // Get random agent number if available
    let agentNumber: string | undefined
    try {
      const agentSetting = await db.settings.findUnique({ where: { key: 'agent_numbers' } })
      if (agentSetting?.value && Array.isArray(agentSetting.value) && agentSetting.value.length > 0) {
        const agents = agentSetting.value as Array<{ name: string; phone: string }>
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]
        agentNumber = randomAgent.phone
      }
    } catch {
      // Ignore - agents not configured
    }

    sendTransactionAlert({
      orderId: order.id, customerName: user?.name || phone || 'Unknown', customerPhone: phone || 'N/A',
      amount: Number(total), paymentMethod: paymentMethod || 'cod', transactionId: body.transactionId,
      items: orderItemsData.map(i => `${i.name} x${i.quantity}`).join(', '),
      agentNumber,
    }).catch(() => {})

    return NextResponse.json({ order: completeOrder, message: 'Order placed successfully' }, { status: 201, headers })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

export async function PUT(request: Request) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) return adminCheck.error!

    const body = await request.json()
    const result = updateOrderStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400, headers })
    }

    const { orderId, status } = result.data
    if (!isValidId(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400, headers })
    }

    const existingOrder = await db.order.findUnique({ where: { id: orderId } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers })
    }

    const order = await db.order.update({ where: { id: orderId }, data: { status }, include: { orderItems: true } })
    return NextResponse.json({ order, message: 'Order status updated' }, { status: 200, headers })
  } catch (error) {
    console.error('Orders PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
