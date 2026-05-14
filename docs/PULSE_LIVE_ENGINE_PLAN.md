# PULSE LIVE ENGINE — Plan

## Architecture

```
/pulse/vote → Firebase RTDB → /pulse dashboard
```

## Adapter Pattern

```
PulseAdapter (interface)
  ├── createMockPulseAdapter()    ← deterministic, no Date.now/Math.random
  └── createFirebasePulseAdapter() ← Firebase RTDB listeners
```

## Data Flow

1. `usePulseRealtime` picks adapter based on env vars / URL param
2. Adapter subscribes to Firebase or returns mock
3. Each update passes through `dataValidator` before UI update
4. On error: keep last good PulseState, set `_meta.source = 'snapshot'`
5. On freeze: set `_meta.source = 'frozen'`, stop updates

## Vote Flow

```
frozen? → rate_limited? → localStorage duplicate? → offline? → Firebase transaction → mood push
```

## Reliability Stack

- Error Boundary: panel-level crash isolation
- Tab Keep-Alive: Web Lock + self-ping + auto-reload
- Heartbeat: 30s Firebase write, stale detection
- Data Validator: per-snapshot validation, ignore invalid fields
- State Snapshot: localStorage every 5min, instant load on boot
- Fallback HTML: static page for total failure

## Firebase Schema

See `docs/PULSE_FIREBASE_SCHEMA.md`

## Tasks

- [x] Task 1: Data Contract
- [ ] Task 2: Firebase Schema + Rules
- [ ] Task 3: Firebase Client + Adapter
- [ ] Task 4: Vote Client
- [ ] Task 5: Mobile Vote Page
- [ ] Task 6: Admin Page
- [ ] Task 7: Reliability Layer
- [ ] Task 8: Load Test + Seed
- [ ] Task 9: Rehearsal Script
- [ ] Task 10: Operator Runbook
- [ ] Task 11: Integration Contract
