import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings/banner
export async function GET() {
  try {
    // Fetch banner settings from the Settings table
    const bannerActive = await db.settings.findUnique({
      where: { key: 'banner_active' },
    })
    const bannerTitle = await db.settings.findUnique({
      where: { key: 'banner_title' },
    })
    const bannerMessage = await db.settings.findUnique({
      where: { key: 'banner_message' },
    })
    const bannerType = await db.settings.findUnique({
      where: { key: 'banner_type' },
    })

    const active = bannerActive?.value === 'true'

    return NextResponse.json({
      active,
      title: bannerTitle?.value || '',
      message: bannerMessage?.value || '',
      type: bannerType?.value || 'info',
    })
  } catch (error) {
    console.error('Banner GET error:', error)
    // Return inactive banner on error so the UI doesn't break
    return NextResponse.json({
      active: false,
      title: '',
      message: '',
      type: 'info',
    })
  }
}
