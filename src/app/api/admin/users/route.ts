import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, validateAdminAccess, getClientIP } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatar: true,
          banned: true,
          bannedUntil: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json(
      { users, total, page, totalPages: Math.ceil(total / limit) },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const adminUserId = adminCheck.userId
    const body = await request.json()
    const { userId, action, banDays, banReason } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400, headers })
    }

    // Get real IP and user agent for logging
    const adminIP = getClientIP(request)
    const adminUserAgent = request.headers.get('user-agent') || undefined

    // Admin unban action
    if (action === 'unban') {
      await db.user.update({
        where: { id: userId },
        data: { banned: false, bannedUntil: null, role: 'customer' },
      })

      await db.userLog.create({
        data: {
          userId,
          action: 'admin_unban',
          details: `Admin unbanned user${banReason ? `. Reason: ${banReason}` : ''}`,
          ip: adminIP,
          userAgent: adminUserAgent,
        },
      })

      return NextResponse.json({ message: 'User unbanned successfully' }, { status: 200, headers })
    }

    // Admin ban action with custom duration
    if (action === 'ban') {
      const days = banDays && banDays > 0 ? banDays : 30
      const bannedUntil = new Date()
      bannedUntil.setDate(bannedUntil.getDate() + days)

      await db.user.update({
        where: { id: userId },
        data: { banned: true, bannedUntil, role: 'banned' },
      })

      await db.userLog.create({
        data: {
          userId,
          action: 'admin_ban',
          details: `Admin banned user for ${days} days${banReason ? `. Reason: ${banReason}` : ''}`,
          ip: adminIP,
          userAgent: adminUserAgent,
        },
      })

      return NextResponse.json({
        message: 'User banned successfully',
        bannedUntil: bannedUntil.toISOString(),
        banDays: days,
      }, { status: 200, headers })
    }

    // Permanently ban action
    if (action === 'permanent_ban') {
      await db.user.update({
        where: { id: userId },
        data: { banned: true, bannedUntil: null, role: 'banned' },
      })

      await db.userLog.create({
        data: {
          userId,
          action: 'admin_permanent_ban',
          details: `Admin permanently banned user${banReason ? `. Reason: ${banReason}` : ''}`,
          ip: adminIP,
          userAgent: adminUserAgent,
        },
      })

      return NextResponse.json({ message: 'User permanently banned' }, { status: 200, headers })
    }

    return NextResponse.json({ error: 'Invalid action. Use "ban", "unban", or "permanent_ban"' }, { status: 400, headers })
  } catch (error) {
    console.error('Admin users PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
