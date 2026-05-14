import { describe, it, expect } from 'vitest'
import {
  pulseTopTagsByVotes,
  pulseEngagementLabel,
  getTagTotals,
  getEngagementPercent,
  getTopicMood,
  getHeatmapMatrix,
  getAiInsights,
} from '../../lib/pulse/pulse-aggregations'
import type { PulseTagStat, PulseTopicNode, PulseHeatmapCell, PulseInsight, PulseState } from '../../lib/pulse/types'

const makeTags = (): PulseTagStat[] => [
  { id: 'a', name: 'A', icon: '🔥', votes: 300, growth: 30, mood: 80 },
  { id: 'b', name: 'B', icon: '💡', votes: 100, growth: 10, mood: 50 },
  { id: 'c', name: 'C', icon: '🤝', votes: 200, growth: 20, mood: 60 },
]

describe('pulseTopTagsByVotes', () => {
  it('sorts descending by votes', () => {
    const sorted = pulseTopTagsByVotes(makeTags() as Parameters<typeof pulseTopTagsByVotes>[0])
    expect(sorted[0].votes).toBe(300)
    expect(sorted[2].votes).toBe(100)
  })
})

describe('pulseEngagementLabel', () => {
  it('returns Высокая for >= 70', () => expect(pulseEngagementLabel(70)).toBe('Высокая'))
  it('returns Средняя for 45-69', () => expect(pulseEngagementLabel(50)).toBe('Средняя'))
  it('returns Низкая for < 45', () => expect(pulseEngagementLabel(30)).toBe('Низкая'))
})

describe('getTagTotals', () => {
  it('returns id→votes map', () => {
    const totals = getTagTotals(makeTags())
    expect(totals.a).toBe(300)
    expect(totals.b).toBe(100)
  })
})

describe('getEngagementPercent', () => {
  it('calculates percent of expected audience', () => {
    const state = {
      event: { expectedAudience: 1000 },
      stats: { onlineParticipants: 500 },
    } as unknown as PulseState
    expect(getEngagementPercent(state)).toBe(50)
  })

  it('caps at 100', () => {
    const state = {
      event: { expectedAudience: 100 },
      stats: { onlineParticipants: 200 },
    } as unknown as PulseState
    expect(getEngagementPercent(state)).toBe(100)
  })
})

describe('getTopicMood', () => {
  it('classifies nodes by trend', () => {
    const nodes: PulseTopicNode[] = [
      { id: 'a', name: 'A', value: 80, trend: 12 },
      { id: 'b', name: 'B', value: 60, trend: 6 },
      { id: 'c', name: 'C', value: 50, trend: 2 },
    ]
    const moods = getTopicMood(nodes)
    expect(moods[0].mood).toBe('hot')
    expect(moods[1].mood).toBe('rising')
    expect(moods[2].mood).toBe('stable')
  })
})

describe('getHeatmapMatrix', () => {
  it('groups cells by hall and time', () => {
    const cells: PulseHeatmapCell[] = [
      { hall: 'Main', time: '10:00', value: 50 },
      { hall: 'Main', time: '11:00', value: 70 },
      { hall: 'Side', time: '10:00', value: 40 },
    ]
    const matrix = getHeatmapMatrix(cells)
    expect(matrix['Main']['10:00']).toBe(50)
    expect(matrix['Main']['11:00']).toBe(70)
    expect(matrix['Side']['10:00']).toBe(40)
  })
})

describe('getAiInsights', () => {
  it('formats insights as icon+text', () => {
    const insights: PulseInsight[] = [{ icon: '📈', text: 'Тест' }]
    expect(getAiInsights(insights)[0]).toBe('📈 Тест')
  })
})
