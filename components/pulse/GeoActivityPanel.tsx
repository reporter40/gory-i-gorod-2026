'use client'

import type { PulseGeoRegion } from '@/lib/pulse/pulse-data'

const RUSSIA_PATH =
  'M20 90 L60 40 L120 35 L200 50 L280 30 L340 55 L400 45 L430 80 L420 120 L380 150 L320 160 L280 200 L220 185 L180 200 L130 170 L80 175 L40 140 Z'

const DOTS: { cx: number; cy: number; r: number }[] = [
  { cx: 130, cy: 95, r: 3.5 },
  { cx: 210, cy: 88, r: 3 },
  { cx: 260, cy: 110, r: 2.5 },
  { cx: 300, cy: 75, r: 2.5 },
  { cx: 180, cy: 130, r: 2.5 },
  { cx: 95, cy: 130, r: 2.5 },
]

export default function GeoActivityPanel({ regions }: { regions: PulseGeoRegion[] }) {
  return (
    <section className="pulse-panel absolute flex flex-col p-3" style={{ left: 12, top: 620, width: 298, height: 235 }}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="pulse-panel-title">Геоактивность участников</h2>
      </div>
      <p className="mb-1 text-[11px] text-white/45">Топ по регионам</p>
      <div className="flex flex-1 gap-2 overflow-hidden">
        <ul className="flex w-[120px] shrink-0 flex-col gap-1.5 text-[11px]">
          {regions.map(r => (
            <li key={r.name} className="flex justify-between gap-1 text-white/80">
              <span className="truncate text-white/60">{r.name}</span>
              <span className="font-semibold tabular-nums text-cyan-300">{r.percent}%</span>
            </li>
          ))}
          <li className="mt-1 text-[10px] text-white/35">+ ещё 48 регионов</li>
        </ul>
        <div
          className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-cyan-400/12"
          style={{
            backgroundImage: 'url(/pulse/geo-map-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(0,231,253,0.08)',
          }}
        />
      </div>
    </section>
  )
}
