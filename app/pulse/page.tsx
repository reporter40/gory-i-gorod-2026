'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useActiveSessionVotes } from '@/lib/pulse/useActiveSessionVotes'

function PulseLandingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeSessionId, session, frozen, eventMode, loading, error } = useActiveSessionVotes()

  useEffect(() => {
    if (searchParams.get('display') === '1') {
      router.replace('/pulse/live')
    }
  }, [router, searchParams])

  const modeLabel =
    eventMode === 'vote' ? 'Режим голосования (QR на экране зала)' :
    eventMode === 'freeze' ? 'Данные зафиксированы' :
    'Прямой эфир'

  return (
    <div
      className="min-h-[100dvh] text-white"
      style={{
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%)',
      }}
    >
      <div className="mx-auto max-w-md px-6 pb-28 pt-10">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
          AI‑Пульс
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Горы и Город — 2026</h1>
        <p className="mt-2 text-sm text-white/40">
          Реакции аудитории в реальном времени
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
          <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Статус зала</div>
          <div className="font-semibold text-cyan-300">{modeLabel}</div>
          {frozen && (
            <div className="mt-1 text-xs text-amber-300/90">Голосование может быть приостановлено</div>
          )}
        </div>

        {loading && (
          <div className="mt-10 text-center text-white/45 text-sm">Загрузка…</div>
        )}

        {error && (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !activeSessionId && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-center">
            <div className="text-4xl mb-3">◎</div>
            <div className="text-lg font-bold text-white/90">Пульс скоро начнётся</div>
            <p className="mt-2 text-sm text-white/45">
              Активная сессия появится, когда организатор включит программу.
            </p>
          </div>
        )}

        {!loading && !error && activeSessionId && session && (
          <div className="mt-8 rounded-2xl border border-cyan-500/25 bg-cyan-950/20 px-5 py-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
              Сейчас в зале
            </div>
            <h2 className="mt-2 text-xl font-bold leading-snug">{session.title || 'Сессия'}</h2>
            {session.speakerName && (
              <p className="mt-2 text-sm text-white/70">{session.speakerName}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
              {session.timeLabel && <span>{session.timeLabel}</span>}
              {session.hall && <span>{session.hall}</span>}
            </div>
          </div>
        )}

        {!loading && !error && activeSessionId && !session && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
            Сессия <code className="text-cyan-300/90">{activeSessionId}</code> — данные программы загружаются.
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/pulse/vote"
            className="block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-center text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
          >
            Протегировать выступление
          </Link>
          <Link
            href="/pulse/results"
            className="block rounded-xl border border-white/15 bg-white/[0.06] px-5 py-4 text-center text-sm font-semibold text-white/90"
          >
            Смотреть итоги
          </Link>
          <p className="text-center text-[11px] text-white/30">
            Экран зала для организаторов:{' '}
            <Link href="/pulse/live" className="underline text-white/45 hover:text-white/70">
              /pulse/live
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PulseLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#050b18] text-white flex items-center justify-center text-sm text-white/45">
          Загрузка…
        </div>
      }
    >
      <PulseLandingInner />
    </Suspense>
  )
}
