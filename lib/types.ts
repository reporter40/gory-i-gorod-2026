export type Block = 'tourism' | 'quality' | 'creative' | 'infra' | 'cases'

export interface Speaker {
  id: string
  name: string
  /** Не из программы XLSX; зарезервировано, в данных пусто. */
  bio: string
  photo_url: string
  /** Не из программы XLSX; география только в `role`, если есть в ячейке. */
  city: string
  /** Подпись из колонки «Спикеры / Участники» XLSX (после ФИО или целиком ячейка). */
  role: string
  session_id?: string
}

export interface Session {
  id: string
  title: string
  speaker_id: string
  speaker?: Speaker
  starts_at: string
  ends_at: string
  hall: string
  block: Block
  day: number
  description?: string
  /** Вместо блока ФИО/роль — одна строка (пустые ячейки спикера в XLSX). */
  speaker_row_note?: string
  /** `title_only` — в расписании только заголовок (без времени, блока, описания, спикера). */
  program_card?: 'title_only'
  /** Дополнительные спикеры — рендерятся отдельными чипами после основного. */
  extra_speaker_ids?: string[]
}

export interface Participant {
  id: string
  name: string
  email: string
  city: string
  role: string
  avatar_url?: string
}

export type TagType = 'implement' | 'discovery' | 'partner' | 'question' | 'applicable'

export const TAG_LABELS: Record<TagType, string> = {
  implement:  'Хочу внедрить',
  discovery:  'Открытие',
  partner:    'Ищу партнёров',
  question:   'Есть вопрос',
  applicable: 'Применимо у нас',
}

export const TAG_COLORS: Record<TagType, string> = {
  implement:  '#f97316',
  discovery:  '#f5c518',
  partner:    '#22c55e',
  question:   '#a855f7',
  applicable: '#4a9eca',
}

export interface PulseTag {
  id: string
  session_id: string
  participant_id: string
  tag_type: TagType
  comment?: string
  created_at: string
}

export interface PulseSynthesis {
  id: string
  session_id: string
  synthesis_text: string
  tag_count: number
  generated_at: string
}
