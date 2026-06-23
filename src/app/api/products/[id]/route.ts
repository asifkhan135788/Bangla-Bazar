import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateProductSchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, isValidId, sanitizeInput } from '@/lib/security'
import { toNumber } from '@/lib/utils'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

// Helper to serialize product Decimal fields for JSON response
function serializeProduct(product: Record<string, unknown>) {
  return {
    ...product,
    price: toNumber(product.price),
    salePrice: product.salePrice != null ? toNumber(product.salePrice) : null,
    rating: toNumber(product.rating),
    buyCount: toNumber(product.buyCount ?? 0),
    reviewCount: toNumber(product.reviewCount ?? 0),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400, headers }
      )
    }

    const product = await db.product.findUnique({
      where: { id },
      include: {
        categoryRef: {
          select: { id: true, name: true, nameBN: true, slug: true },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers }
      )
    }

    return NextResponse.json(
      { product: serializeProduct(product as unknown as Record<string, unknown>) },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin access
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { id } = await params

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400, headers }
      )
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({ where: { id } })
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers }
      )
    }

    const body = await request.json()
    const result = updateProductSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400, headers }
      )
    }

    const data = result.data

    // Build update data, sanitizing strings
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = sanitizeInput(data.name)
    if (data.nameBN !== undefined) updateData.nameBN = data.nameBN ? sanitizeInput(data.nameBN) : null
    if (data.description !== undefined) updateData.description = data.description ? sanitizeInput(data.description) : null
    if (data.descriptionBN !== undefined) updateData.descriptionBN = data.descriptionBN ? sanitizeInput(data.descriptionBN) : null
    if (data.price !== undefined) updateData.price = data.price
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
    if (data.category !== undefined) updateData.categoryId = data.category
    if (data.images !== undefined) {
      // Handle images - could be string or array
      if (Array.isArray(data.images)) updateData.images = data.images
      else if (typeof data.images === 'string') {
        try { updateData.images = JSON.parse(data.images) } catch { updateData.images = [] }
      }
    }
    if (data.stock !== undefined) updateData.stock = data.stock
    if (data.featured !== undefined) updateData.featured = data.featured
    if (data.active !== undefined) updateData.active = data.active
    if (data.sku !== undefined) updateData.sku = data.sku ? sanitizeInput(data.sku) : null
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.tags !== undefined) {
      if (Array.isArray(data.tags)) updateData.tags = data.tags
      else if (typeof data.tags === 'string') {
        try { updateData.tags = JSON.parse(data.tags) } catch { updateData.tags = [] }
      }
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(
      { product: serializeProduct(product as unknown as Record<string, unknown>), message: 'Product updated successfully' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin access
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { id } = await params

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400, headers }
      )
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({ where: { id } })
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers }
      )
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
