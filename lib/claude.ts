import OpenAI from 'openai'
import { TagType, TAG_LABELS } from './types'

const MODEL = 'anthropic/claude-sonnet-4-5-20250929'

function getClient() {
  return new OpenAI({
    apiKey: process.env.POLZA_API_KEY || 'no-key',
    baseURL: 'https://polza.ai/api/v1',
  })
}

interface TagEntry {
  tag_type: TagType
  comment?: string
}

export async function synthesizePulseTags(
  sessionTitle: string,
  tags: TagEntry[]
): Promise<string> {
  const tagSummary = tags.reduce<Record<string, number>>((acc, t) => {
    const label = TAG_LABELS[t.tag_type]
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  const tagLines = Object.entries(tagSummary)
    .map(([label, count]) => `${label}: ${count}`)
    .join(', ')

  const comments = tags
    .filter(t => t.comment)
    .map(t => `• [${TAG_LABELS[t.tag_type]}] ${t.comment}`)
    .join('\n')

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Ты — аналитик форума урбанистики «Горы и Город – 2026» в Геленджике.

Сессия: "${sessionTitle}"

Реакции участников (${tags.length} голосов):
${tagLines}

${comments ? `Комментарии:\n${comments}` : ''}

Напиши 1–2 коротких предложения: в чём консенсус аудитории на эту идею?
Стиль: конкретный, без воды, без вводных слов. Только суть. Язык: русский.`,
      },
    ],
  })

  return response.choices[0].message.content ?? ''
}

export async function generateDayDigest(
  day: number,
  sessionSyntheses: { title: string; synthesis: string; tagCount: number }[]
): Promise<string> {
  const sessionsText = sessionSyntheses
    .map((s, i) => `${i + 1}. **${s.title}** (${s.tagCount} реакций)\n   ${s.synthesis}`)
    .join('\n\n')

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `Ты — главный аналитик форума урбанистики «Горы и Город – 2026».

Итоги дня ${day} форума. Синтез мнений участников по сессиям:

${sessionsText}

Создай дайджест дня (3–5 абзацев):
1. Главная идея дня (1 предложение)
2. Топ-3 инсайта, которые вызвали наибольший резонанс
3. Ключевые противоречия или барьеры, которые обозначили участники
4. Призыв к действию: что конкретно стоит сделать городам после этого дня

Стиль: деловой, вдохновляющий, без клише. Язык: русский.`,
      },
    ],
  })

  return response.choices[0].message.content ?? ''
}
