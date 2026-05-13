/** Deterministic pulse dashboard state — no Date.now()/Math.random. */

export type PulseSpeaker = { id: string; name: string; initials: string; color: string }

export type PulseSession = {
  id: string
  time: string
  type: string
  title: string
  hall: string
  isLive?: boolean
  speakers: PulseSpeaker[]
}

export type PulseTopTag = {
  id: string
  name: string
  icon: string
  votes: number
  growth: number
  mood: number
}

export type PulseTagBar = { name: string; value: number; color?: string }

export type PulseTopicNode = {
  id: string
  name: string
  value: number
  trend: number
}

export type PulseGeoRegion = { name: string; percent: number }

export type PulseHallPulsePoint = { time: string; value: number }

export type PulseAIInsight = { icon: string; text: string }

export type SessionHeatmap = {
  halls: readonly string[]
  times: readonly string[]
  /** 0–100 intensity per hall row */
  values: readonly (readonly number[])[]
  /** Tooltip cell for static mock */
  highlight: { hallIndex: number; timeIndex: number; engagement: number; label: string }
}

export type MockPulseState = {
  event: { name: string; activeSessionId: string; expectedAudience: number }
  stats: {
    onlineParticipants: number
    participantsChange: number
    hallActivity: number
    engagement: number
    engagementChange: number
    speakersToday: number
    overallEngagement: number
  }
  sessions: PulseSession[]
  tagFilterTabs: readonly string[]
  topTags: PulseTopTag[]
  tagMoodBars: PulseTagBar[]
  topicNetwork: PulseTopicNode[]
  geoRegions: PulseGeoRegion[]
  hallPulse: { current: number; timeline: PulseHallPulsePoint[] }
  sessionHeatmap: SessionHeatmap
  aiInsights: PulseAIInsight[]
  footer: {
    quote: string
    quoteAuthor: string
    trends: readonly string[]
    nextRecommendation: string
  }
  voting: {
    leftDonut: { label: string; percent: number; votes: number; trend: number }
    rightDonut: { label: string; percent: number; votes: number; trend: number }
    avatarGroups: readonly { count: number; offset: number }[]
  }
}

const SP = (id: string, name: string, initials: string, color: string): PulseSpeaker =>
  ({ id, name, initials, color })

export const MOCK_SPEAKERS = {
  a: SP('sp-a', 'А. Иванова', 'АИ', '#3b82f6'),
  b: SP('sp-b', 'М. Петров', 'МП', '#22c55e'),
  c: SP('sp-c', 'Е. Смирнова', 'ЕС', '#a855f7'),
  d: SP('sp-d', 'Д. Орлов', 'ДО', '#f59e0b'),
  e: SP('sp-e', 'К. Лебедева', 'КЛ', '#ec4899'),
} as const

