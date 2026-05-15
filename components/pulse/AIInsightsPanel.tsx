'use client'

import type { PulseAIInsight } from '@/lib/pulse/pulse-data'

export default function AIInsightsPanel({ insights }: { insights: PulseAIInsight[] }) {
  return (
    <section className="pulse-panel absolute flex flex-col p-3 pb-4" style={{ left: 1326, top: 502, width: 334, height: 353 }}>
      <div className="mb-2 flex items-center justify-between gap-2 relative z-10">
        <h2 className="pulse-panel-title text-white/90">
          AI-Инсайты
          <span className="ml-2 align-top text-[10px] text-cyan-500/55">◇</span>
        </h2>
      </div>
      <ul className="no-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {insights.slice(0, 4).map((insight, idx) => (
          <li
            key={`${idx}-${insight.icon}`}
            className="rounded-[11px] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex gap-2">
              <span className="text-[16px]" aria-hidden>
                {insight.icon}
              </span>
              <p className="text-[11.5px] leading-snug text-white/78">{insight.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 w-full rounded-[11px] border border-white/14 bg-white/[0.04] py-2 text-[12px] font-medium text-white/88"
      >
        Все инсайты
      </button>
    </section>
  )
}
