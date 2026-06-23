import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, escapeLikePattern, detectMaliciousInput, autoBanUser } from '@/lib/security'
import { Prisma } from '@prisma/client'
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock')
    const featured = searchParams.get('featured')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const maliciousCheck = detectMaliciousInput(q || '')
    if (maliciousCheck.isMalicious) {
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      if (userId) await autoBanUser(userId, clientIP, userAgent, maliciousCheck.type)
      return NextResponse.json({ error: 'Invalid search input', banned: !!userId }, { status: 403, headers })
    }

    const where: Prisma.ProductWhereInput = { active: true }

    if (q) {
      const escapedQ = escapeLikePattern(q)
      where.OR = [
        { name: { contains: escapedQ, mode: 'insensitive' } },
        { nameBN: { contains: escapedQ, mode: 'insensitive' } },
        { description: { contains: escapedQ, mode: 'insensitive' } },
        { descriptionBN: { contains: escapedQ, mode: 'insensitive' } },
        { tags: { has: q } },
      ]
    }

    if (category) where.categoryId = category

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, unknown> = {}
      if (minPrice) priceFilter.gte = new Prisma.Decimal(minPrice)
      if (maxPrice) priceFilter.lte = new Prisma.Decimal(maxPrice)
      where.price = priceFilter as Prisma.ProductWhereInput['price']
    }

    if (inStock === 'true') where.stock = { gt: 0 }
    if (featured === 'true') where.featured = true

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price_asc': orderBy = { price: 'asc' }; break
      case 'price_desc': orderBy = { price: 'desc' }; break
      case 'name': orderBy = { name: 'asc' }; break
      case 'rating': orderBy = { rating: 'desc' }; break
    }

    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      db.product.findMany({ where, orderBy, skip, take: limit, include: { categoryRef: { select: { id: true, name: true, nameBN: true, slug: true } } } }),
      db.product.count({ where }),
    ])

    const serializedProducts = products.map((p) => serializeProduct(p as unknown as Record<string, unknown>))

    return NextResponse.json({ products: serializedProducts, total, page, totalPages: Math.ceil(total / limit), query: q }, { status: 200, headers })
  } catch (error) {
    console.error('Search GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
