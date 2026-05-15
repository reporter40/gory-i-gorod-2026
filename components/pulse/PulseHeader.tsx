export default function PulseHeader() {
  return (
    <header
      className="absolute left-0 top-0 z-30 flex h-[70px] w-full items-center border-b border-white/[0.06] px-6"
      style={{
        background: `
          linear-gradient(180deg, rgba(0,231,253,0.06) 0%, transparent 22%),
          linear-gradient(180deg, rgba(6,12,26,0.98) 0%, rgba(8,16,30,0.72) 55%, rgba(6,10,22,0.55) 100%)
        `,
        backdropFilter: 'blur(18px) saturate(120%)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.42), inset 0 -1px 0 rgba(0,231,253,0.1), inset 0 1px 0 rgba(247,168,25,0.04)',
      }}
    >
      <div className="flex items-center gap-3">
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
    </header>
  )
}
