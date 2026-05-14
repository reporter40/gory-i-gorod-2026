import { NextRequest, NextResponse } from 'next/server'
import { SESSIONS, SPEAKERS } from '@/lib/data'

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!
const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!

async function getAnonToken(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }) }
  )
  const d = await res.json() as { idToken?: string; error?: { message: string } }
  if (!d.idToken) throw new Error(d.error?.message ?? 'Firebase auth failed')
  return d.idToken
}

export async function POST(_req: NextRequest) {
  if (!API_KEY || !DB_URL) {
    return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 503 })
  }

  try {
    const token = await getAnonToken()

    // Build sessions payload: id → { title, hall, day, starts_at, ends_at, speakerName, status }
    const payload: Record<string, object> = {}
    for (const s of SESSIONS) {
      if (s.program_card === 'title_only') continue
      const speaker = SPEAKERS.find(sp => sp.id === s.speaker_id)
      payload[s.id] = {
        title: s.title ?? '',
        hall: s.hall ?? '',
        day: s.day,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        speakerName: speaker ? speaker.name : (s.speaker_row_note ?? ''),
        status: 'upcoming',
      }
    }

    const res = await fetch(`${DB_URL}/sessions.json?auth=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error(await res.text())

    return NextResponse.json({ ok: true, count: Object.keys(payload).length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
