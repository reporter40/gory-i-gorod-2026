import { NextRequest, NextResponse } from 'next/server'
import { getAdminApp } from '@/lib/pulse/firebase/admin-app'
import { requireAdminDb, rtdbRead } from '@/lib/pulse/server/rtdb-admin'

function auth(req: NextRequest): boolean {
  const expected = process.env.PULSE_OPERATOR_SECRET
  if (!expected || expected.length < 8) return false
  const key = req.headers.get('x-pulse-operator-key') ?? req.nextUrl.searchParams.get('key') ?? ''
  return key === expected
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!getAdminApp()) {
    return NextResponse.json({ ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON missing' }, { status: 503 })
  }

  const format = req.nextUrl.searchParams.get('format') ?? 'json'

  const [participants, votes, speakerVotes, geo, voteTimeline, event] = await Promise.all([
    rtdbRead('participants'),
    rtdbRead('votes'),
    rtdbRead('speakerVotes'),
    rtdbRead('geo'),
    rtdbRead('voteTimeline'),
    rtdbRead('event'),
  ])

  const snapshot = {
    exportedAt: new Date().toISOString(),
    participants,
    votes,
    speakerVotes,
    geo,
    voteTimeline,
    event,
  }

  if (format === 'csv') {
    const rows: string[] = ['uid,name,role,company,city,phone,telegram,ts']
    if (participants && typeof participants === 'object') {
      for (const [uid, val] of Object.entries(participants as Record<string, Record<string, unknown>>)) {
        const p = val ?? {}
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
        rows.push([
          esc(uid),
          esc(p.name),
          esc(p.role),
          esc(p.company),
          esc(p.city),
          esc(p.phone),
          esc(p.telegram),
          esc(p.ts ? new Date(p.ts as number).toISOString() : ''),
        ].join(','))
      }
    }
    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="participants-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json(snapshot, {
    headers: {
      'Content-Disposition': `attachment; filename="export-${Date.now()}.json"`,
    },
  })
}
