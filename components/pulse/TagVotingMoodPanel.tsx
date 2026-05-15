'use client'

import { useId } from 'react'

function DonutStat({
  label,
  pct,
  votes,
  trend,
}: {
  label: string
  pct: number
  votes: number
  trend: number
}) {
  const uid = useId().replace(/:/g, '')
  const gradId = `dg-${uid}`
  const R = 52
  const c = 2 * Math.PI * R
  const dash = (c * pct) / 100
  return (
    <div className="relative flex h-[128px] w-[128px] items-center justify-center">
      <svg width={128} height={128} viewBox="0 0 128 128" className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 64 64)"
          style={{ filter: 'drop-shadow(0 0 14px rgba(0,229,255,0.25))' }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center gap-0 px-2 text-center">
        <div className="line-clamp-2 text-[9px] leading-tight text-white/50">{label}</div>
        <div className="text-[24px] font-black leading-none text-white">{pct}%</div>
        <div className={`text-[9px] text-white/38 transition-opacity ${votes > 0 ? 'opacity-100' : 'opacity-0'}`}>{votes > 0 ? votes.toLocaleString('ru-RU') + ' голосов' : '—'}</div>
        <div className={`text-[9px] font-semibold text-green-400 transition-opacity ${trend > 0 ? 'opacity-100' : 'opacity-0'}`}>▲ {trend}%</div>
      </div>
    </div>
  )
}

export default function TagVotingMoodPanel({
  left,
  right,
  bars,
  avatarSlices,
}: {
  left: { label: string; percent: number; votes: number; trend: number }
  right: { label: string; percent: number; votes: number; trend: number }
  bars: { name: string; value: number; color?: string }[]
  avatarSlices: readonly { id: string; initials: string; color: string }[]
}) {
  return (
    <section className="absolute flex flex-col p-3" style={{ left: 318, top: 558, width: 400, height: 260 }}>
      <h2 className="pulse-panel-title mb-2 shrink-0">Настроение по тегам / Голосование</h2>
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="flex shrink-0 gap-5">
          <DonutStat label={left.label} pct={left.percent} votes={left.votes} trend={left.trend} />
          <DonutStat label={right.label} pct={right.percent} votes={right.votes} trend={right.trend} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto pr-1">
            {bars.map(bar => (
              <div key={bar.name}>
                <div className="mb-0.5 flex justify-between text-[11px] text-white/68">
                  <span className="truncate pr-2">{bar.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-white">{bar.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${bar.value}%`,
                      background: bar.color ?? 'linear-gradient(90deg,#00e5ff,#22c55e)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto flex shrink-0 items-center justify-between gap-2 pt-2">
        <div className="flex -space-x-2">
          {avatarSlices.slice(0, 6).map(a => (
            <div
              key={a.id}
              title=""
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a101c] text-[10px] font-bold text-white"
              style={{ background: a.color }}
            >
              {a.initials}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-[10px] border border-white/14 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/85"
        >
          Смотреть все теги и голосования
        </button>
      </div>
    </section>
  )
}