export const mockPulseState: MockPulseState = {
  event: {
    name: 'Горы и Город — 2026',
    activeSessionId: 'session-1',
    expectedAudience: 1700,
  },
  stats: {
    onlineParticipants: 1248,
    participantsChange: 112,
    hallActivity: 73,
    engagement: 68,
    engagementChange: 9,
    speakersToday: 42,
    overallEngagement: 73,
  },
  sessions: [
    {
      id: 'session-1',
      time: '10:25',
      type: 'Пленарная сессия',
      title: 'Будущее городов в новой реальности',
      hall: 'Главный зал',
      isLive: true,
      speakers: [MOCK_SPEAKERS.a, MOCK_SPEAKERS.b, MOCK_SPEAKERS.c],
    },
    {
      id: 'session-2',
      time: '11:15',
      type: 'Кейс-сессия',
      title: 'Умные решения для устойчивого роста',
      hall: 'Панорама',
      speakers: [MOCK_SPEAKERS.d, MOCK_SPEAKERS.e],
    },
    {
      id: 'session-3',
      time: '12:00',
      type: 'Панельная дискуссия',
      title: 'ГЧП как драйвер развития регионов',
      hall: 'Стратегия',
      speakers: [MOCK_SPEAKERS.b, MOCK_SPEAKERS.c, MOCK_SPEAKERS.d],
    },
    {
      id: 'session-4',
      time: '13:30',
      type: 'Кейс-сессия',
      title: 'Технологии для людей',
      hall: 'Инновации',
      speakers: [MOCK_SPEAKERS.a, MOCK_SPEAKERS.e],
    },
    {
      id: 'session-5',
      time: '14:15',
      type: 'Мастер-класс',
      title: 'ИИ в управлении городской средой',
      hall: 'Мастер-класс',
      speakers: [MOCK_SPEAKERS.c, MOCK_SPEAKERS.d],
    },
  ],
  tagFilterTabs: [
    'Все теги',
    'Стратегия',
    'Управление',
    'Технологии',
    'Устойчивость',
    'Инфраструктура',
    'Цифровизация',
  ],
  topTags: [
    { id: 'actual', name: 'Актуально', icon: '🔥', votes: 876, growth: 81, mood: 81 },
    { id: 'ppp', name: 'ГЧП / Партнёрство', icon: '🤝', votes: 642, growth: 59, mood: 59 },
    { id: 'innovation', name: 'Инновации', icon: '💡', votes: 821, growth: 76, mood: 76 },
    { id: 'cases', name: 'Кейсы / Практика', icon: '📋', votes: 663, growth: 61, mood: 61 },
    { id: 'invest', name: 'Инвестиции', icon: '💰', votes: 588, growth: 54, mood: 54 },
  ],
  tagMoodBars: [
    { name: 'Инновации', value: 76, color: '#00e5ff' },
    { name: 'Кейсы / Практика', value: 61, color: '#a855f7' },
    { name: 'Инвестиции', value: 54, color: '#f59e0b' },
    { name: 'Для людей', value: 68, color: '#22c55e' },
    { name: 'GovTech', value: 46, color: '#64748b' },
    { name: 'Масштабируемо', value: 47, color: '#ec4899' },
    { name: 'Стратегия', value: 59, color: '#38bdf8' },
    { name: 'Инфраструктура', value: 56, color: '#eab308' },
  ],
  topicNetwork: [
    { id: 'innovation', name: 'Инновации', value: 76, trend: 12 },
    { id: 'ppp-dev', name: 'ГЧП и партнёрское развитие', value: 84, trend: 15 },
    { id: 'strategy', name: 'Стратегическое развитие', value: 79, trend: 11 },
    { id: 'digital', name: 'Цифровизация', value: 71, trend: 9 },
    { id: 'infra', name: 'Инфраструктура', value: 68, trend: 6 },
    { id: 'invest', name: 'Инвестиции', value: 62, trend: 7 },
  ],
  geoRegions: [
    { name: 'Москва', percent: 24 },
    { name: 'С-Петербург', percent: 16 },
    { name: 'Свердловская обл.', percent: 8 },
    { name: 'Татарстан', percent: 6 },
    { name: 'Краснодарский край', percent: 5 },
  ],
  hallPulse: {
    current: 73,
    timeline: [
      { time: '09:00', value: 45 },
      { time: '10:00', value: 58 },
      { time: '11:00', value: 67 },
      { time: '11:08', value: 73 },
      { time: '12:00', value: 70 },
      { time: '13:00', value: 65 },
      { time: '14:00', value: 68 },
      { time: '15:00', value: 62 },
    ],
  },
  sessionHeatmap: {
    halls: [
      'Главный зал',
      'Панорама',
      'Высота 1050',
      'Стратегия',
      'Инновации',
      'Горизонт',
      'Практика',
      'Мастер-класс',
    ],
    times: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    values: [
      [42, 55, 86, 78, 61, 48, 40],
      [38, 50, 72, 80, 65, 52, 44],
      [35, 48, 68, 74, 70, 58, 46],
      [40, 52, 75, 77, 66, 55, 50],
      [44, 58, 70, 72, 68, 60, 48],
      [36, 46, 62, 70, 64, 58, 42],
      [33, 44, 60, 66, 62, 54, 40],
      [30, 40, 55, 64, 60, 50, 38],
    ],
    highlight: {
      hallIndex: 0,
      timeIndex: 2,
      engagement: 86,
      label: 'Сейчас здесь пики интереса 12:00–13:00',
    },
  },
  aiInsights: [
    { icon: '📈', text: 'Растёт интерес к темам ГЧП и Инноваций +18% за последний час' },
    { icon: '⚡', text: 'Пики активности в зале с 11:45 до 13:15' },
    { icon: '🎯', text: 'Высокая вовлечённость в сессиях по стратегиям' },
    { icon: '💡', text: 'Рекомендуем усилить темы: Инфраструктура, GovTech и Практика' },
  ],
  footer: {
    quote: '«Будущее городов — это люди, технологии и партнёрство»',
    quoteAuthor: 'Алексей Мельников',
    trends: ['#Партнёрство', '#Инновации', '#Устойчивость', '#ГородБудущего'],
    nextRecommendation: 'Посетите сессию «Искусственный интеллект в городах» в 14:15',
  },
  voting: {
    leftDonut: { label: 'Актуально', percent: 81, votes: 876, trend: 12 },
    rightDonut: { label: 'ГЧП / Партнёрство', percent: 59, votes: 642, trend: 9 },
    avatarGroups: [{ count: 342, offset: 0 }, { count: 218, offset: 4 }],
  },
}
