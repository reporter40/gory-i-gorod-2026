import { describe, it, expect } from 'vitest'
import {
  buildHeatmapFromTagStats,
  buildPulseStateMeta,
  CANONICAL_REACTION_TAG_IDS,
  sessionHeatmapToCells,
} from '../../lib/pulse/pulse-aggregations'
import type { PulseTagStat } from '../../lib/pulse/types'

const tag = (id: string, label: string, count: number) => ({ tagId: id, label, count })

describe('buildHeatmapFromTagStats', () => {
  it('A: builds heatmap rows from live canonical tagStats', () => {
    const h = buildHeatmapFromTagStats({
      sessionId: 'sess-1',
      tagStats: [
        tag('implement', 'Хочу внедрить', 10),
        tag('discovery', 'Открытие', 5),
        tag('partner', 'Ищу партнёров', 0),
        tag('question', 'Есть вопрос', 0),
        tag('applicable', 'Применимо у нас', 0),
      ],
    })
    expect(h.halls.length).toBe(5)
    expect(h.times).toEqual(['Реакции'])
    expect(h.values[0]?.[0]).toBe(100)
    expect(h.values[1]?.[0]).toBe(50)
    expect(sessionHeatmapToCells(h)).toHaveLength(5)
  })

  it('B: count 0 rows get intensity 0 when another tag has votes', () => {
    const h = buildHeatmapFromTagStats({
      sessionId: 's',
      tagStats: [
        tag('implement', 'Хочу внедрить', 4),
        tag('discovery', 'Открытие', 0),
        tag('partner', 'Ищу партнёров', 0),
        tag('question', 'Есть вопрос', 0),
        tag('applicable', 'Применимо у нас', 0),
      ],
    })
    expect(h.values[1]?.[0]).toBe(0)
    expect(h.values[2]?.[0]).toBe(0)
  })

  it('C: max count normalizes intensities deterministically to 0–100', () => {
    const h = buildHeatmapFromTagStats({
      sessionId: 's',
      tagStats: [
        tag('implement', 'I', 10),
        tag('discovery', 'D', 5),
        tag('partner', 'P', 0),
        tag('question', 'Q', 0),
        tag('applicable', 'A', 0),
      ],
    })
    expect(h.values[0]?.[0]).toBe(100)
    expect(h.values[1]?.[0]).toBe(50)
  })

  it('D: empty tagStats returns empty heatmap', () => {
    const h = buildHeatmapFromTagStats({ sessionId: 's', tagStats: [] })
    expect(h.halls).toEqual([])
    expect(h.times).toEqual([])
    expect(h.values).toEqual([])
    expect(sessionHeatmapToCells(h)).toEqual([])
  })

  it('F: legacy tag ids do not appear in heatmap', () => {
    const h = buildHeatmapFromTagStats({
      sessionId: 's',
      tagStats: [tag('actual', 'Актуально', 99), tag('ppp', 'ППП', 99)],
    })
    expect(h.halls.length).toBe(0)
  })

  it('all-zero canonical counts returns empty heatmap (no fake heat)', () => {
    const h = buildHeatmapFromTagStats({
      sessionId: 's',
      tagStats: CANONICAL_REACTION_TAG_IDS.map((id) => tag(id, id, 0)),
    })
    expect(h.halls.length).toBe(0)
  })
})

describe('buildPulseStateMeta + regression', () => {
  it('E: live path meta uses votes heatmapSource when counts present', () => {
    const tags: PulseTagStat[] = [
      { id: 'implement', name: 'Хочу внедрить', icon: '🔥', votes: 3, growth: 0, mood: 0 },
    ]
    const meta = buildPulseStateMeta({ mode: 'live', activeSessionId: 'sid', topTags: tags })
    expect(meta.source).toBe('live')
    expect(meta.heatmapSource).toBe('votes')
    expect(meta.eventsCount).toBe(3)
  })

  it('E: mock fallback meta stays mock', () => {
    const meta = buildPulseStateMeta({
      mode: 'mock',
      activeSessionId: 'x',
      topTags: [{ id: 'implement', name: 'X', icon: '🔥', votes: 9, growth: 0, mood: 0 }],
    })
    expect(meta.source).toBe('mock')
    expect(meta.heatmapSource).toBe('mock')
  })
})
