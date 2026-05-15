'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPEAKERS, SESSIONS } from '@/lib/data'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  name: 'Хочу внедрить',  icon: '🔥' },
  { id: 'discovery',  name: 'Открытие',        icon: '💡' },
  { id: 'partner',    name: 'Ищу партнёров',   icon: '🤝' },
  { id: 'question',   name: 'Есть вопрос',     icon: '❓' },
  { id: 'applicable', name: 'Применимо у нас', icon: '📍' },
]

const STORAGE_PREFIX = 'sv_'

function getLocalVote(speakerId: string, uid: string): string | null {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${speakerId}_${uid}`) } catch { return null }
}

// Sessions with real speakers only (skip org/panel)
const SPEAKER_SESSIONS = SESSIONS.filter(s => {
  const sp = SPEAKERS.find(sp => sp.id === s.speaker_id)
  return sp && s.speaker_id !== 'org'
})

// Dedupe: one entry per speaker
const UNIQUE_SPEAKERS = Array.from(
  new Map(SPEAKER_SESSIONS.map(s => [s.speaker_id, s])).entries()
).map(([speakerId, session]) => ({
  speaker: SPEAKERS.find(sp => sp.id === speakerId)!,
  session,
}))

// Group by day
const DAY1 = UNIQUE_SPEAKERS.filter(e => e.session.day === 1)
const DAY2 = UNIQUE_SPEAKERS.filter(e => e.session.day === 2)

export default function PulsePage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [activeDay, setActiveDay] = useState(1)

  useEffect(() => {
    async function init() {
      let resolvedUid: string
      if (hasFirebaseConfig()) {
        resolvedUid = await ensureAnonymousAuth()
      } else {
        resolvedUid = 'mock-user'
      }
      setUid(resolvedUid)
      // Load all local votes
      const v: Record<string, string> = {}
      for (const { speaker } of UNIQUE_SPEAKERS) {
        const vote = getLocalVote(speaker.id, resolvedUid)
        if (vote) v[speaker.id] = vote
      }
      setVotes(v)
    }
    init().catch(console.error)
  }, [])

  const dayEntries = activeDay === 1 ? DAY1 : DAY2
  const votedCount = Object.keys(votes).length

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%)',
      color: '#f0f6ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px #00d4ff', display: 'inline-block', flexShrink: 0 }} />
            AI‑Пульс · Горы и Город 2026
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Оцените доклады
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            Выберите доклад и поставьте одну реакцию
          </p>

          {votedCount > 0 && (
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 50, background: 'rgba(34,217,122,0.1)', border: '1px solid rgba(34,217,122,0.25)' }}>
              <span style={{ fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#22d97a' }}>
                {votedCount} из {UNIQUE_SPEAKERS.length} оценено
              </span>
            </div>
          )}
        </div>

        {/* Day tabs */}
        <div style={{ padding: '0 24px 16px', display: 'flex', gap: 8 }}>
          {[1, 2].map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                padding: '9px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeDay === day ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: activeDay === day ? '1.5px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: activeDay === day ? '#00d4ff' : 'rgba(255,255,255,0.4)',
              }}
            >
              День {day}
            </button>
          ))}
        </div>

        {/* Speaker list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayEntries.map(({ speaker, session }) => {
            const myVote = votes[speaker.id]
            const tag = myVote ? TAGS.find(t => t.id === myVote) : null
            const initials = speaker.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            const time = new Date(session.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

            return (
              <button
                key={speaker.id}
                onClick={() => router.push(`/pulse/speaker/${speaker.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', borderRadius: 18, width: '100%', textAlign: 'left',
                  background: myVote ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.03)',
                  border: myVote ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: myVote ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.06)',
                  border: myVote ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800,
                  color: myVote ? '#00d4ff' : 'rgba(238,244,255,0.35)',
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', lineHeight: 1.2 }}>
                    {speaker.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {time} · {session.title}
                  </div>
                </div>

                {/* Status */}
                {tag ? (
                  <div style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 10,
                    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
                  }}>
                    <span style={{ fontSize: 16 }}>{tag.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff' }}>✓</span>
                  </div>
                ) : (
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.25)', fontSize: 16,
                  }}>
                    →
                  </div>
                )}
              </button>
            )
          })}

          {dayEntries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              Доклады не запланированы
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
