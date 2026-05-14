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
      <div className="text-white relative overflow-hidden z-10" style={{ minHeight: 440 }}>

        {/* Photo background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 20%',
            pointerEvents: 'none',
          }}
        />

        {/* Gradient overlay — darkens bottom so content is readable */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(2,12,28,0.35) 0%, rgba(2,12,28,0.55) 60%, rgba(7,16,31,1) 100%)',
        }} />

        {/* ── TEXT CONTENT ── */}
        <div className="relative px-6 pt-14 pb-12" style={{ zIndex: 2, maxWidth: '62%' }}>

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
