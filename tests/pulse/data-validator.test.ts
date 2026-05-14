import { describe, it, expect } from 'vitest'
import { validatePulseSnapshot } from '../../lib/pulse/reliability/dataValidator'
import type { PulseState } from '../../lib/pulse/types'

function makeState(overrides: Partial<PulseState> = {}): PulseState {
  return {
    event: { name: 'Test', activeSessionId: 's1', expectedAudience: 1000, frozen: false, updatedAt: 1747123200000 },
    stats: { onlineParticipants: 500, participantsChange: 10, hallActivity: 70, engagement: 65, engagementChange: 5, speakersToday: 10, overallEngagement: 70 },
    sessions: [{ id: 's1', time: '10:00', type: 'Panel', title: 'Test', hall: 'Main', speakerId: 'sp1', start: 1747123200000, end: 1747130400000, status: 'live', speakers: [] }],
    topTags: [{ id: 't1', name: 'Tag', icon: '🔥', votes: 100, growth: 50, mood: 60 }],
    tagMoodBars: [{ name: 'Tag', value: 50 }],
    topicNetwork: [],
    geoRegions: [],
    hallPulse: { current: 70, timeline: [] },
    heatmap: [{ hall: 'Main', time: '10:00', value: 70 }],
    aiInsights: [],
    footer: { quote: '', quoteAuthor: '', trends: [], nextRecommendation: '' },
    connection: { status: 'connected', lastConnected: null, reconnectAttempt: 0 },
    _meta: { source: 'firebase', lastUpdated: 1747123200000, staleSince: null, errors: [] },
    ...overrides,
  }
}

describe('dataValidator', () => {
  it('passes valid state unchanged', () => {
    const state = makeState()
    const result = validatePulseSnapshot(state)
    expect(result.topTags[0].votes).toBe(100)
    expect(result.stats.engagement).toBe(65)
  })

  it('clamps negative vote count to 0', () => {
    const state = makeState({ topTags: [{ id: 't1', name: 'X', icon: '🔥', votes: -5, growth: 50, mood: 50 }] })
    const result = validatePulseSnapshot(state)
    expect(result.topTags[0].votes).toBe(0)
  })

  it('clamps vote count over 100000 to 100000', () => {
    const state = makeState({ topTags: [{ id: 't1', name: 'X', icon: '🔥', votes: 200000, growth: 50, mood: 50 }] })
    const result = validatePulseSnapshot(state)
    expect(result.topTags[0].votes).toBe(100000)
  })

  it('clamps percentage over 100 to 100', () => {
    const state = makeState({ stats: { ...makeState().stats, engagement: 150 } })
    const result = validatePulseSnapshot(state)
    expect(result.stats.engagement).toBe(100)
  })

  it('clamps negative percentage to 0', () => {
    const state = makeState({ stats: { ...makeState().stats, engagement: -10 } })
    const result = validatePulseSnapshot(state)
    expect(result.stats.engagement).toBe(0)
  })

  it('removes sessions with empty id', () => {
    const state = makeState({ sessions: [{ id: '', time: '10:00', type: 'X', title: 'X', hall: 'X', speakerId: '', start: 0, end: 0, status: 'live', speakers: [] }] })
    const result = validatePulseSnapshot(state)
    expect(result.sessions.length).toBe(0)
  })

  it('keeps sessions with valid id', () => {
    const state = makeState()
    const result = validatePulseSnapshot(state)
    expect(result.sessions.length).toBe(1)
  })

  it('clamps heatmap value to 0-100', () => {
    const state = makeState({ heatmap: [{ hall: 'H', time: '10:00', value: 150 }] })
    const result = validatePulseSnapshot(state)
    expect(result.heatmap[0].value).toBe(100)
  })

  it('does not throw on NaN stats', () => {
    const state = makeState({ stats: { ...makeState().stats, engagement: NaN } })
    expect(() => validatePulseSnapshot(state)).not.toThrow()
    const result = validatePulseSnapshot(state)
    expect(result.stats.engagement).toBe(0)
  })
})
