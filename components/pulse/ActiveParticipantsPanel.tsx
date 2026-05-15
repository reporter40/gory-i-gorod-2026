'use client'

import { useEffect, useState, useRef } from 'react'
import { SPEAKERS } from '@/lib/data'
import { hasFirebaseConfig, getFirebaseDb } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  icon: '🔥', color: '#ff6b35' },
  { id: 'discovery',  icon: '💡', color: '#ffd700' },
  { id: 'partner',    icon: '🤝', color: '#00d4ff' },
  { id: 'question',   icon: '❓', color: '#a78bfa' },
  { id: 'applicable', icon: '📍', color: '#22d97a' },
]

interface Row {
  id: string
  name: string
  counts: Record<string, number>
  total: number
  flash: boolean
}

type SpeakerCounts = Record<string, Record<string, number>>

export default function ActiveParticipantsPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const prevTotals = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setRows(SPEAKERS.slice(0, 5).map((sp, i) => ({
        id: sp.id,
        name: sp.name,
        counts: { implement: i * 3 + 5, discovery: i * 2 + 2, partner: i + 1, question: 2, applicable: i + 2 },
        total: i * 8 + 10,
        flash: false,
      })).sort((a, b) => b.total - a.total))
      return
    }

    import('firebase/database').then(({ ref, onValue }) => {
      const db = getFirebaseDb()
      const r = ref(db, 'speakerVotes')
      const unsub = onValue(r, snap => {
        const allData = (snap.val() ?? {}) as SpeakerCounts
        const result: Row[] = []
        for (const sp of SPEAKERS) {
          const counts = ((allData[sp.id] as any)?.counts ?? allData[sp.id] ?? {}) as Record<string, number>
          const total = Object.values(counts).reduce((a, b) => a + b, 0)
          if (total > 0) {
            const flash = (prevTotals.current[sp.id] ?? 0) < total
            result.push({ id: sp.id, name: sp.name, counts, total, flash })
          }
        }
        result.sort((a, b) => b.total - a.total)

        // update prev totals
        for (const r of result) prevTotals.current[r.id] = r.total
        setRows(result)

        // clear flash after 700ms
        setTimeout(() => setRows(prev => prev.map(r => ({ ...r, flash: false }))), 700)
      })
      return () => unsub()
    }).catch(console.error)
  }, [])

  const maxTotal = rows[0]?.total ?? 1

  return (
    <section
      className="pulse-panel absolute flex flex-col overflow-hidden p-3"
      style={{ left: 804, top: 538, width: 508, height: 319 }}
    >
      <h2 className="pulse-panel-title mb-2 shrink-0">Активность участников</h2>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-[12px] text-white/30">
          <div>
            <div className="mb-2 text-[28px]">⚡</div>
            Ожидание активности…
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-3">
          {/* Leader card */}
          {rows[0] && (() => {
            const row = rows[0]
            const initials = row.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div
                className="flex w-[156px] shrink-0 flex-col rounded-[14px] p-3 transition-all duration-500"
                style={{
                  background: row.flash ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.06)',
                  border: row.flash ? '1px solid rgba(0,212,255,0.55)' : '1px solid rgba(0,212,255,0.22)',
                  boxShadow: row.flash ? '0 0 28px rgba(0,212,255,0.18)' : 'none',
                }}
              >
                <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#00d4ff]">🏆 Лидер</div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-black text-[#00d4ff]"
                    style={{ background: 'rgba(0,212,255,0.18)', border: '1px solid rgba(0,212,255,0.35)' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 truncate text-[12px] font-bold text-white">{row.name.split(' ')[0]}</div>
                </div>
                <div className="text-[32px] font-black leading-none text-[#00d4ff]">{row.total}</div>
                <div className="mb-2 text-[9px] text-white/35">голосов</div>
                {/* Tag cubes */}
                <div className="flex flex-wrap gap-[4px]">
                  {TAGS.map(t => {
                    const cnt = row.counts[t.id] ?? 0
                    if (!cnt) return null
                    return Array.from({ length: Math.min(cnt, 6) }).map((_, i) => (
                      <div
                        key={`${t.id}-${i}`}
                        className={`h-[12px] w-[12px] rounded-[3px] transition-all duration-300 ${row.flash ? 'scale-110' : ''}`}
                        style={{ background: t.color, opacity: 0.75 }}
                      />
                    ))
                  })}
                </div>
              </div>
            )
          })()}

          {/* Ranking list */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {rows.slice(0, 6).map((row, idx) => {
              const pct = Math.round((row.total / maxTotal) * 100)
              const initials = row.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div
                  key={row.id}
                  className="relative shrink-0 overflow-hidden rounded-[10px] transition-all duration-500"
                  style={{
                    border: idx === 0 ? '1px solid rgba(0,212,255,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: row.flash ? '0 0 16px rgba(0,212,255,0.18)' : 'none',
                  }}
                >
                  {/* progress bar bg */}
                  <div
                    className="absolute inset-0 transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: idx === 0
                        ? 'linear-gradient(90deg,rgba(0,212,255,0.14),rgba(0,102,255,0.06))'
                        : 'rgba(255,255,255,0.025)',
                    }}
                  />
                  <div className="relative flex items-center gap-2 px-2.5 py-1.5">
                    <div className="w-3 shrink-0 text-center text-[10px] font-black" style={{ color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                      {idx + 1}
                    </div>
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black"
                      style={{ background: idx === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white">{row.name.split(' ')[0]}</div>
                    {/* mini cubes */}
                    <div className="flex gap-[3px]">
                      {TAGS.map(t => {
                        const cnt = row.counts[t.id] ?? 0
                        if (!cnt) return null
                        return Array.from({ length: Math.min(cnt, 3) }).map((_, i) => (
                          <div
                            key={`${t.id}-${i}`}
                            className={`h-[9px] w-[9px] rounded-[2px] transition-transform duration-300 ${row.flash ? 'scale-125' : ''}`}
                            style={{ background: t.color, opacity: 0.7 }}
                          />
                        ))
                      })}
                    </div>
                    <div className="shrink-0 text-[13px] font-black" style={{ color: idx === 0 ? '#00d4ff' : '#f0f6ff' }}>
                      {row.total}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
