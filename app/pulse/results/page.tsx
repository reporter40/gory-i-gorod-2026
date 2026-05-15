'use client'

import Link from 'next/link'
import { useActiveSessionVotes } from '@/lib/pulse/useActiveSessionVotes'

export default function PulseResultsPage() {
  const { activeSessionId, session, tagStats, totalVotes, loading, error } = useActiveSessionVotes()
  const sorted = [...tagStats].sort((a, b) => b.votes - a.votes)

  return (
    <div
      className="min-h-[100dvh] text-white pb-24"
      style={{
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%)',
      }}
    >
      <div className="mx-auto max-w-md px-6 pt-10">
        <Link href="/pulse" className="text-xs text-white/40 hover:text-white/70">
          ← К пульсу
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Итоги голосования</h1>
        <p className="mt-2 text-sm text-white/45">Обновляются в реальном времени по данным зала</p>

        {loading && <div className="mt-10 text-center text-white/45 text-sm">Загрузка…</div>}

        {error && (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !activeSessionId && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/25 px-5 py-8 text-center">
            <div className="text-lg font-bold text-white/85">Пульс скоро начнётся</div>
            <p className="mt-2 text-sm text-white/45">Нет активной сессии — счётчики появятся позже.</p>
          </div>
        )}

        {!loading && !error && activeSessionId && session && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/35">Активная сессия</div>
            <div className="mt-1 font-semibold">{session.title}</div>
            {session.speakerName && (
              <div className="text-sm text-white/55">{session.speakerName}</div>
            )}
          </div>
        )}

        {!loading && !error && activeSessionId && totalVotes === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-center">
            <div className="text-white/70 font-medium">Пока нет голосов</div>
            <p className="mt-2 text-sm text-white/40">
              Станьте первым —{' '}
              <Link href="/pulse/vote" className="text-cyan-400 underline">
                проголосуйте
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && !error && activeSessionId && totalVotes > 0 && (
          <ul className="mt-8 space-y-3">
            {sorted.map((row, i) => (
              <li
                key={row.tagId}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white/35 w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{row.label}</span>
                </div>
                <span className="text-lg font-bold tabular-nums text-cyan-300">{row.votes}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link
            href="/pulse/vote"
            className="block rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-center text-sm font-semibold text-cyan-200"
          >
            Протегировать выступление
          </Link>
        </div>
      </div>
    </div>
  )
}
