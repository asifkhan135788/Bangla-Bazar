import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadToR2, generateFileKey, isR2Configured, extractKeyFromUrl, deleteFromR2 } from '@/lib/r2'
import { validateAdminAccess } from '@/lib/security'

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/upload — Upload a product image (admin only)
// Frontend sends: FormData with 'file' + Authorization Bearer token
// Returns: { url, success }
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    // ── Admin auth check ────────────────────────────────────────────
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    // ── Check R2 configuration ──────────────────────────────────────
    if (!isR2Configured()) {
      console.error('[upload] R2 is not configured. Check environment variables.')
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
      console.error('[upload] Failed to parse FormData')
      return NextResponse.json(
        { error: 'Invalid request. Please try again.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null

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

    // ── Generate key and upload to R2 ───────────────────────────────
    const key = generateFileKey(file.name)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[upload] Uploading product image:', { key, size: file.size, type: file.type, admin: adminCheck.userId })

    const url = await uploadToR2(buffer, key, file.type)

    console.log('[upload] Product image uploaded successfully:', url)

    return NextResponse.json({
      url,
      success: true,
    })
  } catch (error) {
    console.error('[upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/upload — Delete a product image from R2 (admin only)
// Body: { url: string }
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: Request) {
  try {
    // ── Admin auth check ────────────────────────────────────────────
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required.' },
        { status: 400 }
      )
    }

    // ── Extract key and delete from R2 ──────────────────────────────
    const key = extractKeyFromUrl(url)
    if (!key) {
      return NextResponse.json(
        { error: 'Invalid image URL.' },
        { status: 400 }
      )
    }

    try {
      await deleteFromR2(key)
      console.log('[upload/delete] Deleted from R2:', key, 'by admin:', adminCheck.userId)
    } catch (err) {
      console.warn('[upload/delete] Failed to delete from R2:', err)
      // Still return success — the image is removed from the product list
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[upload/delete] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image.' },
      { status: 500 }
    )
  }
}
