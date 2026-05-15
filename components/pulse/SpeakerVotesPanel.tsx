'use client'

import { useEffect, useState } from 'react'
import { SPEAKERS } from '@/lib/data'
import { hasFirebaseConfig, getFirebaseDb } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  icon: '🔥', color: '#ff6b35' },
  { id: 'discovery',  icon: '💡', color: '#ffd700' },
  { id: 'partner',    icon: '🤝', color: '#00d4ff' },
  { id: 'question',   icon: '❓', color: '#a78bfa' },
  { id: 'applicable', icon: '📍', color: '#22d97a' },
]

type SpeakerCounts = Record<string, Record<string, number>>

interface SpeakerRow {
  id: string
  name: string
  role: string
  counts: Record<string, number>
  total: number
}

export default function SpeakerVotesPanel() {
  const [rows, setRows] = useState<SpeakerRow[]>([])
  const [pulse, setPulse] = useState(false)
  const [lastTotal, setLastTotal] = useState(0)

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      // Mock data for local dev
      setRows(SPEAKERS.slice(0, 6).map((sp, i) => ({
        id: sp.id,
        name: sp.name,
        role: sp.role ?? '',
        counts: { implement: i * 3 + 2, discovery: i * 2 + 1, partner: i, question: 1, applicable: i + 1 },
        total: i * 6 + 5,
      })).sort((a, b) => b.total - a.total))
      return
    }

    import('firebase/database').then(({ ref, onValue }) => {
      const db = getFirebaseDb()
      const r = ref(db, 'speakerVotes')
      const unsub = onValue(r, snap => {
        const allData = (snap.val() ?? {}) as SpeakerCounts
        const result: SpeakerRow[] = []
        for (const sp of SPEAKERS) {
          const counts = (allData[sp.id] ?? {}) as Record<string, number>
          const total = Object.values(counts).reduce((a, b) => a + b, 0)
          if (total > 0) {
            result.push({ id: sp.id, name: sp.name, role: sp.role ?? '', counts, total })
          }
        }
        result.sort((a, b) => b.total - a.total)
        setRows(result)
        const newTotal = result.reduce((a, r) => a + r.total, 0)
        setLastTotal(prev => {
          if (prev < newTotal) {
            setPulse(true)
            setTimeout(() => setPulse(false), 600)
          }
          return newTotal
        })
      })
      return () => unsub()
    }).catch(console.error)
  }, [])

  const maxTotal = rows[0]?.total ?? 1
  const grandTotal = rows.reduce((a, r) => a + r.total, 0)

  if (rows.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, padding: '20px 24px',
        color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 13,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗳️</div>
        Голосов пока нет — участники ещё не оценивали доклады
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${pulse ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 20, padding: '20px 24px',
      transition: 'border-color 0.4s',
      boxShadow: pulse ? '0 0 24px rgba(0,212,255,0.08)' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            Рейтинг докладов
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f6ff', letterSpacing: '-0.02em' }}>
            AI‑Пульс аудитории
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#00d4ff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {grandTotal}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>голосов</div>
        </div>
      </div>

      {/* Tag legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {TAGS.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row, idx) => {
          const pct = (row.total / maxTotal) * 100
          const initials = row.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
          const topTag = TAGS.reduce((best, t) =>
            (row.counts[t.id] ?? 0) > (row.counts[best.id] ?? 0) ? t : best, TAGS[0])

          return (
            <div key={row.id} style={{ position: 'relative' }}>
              {/* Bar background */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 14,
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 14,
                  background: idx === 0
                    ? 'linear-gradient(90deg, rgba(0,212,255,0.12), rgba(0,102,255,0.06))'
                    : 'rgba(255,255,255,0.015)',
                  width: `${pct}%`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              <div style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                border: idx === 0 ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
              }}>
                {/* Rank */}
                <div style={{
                  fontSize: 13, fontWeight: 800, color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                  width: 20, textAlign: 'center', flexShrink: 0,
                }}>
                  {idx + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: idx === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: idx === 0 ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                }}>
                  {initials}
                </div>

                {/* Name + tags */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f6ff', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {row.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {TAGS.map(t => {
                      const cnt = row.counts[t.id] ?? 0
                      if (cnt === 0) return null
                      return (
                        <div key={t.id} style={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          fontSize: 10, color: 'rgba(255,255,255,0.4)',
                        }}>
                          <span style={{ fontSize: 12 }}>{t.icon}</span>
                          <span>{cnt}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total + top tag */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: idx === 0 ? '#00d4ff' : '#f0f6ff', lineHeight: 1 }}>
                    {row.total}
                  </div>
                  <div style={{ fontSize: 16, marginTop: 2 }}>{topTag.icon}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
