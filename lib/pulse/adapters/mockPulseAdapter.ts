import type { PulseAdapter, PulseConnectionState, PulseState } from '../types'
import { mockPulseState } from '../pulse-data'

const STATIC_CONNECTION: PulseConnectionState = {
  status: 'connected',
  lastConnected: 1747123200000, // 2026-05-13T12:00:00Z — fixed, no Date.now()
  reconnectAttempt: 0,
}

function buildMockPulseState(): PulseState {
  const m = mockPulseState

  // Flatten heatmap matrix into cells
  const heatmap = m.sessionHeatmap.halls.flatMap((hall, hi) =>
    m.sessionHeatmap.times.map((time, ti) => ({
      hall,
      time,
      value: m.sessionHeatmap.values[hi][ti],
    }))
  )

  return {
    event: {
      name: m.event.name,
      activeSessionId: m.event.activeSessionId,
      expectedAudience: m.event.expectedAudience,
      frozen: false,
      updatedAt: 1747123200000,
    },
    stats: { ...m.stats },
    sessions: m.sessions.map((s) => ({
      id: s.id,
      time: s.time,
      type: s.type,
      title: s.title,
      hall: s.hall,
      speakerId: s.speakers[0]?.id ?? '',
      start: 1747123200000,
      end: 1747130400000,
      status: s.isLive ? 'live' : 'upcoming',
      isLive: s.isLive,
      speakers: s.speakers,
    })),
    topTags: m.topTags.map((t) => ({ ...t })),
    tagMoodBars: m.tagMoodBars.map((b) => ({ ...b })),
    topicNetwork: m.topicNetwork.map((n) => ({ ...n })),
    geoRegions: m.geoRegions.map((r) => ({ ...r })),
    hallPulse: {
      current: m.hallPulse.current,
      timeline: m.hallPulse.timeline.map((p) => ({ ...p })),
    },
    heatmap,
    aiInsights: m.aiInsights.map((i) => ({ ...i })),
    footer: {
      quote: m.footer.quote,
      quoteAuthor: m.footer.quoteAuthor,
      trends: m.footer.trends,
      nextRecommendation: m.footer.nextRecommendation,
    },
    connection: STATIC_CONNECTION,
    _meta: {
      source: 'mock',
      lastUpdated: 1747123200000,
      staleSince: null,
      errors: [],
    },
  }
}

export function createMockPulseAdapter(): PulseAdapter {
  const state = buildMockPulseState()
  const subscribers: Array<(s: PulseState) => void> = []

  return {
    subscribe(callback) {
      subscribers.push(callback)
      // Fire once immediately (synchronously) with mock state
      callback(state)
      return () => {
        const idx = subscribers.indexOf(callback)
        if (idx !== -1) subscribers.splice(idx, 1)
      }
    },
    getConnectionState() {
      return STATIC_CONNECTION
    },
    destroy() {
      subscribers.length = 0
    },
  }
}
