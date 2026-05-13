import type { MockPulseState } from '@/lib/pulse/pulse-data'

export default function PulseFooterTicker({ footer }: Pick<MockPulseState, 'footer'>) {
  return (
    <footer
      className="absolute bottom-0 left-0 flex h-[68px] w-full items-center border-t border-white/[0.1] px-6 text-[12px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(3,8,18,0.35) 0%, rgba(2,8,16,0.97) 100%)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(0,231,253,0.05)',
      }}
    >
      <div className="flex min-w-0 flex-[1.05] items-center gap-3 border-r border-white/[0.1] pr-5">
        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-400/90">Цитата дня</span>
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-medium leading-snug text-white/93">{footer.quote}</div>
          <div className="text-[10px] text-white/38">— {footer.quoteAuthor}</div>
        </div>
      </div>
      <div className="flex min-w-0 flex-[0.92] justify-center px-5">
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
      <div className="flex min-w-0 flex-1 items-center gap-3 border-l border-white/[0.1] pl-5">
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
