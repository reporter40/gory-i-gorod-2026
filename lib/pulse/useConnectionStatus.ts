'use client'

import { useEffect, useRef, useState } from 'react'
import type { PulseConnectionState } from './types'
import { hasFirebaseConfig } from './firebase/client'

const DEFAULT_STATE: PulseConnectionState = {
  status: 'connected',
  lastConnected: null,
  reconnectAttempt: 0,
}

export function useConnectionStatus(): PulseConnectionState {
  const [status, setStatus] = useState<PulseConnectionState>(DEFAULT_STATE)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setStatus({ status: 'connected', lastConnected: Date.now(), reconnectAttempt: 0 })
      return
    }

    let unsubRef: (() => void) | null = null

    async function setup() {
      try {
        const { getFirebaseDb } = await import('./firebase/client')
        const { ref, onValue } = await import('firebase/database')
        const db = getFirebaseDb()
        const connRef = ref(db, '.info/connected')

        const cb = onValue(connRef, (snap) => {
          const connected = !!snap.val()
          setStatus((prev) => ({
            status: connected ? 'connected' : 'reconnecting',
            lastConnected: connected ? Date.now() : prev.lastConnected,
            reconnectAttempt: connected ? 0 : prev.reconnectAttempt + 1,
          }))
        })

        unsubRef = () => {
          const { off } = require('firebase/database')
          off(connRef, 'value', cb)
        }
      } catch {
        setStatus({ status: 'offline', lastConnected: null, reconnectAttempt: 0 })
      }
    }

    setup()

    return () => {
      if (unsubRef) unsubRef()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return status
}
