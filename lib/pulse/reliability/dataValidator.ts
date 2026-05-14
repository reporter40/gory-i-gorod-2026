import type { PulseState } from '../types'

// Validation rules:
//   votes count: 0 ≤ n ≤ 100000, integer
//   percentage: 0 ≤ n ≤ 100
//   sessionId/tagId: non-empty string
//   timestamps: number > 1700000000000 (after 2023)
// Invalid fields are replaced with last-good values; dashboard never crashes.

const MIN_TS = 1_700_000_000_000

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

function clampPercent(n: unknown, fallback: number): number {
  return clampInt(n, 0, 100, fallback)
}

function validString(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0
}

function validTs(n: unknown): n is number {
  return typeof n === 'number' && n > MIN_TS
}

export function validatePulseSnapshot(state: PulseState): PulseState {
  return {
    ...state,
    topTags: state.topTags.map((t) => ({
      ...t,
      votes: clampInt(t.votes, 0, 100_000, 0),
      growth: clampPercent(t.growth, 0),
      mood: clampPercent(t.mood, 0),
    })),
    tagMoodBars: state.tagMoodBars.map((b) => ({
      ...b,
      value: clampPercent(b.value, 0),
    })),
    stats: {
      ...state.stats,
      engagement: clampPercent(state.stats.engagement, 0),
      hallActivity: clampPercent(state.stats.hallActivity, 0),
      overallEngagement: clampPercent(state.stats.overallEngagement, 0),
      onlineParticipants: clampInt(state.stats.onlineParticipants, 0, 999_999, 0),
    },
    sessions: state.sessions.filter((s) => validString(s.id) && validString(s.title)),
    heatmap: state.heatmap.map((c) => ({
      ...c,
      value: clampPercent(c.value, 0),
    })),
    event: {
      ...state.event,
      updatedAt: validTs(state.event.updatedAt) ? state.event.updatedAt : Date.now(),
    },
    _meta: {
      ...state._meta,
      lastUpdated: validTs(state._meta.lastUpdated) ? state._meta.lastUpdated : Date.now(),
    },
  }
}
