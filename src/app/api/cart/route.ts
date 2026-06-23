import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addToCartSchema } from '@/lib/validators'
import { getSecurityHeaders, isValidId } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !isValidId(userId)) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400, headers }
      )
    }

    const cartItems = await db.cart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameBN: true,
            price: true,
            salePrice: true,
            images: true,
            stock: true,
            active: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.product.salePrice ?? item.product.price)
      return sum + price * item.quantity
    }, 0)

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json(
      { cartItems, subtotal, totalItems },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = addToCartSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400, headers }
      )
    }

    const { userId, productId, quantity } = result.data

    // Verify product exists and is active
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers }
      )
    }

    if (!product.active) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400, headers }
      )
    }

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', available: product.stock },
        { status: 400, headers }
      )
    }

    // Upsert cart item: if exists, increment quantity; else create
    const cartItem = await db.cart.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameBN: true,
            price: true,
            salePrice: true,
            images: true,
            stock: true,
            unit: true,
          },
        },
      },
    })

    return NextResponse.json(
      { cartItem, message: 'Item added to cart' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, productId, quantity } = body

    if (!userId || !isValidId(userId)) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400, headers }
      )
    }

    if (!productId || !isValidId(productId)) {
      return NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400, headers }
      )
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400, headers }
      )
    }

    // Check if cart item exists
    const cartItem = await db.cart.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404, headers }
      )
    }

    // Check stock
    const product = await db.product.findUnique({ where: { id: productId } })
    if (product && product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', available: product.stock },
        { status: 400, headers }
      )
    }

    const updatedCartItem = await db.cart.update({
      where: {
        userId_productId: { userId, productId },
      },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameBN: true,
            price: true,
            salePrice: true,
            images: true,
            stock: true,
            unit: true,
          },
        },
      },
    })

    return NextResponse.json(
      { cartItem: updatedCartItem, message: 'Cart updated' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Cart PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !isValidId(userId)) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400, headers }
      )
    }

    if (!productId || !isValidId(productId)) {
      return NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400, headers }
      )
    }

    // Check if cart item exists
    const cartItem = await db.cart.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404, headers }
      )
    }

    await db.cart.delete({
      where: {
        userId_productId: { userId, productId },
      },
    })

    return NextResponse.json(
      { message: 'Item removed from cart' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
