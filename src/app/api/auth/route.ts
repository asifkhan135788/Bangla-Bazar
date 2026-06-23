import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { loginSchema, registerSchema } from '@/lib/validators'
import { getSecurityHeaders, loginRateLimiter, getClientIP, sanitizeInput, checkAndUnbanExpired } from '@/lib/security'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // LOGIN
    if (action === 'login') {
      const result = loginSchema.safeParse({ email: body.email, password: body.password })
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.issues },
          { status: 400, headers }
        )
      }

      // Rate limiting
      const clientIP = getClientIP(request)
      const rateLimitResult = loginRateLimiter(`login_${clientIP}`)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429, headers }
        )
      }

      const { email, password } = result.data

      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401, headers }
        )
      }

      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401, headers }
        )
      }

      // Check if ban has expired
      if (user.banned) {
        const unbanned = await checkAndUnbanExpired(user.id)
        if (unbanned) {
          // Refresh user data after unban
          const refreshedUser = await db.user.findUnique({ where: { id: user.id } })
          if (refreshedUser) {
            const { password: _p, ...refreshedWithoutPw } = refreshedUser
            let adminToken: string | null = null
            if (refreshedUser.role === 'admin') {
              adminToken = uuidv4()
              const expiresAt = new Date()
              expiresAt.setHours(expiresAt.getHours() + 24)
              await db.adminSession.create({ data: { token: adminToken, userId: refreshedUser.id, expiresAt } })
            }
            await db.userLog.create({ data: { userId: refreshedUser.id, action: 'login', details: 'User logged in after ban expired', ip: getClientIP(request), userAgent: request.headers.get('user-agent') || undefined } })
            return NextResponse.json({ user: refreshedWithoutPw, token: adminToken, message: 'Login successful' }, { status: 200, headers })
          }
        } else {
          // Still banned
          const { password: _p, ...userWithoutPw } = user
          return NextResponse.json({ user: userWithoutPw, token: null, message: 'Account is still banned' }, { status: 200, headers })
        }
      }

      let adminToken: string | null = null

      // If admin, create admin session
      if (user.role === 'admin') {
        adminToken = uuidv4()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)

        await db.adminSession.create({
          data: {
            token: adminToken,
            userId: user.id,
            expiresAt,
          },
        })
      }

      // Log the login
      await db.userLog.create({
        data: {
          userId: user.id,
          action: 'login',
          details: 'User logged in successfully',
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json(
        {
          user: userWithoutPassword,
          token: adminToken,
          message: 'Login successful',
        },
        { status: 200, headers }
      )
    }

    // REGISTER
    if (action === 'register') {
      const result = registerSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.issues },
          { status: 400, headers }
        )
      }

      const { email, password, name, phone, address } = result.data

      // Check email uniqueness
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409, headers }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await db.user.create({
        data: {
          email: sanitizeInput(email),
          password: hashedPassword,
          name: sanitizeInput(name),
          phone: phone ? sanitizeInput(phone) : undefined,
          address: address ? sanitizeInput(address) : undefined,
        },
      })

      // Log registration
      await db.userLog.create({
        data: {
          userId: user.id,
          action: 'register',
          details: 'New user registered',
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json(
        {
          user: userWithoutPassword,
          message: 'Registration successful',
        },
        { status: 201, headers }
      )
    }

    // CHECK BAN
    if (action === 'check_ban') {
      const userId = body.userId
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400, headers })
      }

      const unbanned = await checkAndUnbanExpired(userId)
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user) {
        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json({ user: userWithoutPassword, unbanned }, { status: 200, headers })
      }

      return NextResponse.json({ error: 'User not found' }, { status: 404, headers })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "login", "register", or "check_ban"' },
      { status: 400, headers }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
