export default function MapPage() {
  const zones = [
    { id: 'hall-a', label: 'Зал А', desc: 'Пленарные сессии', color: '#1a3a5c', x: 60, y: 80, w: 200, h: 120 },
    { id: 'hall-b', label: 'Зал Б', desc: 'Параллельные секции', color: '#2d5a3d', x: 290, y: 80, w: 140, h: 120 },
    { id: 'coffee', label: 'Кофе-зона', desc: 'Нетворкинг', color: '#e07b39', x: 60, y: 230, w: 140, h: 80 },
    { id: 'expo', label: 'Экспозиция', desc: 'Выставка проектов', color: '#8e44ad', x: 220, y: 230, w: 210, h: 80 },
    { id: 'sea', label: 'Терраса', desc: 'Вид на море 🌊', color: '#4a9eca', x: 60, y: 340, w: 370, h: 60 },
  ]

  const schedule = [
    { time: '09:00', event: 'Регистрация', location: 'Вход' },
    { time: '10:00', event: 'Открытие форума', location: 'Зал А' },
    { time: '11:30', event: 'Параллельные секции', location: 'Зал А / Зал Б' },
    { time: '13:00', event: 'Обед + нетворкинг', location: 'Кофе-зона' },
    { time: '14:00', event: 'Дневные сессии', location: 'Зал А / Зал Б' },
    { time: '16:00', event: 'Кофе-брейк', location: 'Кофе-зона' },
    { time: '16:30', event: 'Финальная сессия', location: 'Зал А' },
    { time: '18:00', event: 'Нетворкинг на террасе', location: 'Терраса' },
  ]

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-4 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Карта площадки</h1>
          <p className="text-sm opacity-75">Санаторий «Голубая волна», Геленджик</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* SVG map */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-4">
          <svg viewBox="0 0 450 430" className="w-full" style={{ maxHeight: 300 }}>
            {/* Background */}
            <rect width="450" height="430" fill="#f0f4f8" rx="12" />

            {/* Sea at bottom */}
            <rect x="0" y="380" width="450" height="50" fill="#4a9eca" opacity="0.15" rx="0" />
            <text x="225" y="410" textAnchor="middle" fontSize="11" fill="#4a9eca">🌊 Чёрное море</text>

            {zones.map(z => (
              <g key={z.id}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8" fill={z.color} opacity="0.15" stroke={z.color} strokeWidth="1.5" />
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 6} textAnchor="middle" fontSize="13" fontWeight="bold" fill={z.color}>
                  {z.label}
                </text>
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 12} textAnchor="middle" fontSize="10" fill="#666">
                  {z.desc}
                </text>
              </g>
            ))}

            {/* Entrance */}
            <rect x="180" y="10" width="90" height="40" rx="6" fill="#fff" stroke="#ccc" strokeWidth="1" />
            <text x="225" y="35" textAnchor="middle" fontSize="11" fill="#555">🚪 Вход</text>

            {/* Paths */}
            <line x1="225" y1="50" x2="225" y2="80" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {zones.slice(0, 4).map(z => (
            <div key={z.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
              <div>
                <div className="text-xs font-semibold text-gray-800">{z.label}</div>
                <div className="text-[10px] text-gray-400">{z.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily schedule */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1a3a5c] mb-3">Расписание дня</h3>
          <div className="space-y-2">
            {schedule.map(({ time, event, location }) => (
              <div key={time} className="flex gap-3 items-start">
                <span className="text-xs font-mono text-[#4a9eca] w-12 flex-shrink-0 pt-0.5">{time}</span>
                <div>
                  <div className="text-sm text-gray-800">{event}</div>
                  <div className="text-xs text-gray-400">{location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
