'use client'

import type { SessionHeatmap as SessionHeatmapT } from '@/lib/pulse/pulse-data'

function intensityColor(v: number): string {
  if (v <= 0) return 'rgba(10,16,32,0.4)'
  const t = v / 100
  // dark → teal → green → amber → yellow  (matches reference warm heatmap)
  let r: number, g: number, b: number
  if (t < 0.35) {
    // dark → teal
    const s = t / 0.35
    r = Math.round(10 + s * (0 - 10))
    g = Math.round(16 + s * (160 - 16))
    b = Math.round(32 + s * (140 - 32))
  } else if (t < 0.65) {
    // teal → green
    const s = (t - 0.35) / 0.30
    r = Math.round(0 + s * (30 - 0))
    g = Math.round(160 + s * (210 - 160))
    b = Math.round(140 + s * (80 - 140))
  } else if (t < 0.85) {
    // green → amber
    const s = (t - 0.65) / 0.20
    r = Math.round(30 + s * (240 - 30))
    g = Math.round(210 + s * (180 - 210))
    b = Math.round(80 + s * (20 - 80))
  } else {
    // amber → bright yellow
    const s = (t - 0.85) / 0.15
    r = Math.round(240 + s * (255 - 240))
    g = Math.round(180 + s * (220 - 180))
    b = Math.round(20 + s * (0 - 20))
  }
  const a = 0.25 + t * 0.75
  return `rgba(${r},${g},${b},${a})`
}

export default function SessionInterestHeatmap({
  heat,
  speakerDots,
}: {
  heat: SessionHeatmapT
  speakerDots: { initials: string; color: string }[]
}) {
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

  const cellW = 54
  const cellH = 22
  const ox = 86
  const oy = 30
  const cw = heat.times.length * cellW + ox + 8
  const ch = heat.halls.length * cellH + oy + 24

  const { hallIndex: hi, timeIndex: ti, engagement, label } = heat.highlight
  const cx = ox + ti * cellW + cellW / 2

  return (
    <section className="pulse-panel absolute flex flex-col overflow-hidden p-3" style={{ left: 804, top: 538, width: 508, height: 319 }}>
      <h2 className="pulse-panel-title mb-2 shrink-0">Карта интереса к сессиям</h2>
      <div className="relative min-h-0 flex-1">
        <svg width="100%" height="210" viewBox={`0 0 ${cw} ${ch}`} preserveAspectRatio="xMinYMin meet">
          <defs>
            <filter id="pulseTipShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.45" />
            </filter>
          </defs>
          {heat.times.map((t, j) => (
            <text
              key={t}
              x={ox + j * cellW + cellW / 2}
              y={16}
              fill="rgba(255,255,255,0.42)"
              fontSize={10}
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              {t}
            </text>
          ))}
          {heat.halls.map((hall, i) => (
            <text
              key={hall}
              x={4}
              y={oy + i * cellH + cellH / 2 + 4}
              fill="rgba(255,255,255,0.55)"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {hall.length > 18 ? `${hall.slice(0, 16)}…` : hall}
            </text>
          ))}
          {heat.values.map((row, i) =>
            row.map((v, j) => {
              const isHi = hi === i && ti === j
              return (
                <rect
                  key={`${i}-${j}`}
                  x={ox + j * cellW + 2}
                  y={oy + i * cellH + 2}
                  width={cellW - 4}
                  height={cellH - 4}
                  rx={6}
                  fill={intensityColor(v)}
                  stroke={isHi ? 'rgba(0,229,255,0.68)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isHi ? 1.8 : 1}
                />
              )
            }),
          )}
          <g transform={`translate(${cx - 146}, ${oy + hi * cellH - 44})`} filter="url(#pulseTipShadow)">
            <rect x={0} y={0} width={292} height={58} rx={12} fill="rgba(6,11,22,0.97)" stroke="rgba(0,229,255,0.42)" strokeWidth={1} />
            {speakerDots.slice(0, 3).map((s, idx) => (
              <g key={`${s.initials}-${idx}`} transform={`translate(${14 + idx * 18}, ${15})`}>
                <circle r={11} cx={11} cy={11} fill={s.color} stroke="#081018" strokeWidth={1} />
                <text x={11} y={15} fill="#fff" fontSize={9} fontWeight={700} textAnchor="middle" fontFamily="system-ui, sans-serif">
                  {s.initials.slice(0, 2)}
                </text>
              </g>
            ))}
            <text x={74} y={22} fill="#ffffff" fontSize={11} fontWeight={700} fontFamily="system-ui, sans-serif">
              {label.slice(0, 44)}
              {label.length > 44 ? '…' : ''}
            </text>
            <text x={74} y={40} fill="rgba(255,255,255,0.6)" fontSize={10} fontFamily="system-ui, sans-serif">
              {`${engagement}% · вовлечённость · +218`}
            </text>
          </g>
        </svg>
        <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex items-center gap-3 px-2 text-[10px] text-white/45">
          <span className="shrink-0">Низкий интерес</span>
          <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#0a1020] via-[#00a078] via-[#1ed760] to-[#ffdc00]" />
          <span className="shrink-0">Высокий интерес</span>
        </div>
      </div>
    </section>
  )
}
