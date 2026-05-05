import Link from 'next/link'
import { SESSIONS, SPEAKERS, BLOCK_LABELS } from '@/lib/data'
import { PartnersBar, LogoInnopolis, LogoGelendzhikArena, LogoIIntegration } from '@/components/Logos'

const BLOCK_DOT: Record<string, string> = {
  tourism: '#2563eb', quality: '#16a34a', creative: '#9333ea',
  infra: '#ea580c', cases: '#0891b2',
}

export default function Home() {
  const nextSession = SESSIONS[0]
  const speaker = SPEAKERS.find(s => s.id === nextSession.speaker_id)

  const quickLinks = [
    { href: '/program', icon: '▤', title: 'Программа', desc: '8 сессий · 2 дня' },
    { href: '/pulse', icon: '◎', title: 'Городской Пульс', desc: 'AI-синтез идей', accent: true },
    { href: '/speakers', icon: '◈', title: 'Спикеры', desc: '6 экспертов' },
    { href: '/network', icon: '◉', title: 'Участники', desc: '200+ человек' },
    { href: '/map', icon: '◫', title: 'Площадка', desc: 'Схема залов' },
    { href: '/dashboard', icon: '◧', title: 'Аналитика', desc: 'Для организаторов' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — минималистичный */}
      <div className="forum-gradient text-white px-5 pt-10 pb-8">
        <div className="max-w-md mx-auto">
          {/* Логотипы партнёров в хедере */}
          <div className="flex items-center gap-3 mb-8 opacity-80">
            <LogoInnopolis size={20} />
            <div className="w-px h-4 bg-white/30" />
            <LogoGelendzhikArena size={20} />
            <div className="w-px h-4 bg-white/30" />
            <LogoIIntegration size={18} />
          </div>

          <p className="subhead text-white/50 mb-3">17–18 сентября 2026 · Геленджик</p>
          <h1 className="display text-white mb-2">Горы и Город</h1>
          <p className="text-white/70 text-base font-light leading-relaxed">
            Форум урбанистики — практический опыт<br />создания городской среды
          </p>
        </div>
      </div>

      {/* Счётчик тем */}
      <div className="bg-white border-b border-gray-100 px-5">
        <div className="max-w-md mx-auto">
          <div className="flex gap-1 py-3 no-scroll overflow-x-auto">
            {Object.entries(BLOCK_LABELS).map(([key, label]) => (
              <Link key={key} href={`/program?block=${key}`}>
                <span className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BLOCK_DOT[key] }} />
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 flex-1 space-y-4">
        {/* Следующая сессия */}
        <Link href="/program">
          <div className="card p-4 cursor-pointer">
            <p className="subhead mb-2 text-[#2563eb]">Открывает форум</p>
            <h2 className="font-semibold text-[#0f1f3d] leading-snug mb-3 text-base">
              {nextSession.title}
            </h2>
            <div className="flex items-center gap-3">
              {speaker && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={speaker.photo_url} alt={speaker.name}
                  className="w-8 h-8 rounded-full object-cover grayscale" />
              )}
              <div className="text-sm text-gray-500">
                {speaker?.name} · {nextSession.hall} · 10:00
              </div>
            </div>
          </div>
        </Link>

        {/* Сетка разделов */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ href, icon, title, desc, accent }) => (
            <Link key={href} href={href}>
              <div className={`rounded-2xl p-4 h-full border transition-all active:scale-95 ${
                accent
                  ? 'forum-gradient border-transparent text-white'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
                <span className={`text-xl mb-3 block font-mono ${accent ? 'text-white/80' : 'text-gray-400'}`}>
                  {icon}
                </span>
                <div className={`font-semibold text-sm ${accent ? 'text-white' : 'text-[#0f1f3d]'}`}>{title}</div>
                <div className={`text-xs mt-0.5 ${accent ? 'text-white/60' : 'text-gray-400'}`}>{desc}</div>
                {accent && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] bg-white/15 rounded-full px-2 py-0.5">
                    <span className="blink">●</span> live
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* О форуме */}
        <div className="card-flat p-4">
          <p className="subhead mb-2">О форуме</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Разговор об урбанистике начинается с разбора конкретных мест
            и готовых решений. Устойчивое развитие, креативная экономика,
            инфраструктура и лучшие практики городского развития.
          </p>
        </div>

        {/* Партнёры */}
        <div className="card-flat overflow-hidden">
          <div className="px-4 pt-4">
            <p className="subhead mb-3">Партнёры</p>
          </div>
          <div className="px-4 pb-4 space-y-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Организаторы</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <LogoInnopolis size={28} />
                  <div>
                    <div className="text-sm font-semibold text-[#0f1f3d]">Иннополис</div>
                    <div className="text-[10px] text-gray-400">Технополис</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <LogoGelendzhikArena size={28} />
                  <div>
                    <div className="text-sm font-semibold text-[#0f1f3d]">Геленджик Арена</div>
                    <div className="text-[10px] text-gray-400">Площадка</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="flex items-center gap-2.5">
              <LogoIIntegration size={26} />
              <div>
                <div className="text-sm font-semibold text-[#0f1f3d]">ИИнтеграция</div>
                <div className="text-[10px] text-gray-400">Консалтингово-аналитическая группа · Креативный партнёр</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
