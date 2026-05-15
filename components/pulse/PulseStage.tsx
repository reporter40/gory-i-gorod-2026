'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const STAGE_W = 1672
const STAGE_H = 941

function useStageScale() {
  useEffect(() => {
    function update() {
      const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
      document.documentElement.style.setProperty('--pulse-stage-scale', String(scale))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
}

export type PulseBgMode = 'normal' | 'bg-only' | 'ui-only' | 'final'

/**
 * Stage = one raster (`pulse-bg-atmosphere-approved-v1.png`) + flat safety tint + content.
 * Debug: `?visualTest=1&bgMode=bg-only` | `&bgMode=ui-only` | `&bgMode=final` (final = same stack as normal; for capture parity).
 */
export default function PulseStage({
  visualTest,
  bgDebug: _legacyBgDebug,
  children,
}: {
  visualTest: boolean
  /** @deprecated Ignored — use URL `bgMode` */
  bgDebug?: boolean
  children: ReactNode
}) {
  useStageScale()
  const params = useSearchParams()
  const vt = visualTest || params.get('visualTest') === '1'
  const raw = params.get('bgMode')
  let bgMode: PulseBgMode = 'normal'
  if (raw === 'bg-only' || raw === 'ui-only' || raw === 'final') {
    bgMode = raw
  } else if (vt && params.get('bgDebug') === '1') {
    bgMode = 'bg-only'
  }

  return (
    <div className="pulse-stage" data-visual-test={vt ? '1' : '0'} data-bg-mode={bgMode}>
      {bgMode !== 'ui-only' && (
        <>
          <div className="pulse-background-image" aria-hidden />
          <div className="pulse-background-safety-overlay" aria-hidden />
        </>
      )}
      <div className="pulse-stage-content">{children}</div>
      <img
        src="/pulse/logo-ii.svg"
        alt="ИИ Интеграция"
        className="pointer-events-none absolute"
        style={{ right: 16, bottom: 12, width: 180, opacity: 0.7, zIndex: 20 }}
      />
    </div>
  )
}
