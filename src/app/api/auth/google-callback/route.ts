import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, getClientIP } from '@/lib/security'

const headers = { ...getSecurityHeaders() }

// GET /api/auth/google-callback
// Handles the OAuth callback from Supabase Google Auth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?auth_error=no_code', request.url)
      )
    }

    // Exchange code for session with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(
        new URL('/?auth_error=supabase_not_configured', request.url)
      )
    }

    // Exchange the code for a session
    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: supabaseAnonKey,
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: code, // Simplified - in production use proper PKCE
      }),
    })

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(
        new URL('/?auth_error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const userMetadata = tokenData.user?.user_metadata || {}

    // Get user info from Supabase Auth
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apiKey: supabaseAnonKey,
      },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL('/?auth_error=user_fetch_failed', request.url)
      )
    }

    const supabaseUser = await userRes.json()
    const email = supabaseUser.email
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || ''
    const avatar = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || ''
    const supabaseId = supabaseUser.id

    if (!email) {
      return NextResponse.redirect(
        new URL('/?auth_error=no_email', request.url)
      )
    }

    // Check if user already exists in our DB
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      // Create a new user in our DB
      // Generate a random password (user won't need it since they use Google Auth)
      const crypto = await import('crypto')
      const randomPassword = crypto.randomBytes(32).toString('hex')
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          avatar: avatar || null,
          password: hashedPassword,
        },
      })

      // Log registration
      await db.userLog.create({
        data: {
          userId: user.id,
          action: 'google_register',
          details: 'User registered via Google Auth',
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } else {
      // Update avatar if user exists and Google has a newer avatar
      if (avatar && user.avatar !== avatar) {
        await db.user.update({
          where: { id: user.id },
          data: { avatar },
        })
      }

      // Log login
      await db.userLog.create({
        data: {
          userId: user.id,
          action: 'google_login',
          details: 'User logged in via Google Auth',
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    }

    // Create admin session if admin
    let adminToken: string | null = null
    if (user.role === 'admin') {
      const { v4: uuidv4 } = await import('uuid')
      adminToken = uuidv4()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)
      await db.adminSession.create({
        data: { token: adminToken, userId: user.id, expiresAt },
      })
    }

    // Redirect to frontend with user data encoded in URL
    const { password: _, ...userWithoutPassword } = user
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth_success', 'true')
    redirectUrl.searchParams.set('user_data', encodeURIComponent(JSON.stringify({
      user: { ...userWithoutPassword, avatar: avatar || userWithoutPassword.avatar },
      token: adminToken,
    })))

    const response = NextResponse.redirect(redirectUrl, { headers })

    return response
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      new URL('/?auth_error=internal_error', request.url)
    )
  }
}
