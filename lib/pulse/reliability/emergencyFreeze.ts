// Emergency freeze state management.
// Reads event/frozen from Firebase, exposes a subscribe interface.

type FreezeCallback = (frozen: boolean) => void

let _frozen = false
const _subscribers: FreezeCallback[] = []
let _unsubFirebase: (() => void) | null = null

export function getFrozen(): boolean {
  return _frozen
}

export function subscribeFrozen(cb: FreezeCallback): () => void {
  _subscribers.push(cb)
  cb(_frozen) // fire immediately
  return () => {
    const idx = _subscribers.indexOf(cb)
    if (idx !== -1) _subscribers.splice(idx, 1)
  }
}

function notify() {
  _subscribers.forEach((cb) => cb(_frozen))
}

export async function startFreezeListener(): Promise<void> {
  if (_unsubFirebase) return
  try {
    const { getFirebaseDb, hasFirebaseConfig } = await import('../firebase/client')
    if (!hasFirebaseConfig()) return
    const { ref, onValue } = await import('firebase/database')
    const db = getFirebaseDb()
    const cb = onValue(ref(db, 'event/frozen'), (snap) => {
      const val = !!snap.val()
      if (val !== _frozen) {
        _frozen = val
        notify()
      }
    })
    _unsubFirebase = () => {
      const { off } = require('firebase/database')
      off(ref(db, 'event/frozen'), 'value', cb)
    }
  } catch {}
}

export function stopFreezeListener(): void {
  if (_unsubFirebase) { _unsubFirebase(); _unsubFirebase = null }
}
