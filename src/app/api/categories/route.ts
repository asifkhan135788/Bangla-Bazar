import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorySchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, sanitizeInput, isValidSlug } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    })

    return NextResponse.json(
      { categories },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Validate admin access
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const body = await request.json()
    const result = categorySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400, headers }
      )
    }

    const data = result.data

    // Validate slug format
    if (!isValidSlug(data.slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400, headers }
      )
    }

    // Check slug uniqueness
    const existingCategory = await db.category.findUnique({ where: { slug: data.slug } })
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409, headers }
      )
    }

    const category = await db.category.create({
      data: {
        name: sanitizeInput(data.name),
        nameBN: data.nameBN ? sanitizeInput(data.nameBN) : undefined,
        slug: data.slug,
        image: data.image ?? undefined,
        icon: data.icon ?? undefined,
        sortOrder: data.sortOrder ?? 0,
        active: data.active ?? true,
      },
    })

    return NextResponse.json(
      { category, message: 'Category created successfully' },
      { status: 201, headers }
    )
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
