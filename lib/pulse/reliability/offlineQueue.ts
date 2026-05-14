// Offline vote queue — persisted in localStorage, survives page reload.
// Max 20 items; oldest dropped when full.
// On reconnect: flush queue, re-check dedupe before each send.

export interface QueuedVote {
  sessionId: string
  tagId: string
  userId: string
  queuedAt: number
}

const QUEUE_KEY = 'pulse_offline_queue'
const MAX_QUEUE_SIZE = 20

function loadQueue(): QueuedVote[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedVote[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedVote[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // storage full — ignore
  }
}

export function enqueueVote(vote: Omit<QueuedVote, 'queuedAt'>): void {
  const queue = loadQueue()
  queue.push({ ...vote, queuedAt: Date.now() })
  // Drop oldest if over limit
  while (queue.length > MAX_QUEUE_SIZE) queue.shift()
  saveQueue(queue)
}

export function getQueue(): QueuedVote[] {
  return loadQueue()
}

export function removeFromQueue(vote: Pick<QueuedVote, 'sessionId' | 'tagId' | 'userId'>): void {
  const queue = loadQueue().filter(
    (q) => !(q.sessionId === vote.sessionId && q.tagId === vote.tagId && q.userId === vote.userId)
  )
  saveQueue(queue)
}

export function clearQueue(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(QUEUE_KEY)
  }
}

export function queueSize(): number {
  return loadQueue().length
}
