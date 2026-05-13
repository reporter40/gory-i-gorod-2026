import type { PulseHallPulsePoint } from '@/lib/pulse/pulse-data'

export default function LiveHallPulsePanel({
  current,
  timeline,
}: {
  current: number
  timeline: PulseHallPulsePoint[]
}) {
  const w = 270
  const h = 78
  const pad = 10
  const values = timeline.map(t => t.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const norm = (v: number) => (maxV === minV ? 0.5 : (v - minV) / (maxV - minV))

  let d = ''
  timeline.forEach((pt, i) => {
    const x = pad + (i / Math.max(1, timeline.length - 1)) * (w - pad * 2)
    const y = h - pad - norm(pt.value) * (h - pad * 2)
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
  })

  const peakIdx = timeline.reduce((best, pt, idx) => (pt.value > timeline[best].value ? idx : best), 0)
  const peakX = pad + (peakIdx / Math.max(1, timeline.length - 1)) * (w - pad * 2)
  const peakY = h - pad - norm(timeline[peakIdx].value) * (h - pad * 2)

  const firstT = timeline[0]?.time ?? '09:00'
  const lastT = timeline[timeline.length - 1]?.time ?? '15:00'

  return (
    <section className="pulse-panel absolute overflow-hidden p-3" style={{ left: 12, top: 414, width: 298, height: 200 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="pulse-panel-title mb-1">Live-пульс зала</h2>
          <p className="text-[11px] text-white/45">Общий уровень вовлечённости</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--pulse-accent-green)]">
          Высокая активность
        </span>
      </div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-[44px] font-extrabold leading-none text-white" style={{ textShadow: 'var(--pulse-glow-cyan)' }}>
          {current}
          <span className="text-[22px] font-bold text-white/80">%</span>
        </div>
        <svg width={w} height={h} className="shrink-0 overflow-visible">
          <defs>
            <linearGradient id="lp-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#004d6b" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke="url(#lp-line)" strokeWidth="2" strokeLinecap="round" />
          {[0, 1, 2, 3].map(i => {
            const lx = pad + (i / 3) * (w - pad * 2)
            return (
              <line key={i} x1={lx} y1={h - pad} x2={lx} y2={h - pad - 4} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            )
          })}
          <circle cx={peakX} cy={peakY} r={4} fill="#050a14" stroke="#00e5ff" strokeWidth="2" />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-white/35">
        <span>{firstT}</span>
        <span>{lastT}</span>
      </div>
    </section>
  )
}
