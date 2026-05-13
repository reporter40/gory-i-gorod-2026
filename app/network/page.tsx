'use client'
import { useState } from 'react'
import { PARTICIPANTS } from '@/lib/data'

const AVATAR_COLORS = ['#0f1f3d', '#166534', '#2563eb', '#9333ea', '#ea580c', '#0891b2']

export default function NetworkPage() {
  const [search, setSearch] = useState('')
  const [qrOpen, setQrOpen] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = PARTICIPANTS.filter(p => {
    if (!q) return true
    const hay = `${p.name} ${p.city} ${p.role}`.toLowerCase()
    return hay.includes(q)
  })

  const openP = PARTICIPANTS.find(p => p.id === qrOpen)

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead text-white/50 mb-2">Нетворкинг</p>
          <h1 className="heading text-white">Участники</h1>
          <p className="text-xs text-white/60 mt-2 leading-relaxed">
            Список из колонки «Спикеры / Участники» программы (как в XLSX). Контакты в файле не заданы.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя или фрагмент подписи из программы"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
        </div>

        <div className="space-y-2">
          {filtered.map((p, i) => (
            <div key={p.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#0f1f3d]">{p.name}</div>
                <div className="text-xs text-gray-400 line-clamp-2">
                  {p.role}
                  {p.city ? ` · ${p.city}` : ''}
                </div>
              </div>
              <button onClick={() => setQrOpen(p.id)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Никого не найдено</div>
          )}
        </div>
      </div>

      {qrOpen && openP && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5"
          onClick={() => setQrOpen(null)}>
          <div className="bg-white rounded-3xl p-6 w-72 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
              style={{ background: AVATAR_COLORS[PARTICIPANTS.indexOf(openP) % AVATAR_COLORS.length] }}>
              {openP.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h3 className="font-bold text-[#0f1f3d] mb-0.5">{openP.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {openP.role}
              {openP.city ? ` · ${openP.city}` : ''}
            </p>

            {/* QR placeholder */}
            <div className="w-36 h-36 mx-auto bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center mb-4">
              <div className="grid grid-cols-7 gap-0.5 p-2 opacity-40">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm"
                    style={{ background: Math.random() > 0.5 ? '#0f1f3d' : 'transparent' }} />
                ))}
              </div>
            </div>

            {openP.email.trim() ? (
              <>
                <p className="text-xs text-gray-400 mb-4">{openP.email}</p>
                <a href={`mailto:${openP.email}`}
                  className="block w-full py-3 rounded-xl text-white text-sm font-semibold forum-gradient mb-2">
                  Написать
                </a>
              </>
            ) : (
              <p className="text-xs text-gray-400 mb-4 text-center">
                E-mail в файле программы не указан.
              </p>
            )}
            <button onClick={() => setQrOpen(null)} className="text-sm text-gray-400 py-1.5 w-full">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
