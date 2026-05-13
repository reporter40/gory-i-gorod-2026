import type { ReactNode } from 'react'

export default function PulseStage({ visualTest, children }: { visualTest: boolean; children: ReactNode }) {
  return (
    <div
      className="pulse-stage"
      data-visual-test={visualTest ? '1' : '0'}
    >
      <div className="pulse-stage-bg" aria-hidden />
      <div className="pulse-stage-silhouette" aria-hidden />
      <div className="pulse-stage-panorama" aria-hidden />
      <div className="pulse-stage-boreal" aria-hidden />
      <div className="pulse-stage-horizon" aria-hidden />
      <div className="pulse-stage-haze" aria-hidden />
      <div className="pulse-stage-noise" aria-hidden />
      <div className="pulse-stage-vignette" aria-hidden />
      <div className="pulse-mountain-footer" aria-hidden />
      {children}
    </div>
  )
}
