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
          const counts = ((allData[sp.id] as any)?.counts ?? allData[sp.id] ?? {}) as Record<string, number>
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

  return (
    <section
      className="pulse-panel absolute flex flex-col overflow-hidden p-3"
      style={{
        left: 1326, top: 76, width: 334, height: 420,
        borderColor: pulse ? 'rgba(0,212,255,0.35)' : undefined,
        boxShadow: pulse ? '0 0 32px rgba(0,212,255,0.12)' : undefined,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between shrink-0">
        <h2 className="pulse-panel-title">Рейтинг докладов</h2>
        <div className="text-right">
          <div className="text-[18px] font-black leading-none text-[#00d4ff]">{grandTotal}</div>
          <div className="text-[9px] text-white/30">голосов</div>
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-[12px] text-white/30">
          <div>
            <div className="mb-2 text-[28px]">🗳️</div>
            Голосов пока нет
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto min-h-0 flex-1">
          {rows.map((row, idx) => {
            const pct = (row.total / maxTotal) * 100
            const initials = row.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            const topTag = TAGS.reduce((best, t) =>
              (row.counts[t.id] ?? 0) > (row.counts[best.id] ?? 0) ? t : best, TAGS[0])

            return (
              <div key={row.id} className="relative shrink-0">
                {/* Bar bg */}
                <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                  <div
                    className="h-full rounded-[12px] transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: idx === 0
                        ? 'linear-gradient(90deg, rgba(0,212,255,0.14), rgba(0,102,255,0.07))'
                        : 'rgba(255,255,255,0.02)',
                    }}
                  />
                </div>
                <div
                  className="relative flex items-center gap-2 rounded-[12px] px-2.5 py-2"
                  style={{
                    border: idx === 0 ? '1px solid rgba(0,212,255,0.22)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Rank */}
                  <div className="w-4 shrink-0 text-center text-[11px] font-black" style={{ color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                    {idx + 1}
                  </div>
                  {/* Avatar */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-black"
                    style={{
                      background: idx === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: idx === 0 ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {initials}
                  </div>
                  {/* Name + tags */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-bold text-white">{row.name}</div>
                    <div className="mt-0.5 flex gap-2">
                      {TAGS.map(t => {
                        const cnt = row.counts[t.id] ?? 0
                        if (cnt === 0) return null
                        return (
                          <span key={t.id} className="text-[10px] text-white/40">
                            {t.icon}{cnt}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  {/* Total */}
                  <div className="shrink-0 text-right">
                    <div className="text-[16px] font-black leading-none" style={{ color: idx === 0 ? '#00d4ff' : '#f0f6ff' }}>
                      {row.total}
                    </div>
                    <div className="text-[13px]">{topTag.icon}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
