import Link from 'next/link'

const NAV = ['Главная', 'Программа', 'AI-ПУЛЬС', 'Участники', 'Партнёры', 'Спикеры'] as const

export default function PulseHeader() {
  return (
    <header
      className="absolute left-0 top-0 z-30 flex h-[70px] w-full items-center border-b border-white/[0.08] px-6"
      style={{
        background: 'linear-gradient(180deg, rgba(6,10,22,0.97) 0%, rgba(8,14,26,0.62) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(0,231,253,0.06)',
      }}
    >
      <div className="flex w-[292px] shrink-0 items-center gap-3">
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[14px] font-extrabold"
          style={{
            background: 'linear-gradient(135deg, var(--pulse-accent-cyan) 0%, #0070ff 100%)',
            boxShadow: 'var(--pulse-glow-cyan)',
            color: '#051018',
          }}
        >
          GG
        </div>
        <div className="min-w-0">
          <div className="truncate text-[18px] font-semibold leading-[1.12] tracking-tight text-white">Горы и Город — 2026</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/48">Главная AI-панель конференции</div>
        </div>
      </div>

      <nav className="flex flex-1 justify-center gap-9 px-4">
        {NAV.map(item => (
          <span
            key={item}
            className={
              item === 'AI-ПУЛЬС'
                ? 'pulse-nav-active cursor-default text-[12px] font-bold tracking-[0.06em]'
                : 'cursor-default text-[12px] font-medium text-white/52 hover:text-white/82'
            }
          >
            {item === 'Главная' ? (
              <Link href="/" className="text-inherit no-underline hover:text-white/90">
                {item}
              </Link>
            ) : item === 'Программа' ? (
              <Link href="/program" className="text-inherit no-underline hover:text-white/90">
                {item}
              </Link>
            ) : (
              item
            )}
          </span>
        ))}
      </nav>

      <div className="flex w-[352px] shrink-0 items-center justify-end gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.055] px-2.5 py-1">
          <span className={`h-2 w-2 rounded-full bg-[var(--pulse-accent-green)] ${''}`} />
          <span className="text-[10px] font-bold tracking-[0.1em] text-[var(--pulse-accent-green)]">LIVE</span>
        </div>
        <button
          type="button"
          className="relative rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white"
          aria-label="Уведомления"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--pulse-accent-red)]" />
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30"
          style={{ boxShadow: '0 0 12px rgba(0,229,255,0.15)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-200">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20v-2a4 4 0 018 0v2" />
          </svg>
        </div>
        <button
          type="button"
          className="rounded-[12px] border-2 px-3.5 py-2 text-[11px] font-bold tracking-wide text-white"
          style={{
            borderImage: 'linear-gradient(90deg,var(--pulse-accent-cyan),#0070ff,var(--pulse-accent-gold)) 1',
            background: 'linear-gradient(135deg,rgba(0,231,253,0.16),rgba(0,112,255,0.09))',
            boxShadow: 'var(--pulse-glow-cyan), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          Принять участие
        </button>
      </div>
    </header>
  )
}
