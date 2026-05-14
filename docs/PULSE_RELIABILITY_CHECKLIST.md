# PULSE Reliability Checklist

## Error Boundary (`lib/pulse/reliability/errorBoundary.tsx`)
- [x] `<PulseErrorBoundary panelName="X">` wraps each panel
- [x] Crashed panel shows `—` not red screen
- [x] Logs error with timestamp to `console.error`
- [x] Other panels continue working

## Tab Keep-Alive (`lib/pulse/reliability/tabKeepAlive.ts`)
- [x] Web Locks API (`navigator.locks.request`) prevents tab freeze
- [x] 30s self-ping detects if execution froze
- [x] Auto-reload if no ping for 60s
- [x] 1×1 muted video element as anti-sleep fallback

## Heartbeat (`lib/pulse/reliability/heartbeat.ts`)
- [x] Writes to `heartbeat/{dashboardId}/lastSeen` every 30s
- [x] `parseHeartbeatStatus()` returns green/yellow/red label
- [x] Admin page shows heartbeat age
- [x] Green: <15s, Yellow: 15–90s, Red: >90s

## Data Validator (`lib/pulse/reliability/dataValidator.ts`)
- [x] Validates every snapshot before UI update
- [x] Clamps votes: 0 ≤ n ≤ 100,000 (integer)
- [x] Clamps percentages: 0 ≤ n ≤ 100
- [x] Removes sessions with empty id
- [x] Handles NaN/undefined/negative values
- [x] Never throws — dashboard never crashes from bad data

## State Snapshot (`lib/pulse/reliability/stateSnapshot.ts`)
- [x] Saves to `localStorage['pulse_last_good_state']` every 5 min
- [x] `loadSnapshot()` returns null if >30 min old
- [x] `usePulseRealtime` shows snapshot on first render (instant load)
- [x] Replaced with live data when Firebase responds
- [x] `_meta.source = 'snapshot'` when showing cached data

## Emergency Freeze (`lib/pulse/reliability/emergencyFreeze.ts`)
- [x] Listens to `event/frozen` in Firebase
- [x] Notifies all subscribers synchronously
- [x] `voteForTag` checks freeze before transacting
- [x] Firebase adapter sets `_meta.source = 'frozen'` when frozen

## Fallback HTML (`public/pulse-fallback.html`)
- [x] Zero JS dependencies — pure HTML + inline CSS
- [x] Shows frozen stats from last known state
- [x] Works without internet connection (file:// or CDN)
- [x] Shows frozen banner

## Health Endpoint (`app/pulse/health/route.ts`)
- [x] `GET /pulse/health` returns JSON
- [x] Fields: `status`, `firebase`, `lastVoteReceived`, `activeSession`, `frozen`, `dashboardHeartbeat`, `uptime`
- [x] Status: `ok` | `degraded` | `down`
- [x] Works without Firebase config (returns `unconfigured`)
