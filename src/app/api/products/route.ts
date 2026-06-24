import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productSchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, sanitizeInput, escapeLikePattern } from '@/lib/security'
import { Prisma } from '@prisma/client'
import { toNumber } from '@/lib/utils'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

// Helper to serialize product Decimal fields for JSON response
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
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const where: Prisma.ProductWhereInput = { active: true }

    if (category) where.categoryId = category

    if (search) {
      const escapedSearch = escapeLikePattern(search)
      where.OR = [
        { name: { contains: escapedSearch, mode: 'insensitive' } },
        { nameBN: { contains: escapedSearch, mode: 'insensitive' } },
        { description: { contains: escapedSearch, mode: 'insensitive' } },
      ]
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, unknown> = {}
      if (minPrice) priceFilter.gte = new Prisma.Decimal(minPrice)
      if (maxPrice) priceFilter.lte = new Prisma.Decimal(maxPrice)
      where.price = priceFilter as Prisma.ProductWhereInput['price']
    }

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

    return NextResponse.json({ products: serializedProducts, total, page, totalPages: Math.ceil(total / limit) }, { status: 200, headers })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) return adminCheck.error!

    const body = await request.json()
    const result = productSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400, headers })
    }

    const data = result.data
    let images: string[] = []
    if (Array.isArray(data.images)) images = data.images
    else if (typeof data.images === 'string' && data.images) { try { images = JSON.parse(data.images) } catch { images = [] } }

    let tags: string[] = []
    if (Array.isArray(data.tags)) tags = data.tags
    else if (typeof data.tags === 'string' && data.tags) { try { tags = JSON.parse(data.tags) } catch { tags = [] } }

    const product = await db.product.create({
      data: {
        name: sanitizeInput(data.name), nameBN: data.nameBN ? sanitizeInput(data.nameBN) : undefined,
        description: data.description ? sanitizeInput(data.description) : undefined, descriptionBN: data.descriptionBN ? sanitizeInput(data.descriptionBN) : undefined,
        price: data.price, salePrice: data.salePrice ?? undefined, deliveryCharge: data.deliveryCharge ?? undefined, categoryId: data.category,
        images, stock: data.stock ?? 0, featured: data.featured ?? false, active: data.active ?? true,
        sku: data.sku ? sanitizeInput(data.sku) : undefined, unit: data.unit ?? 'piece', tags,
      },
    })

    return NextResponse.json({ product: serializeProduct(product as unknown as Record<string, unknown>), message: 'Product created successfully' }, { status: 201, headers })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
