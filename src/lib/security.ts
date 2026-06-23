import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ═══════════════════════════════════════════════════════════════════════════
// XSS Protection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strips all HTML tags and encodes special characters to prevent XSS attacks.
 * Replaces <, >, &, ", ' with their HTML entity equivalents.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/&/g, '&amp;')   // Encode ampersands first
    .replace(/</g, '&lt;')    // Encode less-than
    .replace(/>/g, '&gt;')    // Encode greater-than
    .replace(/"/g, '&quot;')  // Encode double quotes
    .replace(/'/g, '&#x27;')  // Encode single quotes
}

/**
 * Sanitizes HTML content by allowing only a safe whitelist of tags.
 * Allowed tags: b, i, em, strong, p, br
 * All other tags and their attributes are stripped.
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return ''

  // Define allowed tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']

  // Replace allowed tags with placeholders
  const placeholders: Record<string, string> = {}
  let placeholderIndex = 0

  let result = html

  // Extract and preserve allowed tags (both opening and closing)
  for (const tag of allowedTags) {
    const openingRegex = new RegExp(`<${tag}\\s*/?>`, 'gi')
    const closingRegex = new RegExp(`</${tag}\\s*>`, 'gi')

    result = result.replace(openingRegex, (match) => {
      const key = `__PH${placeholderIndex++}__`
      // Normalize self-closing br
      if (tag === 'br') {
        placeholders[key] = '<br>'
      } else {
        placeholders[key] = `<${tag}>`
      }
      return key
    })

    result = result.replace(closingRegex, (match) => {
      const key = `__PH${placeholderIndex++}__`
      placeholders[key] = `</${tag}>`
      return key
    })
  }

  // Strip all remaining HTML tags
  result = result.replace(/<[^>]*>/g, '')

  // Restore placeholders
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(key, value)
  }

  return result
}

/**
 * Validates an email address using a comprehensive regex pattern.
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

// ═══════════════════════════════════════════════════════════════════════════
// SQL Injection Protection (Input Validation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates that an ID follows the UUID format.
 * Prisma is configured with @default(uuid()) @db.Uuid which produces standard UUIDs.
 */
export function isValidId(id: string): boolean {
  if (typeof id !== 'string') return false
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Validates that a slug contains only lowercase alphanumeric characters and hyphens.
 */
export function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 255
}

/**
 * Escapes special characters in a string for use in SQL LIKE patterns.
 * Escapes %, _, and \ characters.
 */
export function escapeLikePattern(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape percent signs
    .replace(/_/g, '\\_')    // Escape underscores
}

// ═══════════════════════════════════════════════════════════════════════════
// CSRF Protection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validates a CSRF token against an expected value using timing-safe comparison.
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  if (!token || !expected) return false
  if (typeof token !== 'string' || typeof expected !== 'string') return false
  if (token.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limiting (In-Memory)
// ═══════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  timestamps: number[]
}

/**
 * Creates an in-memory rate limiter.
 * @param options.windowMs - Time window in milliseconds
 * @param options.maxRequests - Maximum number of requests allowed in the window
 * @returns Object with a `check` method that takes a key and returns allowed status
 */
export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options
  const store = new Map<string, RateLimitEntry>()

  // Cleanup interval: remove entries older than the window every 60 seconds
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, 60_000)

  // Prevent the interval from keeping the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }

  return {
    check(key: string): { allowed: boolean; remaining: number } {
      const now = Date.now()

      let entry = store.get(key)
      if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
      }

      // Remove timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)

      const remaining = Math.max(0, maxRequests - entry.timestamps.length)

      if (entry.timestamps.length >= maxRequests) {
        return { allowed: false, remaining: 0 }
      }

      // Record this request
      entry.timestamps.push(now)

      return { allowed: true, remaining: remaining - 1 }
    },

    /** Reset rate limit for a specific key */
    reset(key: string): void {
      store.delete(key)
    },

    /** Get current count for a key without incrementing */
    getCount(key: string): number {
      const entry = store.get(key)
      if (!entry) return 0
      const now = Date.now()
      return entry.timestamps.filter((ts) => now - ts < windowMs).length
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Malicious Input Detection & Auto-Ban
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Patterns commonly used in SQL injection, XSS, and other attacks.
 */
const MALICIOUS_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC)\b.*\b(FROM|TABLE|INTO|WHERE|SET|DATABASE)\b)/i, type: 'sql_injection' },
  { pattern: /(--|;--|\/\*|\*\/|xp_|0x[0-9a-f]{2,})/i, type: 'sql_injection' },
  { pattern: /(<script|javascript:|on\w+\s*=|eval\s*\(|alert\s*\(|document\.)|<\/script>/i, type: 'xss' },
  { pattern: /(\bOR\b\s+1\s*=\s*1|\bAND\b\s+1\s*=\s*1|'\s*OR\s*'|'\s*AND\s*')/i, type: 'sql_injection' },
  { pattern: /(\.\.\/|\.\.\\|%2e%2e|%252e)/i, type: 'path_traversal' },
  { pattern: /(\<\?php|\<%|<iframe|<object|<embed|<link|<meta)/i, type: 'xss' },
]

/**
 * Detects potentially malicious input patterns.
 * Returns an object with `isMalicious` flag and the `type` of attack detected.
 */
export function detectMaliciousInput(input: string): { isMalicious: boolean; type: string } {
  if (typeof input !== 'string') {
    return { isMalicious: false, type: '' }
  }

  for (const { pattern, type } of MALICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      return { isMalicious: true, type }
    }
  }

  return { isMalicious: false, type: '' }
}

/**
 * Automatically bans a user for 3 days and logs the ban action.
 * Sets the user's `banned` flag to true, sets `bannedUntil` to 3 days from now,
 * and records a user log entry.
 */
export async function autoBanUser(
  userId: string,
  ip: string,
  userAgent: string,
  reason: string
): Promise<void> {
  try {
    const bannedUntil = new Date()
    bannedUntil.setDate(bannedUntil.getDate() + 3) // 3-day ban

    await db.user.update({
      where: { id: userId },
      data: { banned: true, bannedUntil },
    })

    await db.userLog.create({
      data: {
        userId,
        action: 'auto_ban',
        details: `Auto-banned for 3 days for malicious input: ${reason}`,
        ip,
        userAgent,
      },
    })

    console.warn(`[Security] User ${userId} auto-banned for 3 days for: ${reason} (IP: ${ip})`)
  } catch (error) {
    console.error('[Security] Failed to auto-ban user:', error)
  }
}

/**
 * Checks if a user's ban has expired and un-bans them if so.
 * Should be called on login or page load.
 */
export async function checkAndUnbanExpired(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.banned) return false

    if (user.bannedUntil && new Date() > user.bannedUntil) {
      await db.user.update({
        where: { id: userId },
        data: { banned: false, bannedUntil: null },
      })

      await db.userLog.create({
        data: {
          userId,
          action: 'auto_unban',
          details: 'Ban expired, automatically unbanned',
        },
      })

      return true // was unbanned
    }

    return false // still banned
  } catch (error) {
    console.error('[Security] Failed to check/unban user:', error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Client IP Extraction
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts the client IP address from request headers.
 * Checks common proxy headers first (X-Forwarded-For, X-Real-IP),
 * then falls back to a default value.
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (may contain multiple IPs, first is client)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim())
    if (ips[0]) return ips[0]
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  // Check Cloudflare header
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  return '127.0.0.1'
}

// ═══════════════════════════════════════════════════════════════════════════
// Login Rate Limiter (pre-configured instance)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-configured rate limiter for login attempts.
 * Allows 5 attempts per 15 minutes per IP.
 */
export const loginRateLimiter = createRateLimiterInternal({ windowMs: 15 * 60 * 1000, maxRequests: 5 })

function createRateLimiterInternal(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options
  const store = new Map<string, { timestamps: number[] }>()

  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, 60_000)

  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }

  // Calculate the window start time for resetTime
  function getResetTime(key: string): number {
    const entry = store.get(key)
    if (!entry || entry.timestamps.length === 0) return Date.now() + windowMs
    const oldestInWindow = Math.min(...entry.timestamps)
    return oldestInWindow + windowMs
  }

  return function checkRate(key: string): { allowed: boolean; resetTime: number } {
    const now = Date.now()

    let entry = store.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      store.set(key, entry)
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)

    if (entry.timestamps.length >= maxRequests) {
      return { allowed: false, resetTime: getResetTime(key) }
    }

    // Record this request
    entry.timestamps.push(now)

    return { allowed: true, resetTime: getResetTime(key) }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin Authentication
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates admin access by checking the Authorization header against AdminSession records.
 * Expects a Bearer token in the Authorization header.
 * Verifies the session exists and has not expired.
 * Returns { valid: true, userId } on success or { valid: false, error: NextResponse } on failure.
 */
export async function validateAdminAccess(request: Request): Promise<{
  valid: boolean
  userId?: string
  error?: NextResponse
}> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Authorization header required' },
          { status: 401, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    // Extract Bearer token
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Invalid authorization format. Use Bearer token.' },
          { status: 401, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    const token = parts[1]
    if (!token || token.length < 10) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    // Query the admin session from the database
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await db.adminSession.delete({ where: { id: session.id } }).catch(() => {})
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Session expired. Please login again.' },
          { status: 401, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    // Check if the user is actually an admin
    if (session.user.role !== 'admin') {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
        ),
      }
    }

    return { valid: true, userId: session.userId }
  } catch (error) {
    console.error('Admin access validation error:', error)
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: { ...getSecurityHeaders(), 'Content-Type': 'application/json' } }
      ),
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// File Path Validation (LFI Protection)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates that a file path is safe (no directory traversal, absolute paths, or null bytes).
 * Protects against Local File Inclusion (LFI) attacks.
 */
export function isValidFilePath(path: string): boolean {
  if (typeof path !== 'string') return false

  // Check for null bytes
  if (path.includes('\0')) return false

  // Check for directory traversal
  if (path.includes('..')) return false

  // Check for absolute paths (Unix or Windows)
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return false

  // Check for URL protocol prefixes
  if (/^(https?|ftp|file):\/\//i.test(path)) return false

  return true
}

/**
 * Sanitizes a file path by removing directory traversal sequences and normalizing slashes.
 */
export function sanitizePath(path: string): string {
  if (typeof path !== 'string') return ''

  let sanitized = path

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove directory traversal sequences
  sanitized = sanitized.replace(/\.\./g, '')

  // Remove leading slashes (absolute paths)
  sanitized = sanitized.replace(/^\/+/, '')

  // Remove Windows drive letters
  sanitized = sanitized.replace(/^[a-zA-Z]:/, '')

  // Remove URL protocol prefixes
  sanitized = sanitized.replace(/^(https?|ftp|file):\/\//gi, '')

  // Normalize multiple slashes to single
  sanitized = sanitized.replace(/\/+/g, '/')

  // Remove leading slashes again after normalization
  sanitized = sanitized.replace(/^\/+/, '')

  return sanitized
}

// ═══════════════════════════════════════════════════════════════════════════
// Request Validation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates the size of an incoming request by checking the Content-Length header.
 * @param request - The incoming Request object
 * @param maxSizeKB - Maximum allowed size in kilobytes (default: 1024 KB = 1 MB)
 */
export function validateRequestSize(request: Request, maxSizeKB: number = 1024): boolean {
  const contentLength = request.headers.get('Content-Length')

  if (!contentLength) {
    // If Content-Length is not present, we can't validate the size.
    // Return true to allow the request through (the body parsing will enforce limits).
    return true
  }

  const sizeInBytes = parseInt(contentLength, 10)
  if (isNaN(sizeInBytes)) {
    return false
  }

  const maxSizeBytes = maxSizeKB * 1024
  return sizeInBytes <= maxSizeBytes
}

// ═══════════════════════════════════════════════════════════════════════════
// Security Headers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns a comprehensive set of security headers for HTTP responses.
 * These headers help protect against common web vulnerabilities.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking - only allow same-origin framing
    'X-Frame-Options': 'SAMEORIGIN',

    // Enable browser XSS filtering (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Restrict permissions (geolocation, camera, microphone, etc.)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',

    // Strict Transport Security - force HTTPS for 1 year with subdomains
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Content Security Policy - restrict resource loading
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // Cross-Origin policies
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
