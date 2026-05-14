'use client'
import { useState } from 'react'
import { PARTICIPANTS } from '@/lib/data'

const AVATAR_BG   = ['#0f2a4a', '#0a2a1a', '#1a1a4a', '#2a0a3a', '#2a180a', '#0a2a2a']
const AVATAR_TEXT = ['#4a9eca', '#22c55e', '#818cf8', '#a855f7', '#f97316', '#06b6d4']

export default function NetworkPage() {
  const [search, setSearch] = useState('')
  const [qrOpen, setQrOpen] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = PARTICIPANTS.filter(p => {
    if (!q) return true
    return `${p.name} ${p.city} ${p.role}`.toLowerCase().includes(q)
  })

  const openP = PARTICIPANTS.find(p => p.id === qrOpen)
  const openIdx = openP ? PARTICIPANTS.indexOf(openP) : 0

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Нетворкинг</p>
          <h1 className="heading text-white">Участники</h1>
          <p style={{ fontSize: 12, color: 'rgba(238,244,255,0.4)', marginTop: 6, lineHeight: 1.6 }}>
            Список из колонки «Спикеры / Участники» программы.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя или фрагмент подписи из программы"
            className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        <div className="space-y-2">
          {filtered.map((p, i) => (
            <div key={p.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                style={{ background: AVATAR_BG[i % AVATAR_BG.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length] }}>
                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.role}{p.city ? ` · ${p.city}` : ''}
                </div>
              </div>
              <button onClick={() => setQrOpen(p.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Никого не найдено</div>
          )}
        </div>
      </div>

      {qrOpen && openP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setQrOpen(null)}>
          <div className="rounded-3xl p-6 w-72 text-center" style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold"
              style={{ background: AVATAR_BG[openIdx % AVATAR_BG.length], color: AVATAR_TEXT[openIdx % AVATAR_TEXT.length] }}>
              {openP.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>{openP.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, marginBottom: 20, lineHeight: 1.5 }}>
              {openP.role}{openP.city ? ` · ${openP.city}` : ''}
            </p>

            <div className="w-36 h-36 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-7 gap-0.5 p-2" style={{ opacity: 0.35 }}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm"
                    style={{ background: Math.random() > 0.5 ? 'var(--accent)' : 'transparent' }} />
                ))}
              </div>
            </div>

            {openP.email.trim() ? (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>{openP.email}</p>
                <a href={`mailto:${openP.email}`}
                  className="block w-full py-3 rounded-2xl text-sm font-semibold forum-gradient text-white mb-2">
                  Написать
                </a>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                E-mail в файле программы не указан.
              </p>
            )}
            <button onClick={() => setQrOpen(null)}
              className="text-sm py-1.5 w-full"
              style={{ color: 'var(--text-3)' }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
