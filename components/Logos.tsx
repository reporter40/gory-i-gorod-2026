// SVG логотипы организаторов

export function LogoInnopolis({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Гексагон — символ умного города */}
      <path
        d="M20 3L35.5 12V28L20 37L4.5 28V12L20 3Z"
        stroke="#0066CC"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M20 9L29.5 14.5V25.5L20 31L10.5 25.5V14.5L20 9Z"
        fill="#0066CC"
        opacity="0.15"
      />
      {/* I-буква внутри */}
      <rect x="18" y="14" width="4" height="12" rx="1" fill="#0066CC" />
      <rect x="15" y="14" width="10" height="2.5" rx="1" fill="#0066CC" />
      <rect x="15" y="23.5" width="10" height="2.5" rx="1" fill="#0066CC" />
    </svg>
  )
}

export function LogoGelendzhikArena({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Арка арены */}
      <path
        d="M4 36C4 20.536 12.954 8 24 8C35.046 8 44 20.536 44 36"
        stroke="#1A5C3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Внутренняя арка */}
      <path
        d="M10 36C10 23.297 16.268 13 24 13C31.732 13 38 23.297 38 36"
        stroke="#1A5C3A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      {/* Горы */}
      <path d="M2 36L10 20L18 30L24 16L30 28L36 18L46 36" stroke="#4a9eca" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Основание */}
      <line x1="2" y1="36" x2="46" y2="36" stroke="#1A5C3A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function LogoIIntegration({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Нейронная сеть — символ ИИ */}
      {/* Узлы */}
      <circle cx="8" cy="20" r="4" fill="#6B21A8" />
      <circle cx="20" cy="8" r="4" fill="#6B21A8" />
      <circle cx="20" cy="32" r="4" fill="#6B21A8" />
      <circle cx="32" cy="20" r="4" fill="#6B21A8" />
      <circle cx="20" cy="20" r="3" fill="#9333EA" />
      {/* Связи */}
      <line x1="11.5" y1="18" x2="17" y2="10.5" stroke="#9333EA" strokeWidth="1.2" opacity="0.6" />
      <line x1="11.5" y1="22" x2="17" y2="29.5" stroke="#9333EA" strokeWidth="1.2" opacity="0.6" />
      <line x1="23" y1="10.5" x2="28.5" y2="18" stroke="#9333EA" strokeWidth="1.2" opacity="0.6" />
      <line x1="23" y1="29.5" x2="28.5" y2="22" stroke="#9333EA" strokeWidth="1.2" opacity="0.6" />
      <line x1="12" y1="20" x2="17" y2="20" stroke="#9333EA" strokeWidth="1.2" opacity="0.4" />
      <line x1="23" y1="20" x2="28" y2="20" stroke="#9333EA" strokeWidth="1.2" opacity="0.4" />
    </svg>
  )
}

export function PartnersBar({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const textClass = variant === 'dark' ? 'text-white/60' : 'text-gray-400'
  const labelClass = variant === 'dark' ? 'text-white/90 font-semibold text-xs' : 'text-gray-700 font-semibold text-xs'

  return (
    <div className={`flex flex-col gap-4 py-4 px-4 ${variant === 'dark' ? '' : 'bg-gray-50 rounded-2xl border border-gray-100'}`}>
      <div className="flex items-start gap-6 flex-wrap">
        <div>
          <div className={`text-[10px] uppercase tracking-widest mb-1.5 ${textClass}`}>Организаторы</div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <LogoInnopolis size={26} />
              <span className={labelClass}>Иннополис</span>
            </div>
            <div className="flex items-center gap-2">
              <LogoGelendzhikArena size={26} />
              <span className={labelClass}>Геленджик Арена</span>
            </div>
          </div>
        </div>
        <div>
          <div className={`text-[10px] uppercase tracking-widest mb-1.5 ${textClass}`}>Креативный партнёр</div>
          <div className="flex items-center gap-2">
            <LogoIIntegration size={22} />
            <span className={labelClass}>ИИнтеграция</span>
          </div>
        </div>
      </div>
    </div>
  )
}
