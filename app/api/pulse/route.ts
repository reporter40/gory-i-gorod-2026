import { NextRequest, NextResponse } from 'next/server'
import { synthesizePulseTags } from '@/lib/claude'
import { SESSIONS } from '@/lib/data'
import { TagType } from '@/lib/types'

// In-memory store для demo (в продакшне — Supabase)
type TagEntry = { session_id: string; tag_type: TagType; comment?: string; created_at: string; participant_id: string }
type SynthesisEntry = { session_id: string; synthesis_text: string; tag_count: number; generated_at: string }

const pulseTags: TagEntry[] = []
const pulseSyntheses: SynthesisEntry[] = []
const lastSynthesisTime: Record<string, number> = {}

const SYNTHESIS_COOLDOWN_MS = 3 * 60 * 1000 // 3 минуты

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (sessionId) {
    const tags = pulseTags.filter(t => t.session_id === sessionId)
    const synthesis = pulseSyntheses
      .filter(s => s.session_id === sessionId)
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0] || null

    const tagCounts = tags.reduce<Record<string, number>>((acc, t) => {
      acc[t.tag_type] = (acc[t.tag_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({ tags, tagCounts, synthesis, totalTags: tags.length })
  }

  // All sessions summary
  const summary = SESSIONS.map(s => {
    const tags = pulseTags.filter(t => t.session_id === s.id)
    const latestSynthesis = pulseSyntheses
      .filter(p => p.session_id === s.id)
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0]
    return {
      session_id: s.id,
      session_title: s.title,
      tag_count: tags.length,
      latest_synthesis: latestSynthesis?.synthesis_text || null,
    }
  })

  return NextResponse.json({ summary, totalTags: pulseTags.length })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { session_id: string; tag_type: TagType; comment?: string; participant_id?: string }
  const { session_id, tag_type, comment, participant_id = 'anon' } = body

  if (!session_id || !tag_type) {
    return NextResponse.json({ error: 'session_id and tag_type required' }, { status: 400 })
  }

  const entry: TagEntry = {
    session_id,
    tag_type,
    comment,
    participant_id,
    created_at: new Date().toISOString(),
  }
  pulseTags.push(entry)

  const sessionTags = pulseTags.filter(t => t.session_id === session_id)
  const now = Date.now()
  const last = lastSynthesisTime[session_id] || 0
  let synthesis = null

  if (sessionTags.length >= 3 && now - last > SYNTHESIS_COOLDOWN_MS) {
    lastSynthesisTime[session_id] = now
    const session = SESSIONS.find(s => s.id === session_id)
    if (session && process.env.POLZA_API_KEY && process.env.POLZA_API_KEY !== 'your_polza_api_key') {
      try {
        const text = await synthesizePulseTags(session.title, sessionTags)
        const synthEntry: SynthesisEntry = {
          session_id,
          synthesis_text: text,
          tag_count: sessionTags.length,
          generated_at: new Date().toISOString(),
        }
        pulseSyntheses.push(synthEntry)
        synthesis = synthEntry
      } catch {
        // API error — graceful fallback
      }
    }
  }

  return NextResponse.json({ ok: true, synthesis, totalTags: sessionTags.length })
}
