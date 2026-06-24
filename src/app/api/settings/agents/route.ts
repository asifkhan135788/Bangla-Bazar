import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSecurityHeaders, validateAdminAccess } from '@/lib/security'

const headers = { ...getSecurityHeaders(), 'Content-Type': 'application/json' }

// GET /api/settings/agents - Get agent phone numbers
export async function GET() {
  try {
    const setting = await db.settings.findUnique({
      where: { key: 'agent_numbers' },
    })

    if (!setting || !setting.value) {
      return NextResponse.json({
        agents: [],
      }, { status: 200, headers })
    }

    const agents = Array.isArray(setting.value) ? setting.value : []

    return NextResponse.json({ agents }, { status: 200, headers })
  } catch (error) {
    console.error('Agents GET error:', error)
    return NextResponse.json(
      { agents: [], error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

// PUT /api/settings/agents - Update agent phone numbers (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await validateAdminAccess(request)
    if (!adminCheck.valid) {
      return adminCheck.error!
    }

    const body = await request.json()
    const { agents } = body

    if (!Array.isArray(agents)) {
      return NextResponse.json(
        { error: 'agents must be an array of objects with name and phone' },
        { status: 400, headers }
      )
    }

    // Validate each agent
    for (const agent of agents) {
      if (!agent.name || !agent.phone) {
        return NextResponse.json(
          { error: 'Each agent must have name and phone' },
          { status: 400, headers }
        )
      }
    }

    await db.settings.upsert({
      where: { key: 'agent_numbers' },
      update: { value: agents as any },
      create: { key: 'agent_numbers', value: agents as any },
    })

    return NextResponse.json({ agents, message: 'Agent numbers updated' }, { status: 200, headers })
  } catch (error) {
    console.error('Agents PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
