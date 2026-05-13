import type { ReactNode } from 'react'
import type { MockPulseState } from '@/lib/pulse/pulse-data'

function Metric({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string
  label: string
  value: ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-[11px] border border-white/[0.09] bg-white/[0.042] px-2.5 py-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/48">
        {emoji} {label}
      </div>
      <div className="text-[15px] font-bold tabular-nums tracking-tight text-white">{value}</div>
      {sub && <div className="text-[10px] text-cyan-400/90">{sub}</div>}
    </div>
  )
}

export default function HeroPulsePanel({ state }: { state: MockPulseState }) {
  const { stats } = state
  const pct = stats.overallEngagement
  const ringR = 93
  const c = 2 * Math.PI * ringR
  const dash = (c * pct) / 100

  return (
    <section className="absolute overflow-visible" style={{ left: 318, top: 76, width: 994, height: 290 }}>
      <div className="flex items-start justify-between gap-7 px-1.5">
        <div>
          <h1 className="text-[46px] font-black uppercase leading-[0.92] tracking-[-0.02em] text-white pulse-glow-text">
            AI-ПУЛЬС
          </h1>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white/36">
            Интеллектуальная панель конференции
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-1.5 lg:grid-cols-4">
          <Metric
            emoji="👥"
            label="Участников онлайн"
            value={stats.onlineParticipants.toLocaleString('ru-RU')}
            sub={`+${stats.participantsChange} за час`}
          />
          <Metric
            emoji="😊"
            label="Активность зала"
            value={`${stats.hallActivity}%`}
            sub="Высокая"
          />
          <Metric
            emoji="📊"
            label="Вовлечённость"
            value={`${stats.engagement}%`}
            sub={`+${stats.engagementChange}% к среднему`}
          />
          <Metric emoji="👤" label="Выступающих" value={stats.speakersToday} sub="Сегодня" />
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-center">
        <div className="pointer-events-none absolute h-[418px] w-[418px] max-w-[418px]">
          <div
            className="pulse-rotate-slow absolute inset-[-8%] rounded-full border border-cyan-400/32"
            style={{ boxShadow: '0 0 48px rgba(0,231,253,0.16)' }}
          />
          <div className="pulse-rotate-mid absolute inset-[4%] rounded-full border border-dashed border-cyan-300/22" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-cyan-400/14 to-transparent blur-sm" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <svg width={220} height={220} viewBox="0 0 220 220" className="overflow-visible">
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--pulse-accent-cyan)" />
                <stop offset="100%" stopColor="#0070ff" />
              </linearGradient>
              <filter id="hgGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="110" cy="110" r={ringR} fill="none" stroke="rgba(255,255,255,0.065)" strokeWidth="10" />
            <circle
              cx="110"
              cy="110"
              r={ringR}
              fill="none"
              stroke="url(#hg)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              transform="rotate(-90 110 110)"
              filter="url(#hgGlow)"
              opacity={1}
            />
            <circle cx="110" cy="110" r={ringR} fill="none" stroke="rgba(0,231,253,0.12)" strokeWidth="1.5" />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
            <div className="text-[66px] font-black leading-none text-white" style={{ textShadow: 'var(--pulse-glow-strong)' }}>
              {pct}
              <span className="align-top text-[30px] font-extrabold text-cyan-100/95">%</span>
            </div>
            <div className="mt-2.5 max-w-[286px] text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/52">
              Общая вовлечённость аудитории
            </div>
            <div className="mt-2.5 rounded-full border border-green-400/40 bg-green-500/18 px-3 py-1 text-[10px] font-bold text-[var(--pulse-accent-green)]">
              ✦ Высокая активность
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
