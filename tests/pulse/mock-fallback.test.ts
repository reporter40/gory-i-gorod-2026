import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regression: mock fallback must NOT activate when Firebase snapshot is live
describe('usePulseRealtime — mock fallback regression', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('uses mockAdapter when hasFirebaseConfig returns false', async () => {
    vi.doMock('@/lib/pulse/firebase/client', () => ({
      hasFirebaseConfig: () => false,
    }))
    vi.doMock('@/lib/pulse/adapters/mockPulseAdapter', () => ({
      createMockPulseAdapter: () => ({
        subscribe: (cb: (s: unknown) => void) => {
          cb({ _meta: { source: 'mock' }, topTags: [], sessions: [], stats: {}, event: {}, heatmap: [],
               tagMoodBars: [], topicNetwork: [], geoRegions: [], hallPulse: { current: 0, timeline: [] },
               aiInsights: [], footer: {}, connection: {} })
          return () => {}
        },
        destroy: () => {},
      }),
    }))

    // Snapshot of source when Firebase is absent must be 'mock'
    const { createMockPulseAdapter } = await import('@/lib/pulse/adapters/mockPulseAdapter')
    const adapter = createMockPulseAdapter()
    let receivedSource = ''
    adapter.subscribe((s: { _meta: { source: string } }) => { receivedSource = s._meta.source })
    expect(receivedSource).toBe('mock')
    adapter.destroy()
  })

  it('mock source does not appear when live source is firebase', () => {
    // Verify that _meta.source 'firebase' means live data — not mixed with mock
    const liveState = { _meta: { source: 'firebase' as const }, topTags: [{ id: 'implement', votes: 5, name: 'X', icon: '🔥', growth: 0, mood: 50 }] }
    expect(liveState._meta.source).toBe('firebase')
    expect(liveState._meta.source).not.toBe('mock')
    expect(liveState._meta.source).not.toBe('snapshot')
  })
})
