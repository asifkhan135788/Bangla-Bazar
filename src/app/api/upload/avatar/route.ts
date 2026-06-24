import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadToR2, isR2Configured, extractKeyFromUrl, deleteFromR2 } from '@/lib/r2'
import { isValidId } from '@/lib/security'

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/upload/avatar — Upload a profile picture
// Frontend sends: FormData with 'avatar' (file) + 'userId' (string)
// Returns: { avatarUrl, success: true }
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    // ── Check R2 configuration ──────────────────────────────────────
    if (!isR2Configured()) {
      console.error('[avatar/upload] R2 is not configured. Check environment variables.')
      return NextResponse.json(
        { error: 'File storage is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // ── Parse FormData ──────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      console.error('[avatar/upload] Failed to parse FormData')
      return NextResponse.json(
        { error: 'Invalid request. Please try again.' },
        { status: 400 }
      )
    }

    const file = formData.get('avatar') as File | null
    const userId = formData.get('userId') as string | null

    // ── Validate userId ─────────────────────────────────────────────
    if (!userId || !isValidId(userId)) {
      console.warn('[avatar/upload] Missing or invalid userId')
      return NextResponse.json(
        { error: 'Invalid user ID.' },
        { status: 400 }
      )
    }

    // ── Check user exists ───────────────────────────────────────────
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.warn('[avatar/upload] User not found:', userId)
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    // ── Validate file ───────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please select an image.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB.' },
        { status: 400 }
      )
    }

    // ── Delete old avatar from R2 (if any) ──────────────────────────
    if (user.avatar) {
      try {
        const oldKey = extractKeyFromUrl(user.avatar)
        if (oldKey) {
          await deleteFromR2(oldKey)
          console.log('[avatar/upload] Deleted old avatar:', oldKey)
        }
      } catch (err) {
        // Don't block upload if old avatar delete fails
        console.warn('[avatar/upload] Failed to delete old avatar:', err)
      }
    }

    // ── Generate key and upload to R2 ───────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const shortId = crypto.randomUUID().split('-')[0]
    const key = `avatars/${userId.slice(0, 8)}_${shortId}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[avatar/upload] Uploading avatar:', { key, size: file.size, type: file.type })

    const avatarUrl = await uploadToR2(buffer, key, file.type)

    // ── Update user in database ─────────────────────────────────────
    await db.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    })

    console.log('[avatar/upload] Avatar uploaded successfully:', avatarUrl)

    return NextResponse.json({
      avatarUrl,
      success: true,
    })
  } catch (error) {
    console.error('[avatar/upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/upload/avatar?userId=xxx — Remove a profile picture
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !isValidId(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID.' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    if (!user.avatar) {
      return NextResponse.json(
        { error: 'No avatar to remove.' },
        { status: 400 }
      )
    }

    // ── Delete from R2 ──────────────────────────────────────────────
    const key = extractKeyFromUrl(user.avatar)
    if (key) {
      try {
        await deleteFromR2(key)
        console.log('[avatar/delete] Deleted avatar from R2:', key)
      } catch (err) {
        console.warn('[avatar/delete] Failed to delete from R2:', err)
        // Continue — still remove from DB even if R2 delete fails
      }
    }

    // ── Update user in database ─────────────────────────────────────
    await db.user.update({
      where: { id: userId },
      data: { avatar: null },
    })

    console.log('[avatar/delete] Avatar removed for user:', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[avatar/delete] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to remove avatar.' },
      { status: 500 }
    )
  }
}
