'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'pulse_participant_v1'

const ROLES = [
  'CEO / Основатель', 'Инвестор', 'Девелопер',
  'Чиновник', 'Эксперт', 'Другое',
]

// These paths skip registration (organizers / monitor screen)
const BYPASS_PATHS = ['/pulse/admin', '/pulse/live', '/pulse/qr']

interface RegData {
  name: string; role: string; company: string; city: string
  uid: string; consent: boolean; ts: number
}

function isRegistered(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const d = JSON.parse(raw) as Partial<RegData>
    return !!(d.name && d.consent && d.uid)
  } catch { return false }
}

export default function RegistrationGate({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [ready, setReady] = useState(false)
  const [show, setShow] = useState(false)

  // form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const bypass = BYPASS_PATHS.some(p => path.startsWith(p))

  useEffect(() => {
    if (bypass || isRegistered()) {
      setReady(true)
    } else {
      setShow(true)
    }
  }, [bypass])

  async function handleSubmit() {
    if (!name.trim()) { setError('Введите имя'); return }
    if (!role) { setError('Выберите роль'); return }
    if (!consent) { setError('Необходимо согласие'); return }

    setSubmitting(true)
    setError('')
    try {
      const { ensureAnonymousAuth, hasFirebaseConfig, getFirebaseDb } = await import('@/lib/pulse/firebase/client')
      let uid = `local-${Date.now()}`

      if (hasFirebaseConfig()) {
        uid = await ensureAnonymousAuth()
        const { ref, set } = await import('firebase/database')
        const db = getFirebaseDb()
        await set(ref(db, `participants/${uid}`), {
          name: name.trim(),
          role,
          company: company.trim() || null,
          city: city.trim() || null,
          consent: true,
          ts: Date.now(),
        })
      }

      const data: RegData = {
        name: name.trim(), role, company: company.trim(),
        city: city.trim(), uid, consent: true, ts: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setShow(false)
      setReady(true)
    } catch (e) {
      setError('Ошибка сохранения. Попробуйте ещё раз.')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!show && !ready) return null

  if (!show) return <>{children}</>

  return (
    <>
      {/* Full-screen registration overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 70%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', overflowY: 'auto',
        padding: '40px 20px 60px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              marginBottom: 12,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px #00d4ff', display: 'inline-block' }} />
              AI‑Пульс · Горы и Город 2026
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Добро пожаловать
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              Заполните анкету участника — займёт 30 секунд
            </div>
          </div>

          {/* Form card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '28px 24px', display: 'flex',
            flexDirection: 'column', gap: 20,
          }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Имя и фамилия *
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Иван Петров"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none',
                }}
              />
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Роль *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{
                      padding: '11px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      background: role === r ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: role === r ? '1.5px solid #00d4ff' : '1px solid rgba(255,255,255,0.08)',
                      color: role === r ? '#00d4ff' : 'rgba(255,255,255,0.6)',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Компания
              </label>
              <input
                value={company} onChange={e => setCompany(e.target.value)}
                placeholder="ООО «Название»"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none',
                }}
              />
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Город
              </label>
              <input
                value={city} onChange={e => setCity(e.target.value)}
                placeholder="Москва"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none',
                }}
              />
            </div>

            {/* Consent */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: '#00d4ff' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Согласен(на) на обработку персональных данных в соответствии с ФЗ‑152
                для целей организации форума
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{ fontSize: 13, color: '#fca5a5', textAlign: 'center' }}>{error}</div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: submitting ? 'rgba(0,212,255,0.3)' : 'linear-gradient(135deg, #00d4ff, #0066ff)',
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 24px rgba(0,212,255,0.3)',
              }}>
              {submitting ? 'Сохраняем...' : 'Войти на форум →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
