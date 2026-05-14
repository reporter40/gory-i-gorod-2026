'use client'

import {
  ref,
  onValue,
  orderByChild,
  limitToLast,
  query,
  off,
  type DataSnapshot,
} from 'firebase/database'
import type { PulseAdapter, PulseConnectionState, PulseState, PulseSession, PulseTagStat } from '../types'
import { getFirebaseDb } from '../firebase/client'
import { FB_PATHS, type FirebaseSession, type FirebaseSpeaker } from '../firebase/schema'
import { createMockPulseAdapter } from './mockPulseAdapter'
import { validatePulseSnapshot } from '../reliability/dataValidator'

const STALE_THRESHOLD_MS = 60_000
const NO_DATA_TIMEOUT_MS = 30_000

type Unsubscribe = () => void

export function createFirebasePulseAdapter(): PulseAdapter {
  const db = getFirebaseDb()
  const unsubscribers: Unsubscribe[] = []
  const subscribers: Array<(s: PulseState) => void> = []

  let currentState: PulseState | null = null
  let connectionStatus: PulseConnectionState = {
    status: 'reconnecting',
    lastConnected: null,
    reconnectAttempt: 0,
  }
  let lastUpdateTime = Date.now()
  let staleCheckTimer: ReturnType<typeof setInterval> | null = null
  let noDataTimer: ReturnType<typeof setTimeout> | null = null
  let frozen = false

  // Cached reference data
  let sessionsCache: Record<string, FirebaseSession> = {}
  let speakersCache: Record<string, FirebaseSpeaker> = {}

  const mockFallback = createMockPulseAdapter()

  function emit(state: PulseState) {
    const validated = validatePulseSnapshot(state)
    currentState = validated
    subscribers.forEach((cb) => cb(validated))
  }

  function fallbackToMock() {
    if (currentState) return // already have data
    mockFallback.subscribe((mockState) => {
      emit({ ...mockState, _meta: { ...mockState._meta, source: 'snapshot' } })
    })
  }

  function buildTagStats(votes: Record<string, number>): PulseTagStat[] {
    // Must match DEFAULT_TAGS in app/pulse/vote/page.tsx — keep in sync
    const TAG_META: Record<string, { name: string; icon: string }> = {
      implement:  { name: 'Хочу внедрить',  icon: '🔥' },
      discovery:  { name: 'Открытие',        icon: '💡' },
      partner:    { name: 'Ищу партнёров',   icon: '🤝' },
      question:   { name: 'Есть вопрос',     icon: '❓' },
      applicable: { name: 'Применимо у нас', icon: '📍' },
    }
    return Object.entries(votes).map(([id, count]) => ({
      id,
      name: TAG_META[id]?.name ?? id,
      icon: TAG_META[id]?.icon ?? '🏷️',
      votes: count,
      growth: 0,
      mood: Math.min(100, Math.round((count / Math.max(1, Object.values(votes).reduce((a, b) => a + b, 0))) * 100)),
    }))
  }

  function buildSessions(): PulseSession[] {
    return Object.entries(sessionsCache).map(([id, s]) => ({
      id,
      time: new Date(s.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: 'Сессия',
      title: s.title,
      hall: s.hall,
      speakerId: s.speakerId,
      start: s.start,
      end: s.end,
      status: s.status,
      isLive: s.status === 'live',
      speakers: speakersCache[s.speakerId]
        ? [{ id: s.speakerId, name: speakersCache[s.speakerId].name, initials: speakersCache[s.speakerId].name.slice(0, 2).toUpperCase(), color: '#3b82f6' }]
        : [],
    }))
  }

  function mergeFirebaseUpdate(partial: Partial<PulseState>): PulseState {
    const base = currentState ?? (mockFallback as unknown as { _lastState?: PulseState })._lastState
    if (!base) {
      return {
        event: { name: 'Горы и Город — 2026', activeSessionId: '', expectedAudience: 1700, frozen, updatedAt: Date.now() },
        stats: { onlineParticipants: 0, participantsChange: 0, hallActivity: 0, engagement: 0, engagementChange: 0, speakersToday: 0, overallEngagement: 0 },
        sessions: [],
        topTags: [],
        tagMoodBars: [],
        topicNetwork: [],
        geoRegions: [],
        hallPulse: { current: 0, timeline: [] },
        heatmap: [],
        aiInsights: [],
        footer: { quote: '', quoteAuthor: '', trends: [], nextRecommendation: '' },
        connection: connectionStatus,
        _meta: { source: 'firebase', lastUpdated: Date.now(), staleSince: null, errors: [] },
        ...partial,
      }
    }
    return {
      ...base,
      connection: connectionStatus,
      _meta: {
        source: frozen ? 'frozen' : 'firebase',
        lastUpdated: Date.now(),
        staleSince: null,
        errors: base._meta.errors,
      },
      ...partial,
    }
  }

  // .info/connected — connection state
  const connRef = ref(db, FB_PATHS.connected())
  const connUnsub = onValue(connRef, (snap: DataSnapshot) => {
    const isConnected = snap.val() as boolean
    if (isConnected) {
      connectionStatus = { status: 'connected', lastConnected: Date.now(), reconnectAttempt: 0 }
    } else {
      connectionStatus = {
        status: 'reconnecting',
        lastConnected: connectionStatus.lastConnected,
        reconnectAttempt: connectionStatus.reconnectAttempt + 1,
      }
    }
    if (currentState) {
      emit(mergeFirebaseUpdate({}))
    }
  })
  unsubscribers.push(() => off(connRef, 'value', connUnsub as Parameters<typeof off>[2]))

  // event/frozen
  const frozenRef = ref(db, FB_PATHS.frozen())
  const frozenUnsub = onValue(frozenRef, (snap: DataSnapshot) => {
    frozen = !!snap.val()
    if (frozen && currentState) {
      emit({ ...currentState, connection: connectionStatus, _meta: { ...currentState._meta, source: 'frozen' } })
    }
  })
  unsubscribers.push(() => off(frozenRef, 'value', frozenUnsub as Parameters<typeof off>[2]))

  // sessions (one-time, cached)
  const sessionsRef = ref(db, FB_PATHS.sessions())
  const sessionsUnsub = onValue(sessionsRef, (snap: DataSnapshot) => {
    sessionsCache = (snap.val() as Record<string, FirebaseSession>) ?? {}
  }, { onlyOnce: true })
  unsubscribers.push(() => off(sessionsRef, 'value', sessionsUnsub as Parameters<typeof off>[2]))

  // speakers (one-time, cached)
  const speakersRef = ref(db, FB_PATHS.speakers())
  const speakersUnsub = onValue(speakersRef, (snap: DataSnapshot) => {
    speakersCache = (snap.val() as Record<string, FirebaseSpeaker>) ?? {}
  }, { onlyOnce: true })
  unsubscribers.push(() => off(speakersRef, 'value', speakersUnsub as Parameters<typeof off>[2]))

  // event/stats — operator-updated stats (audience, hall activity, engagement, pulse)
  let remoteStats: Partial<PulseState['stats']> & { hallPulseCurrent?: number; hallPulseTimeline?: Record<string, { time: string; value: number }> } = {}

  const statsRef = ref(db, 'event/stats')
  const statsUnsub = onValue(statsRef, (snap: DataSnapshot) => {
    const raw = snap.val() as Record<string, unknown> | null
    if (!raw) return
    remoteStats = {
      onlineParticipants: typeof raw.onlineParticipants === 'number' ? raw.onlineParticipants : undefined,
      hallActivity: typeof raw.hallActivity === 'number' ? raw.hallActivity : undefined,
      engagement: typeof raw.engagement === 'number' ? raw.engagement : undefined,
      overallEngagement: typeof raw.hallActivity === 'number' ? raw.hallActivity : undefined,
      hallPulseCurrent: typeof raw.hallPulseCurrent === 'number' ? raw.hallPulseCurrent : undefined,
      hallPulseTimeline: raw.hallPulseTimeline as Record<string, { time: string; value: number }> | undefined,
    }
    if (currentState) {
      const merged = buildStatsUpdate()
      emit(mergeFirebaseUpdate(merged))
    }
  })
  unsubscribers.push(() => off(statsRef, 'value', statsUnsub as Parameters<typeof off>[2]))

  function buildStatsUpdate(topTags?: PulseTagStat[]): Partial<PulseState> {
    const base = currentState
    if (!base) return {}
    const stats = { ...base.stats }

    // Auto-derive from votes (updates on every vote)
    const tags = topTags ?? base.topTags
    const totalVotes = tags.reduce((s, t) => s + t.votes, 0)
    const expectedAudience = base.event.expectedAudience ?? 1700

    if (totalVotes > 0) {
      // Operator override takes priority; otherwise auto-derive
      stats.onlineParticipants = remoteStats.onlineParticipants
        ?? Math.min(expectedAudience, totalVotes * 3)
      const autoActivity = Math.min(100, Math.round(totalVotes / expectedAudience * 800))
      stats.hallActivity = remoteStats.hallActivity ?? autoActivity
      stats.overallEngagement = remoteStats.hallActivity ?? autoActivity
      stats.engagement = remoteStats.engagement ?? Math.min(100, Math.round(autoActivity * 0.93))
      stats.participantsChange = Math.round(totalVotes * 0.15)
    } else {
      // No votes yet — use manual overrides only
      if (remoteStats.onlineParticipants !== undefined) stats.onlineParticipants = remoteStats.onlineParticipants
      if (remoteStats.hallActivity !== undefined) { stats.hallActivity = remoteStats.hallActivity; stats.overallEngagement = remoteStats.hallActivity }
      if (remoteStats.engagement !== undefined) stats.engagement = remoteStats.engagement
    }

    const hallPulse = remoteStats.hallPulseCurrent !== undefined
      ? {
          current: remoteStats.hallPulseCurrent,
          timeline: remoteStats.hallPulseTimeline
            ? Object.values(remoteStats.hallPulseTimeline).sort((a, b) => a.time.localeCompare(b.time))
            : base.hallPulse.timeline,
        }
      : totalVotes > 0
        ? { current: stats.hallActivity, timeline: base.hallPulse.timeline }
        : base.hallPulse

    return { stats, hallPulse }
  }

  // event/activeSessionId → drives vote listener
  let activeSessionId = ''
  let votesUnsub: Unsubscribe | null = null

  const activeRef = ref(db, FB_PATHS.activeSessionId())
  const activeUnsub = onValue(activeRef, (snap: DataSnapshot) => {
    const newSessionId = (snap.val() as string) ?? ''
    if (newSessionId === activeSessionId) return
    activeSessionId = newSessionId

    // Detach previous votes listener
    if (votesUnsub) {
      votesUnsub()
      votesUnsub = null
    }

    if (!activeSessionId) return

    // votes/{activeSessionId}
    const votesRef = ref(db, `votes/${activeSessionId}`)
    const votesCb = onValue(votesRef, (voteSnap: DataSnapshot) => {
      if (frozen) return
      lastUpdateTime = Date.now()
      if (noDataTimer) { clearTimeout(noDataTimer); noDataTimer = null }

      const votesRaw = (voteSnap.val() as Record<string, number>) ?? {}
      const topTags = buildTagStats(votesRaw)
      const sessions = buildSessions()

      emit(mergeFirebaseUpdate({
        event: { ...(currentState?.event ?? { name: 'Горы и Город — 2026', expectedAudience: 1700, updatedAt: Date.now(), frozen }), activeSessionId, frozen },
        topTags,
        sessions,
        ...buildStatsUpdate(topTags),
      }))
    })
    votesUnsub = () => off(votesRef, 'value', votesCb as Parameters<typeof off>[2])
    unsubscribers.push(votesUnsub)
  })
  unsubscribers.push(() => off(activeRef, 'value', activeUnsub as Parameters<typeof off>[2]))

  // mood — last 100 entries
  const moodQuery = query(ref(db, FB_PATHS.mood()), orderByChild('ts'), limitToLast(100))
  const moodUnsub = onValue(moodQuery, () => {
    // Mood updates trigger a re-emit but we don't surface raw mood in PulseState yet
    // (aggregated via topTags). No-op for now.
  })
  unsubscribers.push(() => off(ref(db, FB_PATHS.mood()), 'value', moodUnsub as Parameters<typeof off>[2]))

  // Stale detection — check every 10s if last update was >60s ago
  staleCheckTimer = setInterval(() => {
    if (!currentState) return
    const now = Date.now()
    const staleSince = now - lastUpdateTime > STALE_THRESHOLD_MS
      ? (currentState._meta.staleSince ?? now - STALE_THRESHOLD_MS)
      : null
    if (staleSince !== currentState._meta.staleSince) {
      emit({ ...currentState, _meta: { ...currentState._meta, staleSince } })
    }
  }, 10_000)

  // No-data timeout — fallback to mock if no Firebase update in 30s
  noDataTimer = setTimeout(() => {
    if (!currentState) fallbackToMock()
  }, NO_DATA_TIMEOUT_MS)

  return {
    subscribe(callback) {
      subscribers.push(callback)
      if (currentState) callback(currentState)
      return () => {
        const idx = subscribers.indexOf(callback)
        if (idx !== -1) subscribers.splice(idx, 1)
      }
    },
    getConnectionState() {
      return connectionStatus
    },
    destroy() {
      subscribers.length = 0
      unsubscribers.forEach((fn) => fn())
      unsubscribers.length = 0
      if (staleCheckTimer) clearInterval(staleCheckTimer)
      if (noDataTimer) clearTimeout(noDataTimer)
      mockFallback.destroy()
    },
  }
}
