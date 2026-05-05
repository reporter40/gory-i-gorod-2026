import { Session, Speaker, Participant } from './types'

export const SPEAKERS: Speaker[] = [
  {
    id: 's1',
    name: 'Алексей Муратов',
    bio: 'Партнёр КБ Стрелка, эксперт в области стратегического планирования городов',
    photo_url: 'https://i.pravatar.cc/200?img=1',
    city: 'Москва',
    role: 'Урбанист, стратег',
  },
  {
    id: 's2',
    name: 'Ирина Ирбитская',
    bio: 'Директор Центра городской экономики, исследователь туристических экосистем',
    photo_url: 'https://i.pravatar.cc/200?img=5',
    city: 'Москва',
    role: 'Экономист-урбанист',
  },
  {
    id: 's3',
    name: 'Михаил Сарченко',
    bio: 'Основатель лаборатории городских трансформаций, ГЧП-эксперт',
    photo_url: 'https://i.pravatar.cc/200?img=3',
    city: 'Краснодар',
    role: 'ГЧП-эксперт',
  },
  {
    id: 's4',
    name: 'Наталья Фишман-Бекмамбетова',
    bio: 'Советник Президента Татарстана, создатель программы парков и скверов',
    photo_url: 'https://i.pravatar.cc/200?img=6',
    city: 'Казань',
    role: 'Государственный управленец',
  },
  {
    id: 's5',
    name: 'Евгений Асс',
    bio: 'Архитектор, ректор Московской архитектурной школы МАРШ',
    photo_url: 'https://i.pravatar.cc/200?img=7',
    city: 'Москва',
    role: 'Архитектор',
  },
  {
    id: 's6',
    name: 'Павел Черкашин',
    bio: 'Директор по цифровым сервисам Геленджика, Smart City эксперт',
    photo_url: 'https://i.pravatar.cc/200?img=8',
    city: 'Геленджик',
    role: 'Цифровые технологии',
  },
]

export const SESSIONS: Session[] = [
  // День 1
  {
    id: 'ses1',
    title: 'Открытие форума. Городская среда как конкурентное преимущество',
    speaker_id: 's1',
    starts_at: '2026-09-17T10:00',
    ends_at: '2026-09-17T11:00',
    hall: 'Зал А',
    block: 'tourism',
    day: 1,
    description: 'Пленарная сессия. Обзор лучших мировых практик развития туристических городов через качество среды.',
  },
  {
    id: 'ses2',
    title: 'Креативные кластеры как экономический драйвер',
    speaker_id: 's2',
    starts_at: '2026-09-17T11:30',
    ends_at: '2026-09-17T12:30',
    hall: 'Зал А',
    block: 'creative',
    day: 1,
    description: 'Как творческие индустрии создают рабочие места и привлекают туристов нового типа.',
  },
  {
    id: 'ses3',
    title: 'ГЧП в инфраструктуре туристических городов',
    speaker_id: 's3',
    starts_at: '2026-09-17T14:00',
    ends_at: '2026-09-17T15:00',
    hall: 'Зал Б',
    block: 'infra',
    day: 1,
    description: 'Механизмы государственно-частного партнёрства для финансирования городской инфраструктуры.',
  },
  {
    id: 'ses4',
    title: 'Парки и общественные пространства: кейс Татарстана',
    speaker_id: 's4',
    starts_at: '2026-09-17T15:30',
    ends_at: '2026-09-17T16:30',
    hall: 'Зал А',
    block: 'quality',
    day: 1,
    description: 'Программа благоустройства 600+ парков: от идеи до реализации.',
  },
  // День 2
  {
    id: 'ses5',
    title: 'Архитектура, созвучная природе: горный контекст',
    speaker_id: 's5',
    starts_at: '2026-09-18T10:00',
    ends_at: '2026-09-18T11:00',
    hall: 'Зал А',
    block: 'infra',
    day: 2,
    description: 'Как проектировать здания и пространства, которые усиливают, а не разрушают природный ландшафт.',
  },
  {
    id: 'ses6',
    title: 'Цифровые сервисы в управлении курортным городом',
    speaker_id: 's6',
    starts_at: '2026-09-18T11:30',
    ends_at: '2026-09-18T12:30',
    hall: 'Зал А',
    block: 'cases',
    day: 2,
    description: 'ИИ и данные в управлении туристическими потоками, умные светофоры и предсказание пиковой нагрузки.',
  },
  {
    id: 'ses7',
    title: 'Ребрендинг территорий: от курорта к городу будущего',
    speaker_id: 's1',
    starts_at: '2026-09-18T14:00',
    ends_at: '2026-09-18T15:00',
    hall: 'Зал Б',
    block: 'tourism',
    day: 2,
    description: 'Стратегические подходы к переосмыслению идентичности курортных городов.',
  },
  {
    id: 'ses8',
    title: 'Инсайт-сессия: коллективный манифест форума',
    speaker_id: 's2',
    starts_at: '2026-09-18T16:00',
    ends_at: '2026-09-18T17:30',
    hall: 'Зал А',
    block: 'cases',
    day: 2,
    description: 'Итоговая сессия форума: синтез ключевых решений и формирование дорожной карты развития.',
  },
]

export const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Анна Соколова', email: 'a.sokolova@city.ru', city: 'Сочи', role: 'Главный архитектор' },
  { id: 'p2', name: 'Дмитрий Волков', email: 'd.volkov@invest.ru', city: 'Краснодар', role: 'Инвестор' },
  { id: 'p3', name: 'Мария Петрова', email: 'm.petrova@gov.ru', city: 'Ростов-на-Дону', role: 'Чиновник' },
  { id: 'p4', name: 'Игорь Захаров', email: 'i.zakharov@strelka.ru', city: 'Москва', role: 'Урбанист' },
  { id: 'p5', name: 'Елена Новикова', email: 'e.novikova@arch.ru', city: 'Геленджик', role: 'Архитектор' },
  { id: 'p6', name: 'Сергей Морозов', email: 's.morozov@tourdev.ru', city: 'Анапа', role: 'Туристический девелопер' },
]

export const BLOCK_LABELS: Record<string, string> = {
  tourism: 'Туристические города',
  quality: 'Качество жизни',
  creative: 'Креативная экономика',
  infra: 'Инфраструктура и ГЧП',
  cases: 'Лучшие практики',
}

export const BLOCK_COLORS: Record<string, string> = {
  tourism: 'bg-blue-100 text-blue-800',
  quality: 'bg-green-100 text-green-800',
  creative: 'bg-purple-100 text-purple-800',
  infra: 'bg-orange-100 text-orange-800',
  cases: 'bg-teal-100 text-teal-800',
}

export function getSessionsWithSpeakers(): (Session & { speaker: Speaker })[] {
  return SESSIONS.map(s => ({
    ...s,
    speaker: SPEAKERS.find(sp => sp.id === s.speaker_id)!,
  }))
}
