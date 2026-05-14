import Link from 'next/link'
import { SESSIONS, SPEAKERS, BLOCK_LABELS, PARTICIPANTS } from '@/lib/data'
import { LogoInnopolis, LogoGelendzhikArena, LogoIIntegration } from '@/components/Logos'

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
      <div className="text-white relative overflow-hidden z-10"
        style={{ background: 'linear-gradient(175deg, #020c1c 0%, #030f20 55%, #07101f 100%)', minHeight: 440 }}>

        {/* ── Background art: ring RIGHT, mountains bottom ── */}
        <svg aria-hidden="true" viewBox="0 0 430 440"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="hOrbGlow" cx="75%" cy="40%" r="42%">
              <stop offset="0%" stopColor="#1a8fc0" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#020c1c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hCityGlow" cx="50%" cy="100%" r="55%">
              <stop offset="0%" stopColor="#c4974a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#020c1c" stopOpacity="0" />
            </radialGradient>
            <filter id="hBlur3"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="hBlur6"><feGaussianBlur stdDeviation="6" /></filter>
            <style>{`
              @keyframes hr1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
              @keyframes hr2 { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
              @keyframes hfl { 0%,100%{opacity:.5} 50%{opacity:.75} }
              .hr1{transform-origin:318px 185px;animation:hr1 32s linear infinite}
              .hr2{transform-origin:318px 185px;animation:hr2 20s linear infinite}
              .hr3{transform-origin:318px 185px;animation:hr1 55s linear infinite}
              .hrg{transform-origin:318px 185px;animation:hr2 70s linear infinite}
              .hfl{animation:hfl 4.5s ease-in-out infinite}
            `}</style>
          </defs>

          {/* Ambient glow behind ring (right side) */}
          <ellipse cx="318" cy="185" rx="190" ry="170" fill="url(#hOrbGlow)" />

          {/* Stars — scattered top half */}
          {[[22,18],[65,12],[105,30],[155,8],[210,24],[270,14],[340,8],[390,20],[415,35],[420,55],[380,60],[250,45],[150,55],[60,48],[12,38],[340,42]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r={i%4===0?1.3:0.75} fill="white" fillOpacity={0.25+((i*7)%10)*0.04}/>
          ))}

          {/* Outer dotted gold ring */}
          <circle className="hrg" cx="318" cy="185" r="162"
            fill="none" stroke="#c4974a" strokeWidth="0.7" strokeOpacity="0.2" strokeDasharray="2 20"/>
          {/* Outer blue ring */}
          <circle className="hr3" cx="318" cy="185" r="140"
            fill="none" stroke="#1e6a96" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="8 28"/>
          {/* Mid ring */}
          <circle className="hr2" cx="318" cy="185" r="112"
            fill="none" stroke="#1e82b8" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="14 22"/>
          {/* Inner glow ring (blur copy) */}
          <circle className="hr1" cx="318" cy="185" r="82"
            fill="none" stroke="#3ab0d8" strokeWidth="2.5" strokeOpacity="0.5"
            strokeDasharray="55 159" filter="url(#hBlur3)"/>
          {/* Inner ring sharp */}
          <circle className="hr1" cx="318" cy="185" r="82"
            fill="none" stroke="#6ad8f8" strokeWidth="1.2" strokeOpacity="0.75" strokeDasharray="55 159"/>
          {/* Gold arc accent */}
          <circle className="hrg" cx="318" cy="185" r="82"
            fill="none" stroke="#d4a855" strokeWidth="2" strokeOpacity="0.55" strokeDasharray="9 245"/>

          {/* Core orb dark fill */}
          <circle cx="318" cy="185" r="60" fill="#020c1c"/>
          {/* Core rim */}
          <circle cx="318" cy="185" r="60"
            fill="none" stroke="#3ab0d8" strokeWidth="1.5" strokeOpacity="0.45"/>
          {/* Core glow soft */}
          <circle cx="318" cy="185" r="59"
            fill="none" stroke="#6ad8f8" strokeWidth="4" strokeOpacity="0.1" filter="url(#hBlur3)"/>
          {/* Bright arc on core */}
          <path d="M 318 125 A 60 60 0 0 1 352 197"
            fill="none" stroke="#4ac8ee" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" filter="url(#hBlur3)"/>
          <path d="M 318 125 A 60 60 0 0 1 352 197"
            fill="none" stroke="#aaeeff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
          {/* Small gold dot on ring */}
          <circle cx="377" cy="173" r="3" fill="#d4a855" fillOpacity="0.8" filter="url(#hBlur3)"/>
          <circle cx="377" cy="173" r="1.5" fill="#f0cc88" fillOpacity="0.95"/>

          {/* Mountains — full bottom */}
          <path d="M0 360 L45 295 L85 318 L130 258 L175 295 L215 245 L260 290 L300 262 L345 285 L385 255 L430 272 L430 360 Z"
            fill="#030b1a" opacity="0.98"/>
          <path d="M0 370 L70 328 L115 342 L155 308 L195 325 L235 300 L270 318 L315 304 L355 318 L400 305 L430 315 L430 370 Z"
            fill="#020c1c" opacity="1"/>

          {/* City glow */}
          <rect x="50" y="355" width="330" height="10" fill="url(#hCityGlow)" filter="url(#hBlur6)"/>
          {/* City lights */}
          <g className="hfl">
            {[[150,352],[163,350],[176,353],[189,349],[202,352],[215,350],[228,353],[241,350],[254,352],[267,351],[280,353],[293,350],[165,358],[190,357],[215,359],[240,358]].map(([x,y],i)=>(
              <rect key={i} x={x} y={y} width={i%5===0?2.5:1.5} height={i%3===0?3.5:2.5}
                fill={i%4===0?'#d4a855':'#4ac8ee'} fillOpacity={0.45+((i*13)%10)*0.04}/>
            ))}
          </g>
        </svg>

        {/* ── TEXT CONTENT — left side, clear of ring ── */}
        <div className="relative px-6 pt-14 pb-12" style={{ zIndex: 2, maxWidth: '58%' }}>

          {/* Partner labels — text only, no icons */}
          <div className="flex items-center gap-0 mb-10 flex-wrap">
            {[['ИННОПОЛИС','#4a9eca'],['ГЕЛЕНДЖИК АРЕНА','rgba(238,244,255,0.35)'],['IIИНТЕГРАЦИЯ','rgba(238,244,255,0.35)']].map(([name, color], i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 8, marginRight: 8, fontSize: 10 }}>·</span>}
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: color as string }}>
                  {name}
                </span>
              </span>
            ))}
          </div>

          {/* Date badge */}
          <div className="glow-chip mb-5" style={{ display: 'inline-flex' }}>
            <span className="blink">●</span> 16–17 МАЯ · ГЕЛЕНДЖИК
          </div>

          {/* Main title */}
          <h1 style={{
            fontSize: 42, fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1.0,
            color: '#ffffff',
            marginBottom: 12,
          }}>
            Горы<br />и Город
          </h1>

          {/* Gold accent line */}
          <div style={{
            width: 36, height: 2,
            background: 'linear-gradient(90deg, #d4a855, rgba(212,168,85,0))',
            borderRadius: 2, marginBottom: 16,
          }} />

          {/* Subtitle */}
          <p style={{ color: 'rgba(238,244,255,0.5)', fontSize: 13, fontWeight: 400, lineHeight: 1.65 }}>
            Форум урбанистики<br />и городской среды
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
