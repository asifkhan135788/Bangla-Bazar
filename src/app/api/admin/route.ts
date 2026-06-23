import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminLoginSchema } from '@/lib/validators'
import { getSecurityHeaders, validateAdminAccess, getClientIP } from '@/lib/security'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET(request: Request) {
  try {
    // Validate admin access
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    // Get dashboard stats in parallel
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      recentOrders,
      userLogs,
    ] = await Promise.all([
      db.product.count({ where: { active: true } }),
      db.order.count(),
      db.user.count(),
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] } },
      }),
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          orderItems: true,
        },
      }),
      db.userLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    const totalRevenue = revenueResult._sum.total || 0

    // Get order status breakdown
    const orderStatusBreakdown = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // Get product count by category
    const productsByCategory = await db.product.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: { active: true },
    })

    // Get category names for the breakdown
    const categoryIds = productsByCategory.map((p) => p.categoryId)
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const productsByCategoryNamed = productsByCategory.map((p) => ({
      categoryId: p.categoryId,
      categoryName: categoryMap.get(p.categoryId) || 'Unknown',
      count: p._count?.categoryId ?? 0,
    }))

    return NextResponse.json(
      {
        stats: {
          totalProducts,
          totalOrders,
          totalUsers,
          totalRevenue,
          orderStatusBreakdown,
          productsByCategory: productsByCategoryNamed,
        },
        recentOrders,
        userLogs,
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = adminLoginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400, headers }
      )
    }

    const { email, password } = result.data

    // Find user with admin role
    const user = await db.user.findUnique({ where: { email } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid credentials or not an admin' },
        { status: 401, headers }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers }
      )
    }

    // Create admin session token
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await db.adminSession.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Log the admin login
    await db.userLog.create({
      data: {
        userId: user.id,
        action: 'admin_login',
        details: 'Admin logged in successfully',
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(
      {
        user: userWithoutPassword,
        token,
        message: 'Admin login successful',
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
