import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorySchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, isValidId, sanitizeInput, isValidSlug } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { id } = await params

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400, headers }
      )
    }

    const existingCategory = await db.category.findUnique({ where: { id } })
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers }
      )
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

    // Validate slug format if provided
    if (data.slug && !isValidSlug(data.slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400, headers }
      )
    }

    // Check slug uniqueness if slug is being changed
    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await db.category.findUnique({ where: { slug: data.slug } })
      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409, headers }
        )
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: data.name ? sanitizeInput(data.name) : undefined,
        nameBN: data.nameBN ? sanitizeInput(data.nameBN) : null,
        slug: data.slug || undefined,
        image: data.image ?? undefined,
        icon: data.icon ?? undefined,
        sortOrder: data.sortOrder ?? undefined,
        active: data.active ?? undefined,
      },
    })

    return NextResponse.json(
      { category, message: 'Category updated successfully' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin category PUT error:', error)
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
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { id } = await params

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400, headers }
      )
    }

    const existingCategory = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers }
      )
    }

    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products. Please reassign or delete products first.' },
        { status: 400, headers }
      )
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin category DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
