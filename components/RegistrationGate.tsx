'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'pulse_participant_v1'

const ROLES = [
  { id: 'ceo', label: 'CEO / Основатель', icon: '👔' },
  { id: 'investor', label: 'Инвестор', icon: '💼' },
  { id: 'developer', label: 'Девелопер', icon: '🏗️' },
  { id: 'official', label: 'Чиновник', icon: '🏛️' },
  { id: 'expert', label: 'Эксперт', icon: '🎓' },
  { id: 'other', label: 'Другое', icon: '✨' },
]

const BYPASS_PATHS = ['/pulse/admin', '/pulse/live', '/pulse/qr']

interface RegData {
  name: string; role: string; company: string; city: string
  phone: string; telegram: string
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
  const [visible, setVisible] = useState(false)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [telegram, setTelegram] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const bypass = BYPASS_PATHS.some(p => path.startsWith(p))

  useEffect(() => {
    if (bypass || isRegistered()) {
      setReady(true)
      return
    }
    // Check Firebase — user may have registered on another device
    ;(async () => {
      try {
        const { ensureAnonymousAuth, hasFirebaseConfig, getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        if (hasFirebaseConfig()) {
          const uid = await ensureAnonymousAuth()
          const { ref, get } = await import('firebase/database')
          const snap = await get(ref(getFirebaseDb(), `participants/${uid}`))
          if (snap.exists()) {
            const val = snap.val() as Record<string, unknown>
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...val, uid, consent: true }))
            setReady(true)
            return
          }
        }
      } catch {}
      setShow(true)
      setTimeout(() => setVisible(true), 50)
    })()
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
        const { ref, set, runTransaction } = await import('firebase/database')
        const db = getFirebaseDb()
        const { get } = await import('firebase/database')
        const existing = await get(ref(db, `participants/${uid}`))
        if (!existing.exists()) {
          await set(ref(db, `participants/${uid}`), {
            name: name.trim(),
            role,
            company: company.trim() || null,
            city: city.trim() || null,
            phone: phone.trim() || null,
            telegram: telegram.trim() || null,
            consent: true,
            ts: Date.now(),
          })
          if (city.trim()) {
            await runTransaction(ref(db, `geo/${city.trim()}`), (cur) => (cur ?? 0) + 1)
          }
          await runTransaction(ref(db, 'event/stats/registeredCount'), (cur) => (cur ?? 0) + 1)
        }
      }

      const data: RegData = {
        name: name.trim(), role, company: company.trim(),
        city: city.trim(), phone: phone.trim(), telegram: telegram.trim(),
        uid, consent: true, ts: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSuccess(true)
      setTimeout(() => {
        setShow(false)
        setReady(true)
      }, 1000)
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
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          50%  { transform: scale(1.4); opacity: 0;   }
          100% { transform: scale(1);   opacity: 0;   }
        }
        @keyframes roleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes successPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .reg-input:focus {
          border-color: rgba(0,212,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
        }
        .role-btn {
          transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
        }
        .role-btn:hover {
          transform: translateY(-2px) scale(1.03);
        }
        .role-btn:active {
          transform: scale(0.96);
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 70%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', overflowY: 'auto',
        padding: '40px 20px 60px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          animation: visible ? 'fadeSlideUp 0.5s ease both' : 'none',
        }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              marginBottom: 12, position: 'relative',
            }}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  background: '#00d4ff',
                  animation: 'pulse-ring 2s ease-out infinite',
                }} />
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#00d4ff', boxShadow: '0 0 10px #00d4ff',
                  display: 'inline-block', position: 'relative',
                }} />
              </span>
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
                className="reg-input"
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Иван Петров"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Роль *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map((r, i) => (
                  <button
                    key={r.id}
                    className="role-btn"
                    onClick={() => setRole(r.label)}
                    style={{
                      padding: '14px 8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', textAlign: 'center',
                      background: role === r.label ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.05)',
                      border: role === r.label ? '1.5px solid #00d4ff' : '1px solid rgba(255,255,255,0.08)',
                      color: role === r.label ? '#00d4ff' : 'rgba(255,255,255,0.65)',
                      boxShadow: role === r.label ? '0 0 16px rgba(0,212,255,0.2)' : 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      animation: `roleIn 0.3s ease ${i * 0.05}s both`,
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{r.icon}</span>
                    <span>{r.label}</span>
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
                className="reg-input"
                value={company} onChange={e => setCompany(e.target.value)}
                placeholder="ООО «Название»"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Город
              </label>
              <input
                className="reg-input"
                value={city} onChange={e => setCity(e.target.value)}
                placeholder="Москва"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* Phone + Telegram row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  📱 Телефон
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.35)', fontSize: 15, pointerEvents: 'none',
                  }}>+7</span>
                  <input
                    className="reg-input"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9001234567"
                    style={{
                      width: '100%', padding: '14px 12px 14px 34px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✈️ Telegram
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.35)', fontSize: 15, pointerEvents: 'none',
                  }}>@</span>
                  <input
                    className="reg-input"
                    type="text"
                    value={telegram}
                    onChange={e => setTelegram(e.target.value.replace(/^@/, ''))}
                    placeholder="username"
                    style={{
                      width: '100%', padding: '14px 12px 14px 26px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                </div>
              </div>
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
              disabled={submitting || success}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: success
                  ? 'linear-gradient(135deg, #00c853, #00e676)'
                  : submitting
                    ? 'rgba(0,212,255,0.3)'
                    : 'linear-gradient(135deg, #00d4ff, #0066ff)',
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: (submitting || success) ? 'not-allowed' : 'pointer',
                boxShadow: success
                  ? '0 4px 24px rgba(0,200,83,0.4)'
                  : submitting
                    ? 'none'
                    : '0 4px 24px rgba(0,212,255,0.3)',
                transition: 'all 0.3s ease',
                animation: success ? 'successPop 0.4s ease both' : 'none',
              }}>
              {success ? '✓ Добро пожаловать!' : submitting ? 'Сохраняем...' : 'Войти на форум →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
