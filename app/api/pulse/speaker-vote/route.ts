import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getAdminApp, requireAdminApp } from '@/lib/pulse/firebase/admin-app'
import { requireAdminDb } from '@/lib/pulse/server/rtdb-admin'

const VALID_TAGS = new Set(['implement', 'discovery', 'partner', 'question', 'applicable'])

export async function POST(req: NextRequest) {
  if (!getAdminApp()) {
    return NextResponse.json(
      { ok: false, status: 'error', message: 'Firebase not configured' },
      { status: 503 }
    )
  }

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return NextResponse.json({ ok: false, status: 'error', message: 'missing token' }, { status: 401 })
  }

  let uid: string
  try {
    const decoded = await admin.auth(requireAdminApp()).verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ ok: false, status: 'error', message: 'invalid token' }, { status: 401 })
  }

  let json: unknown
  try { json = await req.json() } catch {
    return NextResponse.json({ ok: false, status: 'error', message: 'invalid JSON' }, { status: 400 })
  }

  const { speakerId, tagId } = (json as Record<string, unknown>) ?? {}
  if (typeof speakerId !== 'string' || !speakerId.trim()) {
    return NextResponse.json({ ok: false, status: 'error', message: 'missing speakerId' }, { status: 400 })
  }
  if (typeof tagId !== 'string' || !VALID_TAGS.has(tagId)) {
    return NextResponse.json({ ok: false, status: 'error', message: 'invalid tagId' }, { status: 400 })
  }

  const db = requireAdminDb()

  // Dedup: one vote per user per speaker (any tag)
  const userMarkerRef = db.ref(`speakerVotes/${speakerId}/userVotes/${uid}`)
  const claim = await userMarkerRef.transaction((current) => {
    if (current !== null) return undefined // already voted
    return tagId
  })

  if (!claim.committed) {
    return NextResponse.json({ ok: false, status: 'duplicate' }, { status: 409 })
  }

  try {
    await db.ref(`speakerVotes/${speakerId}/counts/${tagId}`).transaction((cur) => {
      const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
      return n + 1
    })

    return NextResponse.json({ ok: true, status: 'voted' })
  } catch (e) {
    try { await userMarkerRef.remove() } catch { /* rollback */ }
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, status: 'error', message: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const speakerId = req.nextUrl.searchParams.get('speakerId')
  if (!speakerId) {
    return NextResponse.json({ ok: false, message: 'missing speakerId' }, { status: 400 })
  }

  if (!getAdminApp()) {
    return NextResponse.json({ ok: true, counts: {} })
  }

  const db = requireAdminDb()
  const snap = await db.ref(`speakerVotes/${speakerId}/counts`).once('value')
  const counts = (snap.val() as Record<string, number> | null) ?? {}
  return NextResponse.json({ ok: true, counts })
}
