// Saves PulseState to localStorage every 5 minutes.
// On load: show snapshot instantly, replace with live data when Firebase responds.
// Max age: 30 minutes. Older → ignore, use mock.

import type { PulseState } from '../types'

const SNAPSHOT_KEY = 'pulse_last_good_state_v3'
const SAVE_INTERVAL_MS = 5 * 60_000
const MAX_AGE_MS = 30 * 60_000

export function saveSnapshot(state: PulseState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state))
  } catch {
    // storage full — ignore
  }
}

export function loadSnapshot(): PulseState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as PulseState
    const age = Date.now() - (state._meta?.lastUpdated ?? 0)
    if (age > MAX_AGE_MS) {
      localStorage.removeItem(SNAPSHOT_KEY)
      return null
    }
    return { ...state, _meta: { ...state._meta, source: 'snapshot' } }
  } catch {
    return null
  }
}

export function clearSnapshot(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SNAPSHOT_KEY)
  }
}

export function startSnapshotSaver(getState: () => PulseState | null): () => void {
  if (typeof window === 'undefined') return () => {}

  const interval = setInterval(() => {
    const state = getState()
    if (state && state._meta.source !== 'snapshot') {
      saveSnapshot(state)
    }
  }, SAVE_INTERVAL_MS)

  return () => clearInterval(interval)
}
