import type { PulseSession } from '@/lib/pulse/pulse-data'

function AvatarBubble({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-[9px] font-bold text-white"
      style={{ background: color }}
      title=""
    >
      {initials}
    </div>
  )
}

export default function ProgramNowPanel({ sessions }: { sessions: PulseSession[] }) {
  return (
    <section
      className="pulse-panel absolute flex flex-col overflow-hidden px-[11px] pb-2.5 pt-2.5"
      style={{ left: 12, top: 76, width: 298, height: 332 }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="pulse-panel-title">Программа сейчас</h2>
        <span className="rounded bg-red-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white pulse-blink">
          LIVE
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden pr-0.5">
        <div className="absolute bottom-2 left-[6px] top-1.5 w-px bg-gradient-to-b from-cyan-400/55 via-white/18 to-transparent" />
        <ul className="relative space-y-2 pl-[19px]">
          {sessions.map(sess => (
            <li key={sess.id} className="relative">
              <span
                className="absolute left-[-19px] top-[5px] h-2 w-2 rounded-full border-2 border-cyan-300/55"
                style={{
                  background: sess.isLive ? 'var(--pulse-accent-green)' : 'rgba(255,255,255,0.15)',
                  boxShadow: sess.isLive ? '0 0 8px rgba(34,197,94,0.6)' : undefined,
                }}
              />
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-bold tabular-nums tracking-tight text-cyan-200/95">{sess.time}</span>
                {sess.isLive && (
                  <span className="rounded-full bg-green-500/85 px-1.5 py-0 text-[9px] font-bold text-white">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/38">{sess.type}</p>
              <p className="line-clamp-2 text-[12px] font-semibold leading-[1.35] text-white/96">{sess.title}</p>
              <div className="mt-1 flex -space-x-1.5">
                {sess.speakers.slice(0, 4).map(s => (
                  <AvatarBubble key={s.id} initials={s.initials} color={s.color} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className="mt-1.5 w-full rounded-[10px] border border-white/[0.11] bg-white/[0.055] py-1.5 text-[11px] font-semibold text-white/88 hover:bg-white/[0.09]"
      >
        Смотреть всю программу
      </button>
    </section>
  )
}
