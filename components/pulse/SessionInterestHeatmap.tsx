'use client'

import { useEffect, useRef, useState } from 'react'
import type { SessionHeatmap as SessionHeatmapT } from '@/lib/pulse/pulse-data'
import { hasFirebaseConfig, getFirebaseDb } from '@/lib/pulse/firebase/client'

function intensityColor(v: number): string {
  if (v <= 0) return 'rgba(10,16,32,0.4)'
  const t = v / 100
  let r: number, g: number, b: number
  if (t < 0.35) {
    const s = t / 0.35
    r = Math.round(10 + s * (0 - 10))
    g = Math.round(16 + s * (160 - 16))
    b = Math.round(32 + s * (140 - 32))
  } else if (t < 0.65) {
    const s = (t - 0.35) / 0.30
    r = Math.round(0 + s * (30 - 0))
    g = Math.round(160 + s * (210 - 160))
    b = Math.round(140 + s * (80 - 140))
  } else if (t < 0.85) {
    const s = (t - 0.65) / 0.20
    r = Math.round(30 + s * (240 - 30))
    g = Math.round(210 + s * (180 - 210))
    b = Math.round(80 + s * (20 - 80))
  } else {
    const s = (t - 0.85) / 0.15
    r = Math.round(240 + s * (255 - 240))
    g = Math.round(180 + s * (220 - 180))
    b = Math.round(20 + s * (0 - 20))
  }
  const a = 0.25 + t * 0.75
  return `rgba(${r},${g},${b},${a})`
}

function useRecentVoters(activeSessionId: string | null, limit = 6) {
  const [voters, setVoters] = useState<string[]>([])
  const prevKeys = useRef<Set<string>>(new Set())
  const seeded = useRef(false)

  useEffect(() => {
    if (!activeSessionId || !hasFirebaseConfig()) return
    let cancelled = false

    import('firebase/database').then(({ ref, onValue }) => {
      const db = getFirebaseDb()
      const r = ref(db, `userVotes/${activeSessionId}`)
      const unsub = onValue(r, snap => {
        if (cancelled) return
        const data = snap.val() as Record<string, unknown> | null
        if (!data) return
        const keys = Object.keys(data)
        if (!seeded.current) {
          seeded.current = true
          setVoters(keys.slice(-limit).reverse())
          keys.forEach(k => prevKeys.current.add(k))
          return
        }
        const newKeys = keys.filter(k => !prevKeys.current.has(k))
        if (newKeys.length > 0) {
          setVoters(prev => [...newKeys.reverse(), ...prev].slice(0, limit))
          newKeys.forEach(k => prevKeys.current.add(k))
        }
      })
      return () => { cancelled = true; unsub() }
    }).catch(console.error)

    return () => { cancelled = true }
  }, [activeSessionId, limit])

  return voters
}

/** Detect which cells increased vs previous render and return their keys */
function useFlashCells(values: number[][]): Set<string> {
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set())
  const prevValues = useRef<number[][]>([])

  useEffect(() => {
    const prev = prevValues.current
    if (!prev.length) {
      prevValues.current = values
      return
    }

    const newFlash = new Set<string>()
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < (values[i]?.length ?? 0); j++) {
        const cur = values[i][j] ?? 0
        const old = prev[i]?.[j] ?? 0
        if (cur > old) newFlash.add(`${i}-${j}`)
      }
    }
    prevValues.current = values

    if (newFlash.size === 0) return

    setFlashCells(newFlash)
    const timer = setTimeout(() => setFlashCells(new Set()), 700)
    return () => clearTimeout(timer)
  }, [values])

  return flashCells
}

export default function SessionInterestHeatmap({
  heat,
  speakerDots,
  activeSessionId,
}: {
  heat: SessionHeatmapT
  speakerDots: { initials: string; color: string }[]
  activeSessionId?: string | null
}) {
  const voters = useRecentVoters(activeSessionId ?? null)
  const flashCells = useFlashCells(heat.values as number[][])

  if (!heat.halls.length || !heat.times.length) {
    return (
      <section className="pulse-panel absolute flex flex-col overflow-hidden p-3" style={{ left: 804, top: 538, width: 508, height: 319 }}>
        <h2 className="pulse-panel-title mb-2 shrink-0">Карта интереса к сессиям</h2>
        <div className="relative min-h-0 flex-1 flex items-center justify-center text-[11px] text-white/35 px-6 text-center">
          Нет данных голосования для активной сессии
        </div>
      </section>
    )
  }

  const cols = heat.times.length
  const rows = heat.halls.length
  const ox = 24
  const oy = 22
  const pad = 4
  const vw = ox + cols * 60 + pad
  const vh = oy + rows * 26 + pad

  return (
    <section className="pulse-panel absolute flex flex-col overflow-hidden p-3" style={{ left: 804, top: 538, width: 508, height: 319 }}>
      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] overflow-hidden">
        <div style={{ backgroundImage: "url('/pulse/bg-heatmap.png')", backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%', opacity: 0.15 }} />
      </div>

      <h2 className="pulse-panel-title mb-1 shrink-0">Карта интереса к сессиям</h2>

      <div className="relative min-h-0 flex-1 flex flex-col">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${vw} ${vh}`}
          preserveAspectRatio="none"
          style={{ flex: 1 }}
        >
          <defs>
            <filter id="cellGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Time labels */}
          {heat.times.map((t, j) => (
            <text
              key={t}
              x={ox + j * 60 + 30}
              y={14}
              fill="rgba(255,255,255,0.42)"
              fontSize={9}
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              {t}
            </text>
          ))}

          {/* Row numbers */}
          {heat.halls.map((_, i) => (
            <text
              key={i}
              x={11}
              y={oy + i * 26 + 16}
              fill="rgba(255,255,255,0.32)"
              fontSize={9}
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              {i + 1}
            </text>
          ))}

          {/* Cells */}
          {heat.values.map((row, i) =>
            row.map((v, j) => {
              const key = `${i}-${j}`
              const flashing = flashCells.has(key)
              return (
                <rect
                  key={key}
                  x={ox + j * 60 + 2}
                  y={oy + i * 26 + 2}
                  width={56}
                  height={22}
                  rx={6}
                  fill={flashing ? 'rgba(0,229,255,0.55)' : intensityColor(v)}
                  stroke={flashing ? 'rgba(0,229,255,0.9)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={flashing ? 2 : 1}
                  filter={flashing ? 'url(#cellGlow)' : undefined}
                  style={{ transition: 'fill 0.6s ease, stroke 0.6s ease' }}
                />
              )
            })
          )}
        </svg>

        {/* Recent voters */}
        {voters.length > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 pt-1 overflow-hidden">
            <span className="shrink-0 text-[9px] text-white/30 uppercase tracking-wider">Голосуют:</span>
            <div className="flex gap-1.5 overflow-hidden">
              {voters.map((v, i) => (
                <span
                  key={`${v}-${i}`}
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}
                >
                  {v.startsWith('@') ? v : `@${v}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="shrink-0 flex items-center gap-3 pt-1 text-[9px] text-white/40">
          <span className="shrink-0">Низкий</span>
          <span className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-[#0a1020] via-[#00a078] via-[#1ed760] to-[#ffdc00]" />
          <span className="shrink-0">Высокий</span>
        </div>
      </div>
    </section>
  )
}
