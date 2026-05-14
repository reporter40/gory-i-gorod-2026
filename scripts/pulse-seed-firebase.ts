#!/usr/bin/env npx tsx
// Seed Firebase RTDB with initial data for AI-Пульс.
// Usage: npx tsx scripts/pulse-seed-firebase.ts
//
// Requires env vars: NEXT_PUBLIC_FIREBASE_* (or .env.local)

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const {
  NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: databaseURL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
} = process.env

if (!apiKey || !databaseURL) {
  console.error('❌ Firebase env vars not set. Create .env.local with NEXT_PUBLIC_FIREBASE_* vars.')
  process.exit(1)
}

import('firebase/app').then(async ({ initializeApp }) => {
  const { getDatabase, ref, set } = await import('firebase/database')
  const { getAuth, signInAnonymously } = await import('firebase/auth')

  const app = initializeApp({ apiKey, authDomain, databaseURL, projectId })
  const db = getDatabase(app)
  const auth = getAuth(app)

  await signInAnonymously(auth)

  const now = Date.now()
  const h = 3600000

  const sessions = {
    'session-1': { title: 'Будущее городов в новой реальности', speakerId: 'sp-a', hall: 'Главный зал', start: now, end: now + h, status: 'live' },
    'session-2': { title: 'Умные решения для устойчивого роста', speakerId: 'sp-b', hall: 'Панорама', start: now + h, end: now + 2 * h, status: 'upcoming' },
    'session-3': { title: 'ГЧП как драйвер развития регионов', speakerId: 'sp-c', hall: 'Стратегия', start: now + 2 * h, end: now + 3 * h, status: 'upcoming' },
    'session-4': { title: 'Технологии для людей', speakerId: 'sp-d', hall: 'Инновации', start: now + 3 * h, end: now + 4 * h, status: 'upcoming' },
    'session-5': { title: 'ИИ в управлении городской средой', speakerId: 'sp-e', hall: 'Мастер-класс', start: now + 4 * h, end: now + 5 * h, status: 'upcoming' },
  }

  const speakers = {
    'sp-a': { name: 'А. Иванова', role: 'Директор, ГосТех', avatar: '' },
    'sp-b': { name: 'М. Петров', role: 'Министр цифрового развития', avatar: '' },
    'sp-c': { name: 'Е. Смирнова', role: 'Руководитель ГЧП-центра', avatar: '' },
    'sp-d': { name: 'Д. Орлов', role: 'CTO SmartCity', avatar: '' },
    'sp-e': { name: 'К. Лебедева', role: 'AI-архитектор', avatar: '' },
  }

  const tags = ['actual', 'ppp', 'innovation', 'cases', 'invest']
  const votes: Record<string, Record<string, number>> = {}
  for (const sid of Object.keys(sessions)) {
    votes[sid] = {}
    for (const tid of tags) {
      votes[sid][tid] = 0
    }
  }

  const eventConfig = {
    activeSessionId: 'session-1',
    expectedAudience: 1700,
    updatedAt: now,
    frozen: false,
  }

  console.log('Seeding Firebase...')
  await Promise.all([
    set(ref(db, 'sessions'), sessions),
    set(ref(db, 'speakers'), speakers),
    set(ref(db, 'votes'), votes),
    set(ref(db, 'event'), eventConfig),
  ])

  console.log('✅ Seeded:')
  console.log(`   ${Object.keys(sessions).length} sessions`)
  console.log(`   ${Object.keys(speakers).length} speakers`)
  console.log(`   ${Object.keys(sessions).length * tags.length} vote counters (all 0)`)
  console.log(`   activeSessionId = session-1`)
  process.exit(0)
})
