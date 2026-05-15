'use client'

import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { getFirebaseDb } from './firebase/client'
import { buildHeatmapFromTimeline } from './pulse-aggregations'
import type { SessionHeatmap } from './pulse-data'

export function useVoteTimelineHeatmap(): SessionHeatmap | null {
  const [heatmap, setHeatmap] = useState<SessionHeatmap | null>(null)

  useEffect(() => {
    let db: ReturnType<typeof getFirebaseDb>
    try {
      db = getFirebaseDb()
    } catch {
      return
    }

    const tlRef = ref(db, 'voteTimeline')
    const unsub = onValue(tlRef, (snap) => {
      const data = snap.val() as Record<string, Record<string, number>> | null
      if (!data) { setHeatmap(null); return }
      const built = buildHeatmapFromTimeline(data)
      setHeatmap(built.halls.length ? built : null)
    })

    return () => off(tlRef, 'value', unsub)
  }, [])

  return heatmap
}
