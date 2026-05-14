import { NextResponse } from 'next/server'

const startTime = Date.now()

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  let firebaseStatus: 'connected' | 'disconnected' | 'unconfigured' = 'unconfigured'
  let activeSession = 'unknown'
  let frozen = false
  let lastVoteReceived: string | null = null
  let dashboardHeartbeat: string | null = null

  const hasConfig =
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

  if (hasConfig) {
    try {
      const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
      const { ref, get } = await import('firebase/database')
      const db = getFirebaseDb()

      const [eventSnap, heartSnap] = await Promise.all([
        get(ref(db, 'event')),
        get(ref(db, 'heartbeat/main/lastSeen')),
      ])

      const event = eventSnap.val() as { activeSessionId?: string; frozen?: boolean } | null
      activeSession = event?.activeSessionId ?? 'none'
      frozen = !!event?.frozen
      firebaseStatus = 'connected'

      const heartTs = heartSnap.val() as number | null
      if (heartTs) {
        dashboardHeartbeat = new Date(heartTs).toISOString()
      }

      // Get last mood entry as proxy for last vote received
      const { query, orderByChild, limitToLast } = await import('firebase/database')
      const moodQ = query(ref(db, 'mood'), orderByChild('ts'), limitToLast(1))
      const moodSnap = await get(moodQ)
      const moodData = moodSnap.val() as Record<string, { ts: number }> | null
      if (moodData) {
        const entries = Object.values(moodData)
        if (entries.length > 0) {
          lastVoteReceived = new Date(entries[0].ts).toISOString()
        }
      }
    } catch {
      firebaseStatus = 'disconnected'
    }
  }

  const status =
    firebaseStatus === 'connected' && !frozen ? 'ok' :
    firebaseStatus === 'disconnected' ? 'degraded' :
    frozen ? 'degraded' : 'down'

  return NextResponse.json({
    status,
    firebase: firebaseStatus,
    lastVoteReceived,
    activeSession,
    frozen,
    dashboardHeartbeat,
    uptime,
  })
}
