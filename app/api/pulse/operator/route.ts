import { NextRequest, NextResponse } from 'next/server'
import { getAdminApp } from '@/lib/pulse/firebase/admin-app'
import { requireAdminDb } from '@/lib/pulse/server/rtdb-admin'

/**
 * Operator writes for event/* — protected by PULSE_OPERATOR_SECRET (server env).
 * Header: x-pulse-operator-key
 */
export async function POST(req: NextRequest) {
  const expected = process.env.PULSE_OPERATOR_SECRET
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { ok: false, error: 'PULSE_OPERATOR_SECRET not configured on server' },
      { status: 503 }
    )
  }

  const key = req.headers.get('x-pulse-operator-key') ?? ''
  if (key !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!getAdminApp()) {
    return NextResponse.json({ ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON missing' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 })
  }

  const db = requireAdminDb()

  if (typeof body.activeSessionId === 'string') {
    await db.ref('event/activeSessionId').set(body.activeSessionId)
  }
  if (typeof body.frozen === 'boolean') {
    await db.ref('event/frozen').set(body.frozen)
  }
  if (typeof body.mode === 'string') {
    await db.ref('event/mode').set(body.mode)
  }

  return NextResponse.json({ ok: true })
}
