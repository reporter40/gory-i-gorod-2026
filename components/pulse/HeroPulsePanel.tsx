'use client'

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
    <div className="rounded-[11px] border border-white/[0.07] bg-white/[0.05] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(0,231,253,0.08),inset_0_-1px_0_rgba(247,168,25,0.04),0_6px_20px_rgba(0,0,0,0.28)] backdrop-blur-sm">
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
    <section className="absolute overflow-hidden" style={{ left: 318, top: 76, width: 994, height: 460 }}>
      <div className="pulse-hero-decor pulse-hero-cinematic-bg pulse-hero-background-glow">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]"
          style={{
            background: `
            radial-gradient(circle at 50% 58%, rgba(0, 20, 40, 0.55) 0%, transparent 42%),
            radial-gradient(ellipse 90% 70% at 50% 52%, rgba(0, 100, 150, 0.34) 0%, transparent 54%),
            radial-gradient(ellipse 78% 58% at 50% 56%, rgba(0, 120, 170, 0.28) 0%, transparent 58%),
            radial-gradient(ellipse 42% 36% at 74% 28%, rgba(247, 168, 25, 0.12) 0%, transparent 52%),
            radial-gradient(ellipse 55% 44% at 22% 72%, rgba(0, 231, 253, 0.16) 0%, transparent 54%),
            linear-gradient(168deg, rgba(8, 16, 32, 0.62) 0%, rgba(4, 8, 18, 0.28) 38%, rgba(2, 6, 14, 0.72) 100%)
          `,
            boxShadow:
              'inset 0 0 140px rgba(0,0,0,0.62), inset 0 -60px 120px rgba(0,50,90,0.38), inset 0 0 80px rgba(0,231,253,0.06)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[18px]"
          style={{
            background:
              'radial-gradient(ellipse 55% 48% at 50% 54%, rgba(0,231,253,0.06) 0%, transparent 50%)',
          }}
          aria-hidden
        />
      </div>
      <div className="relative z-10 flex items-start justify-between gap-7 px-1.5">
        <div>
          <h1
            className="text-[38px] font-black uppercase leading-[0.92] tracking-[-0.02em] text-white"
            style={{
              textShadow: [
                '0 1px 0 rgba(0,231,253,0.9)',
                '0 2px 0 rgba(0,200,230,0.75)',
                '0 3px 0 rgba(0,160,200,0.6)',
                '0 4px 0 rgba(0,100,150,0.45)',
                '0 5px 0 rgba(0,60,110,0.35)',
                '0 6px 0 rgba(0,30,70,0.25)',
                '0 8px 16px rgba(0,0,0,0.55)',
                '0 0 40px rgba(0,231,253,0.3)',
              ].join(', '),
            }}
          >
            AI-ПУЛЬС
          </h1>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white/36">
            Интеллектуальная панель конференции
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-20 flex items-center justify-center">
        <div className="pulse-hero-decor pulse-hero-orbits pulse-hero-giant-ring pointer-events-none absolute h-[600px] w-[600px] max-w-[600px]">
          <div
            className="pulse-rotate-slow absolute inset-[-18%] rounded-full border border-cyan-400/32"
            style={{ boxShadow: '0 0 88px rgba(0,231,253,0.32), 0 0 160px rgba(247,168,25,0.1)' }}
          />
          <div
            className="pulse-rotate-mid absolute inset-[-10%] rounded-full border border-dashed border-cyan-300/26"
            style={{ boxShadow: 'inset 0 0 56px rgba(0,231,253,0.14)' }}
          />
          <div className="absolute inset-[-2%] rounded-full border border-amber-400/18" />
          <div className="pulse-rotate-mid absolute inset-0 rounded-full border border-cyan-200/16 opacity-95" />
          <div className="pulse-rotate-slow absolute inset-[3%] rounded-full border border-dashed border-amber-300/14 opacity-85" />
          <div className="pulse-rotate-mid absolute inset-[5%] rounded-full border border-amber-300/12 opacity-80" />
          <div className="absolute inset-[7%] rounded-full border border-dashed border-cyan-400/18" />
          <div className="absolute inset-[9%] rounded-full border border-cyan-100/10" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-cyan-400/28 via-transparent to-amber-400/16 blur-md" />
          <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(0,231,253,0.22)_0%,transparent_58%)] blur-sm" />
          <div className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle,rgba(247,168,25,0.12)_0%,transparent_55%)] blur-md" />
          <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(ellipse_80%_80%,rgba(0,40,80,0.35)_0%,transparent_70%)] blur-lg" />
        </div>

        <div className="relative z-10 flex flex-col items-center" style={{ width: 220, height: 220 }}>
          <div
            className="pulse-hero-decor pulse-hero-energy-field pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,231,253,0.14)_0%,rgba(247,168,25,0.06)_38%,transparent_68%)] blur-2xl"
            aria-hidden
          />
          <svg
            width={220}
            height={220}
            viewBox="0 0 220 220"
            className="pulse-hero-ring-svg overflow-visible drop-shadow-[0_0_28px_rgba(0,231,253,0.22)]"
          >
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--pulse-accent-cyan)" />
                <stop offset="50%" stopColor="#00c8ea" />
                <stop offset="85%" stopColor="#00a8cc" />
                <stop offset="100%" stopColor="#f7a819" stopOpacity={0.92} />
              </linearGradient>
              <radialGradient id="hgInner" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,231,253,0.32)" />
                <stop offset="45%" stopColor="rgba(0,60,100,0.22)" />
                <stop offset="85%" stopColor="rgba(0,20,40,0.12)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="hgCore" cx="50%" cy="50%" r="35%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="40%" stopColor="rgba(0,231,253,0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id="hgGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="8.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="hgOuterGlow" x="-70%" y="-70%" width="240%" height="240%">
                <feGaussianBlur stdDeviation="5.5" result="og" />
                <feMerge>
                  <feMergeNode in="og" />
                </feMerge>
              </filter>
              <filter id="hgTrail" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.4" result="t" />
                <feMerge>
                  <feMergeNode in="t" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g className="pulse-hero-decor pulse-hero-svg-trails">
              {/* Decorative gold / cyan arcs (energy field) */}
              <path
                d="M 110 12 A 98 98 0 0 1 206 92"
                fill="none"
                stroke="rgba(0,231,253,0.26)"
                strokeWidth="1.35"
                strokeLinecap="round"
                filter="url(#hgTrail)"
              />
              <path
                d="M 14 128 A 98 98 0 0 0 110 208"
                fill="none"
                stroke="rgba(247,168,25,0.2)"
                strokeWidth="1.1"
                strokeLinecap="round"
                filter="url(#hgTrail)"
              />
              <path
                d="M 196 172 A 82 82 0 0 1 44 172"
                fill="none"
                stroke="rgba(0,231,253,0.16)"
                strokeWidth="0.9"
                strokeDasharray="4 7"
                filter="url(#hgTrail)"
              />
              <path
                d="M 110 24 A 86 86 0 0 0 36 118"
                fill="none"
                stroke="rgba(0,231,253,0.12)"
                strokeWidth="0.75"
                strokeDasharray="2 8"
              />
              <path
                d="M 184 48 A 72 72 0 0 1 48 184"
                fill="none"
                stroke="rgba(247,168,25,0.1)"
                strokeWidth="0.65"
                strokeDasharray="6 10"
              />
              <path
                d="M 110 18 A 92 92 0 0 1 198 88"
                fill="none"
                stroke="rgba(0,231,253,0.22)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M 22 132 A 92 92 0 0 0 110 202"
                fill="none"
                stroke="rgba(247,168,25,0.18)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <path
                d="M 188 168 A 78 78 0 0 1 48 168"
                fill="none"
                stroke="rgba(0,231,253,0.14)"
                strokeWidth="0.85"
                strokeDasharray="3 6"
              />
              <circle cx="110" cy="110" r={ringR + 14} fill="none" stroke="rgba(0,231,253,0.14)" strokeWidth="1.25" filter="url(#hgOuterGlow)" />
              <circle cx="110" cy="110" r={ringR + 24} fill="none" stroke="rgba(247,168,25,0.12)" strokeWidth="1" strokeDasharray="5 12" />
              <circle cx="110" cy="110" r={ringR + 32} fill="none" stroke="rgba(0,231,253,0.09)" strokeWidth="0.85" />
              <circle cx="110" cy="110" r={ringR + 40} fill="none" stroke="rgba(247,168,25,0.06)" strokeWidth="0.65" strokeDasharray="2 10" />
            </g>
            <circle cx="110" cy="110" r={ringR - 5} fill="url(#hgInner)" opacity={0.95} />
            <circle cx="110" cy="110" r={ringR - 38} fill="url(#hgCore)" opacity={0.85} />
            <circle cx="110" cy="110" r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r={ringR}
              fill="none"
              stroke="url(#hg)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              transform="rotate(-90 110 110)"
              opacity={1}
            />
            <circle cx="110" cy="110" r={ringR} fill="none" stroke="rgba(0,231,253,0.28)" strokeWidth="2.4" />
            <circle cx="110" cy="110" r={ringR} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.1" />
          </svg>
          <div className="pointer-events-none absolute flex flex-col items-center justify-center gap-0" style={{ width: 220, height: 220, top: 0, left: 0 }}>
            <div className="text-[54px] font-black leading-none text-white">
              {pct}
              <span className="align-top text-[24px] font-extrabold text-cyan-100/95">%</span>
            </div>
            <div className="mt-1 max-w-[120px] text-center text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/52">
              Общая вовлечённость аудитории
            </div>
            <div className="mt-1.5 rounded-full border border-green-400/40 bg-green-500/18 px-2.5 py-0.5 text-[8px] font-bold text-[var(--pulse-accent-green)]">
              ✦ Высокая активность
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
