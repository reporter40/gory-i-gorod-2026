export default function PulseHeader() {
  return (
    <header
      className="absolute left-0 top-6 z-30 flex h-[46px] w-full items-center px-6"
      style={{
        background: 'linear-gradient(180deg, rgba(6,12,26,0.55) 0%, transparent 100%)',
        backdropFilter: 'blur(8px)',
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
        <div className="min-w-0 max-w-[295px]">
          <div className="truncate text-[18px] font-semibold leading-[1.12] tracking-tight text-white">Горы и Город — 2026</div>
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/48">Главная AI-панель конференции</div>
        </div>
      </div>
    </header>
  )
}
