'use client'

import { useEffect, useState } from 'react'

export type EventMode = 'live' | 'vote' | 'freeze'

export function useEventMode(): EventMode {
  const [mode, setMode] = useState<EventMode>('live')

  useEffect(() => {
    // visualTest mode never connects to Firebase — always 'live'
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visualTest') === '1') return

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    if (!apiKey || !databaseURL) return

    let off: (() => void) | null = null

    async function subscribe() {
      const { initializeApp, getApps } = await import('firebase/app')
      const { getDatabase, ref, onValue } = await import('firebase/database')
      const { getAuth, signInAnonymously } = await import('firebase/auth')
      if (!getApps().length) {
        initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        })
      }
      await signInAnonymously(getAuth())
      const db = getDatabase()
      const unsubscribe = onValue(ref(db, 'event/mode'), (snap) => {
        const val = snap.val() as string | null
        if (val === 'vote' || val === 'freeze') setMode(val)
        else setMode('live')
      })
      off = unsubscribe
    }

    subscribe().catch(() => {})
    return () => { off?.() }
  }, [])

  return mode
}
