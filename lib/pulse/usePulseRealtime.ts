'use client'

import { useEffect, useRef, useState } from 'react'
import type { PulseState, PulseAdapter } from './types'
import { createMockPulseAdapter } from './adapters/mockPulseAdapter'
import { hasFirebaseConfig } from './firebase/client'

function getInitialState(): PulseState | null {
  if (typeof window === 'undefined') return null
  // Load snapshot from localStorage for instant display
  try {
    const raw = localStorage.getItem('pulse_last_good_state_v2')
    if (raw) {
      const parsed = JSON.parse(raw) as PulseState
      return { ...parsed, _meta: { ...parsed._meta, source: 'snapshot' } }
    }
  } catch {
    // ignore
  }
  return null
}

export function usePulseRealtime(): PulseState {
  const [state, setState] = useState<PulseState | null>(() => getInitialState())
  const adapterRef = useRef<PulseAdapter | null>(null)

  useEffect(() => {
    const isVisualTest =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('visualTest') === '1'

    let adapter: PulseAdapter

    if (isVisualTest || !hasFirebaseConfig()) {
      adapter = createMockPulseAdapter()
    } else {
      // Lazy import to avoid loading Firebase on SSR / visual tests
      const { createFirebasePulseAdapter } = require('./adapters/firebasePulseAdapter')
      try {
        adapter = createFirebasePulseAdapter()
      } catch {
        adapter = createMockPulseAdapter()
      }
    }

    adapterRef.current = adapter

    const unsub = adapter.subscribe((newState) => {
      setState(newState)
    })

    return () => {
      unsub()
      adapter.destroy()
      adapterRef.current = null
    }
  }, [])

  // Fallback: if no state yet, use mock synchronously
  if (!state) {
    const mock = createMockPulseAdapter()
    let fallback: PulseState | null = null
    mock.subscribe((s) => { fallback = s })
    mock.destroy()
    return fallback!
  }

  return state
}
