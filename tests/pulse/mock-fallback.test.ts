import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PulseState } from '../../lib/pulse/types'
import { validatePulseSnapshot } from '../../lib/pulse/reliability/dataValidator'

function minimalFirebaseWireState(): PulseState {
  return {
    event: {
      name: 'T',
      activeSessionId: 's',
      expectedAudience: 100,
      frozen: false,
      updatedAt: 1747123200000,
    },
    stats: {
      onlineParticipants: 0,
      participantsChange: 0,
      hallActivity: 0,
      engagement: 0,
      engagementChange: 0,
      speakersToday: 0,
      overallEngagement: 0,
    },
    sessions: [],
    topTags: [{ id: 'implement', name: 'X', icon: '🔥', votes: 5, growth: 0, mood: 0 }],
    tagMoodBars: [],
    topicNetwork: [],
    geoRegions: [],
    hallPulse: { current: 0, timeline: [] },
    heatmap: [],
    aiInsights: [],
    footer: { quote: '', quoteAuthor: '', trends: [], nextRecommendation: '' },
    connection: { status: 'connected', lastConnected: null, reconnectAttempt: 0 },
    _meta: {
      source: 'firebase',
      lastUpdated: 1747123200000,
      staleSince: null,
      errors: [],
    } as PulseState['_meta'],
  }
}

// Regression: mock fallback must NOT activate when Firebase snapshot is live
describe('usePulseRealtime — mock fallback regression', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('uses mockAdapter when hasFirebaseConfig returns false', async () => {
    vi.doMock('@/lib/pulse/firebase/client', () => ({
      hasFirebaseConfig: () => false,
    }))
    vi.doMock('@/lib/pulse/adapters/mockPulseAdapter', () => ({
      createMockPulseAdapter: () => ({
        subscribe: (cb: (s: unknown) => void) => {
          cb({
            _meta: {
              source: 'mock',
              activeSessionId: null,
              eventsCount: 0,
              heatmapSource: 'mock',
              lastUpdated: 0,
              staleSince: null,
              errors: [],
            },
            topTags: [],
            sessions: [],
            stats: {},
            event: {},
            heatmap: [],
            tagMoodBars: [],
            topicNetwork: [],
            geoRegions: [],
            hallPulse: { current: 0, timeline: [] },
            aiInsights: [],
            footer: {},
            connection: {},
          })
          return () => {}
        },
        destroy: () => {},
      }),
    }))

    // Snapshot of source when Firebase is absent must be 'mock'
    const { createMockPulseAdapter } = await import('@/lib/pulse/adapters/mockPulseAdapter')
    const adapter = createMockPulseAdapter()
    let receivedSource = ''
    adapter.subscribe((s: { _meta: { source: string } }) => { receivedSource = s._meta.source })
    expect(receivedSource).toBe('mock')
    adapter.destroy()
  })

  it('legacy firebase wire meta normalizes to live (heatmap lineage votes)', () => {
    const result = validatePulseSnapshot(minimalFirebaseWireState())
    expect(result._meta.source).toBe('live')
    expect(result._meta.heatmapSource).toBe('votes')
    expect(result._meta.eventsCount).toBe(5)
  })
})
