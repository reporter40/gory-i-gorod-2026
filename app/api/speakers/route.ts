import { NextResponse } from 'next/server'
import { SPEAKERS, SESSIONS, getSessionsWithSpeakers } from '@/lib/data'

export async function GET() {
  return NextResponse.json({
    speakers: SPEAKERS.filter(s => s.id !== 'org'),
    sessions: SESSIONS.filter(s => s.speaker_id !== 'org'),
    sessionsWithSpeakers: getSessionsWithSpeakers().filter(s => s.speaker_id !== 'org'),
  })
}
