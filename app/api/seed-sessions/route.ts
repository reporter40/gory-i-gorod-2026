import { NextResponse } from 'next/server'
import { SESSIONS, SPEAKERS } from '@/lib/data'
import { getAdminApp } from '@/lib/pulse/firebase/admin-app'
import { rtdbWrite } from '@/lib/pulse/server/rtdb-admin'

export async function POST() {
  if (!getAdminApp()) {
    return NextResponse.json(
      { ok: false, error: 'Firebase Admin not configured (FIREBASE_SERVICE_ACCOUNT_JSON)' },
      { status: 503 }
    )
  }

  try {
    const payload: Record<string, object> = {}
    for (const s of SESSIONS) {
      if (s.program_card === 'title_only') continue
      const speaker = SPEAKERS.find((sp) => sp.id === s.speaker_id)
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

    await rtdbWrite('sessions', payload)

    return NextResponse.json({ ok: true, count: Object.keys(payload).length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
