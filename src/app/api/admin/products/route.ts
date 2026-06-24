import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, validateAdminAccess } from '@/lib/security'
import { toNumber } from '@/lib/utils'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

function serializeProduct(product: Record<string, unknown>) {
  return {
    ...product,
    price: toNumber(product.price),
    salePrice: product.salePrice != null ? toNumber(product.salePrice) : null,
    deliveryCharge: product.deliveryCharge != null ? toNumber(product.deliveryCharge) : null,
    rating: toNumber(product.rating),
    buyCount: toNumber(product.buyCount ?? 0),
    reviewCount: toNumber(product.reviewCount ?? 0),
  }
}

export async function GET(request: Request) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const active = searchParams.get('active') // 'true', 'false', or null for all
    const featured = searchParams.get('featured') // 'true', 'false', or null for all

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameBN: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (active === 'true') {
      where.active = true
    } else if (active === 'false') {
      where.active = false
    }

    if (featured === 'true') {
      where.featured = true
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          categoryRef: {
            select: { id: true, name: true, nameBN: true, slug: true },
          },
        },
      }),
      db.product.count({ where }),
    ])

    const serializedProducts = products.map((p) => serializeProduct(p as unknown as Record<string, unknown>))

    return NextResponse.json(
      { products: serializedProducts, total, page, totalPages: Math.ceil(total / limit) },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin products GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
