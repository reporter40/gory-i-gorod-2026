import Link from 'next/link'
import { SESSIONS, SPEAKERS, BLOCK_LABELS, PARTICIPANTS } from '@/lib/data'
import { PartnersBar, LogoInnopolis, LogoGelendzhikArena, LogoIIntegration } from '@/components/Logos'

const BLOCK_DOT: Record<string, string> = {
  tourism: '#4a9eca', quality: '#22c55e', creative: '#a855f7',
  infra: '#f97316', cases: '#06b6d4',
}

const BLOCK_ACCENT: Record<string, string> = {
  tourism: 'rgba(74,158,202,0.12)', quality: 'rgba(34,197,94,0.1)',
  creative: 'rgba(168,85,247,0.1)', infra: 'rgba(249,115,22,0.1)',
  cases: 'rgba(6,182,212,0.1)',
}

export default function Home() {
  const nextSession =
    SESSIONS.find(s => s.id === 'd1-open') ?? SESSIONS.find(s => s.speaker_id !== 'org') ?? SESSIONS[0]
  const speaker = SPEAKERS.find(s => s.id === nextSession.speaker_id)

  const quickLinks = [
    { href: '/program',  icon: '▤', title: 'Программа',    desc: `${SESSIONS.length} слотов · 2 дня`,    color: '#4a9eca' },
    { href: '/pulse',    icon: '◎', title: 'Пульс',         desc: 'AI-синтез идей',  color: '#22c55e', live: true },
    { href: '/speakers', icon: '◈', title: 'Спикеры',       desc: `${SPEAKERS.length} экспертов`,         color: '#a855f7' },
    { href: '/network',  icon: '◉', title: 'Участники',     desc: `${PARTICIPANTS.length} в программе`,   color: '#f97316' },
    { href: '/map',      icon: '◫', title: 'Площадка',      desc: 'Схема залов',                           color: '#06b6d4' },
    { href: '/dashboard',icon: '◧', title: 'Аналитика',     desc: 'Для организаторов',                     color: '#c4974a' },
  ]

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(74,158,202,0.07) 0%, transparent 70%)',
      }} />

      {/* Hero */}
      <div className="text-white px-5 pt-12 pb-9 relative overflow-hidden z-10"
        style={{ background: 'linear-gradient(180deg, #020d1f 0%, #050f22 60%, #07101f 100%)', minHeight: 380 }}>

        {/* ── Animated background art ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 430 380"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="orbGlow" cx="50%" cy="42%" r="38%">
              <stop offset="0%" stopColor="#1a8fc0" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#0a4a7a" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#020d1f" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cityGlow" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#c4974a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#020d1f" stopOpacity="0" />
            </radialGradient>
            <filter id="blur4">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id="blur2">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <style>{`
              @keyframes ring-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes ring-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
              @keyframes orb-pulse {
                0%,100% { opacity: 0.7; r: 58; }
                50%      { opacity: 1;   r: 62; }
              }
              @keyframes city-flicker {
                0%,100% { opacity:0.55 } 30% { opacity:0.7 } 70% { opacity:0.5 }
              }
              .ring1 { transform-origin: 215px 160px; animation: ring-spin 28s linear infinite; }
              .ring2 { transform-origin: 215px 160px; animation: ring-spin-rev 18s linear infinite; }
              .ring3 { transform-origin: 215px 160px; animation: ring-spin 45s linear infinite; }
              .ring-gold { transform-origin: 215px 160px; animation: ring-spin-rev 60s linear infinite; }
              .city-lights { animation: city-flicker 4s ease-in-out infinite; }
            `}</style>
          </defs>

          {/* Ambient background glow */}
          <ellipse cx="215" cy="155" rx="220" ry="160" fill="url(#orbGlow)" />

          {/* Outer gold dotted ring */}
          <circle className="ring-gold" cx="215" cy="160" r="155"
            fill="none" stroke="#c4974a" strokeWidth="0.6" strokeOpacity="0.25"
            strokeDasharray="3 18" />

          {/* Outer ring 1 */}
          <circle className="ring3" cx="215" cy="160" r="135"
            fill="none" stroke="#2a6a9a" strokeWidth="0.8" strokeOpacity="0.3"
            strokeDasharray="6 24" />

          {/* Ring 2 — thicker */}
          <circle className="ring2" cx="215" cy="160" r="108"
            fill="none" stroke="#1a7ab8" strokeWidth="1.2" strokeOpacity="0.4"
            strokeDasharray="12 20" />

          {/* Inner glowing ring */}
          <circle className="ring1" cx="215" cy="160" r="80"
            fill="none" stroke="#4ab8e0" strokeWidth="2" strokeOpacity="0.6"
            strokeDasharray="60 140" filter="url(#blur2)" />
          <circle className="ring1" cx="215" cy="160" r="80"
            fill="none" stroke="#6ad4f8" strokeWidth="1" strokeOpacity="0.8"
            strokeDasharray="60 140" />

          {/* Gold arc accent */}
          <circle className="ring-gold" cx="215" cy="160" r="80"
            fill="none" stroke="#c4974a" strokeWidth="1.5" strokeOpacity="0.5"
            strokeDasharray="8 232" />

          {/* Core orb */}
          <circle cx="215" cy="160" r="58" fill="#020d1f" />
          <circle cx="215" cy="160" r="58" fill="none" stroke="#4ab8e0" strokeWidth="1.5" strokeOpacity="0.5" />
          {/* Orb inner glow rim */}
          <circle cx="215" cy="160" r="57" fill="none" stroke="#6ad4f8" strokeWidth="3" strokeOpacity="0.15" filter="url(#blur2)" />
          {/* Bright arc on core */}
          <path d="M 215 102 A 58 58 0 0 1 248 170" fill="none" stroke="#4ab8e0" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9" filter="url(#blur2)" />
          <path d="M 215 102 A 58 58 0 0 1 248 170" fill="none" stroke="#9ee8ff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />

          {/* Stars */}
          {[[38,28],[90,18],[140,35],[300,22],[360,40],[400,15],[50,70],[380,65],[420,50],[10,45],[200,12],[320,55]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r={i%3===0?1.2:0.7} fill="white" fillOpacity={0.4+Math.sin(i)*0.3} />
          ))}

          {/* Mountain silhouette */}
          <path
            d="M0 310 L55 240 L100 270 L155 195 L200 245 L240 185 L285 250 L330 210 L375 255 L430 230 L430 310 Z"
            fill="#030b1a" opacity="0.95"
          />
          <path
            d="M0 320 L80 275 L130 290 L175 255 L215 270 L260 248 L305 268 L360 255 L410 272 L430 265 L430 320 Z"
            fill="#020d1f" opacity="1"
          />

          {/* City glow on horizon */}
          <rect x="0" y="305" width="430" height="8" fill="url(#cityGlow)" filter="url(#blur4)" />

          {/* City lights */}
          <g className="city-lights">
            {[[160,300],[175,298],[190,302],[205,297],[220,301],[235,299],[250,303],[265,298],[280,301],[295,300],[175,307],[200,305],[225,308],[250,306],[140,304],[310,303]].map(([x,y],i) => (
              <rect key={i} x={x} y={y} width={i%4===0?2:1} height={i%3===0?3:2}
                fill={i%5===0?'#c4974a':'#4ab8e0'} fillOpacity={0.5+Math.sin(i*1.7)*0.3} />
            ))}
          </g>
        </svg>

        {/* Content */}
        <div className="max-w-md mx-auto relative" style={{ zIndex: 2 }}>
          <div className="flex items-center gap-3 mb-9 opacity-60">
            <LogoInnopolis size={18} />
            <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <LogoGelendzhikArena size={18} />
            <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <LogoIIntegration size={16} />
          </div>

          <div className="glow-chip mb-4">
            <span className="blink">●</span> 16–17 мая · Геленджик
          </div>

          <h1 className="display text-white mb-2">Горы<br />и Город</h1>

          <div style={{ width: 28, height: 2, background: 'linear-gradient(90deg, #c4974a, transparent)', borderRadius: 2, marginBottom: 14 }} />

          <p style={{ color: 'rgba(238,244,255,0.55)', fontSize: 15, fontWeight: 400, lineHeight: 1.6 }}>
            Форум урбанистики — практический опыт<br />создания городской среды
          </p>
        </div>
      </div>

      {/* Block pills */}
      <div style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="px-5 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="flex gap-1.5 py-3 no-scroll overflow-x-auto">
            {Object.entries(BLOCK_LABELS).map(([key, label]) => (
              <Link key={key} href={`/program?block=${key}`}>
                <span className="flex-shrink-0 flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-all"
                  style={{
                    background: BLOCK_ACCENT[key],
                    border: `1px solid ${BLOCK_DOT[key]}30`,
                    color: BLOCK_DOT[key],
                    fontWeight: 600,
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BLOCK_DOT[key] }} />
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 flex-1 space-y-3 relative z-10 w-full">
        {/* Opening session card */}
        <Link href="/program">
          <div className="card p-4 cursor-pointer" style={{ borderColor: 'rgba(74,158,202,0.2)' }}>
            <div className="glow-chip mb-3" style={{ display: 'inline-flex' }}>Открывает форум</div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 14, fontSize: 16 }}>
              {nextSession.title}
            </h2>
            <div className="flex items-center gap-3">
              {speaker && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={speaker.photo_url} alt={speaker.name}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ filter: 'grayscale(40%) brightness(1.1)' }} />
              )}
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {speaker?.name} · {nextSession.hall} ·{' '}
                {new Date(nextSession.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </Link>

        {/* Quick links grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {quickLinks.map(({ href, icon, title, desc, color, live }) => (
            <Link key={href} href={href}>
              <div className="card p-4 h-full cursor-pointer active:scale-95 transition-transform"
                style={{ borderColor: `${color}22` }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: 22, color: color, fontFamily: 'monospace', lineHeight: 1 }}>
                    {icon}
                  </span>
                  {live && (
                    <span className="glow-chip" style={{ fontSize: 9, padding: '3px 8px' }}>
                      <span className="blink">●</span> live
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* About */}
        <div className="card-flat p-5">
          <p className="subhead mb-3">О форуме</p>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>
            Разговор об урбанистике начинается с разбора конкретных мест
            и готовых решений. Устойчивое развитие, креативная экономика,
            инфраструктура и лучшие практики городского развития.
          </p>
        </div>

        {/* Partners */}
        <div className="card-flat overflow-hidden">
          <div className="px-5 pt-5">
            <p className="subhead mb-4">Партнёры</p>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Организаторы
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <LogoInnopolis size={26} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Иннополис</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Технополис</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <LogoGelendzhikArena size={26} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Геленджик Арена</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Площадка</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="flex items-center gap-2.5">
              <LogoIIntegration size={24} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>ИИнтеграция</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Консалтингово-аналитическая группа · Креативный партнёр</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
