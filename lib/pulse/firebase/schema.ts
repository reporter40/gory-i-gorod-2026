// Firebase RTDB schema type definitions.
// Actual data lives in Firebase; these types describe the wire format.

export interface FirebaseVotes {
  [sessionId: string]: {
    [tagId: string]: number // atomic counter, transaction only
  }
}

export interface FirebaseUserVotes {
  [sessionId: string]: {
    [userId: string]: {
      [tagId: string]: true // write-once dedupe marker
    }
  }
}

export interface FirebaseMoodEntry {
  tagId: string
  sessionId: string
  userId: string
  ts: number // server timestamp
}

export interface FirebaseMood {
  [pushId: string]: FirebaseMoodEntry
}

export interface FirebaseSession {
  title: string
  speakerId: string
  hall: string
  start: number
  end: number
  status: 'upcoming' | 'live' | 'ended'
}

export interface FirebaseSessions {
  [sessionId: string]: FirebaseSession
}

export interface FirebaseSpeaker {
  name: string
  role: string
  avatar: string
}

export interface FirebaseSpeakers {
  [speakerId: string]: FirebaseSpeaker
}

export interface FirebaseEvent {
  activeSessionId: string
  expectedAudience: number
  updatedAt: number
  frozen: boolean
}

export interface FirebaseHeartbeat {
  [dashboardId: string]: {
    lastSeen: number // server timestamp
  }
}

// Root database shape
export interface FirebaseDB {
  votes: FirebaseVotes
  userVotes: FirebaseUserVotes
  mood: FirebaseMood
  sessions: FirebaseSessions
  speakers: FirebaseSpeakers
  event: FirebaseEvent
  heartbeat: FirebaseHeartbeat
}

// Path helpers
export const FB_PATHS = {
  votes: (sessionId: string, tagId: string) => `votes/${sessionId}/${tagId}`,
  userVote: (sessionId: string, userId: string, tagId: string) =>
    `userVotes/${sessionId}/${userId}/${tagId}`,
  mood: () => 'mood',
  session: (sessionId: string) => `sessions/${sessionId}`,
  sessions: () => 'sessions',
  speaker: (speakerId: string) => `speakers/${speakerId}`,
  speakers: () => 'speakers',
  event: () => 'event',
  activeSessionId: () => 'event/activeSessionId',
  frozen: () => 'event/frozen',
  heartbeat: (dashboardId: string) => `heartbeat/${dashboardId}/lastSeen`,
  connected: () => '.info/connected',
} as const
