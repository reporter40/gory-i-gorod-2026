import type { MockPulseState } from '@/lib/pulse/pulse-data'

function FooterSkyline() {
  return (
    <div className="pulse-footer-skyline" aria-hidden>
      <div className="pulse-footer-cityglow" aria-hidden />
      <svg viewBox="0 0 1672 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pulseFtSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,231,253,0.45)" />
            <stop offset="55%" stopColor="rgba(8,20,40,0.88)" />
            <stop offset="100%" stopColor="rgba(3,8,16,0.98)" />
          </linearGradient>
          <linearGradient id="pulseFtPeak" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(247,168,25,0.15)" />
            <stop offset="50%" stopColor="rgba(0,231,253,0.2)" />
            <stop offset="100%" stopColor="rgba(247,168,25,0.12)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#pulseFtSky)"
          stroke="rgba(0,231,253,0.28)"
          strokeWidth="0.7"
          d="M0 34 L0 20 L36 12 L72 18 L108 8 L152 16 L196 10 L244 18 L292 6 L340 14 L388 9 L436 16 L484 8 L532 15 L580 10 L628 17 L676 8 L724 14 L772 9 L820 16 L868 10 L916 15 L964 8 L1012 14 L1060 10 L1108 17 L1156 9 L1204 15 L1252 11 L1300 18 L1348 8 L1396 14 L1444 10 L1492 17 L1540 9 L1588 14 L1636 11 L1672 16 L1672 34 Z"
        />
        <path
          fill="none"
          stroke="url(#pulseFtPeak)"
          strokeWidth="0.65"
          opacity="0.85"
          d="M0 26 L48 18 L96 24 L156 14 L220 22 L280 16 L340 24 L400 14 L468 22 L528 16 L596 24 L656 15 L720 22 L788 17 L852 24 L916 14 L980 22 L1044 17 L1108 25 L1172 15 L1236 22 L1300 16 L1368 24 L1432 15 L1496 22 L1560 17 L1624 23 L1672 19"
        />
        <path
          fill="none"
          stroke="rgba(0,231,253,0.2)"
          strokeWidth="0.45"
          opacity="0.75"
          d="M0 22 L120 16 L240 20 L380 14 L520 19 L668 13 L820 18 L964 12 L1108 17 L1240 14 L1388 19 L1520 15 L1672 18"
        />
      </svg>
    </div>
  )
}

export default function PulseFooterTicker({ footer }: Pick<MockPulseState, 'footer'>) {
  return (
    <footer
      className="pulse-footer-scene absolute bottom-0 left-0 z-20 flex h-[68px] w-full items-center border-t border-white/[0.09] px-6 text-[12px]"
      style={{
        background: `
          radial-gradient(ellipse 120% 180% at 50% 120%, rgba(0,231,253,0.12), transparent 45%),
          linear-gradient(180deg, rgba(0,55,90,0.22) 0%, transparent 34%),
          linear-gradient(180deg, rgba(3,10,22,0.58) 0%, rgba(1,5,12,0.99) 100%)
        `,
        backdropFilter: 'blur(26px) saturate(124%)',
        boxShadow:
          '0 -28px 72px rgba(0,0,0,0.62), inset 0 1px 0 rgba(0,231,253,0.16), inset 0 -1px 0 rgba(247,168,25,0.09), 0 0 48px rgba(0,231,253,0.04)',
      }}
    >
      <div className="pulse-footer-ridge" aria-hidden />
      <FooterSkyline />
      <div className="relative z-10 flex min-w-0 flex-[1.05] items-center gap-3 border-r border-white/[0.1] pr-5">
        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-400/90">Цитата дня</span>
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-medium leading-snug text-white/93">{footer.quote}</div>
          <div className="text-[10px] text-white/38">— {footer.quoteAuthor}</div>
        </div>
      </div>
      <div className="relative z-10 flex min-w-0 flex-[0.92] justify-center px-5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/44">Тренды дня</span>
          {footer.trends.map(t => (
            <span
              key={t}
              className="rounded-full border border-white/[0.12] bg-cyan-500/12 px-2 py-0.5 text-[10px] font-bold text-cyan-200/95"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3 border-l border-white/[0.1] pl-5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/44">Следующая рекомендация</div>
          <div className="mt-0.5 line-clamp-2 text-[10.5px] font-medium leading-snug text-white/78">{footer.nextRecommendation}</div>
        </div>
        <LinkButton />
      </div>
    </footer>
  )
}

function LinkButton() {
  return (
    <a
      href="/program"
      className="shrink-0 rounded-[11px] border border-cyan-400/50 bg-[linear-gradient(135deg,rgba(0,231,253,0.18),rgba(0,112,255,0.08))] px-3 py-1.5 text-[10.5px] font-bold text-white shadow-[var(--pulse-glow-cyan)] hover:brightness-110"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      Смотрите в программе →
    </a>
  )
}
