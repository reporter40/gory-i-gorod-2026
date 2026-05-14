# PULSE Firebase Schema

## Database Structure

```
votes/
  {sessionId}/
    {tagId}: number              ← atomic counter, transaction only

userVotes/
  {sessionId}/
    {userId}/
      {tagId}: true              ← write-once dedupe marker

mood/
  {pushId}:
    tagId: string
    sessionId: string
    userId: string
    ts: number                   ← serverTimestamp

sessions/
  {sessionId}:
    title: string
    speakerId: string
    hall: string
    start: number
    end: number
    status: "upcoming" | "live" | "ended"

speakers/
  {speakerId}:
    name: string
    role: string
    avatar: string

event/
  activeSessionId: string
  expectedAudience: number
  updatedAt: number
  frozen: boolean               ← emergency freeze flag

heartbeat/
  {dashboardId}/
    lastSeen: number            ← serverTimestamp
```

## Security Rules

Key rules (see `lib/pulse/firebase/rules.json` for full spec):

| Path | Read | Write | Notes |
|------|------|-------|-------|
| `votes/*/*` | public | auth only | Validates 0–100000 integer |
| `userVotes/$s/$uid/$tag` | auth+owner | auth+owner+!exists | Write-once dedupe |
| `mood/*` | public | auth only | Requires 4 fields |
| `sessions` | public | disabled | Admin-managed |
| `speakers` | public | disabled | Admin-managed |
| `event/*` | public | disabled | Admin-managed via SDK |
| `heartbeat/*` | public | auth only | Dashboard liveness |

## Vote Deduplication

Triple-layer protection:
1. **localStorage** — checked before any network call
2. **Rate Limiter** — max 1 vote/2s, max 30/min per userId
3. **Firebase Rules** — `userVotes` write blocked if `data.exists()`

## Emergency Freeze

When `event/frozen = true`:
- Dashboard stops updating (`_meta.source = 'frozen'`)
- Vote client returns `{ status: 'frozen' }`
- Offline queue pauses sending
- Admin page shows UNFREEZE button
