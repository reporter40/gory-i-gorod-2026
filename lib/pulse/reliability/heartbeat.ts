'use client'

// Writes heartbeat to Firebase every 30s so admin can see dashboard liveness.
// heartbeat/{dashboardId}/lastSeen = serverTimestamp

const HEARTBEAT_INTERVAL_MS = 30_000
const STALE_THRESHOLD_MS = 5_000

export interface HeartbeatStatus {
  alive: boolean
  ageSeconds: number
  label: string   // "alive: 3с назад" | "stale: 45с назад" | "offline: 2мин назад"
  color: 'green' | 'yellow' | 'red'
}

export function startHeartbeat(dashboardId: string = 'main'): () => void {
  if (typeof window === 'undefined') return () => {}

  let interval: ReturnType<typeof setInterval> | null = null
  let stopped = false

  async function beat() {
    if (stopped) return
    try {
      const { getFirebaseDb, hasFirebaseConfig } = await import('../firebase/client')
      if (!hasFirebaseConfig()) return
      const { ref, set, serverTimestamp } = await import('firebase/database')
      const db = getFirebaseDb()
      await set(ref(db, `heartbeat/${dashboardId}/lastSeen`), serverTimestamp())
    } catch (err) {
      console.warn('[Heartbeat] write failed:', err)
    }
  }

  beat() // immediate first beat
  interval = setInterval(beat, HEARTBEAT_INTERVAL_MS)

  return function stop() {
    stopped = true
    if (interval) clearInterval(interval)
  }
}

export function parseHeartbeatStatus(lastSeen: number | null): HeartbeatStatus {
  if (!lastSeen) return { alive: false, ageSeconds: 999, label: 'offline: нет данных', color: 'red' }

  const age = Math.floor((Date.now() - lastSeen) / 1000)

  if (age < 15) return { alive: true, ageSeconds: age, label: `alive: ${age}с назад`, color: 'green' }
  if (age < 90) return { alive: true, ageSeconds: age, label: `stale: ${age}с назад`, color: 'yellow' }
  const mins = Math.floor(age / 60)
  return { alive: false, ageSeconds: age, label: `offline: ${mins}мин назад`, color: 'red' }
}
