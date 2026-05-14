'use client'
import { useState } from 'react'
import { SPEAKERS, SESSIONS } from '@/lib/data'

const AVATAR_COLORS = ['#0f2a4a', '#0a2a1a', '#1a1a4a', '#2a0a3a', '#2a180a', '#0a2a2a']
const AVATAR_TEXT   = ['#4a9eca', '#22c55e', '#818cf8', '#a855f7', '#f97316', '#06b6d4']

export default function SpeakersPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = SPEAKERS.filter(sp => {
    if (!q) return true
    return `${sp.name} ${sp.role} ${sp.city}`.toLowerCase().includes(q)
  })

  const openSp = SPEAKERS.find(sp => sp.id === open)
  const openIdx = openSp ? SPEAKERS.indexOf(openSp) : 0
  const openSessions = open ? SESSIONS.filter(s => s.speaker_id === open) : []

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Эксперты</p>
          <h1 className="heading text-white">{SPEAKERS.length} спикеров</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя, должность или город"
            className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-colors"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }} />
        </div>

        <div className="space-y-2">
          {filtered.map((sp, i) => (
            <div key={sp.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length] }}>
                {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{sp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {sp.role}{sp.city ? ` · ${sp.city}` : ''}
                </div>
              </div>
              <button onClick={() => setOpen(sp.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Никого не найдено</div>
          )}
        </div>
      </div>

      {open && openSp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(null)}>
          <div className="rounded-3xl p-6 w-72" style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full mb-3 flex items-center justify-center text-xl font-bold"
                style={{ background: AVATAR_COLORS[openIdx % AVATAR_COLORS.length], color: AVATAR_TEXT[openIdx % AVATAR_TEXT.length] }}>
                {openSp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h3 style={{ fontWeight: 800, color: 'var(--text)', textAlign: 'center', fontSize: 16 }}>{openSp.name}</h3>
              {openSp.role && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>{openSp.role}</p>
              )}
              {openSp.city && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 3 }}>📍 {openSp.city}</p>
              )}
            </div>

            {openSessions.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 16 }} className="space-y-2.5">
                {openSessions.map(s => (
                  <div key={s.id} className="flex gap-2" style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--accent)', fontFamily: 'monospace', width: 52, flexShrink: 0, paddingTop: 1 }}>
                      {new Date(s.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })} д{s.day}
                    </span>
                    <span style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setOpen(null)}
              className="w-full py-2 text-center text-sm"
              style={{ color: 'var(--text-3)' }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
