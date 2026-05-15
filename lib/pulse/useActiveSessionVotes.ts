'use client'

import { useEffect, useMemo, useState } from 'react'
import { getFirebaseDb, hasFirebaseConfig } from '@/lib/pulse/firebase/client'
import {
  CANONICAL_REACTION_TAG_IDS,
  CANONICAL_REACTION_TAG_LABELS,
} from '@/lib/pulse/pulse-aggregations'

export type PulseEventMode = 'live' | 'vote' | 'freeze'

export interface ActiveSessionSummary {
  id: string
  title: string
  speakerName: string
  hall: string
  /** Short time label for UI, e.g. "14:30" */
  timeLabel: string
}

export interface ActiveSessionTagStat {
  tagId: string
  label: string
  votes: number
}

export interface UseActiveSessionVotesResult {
  activeSessionId: string | null
  session: ActiveSessionSummary | null
  tagStats: ActiveSessionTagStat[]
  totalVotes: number
  frozen: boolean
  eventMode: PulseEventMode
  loading: boolean
  error: string | null
}

function normalizeMode(raw: string | null | undefined): PulseEventMode {
  if (raw === 'vote' || raw === 'freeze') return raw
  return 'live'
}

/** Parse RTDB session payload (seed uses starts_at / speakerName; adapter types may use start/speakerId). */
async function fetchSessionSummary(db: ReturnType<typeof getFirebaseDb>, sid: string): Promise<ActiveSessionSummary | null> {
  const { ref, get } = await import('firebase/database')
  const snap = await get(ref(db, `sessions/${sid}`))
  const raw = snap.val() as Record<string, unknown> | null
  if (!raw) return null

  const title = typeof raw.title === 'string' ? raw.title : ''
  const hall = typeof raw.hall === 'string' ? raw.hall : ''

  let speakerName = ''
  if (typeof raw.speakerName === 'string' && raw.speakerName.trim()) {
    speakerName = raw.speakerName.trim()
  } else if (typeof raw.speakerId === 'string') {
    const spSnap = await get(ref(db, `speakers/${raw.speakerId}`))
    const sp = spSnap.val() as { name?: string } | null
    speakerName = typeof sp?.name === 'string' ? sp.name : ''
  }

  let timeLabel = ''
  if (typeof raw.starts_at === 'string') {
    try {
      const d = new Date(raw.starts_at)
      if (!Number.isNaN(d.getTime())) {
        timeLabel = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      /* ignore */
    }
  }
  if (!timeLabel && typeof raw.start === 'number') {
    try {
      timeLabel = new Date(raw.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch {
      /* ignore */
    }
  }

  return {
    id: sid,
    title,
    speakerName,
    hall,
    timeLabel,
  }
}

/**
 * Subscribes to active session + votes for canonical reaction tags (read-only).
 * No mock data — when Firebase is unavailable, returns error / empty state.
 */
export function useActiveSessionVotes(): UseActiveSessionVotesResult {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<ActiveSessionSummary | null>(null)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [frozen, setFrozen] = useState(false)
  const [eventMode, setEventMode] = useState<PulseEventMode>('live')
  const firebaseConfigured = hasFirebaseConfig()
  const [loading, setLoading] = useState(() => firebaseConfigured)
  const [error, setError] = useState<string | null>(() =>
    firebaseConfigured ? null : 'Firebase не настроен (NEXT_PUBLIC_FIREBASE_*)'
  )

  useEffect(() => {
    if (!firebaseConfigured) return

    let cancelled = false
    const db = getFirebaseDb()
    const cleanups: Array<() => void> = []
    let votesUnsub: (() => void) | null = null

    void (async () => {
      try {
        const { ref, onValue } = await import('firebase/database')

        cleanups.push(
          onValue(ref(db, 'event/mode'), (snap) => {
            if (cancelled) return
            setEventMode(normalizeMode(snap.val() as string | null))
          })
        )

        cleanups.push(
          onValue(ref(db, 'event/frozen'), (snap) => {
            if (cancelled) return
            setFrozen(!!snap.val())
          })
        )

        cleanups.push(
          onValue(ref(db, 'event/activeSessionId'), (snap) => {
            if (cancelled) return
            votesUnsub?.()
            votesUnsub = null
            setVoteCounts({})

            const sid = typeof snap.val() === 'string' ? (snap.val() as string).trim() : ''
            setActiveSessionId(sid || null)

            if (!sid) {
              setSession(null)
              setLoading(false)
              setError(null)
              return
            }

            setLoading(true)
            void fetchSessionSummary(db, sid).then((summary) => {
              if (cancelled) return
              setSession(summary)
              setLoading(false)
              setError(null)
            })

            votesUnsub = onValue(ref(db, `votes/${sid}`), (vs) => {
              if (cancelled) return
              const raw = (vs.val() as Record<string, unknown> | null) ?? {}
              const next: Record<string, number> = {}
              for (const id of CANONICAL_REACTION_TAG_IDS) {
                const n = raw[id]
                next[id] = typeof n === 'number' && Number.isFinite(n) ? n : 0
              }
              setVoteCounts(next)
            })
          })
        )
      } catch (e) {
        if (!cancelled) {
          setLoading(false)
          setError(e instanceof Error ? e.message : String(e))
        }
      }
    })()

    return () => {
      cancelled = true
      votesUnsub?.()
      votesUnsub = null
      while (cleanups.length) {
        const u = cleanups.pop()
        try {
          u?.()
        } catch {
          /* ignore */
        }
      }
    }
  }, [firebaseConfigured])

  const tagStats = useMemo((): ActiveSessionTagStat[] => {
    return CANONICAL_REACTION_TAG_IDS.map((id) => ({
      tagId: id,
      label: CANONICAL_REACTION_TAG_LABELS[id],
      votes: voteCounts[id] ?? 0,
    }))
  }, [voteCounts])

  const totalVotes = useMemo(() => tagStats.reduce((s, t) => s + t.votes, 0), [tagStats])

  return {
    activeSessionId,
    session,
    tagStats,
    totalVotes,
    frozen,
    eventMode,
    loading,
    error,
  }
}
