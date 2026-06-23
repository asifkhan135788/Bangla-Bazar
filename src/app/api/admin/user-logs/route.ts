import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, validateAdminAccess } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function GET(request: Request) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const action = searchParams.get('action') || ''

    const where: Record<string, unknown> = {}

    if (action) {
      where.action = action
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      db.userLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.userLog.count({ where }),
    ])

    // Get distinct action types for filter
    const actionTypes = await db.userLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    })

    return NextResponse.json(
      { logs, total, page, totalPages: Math.ceil(total / limit), actionTypes: actionTypes.map(a => a.action) },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Admin user-logs GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
