// In-memory rate limiter — no Firebase required.
// max 1 vote per 2 seconds per userId
// max 30 votes per minute per userId → 5-min block on breach

interface RateLimitResult {
  limited: boolean
  retryAfter: number // seconds until next allowed vote
}

interface UserState {
  lastVoteTime: number
  minuteVotes: number[]  // timestamps of votes in last 60s
  blockedUntil: number
}

const userStates = new Map<string, UserState>()

const COOLDOWN_MS = 2_000
const MAX_PER_MINUTE = 30
const BLOCK_DURATION_MS = 5 * 60_000

function getState(userId: string): UserState {
  if (!userStates.has(userId)) {
    userStates.set(userId, { lastVoteTime: 0, minuteVotes: [], blockedUntil: 0 })
  }
  return userStates.get(userId)!
}

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now()
  const state = getState(userId)

  // Check 5-min block
  if (state.blockedUntil > now) {
    return { limited: true, retryAfter: Math.ceil((state.blockedUntil - now) / 1000) }
  }

  // Check 2-second cooldown
  const timeSinceLast = now - state.lastVoteTime
  if (timeSinceLast < COOLDOWN_MS) {
    return { limited: true, retryAfter: Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000) }
  }

  // Check per-minute limit
  const windowStart = now - 60_000
  state.minuteVotes = state.minuteVotes.filter((t) => t > windowStart)
  if (state.minuteVotes.length >= MAX_PER_MINUTE) {
    state.blockedUntil = now + BLOCK_DURATION_MS
    return { limited: true, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) }
  }

  return { limited: false, retryAfter: 0 }
}

export function recordVote(userId: string): void {
  const now = Date.now()
  const state = getState(userId)
  state.lastVoteTime = now
  state.minuteVotes.push(now)
}
