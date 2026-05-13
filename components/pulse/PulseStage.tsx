import type { ReactNode } from 'react'

export default function PulseStage({ visualTest, children }: { visualTest: boolean; children: ReactNode }) {
  return (
    <div
      className="pulse-stage"
      data-visual-test={visualTest ? '1' : '0'}
    >
      <div className="pulse-mountain-footer" aria-hidden />
      {children}
    </div>
  )
}
