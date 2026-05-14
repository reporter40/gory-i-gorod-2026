export default function MapPage() {
  const zones = [
    { id: 'hall-a', label: 'Зал А', desc: 'Пленарные сессии', color: '#4a9eca', x: 30, y: 80, w: 185, h: 120 },
    { id: 'hall-b', label: 'Зал Б', desc: 'Параллельные секции', color: '#22c55e', x: 235, y: 80, w: 185, h: 120 },
    { id: 'coffee', label: 'Кофе-зона', desc: 'Нетворкинг', color: '#f97316', x: 30, y: 220, w: 185, h: 80 },
    { id: 'expo', label: 'Экспозиция', desc: 'Выставка проектов', color: '#a855f7', x: 235, y: 220, w: 185, h: 80 },
    { id: 'sea', label: 'Терраса', desc: 'Вид на море 🌊', color: '#06b6d4', x: 30, y: 320, w: 390, h: 60 },
  ]

  const schedule = [
    { time: '08:00', event: 'Регистрация и кофе', location: 'Фойе' },
    { time: '10:00', event: 'Открытие форума', location: 'Главный зал' },
    { time: '10:15', event: 'Пленарная сессия №1', location: 'Главный зал' },
    { time: '12:45', event: 'Обед', location: 'Ресторан' },
    { time: '13:30', event: 'Сольные выступления', location: 'Главный зал' },
    { time: '15:15', event: 'Кофе-брейк', location: 'Фойе' },
    { time: '16:45', event: 'Пленарная сессия №2', location: 'Главный зал' },
    { time: '18:00', event: 'Ужин спикеров', location: 'Ресторан' },
  ]

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-4 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Площадка</p>
          <h1 className="heading text-white">Карта зон</h1>
          <p style={{ fontSize: 12, color: 'rgba(238,244,255,0.4)', marginTop: 4 }}>Геленджик Арена, Геленджик</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* SVG map */}
        <div className="card p-3 mb-4">
          <svg viewBox="0 0 450 450" className="w-full" style={{ maxHeight: 320 }}>
            <rect width="450" height="450" fill="#0c1a2e" rx="12" />

            {/* Sea */}
            <rect x="0" y="400" width="450" height="50" fill="#06b6d4" opacity="0.08" rx="0" />
            <text x="225" y="430" textAnchor="middle" fontSize="11" fill="#06b6d4" opacity="0.6">🌊 Чёрное море</text>

            {zones.map(z => (
              <g key={z.id}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill={z.color} opacity="0.1" stroke={z.color} strokeWidth="1" strokeOpacity="0.4" />
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={z.color}>
                  {z.label}
                </text>
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 12} textAnchor="middle" fontSize="10" fill="rgba(238,244,255,0.4)">
                  {z.desc}
                </text>
              </g>
            ))}

            {/* Entrance */}
            <rect x="180" y="10" width="90" height="40" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <text x="225" y="35" textAnchor="middle" fontSize="11" fill="rgba(238,244,255,0.5)">🚪 Вход</text>

            {/* Path */}
            <line x1="225" y1="50" x2="225" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {zones.slice(0, 4).map(z => (
            <div key={z.id} className="card p-3 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: z.color }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{z.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{z.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div className="card p-4">
          <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 14, fontSize: 15 }}>Расписание дня</h3>
          <div className="space-y-2.5">
            {schedule.map(({ time, event, location }) => (
              <div key={time} className="flex gap-3 items-start">
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent)', width: 48, flexShrink: 0, paddingTop: 1 }}>{time}</span>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{event}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
