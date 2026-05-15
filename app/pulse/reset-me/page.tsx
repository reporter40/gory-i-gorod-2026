'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const VOTE_PREFIX = 'sv_'
const REG_KEY = 'pulse_participant_v1'
const SNAPSHOT_KEY = 'pulse_last_good_state_v3'

export default function ResetMePage() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleReset() {
    try {
      // 1. Clear localStorage: registration + all votes + snapshot
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (k.startsWith(VOTE_PREFIX) || k === REG_KEY || k === SNAPSHOT_KEY)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))

      // 2. Clear Firebase: participant record + speakerVotes userVotes
      const { hasFirebaseConfig, ensureAnonymousAuth, getFirebaseDb } = await import('@/lib/pulse/firebase/client')
      if (hasFirebaseConfig()) {
        const uid = await ensureAnonymousAuth()
        const { ref, remove, get } = await import('firebase/database')
        const db = getFirebaseDb()

        // Remove participant
        await remove(ref(db, `participants/${uid}`))

        // Remove speakerVotes userVotes for this user across all speakers
        const svSnap = await get(ref(db, 'speakerVotes'))
        if (svSnap.exists()) {
          const data = svSnap.val() as Record<string, { userVotes?: Record<string, unknown> }>
          const removes: Promise<void>[] = []
          for (const speakerId of Object.keys(data)) {
            if (data[speakerId]?.userVotes?.[uid] !== undefined) {
              removes.push(remove(ref(db, `speakerVotes/${speakerId}/userVotes/${uid}`)))
            }
          }
          await Promise.all(removes)
        }
      }

      setDone(true)
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%)',
      color: '#f0f6ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        {done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Аккаунт сброшен</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Все голоса и регистрация очищены. Можно зарегистрироваться заново.
            </p>
            <button
              onClick={() => router.push('/join')}
              style={{
                width: '100%', padding: '16px', borderRadius: 16,
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Зарегистрироваться заново
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Сбросить аккаунт</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Удалит регистрацию и все твои голоса. После этого можно зарегистрироваться заново.
            </p>
            {error && (
              <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</p>
            )}
            <button
              onClick={handleReset}
              style={{
                width: '100%', padding: '16px', borderRadius: 16,
                background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)',
                color: '#ef4444', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              Сбросить мой аккаунт
            </button>
            <button
              onClick={() => router.back()}
              style={{
                width: '100%', padding: '14px', borderRadius: 16,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer',
              }}
            >
              Назад
            </button>
          </>
        )}
      </div>
    </div>
  )
}
