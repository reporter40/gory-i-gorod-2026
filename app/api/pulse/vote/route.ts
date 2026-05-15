import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getAdminApp, requireAdminApp } from '@/lib/pulse/firebase/admin-app'
import { parseVoteRequestBody } from '@/lib/pulse/server/validate-vote-request'
import { requireAdminDb } from '@/lib/pulse/server/rtdb-admin'

/**
 * Strategy A — server-authoritative vote.
 * Client sends Firebase ID token; server verifies, claims userVotes slot, increments votes, pushes mood.
 */
export async function POST(req: NextRequest) {
  if (!getAdminApp()) {
    return NextResponse.json(
      { ok: false, status: 'error', message: 'Server vote unavailable (missing FIREBASE_SERVICE_ACCOUNT_JSON)' },
      { status: 503 }
    )
  }

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return NextResponse.json({ ok: false, status: 'error', message: 'missing Authorization Bearer token' }, { status: 401 })
  }

  let uid: string
  try {
    const decoded = await admin.auth(requireAdminApp()).verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ ok: false, status: 'error', message: 'invalid token' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ ok: false, status: 'error', message: 'invalid JSON' }, { status: 400 })
  }

  const parsed = parseVoteRequestBody(json)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, status: 'error', message: parsed.error }, { status: 400 })
  }

  const { sessionId, tagId } = parsed
  const db = requireAdminDb()

  const eventSnap = await db.ref('event').once('value')
  const ev = eventSnap.val() as { frozen?: boolean; activeSessionId?: string } | null
  if (ev?.frozen) {
    return NextResponse.json({ ok: false, status: 'frozen' }, { status: 423 })
  }
  const active = typeof ev?.activeSessionId === 'string' ? ev.activeSessionId : ''
  if (!active || active !== sessionId) {
    return NextResponse.json(
      { ok: false, status: 'error', message: 'sessionId does not match active session' },
      { status: 400 }
    )
  }

  const markerRef = db.ref(`userVotes/${sessionId}/${uid}/${tagId}`)
  const claim = await markerRef.transaction((current) => {
    if (current === true) return undefined
    return true
  })

  if (!claim.committed) {
    return NextResponse.json({ ok: false, status: 'duplicate' }, { status: 409 })
  }

  try {
    await db.ref(`votes/${sessionId}/${tagId}`).transaction((cur) => {
      const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
      return n + 1
    })

    // Timeline: tag × hourly slot (MSK = UTC+3)
    const mskHour = (new Date().getUTCHours() + 3) % 24
    const slot = `${String(mskHour).padStart(2, '0')}:00`
    await db.ref(`voteTimeline/${tagId}/${slot}`).transaction((cur) => {
      const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
      return n + 1
    })

    await db.ref('mood').push({
      tagId,
      sessionId,
      userId: uid,
      ts: admin.database.ServerValue.TIMESTAMP,
    })

    return NextResponse.json({ ok: true, status: 'voted' })
  } catch (e) {
    try {
      await markerRef.remove()
    } catch {
      /* best-effort rollback */
    }
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, status: 'error', message: msg }, { status: 500 })
  }
}
