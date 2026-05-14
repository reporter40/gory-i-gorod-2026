'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  panelName: string
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PulseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const ts = new Date().toISOString()
    console.error(`[PulseErrorBoundary:${this.props.panelName}] ${ts}`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: '#475569',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
          aria-label={`${this.props.panelName} unavailable`}
        >
          —
        </div>
      )
    }
    return this.props.children
  }
}
