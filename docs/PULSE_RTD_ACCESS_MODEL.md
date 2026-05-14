# Pulse RTDB — access model (SPRINT-PULSE-04)

## Summary

- **Participants (Firebase Auth, anonymous OK):** read public Pulse data (`event`, `sessions`, `speakers`, `votes`, `mood`). Write **only** `participants/{auth.uid}` (own profile). **No** direct writes to votes, userVotes, mood, event, sessions, or speakers.
- **Votes:** **Strategy A — server-authoritative.** `POST /api/pulse/vote` with `Authorization: Bearer <Firebase ID token>`. Server uses **Firebase Admin SDK** to claim `userVotes`, increment `votes`, push `mood`.
- **Operators:** writes to `event/activeSessionId`, `event/frozen`, `event/mode` via `POST /api/pulse/operator` with header `x-pulse-operator-key: <PULSE_OPERATOR_SECRET>` (length ≥ 16 on server). Telegram bot uses Admin SDK (`rtdbRead` / `rtdbWrite`) — requires `FIREBASE_SERVICE_ACCOUNT_JSON`.
- **Program seed:** `POST /api/seed-sessions` uses Admin SDK (`sessions` tree).

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Vercel | Client Firebase app (auth + RTDB reads). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel (server) | Service account JSON string for Admin SDK (vote API, operator API, Telegram, seed). |
| `FIREBASE_DATABASE_URL` | Vercel (server) | Optional; defaults to `NEXT_PUBLIC_FIREBASE_DATABASE_URL` in Admin init if unset. |
| `PULSE_OPERATOR_SECRET` | Vercel (server) | Shared secret for `/api/pulse/operator` (and manual operator UI on `/pulse/admin`). |

## Rules deployment

Update JSON in Firebase Console from `lib/pulse/firebase/rules.json` after each rules change.

## Emulator / manual checks (recommended)

With Firebase emulator or staging project, verify:

1. Unauthenticated client cannot write `participants/*` (needs auth).
2. Authenticated participant cannot write `event/activeSessionId`, `sessions`, `speakers`, `votes`, `userVotes`, `mood`.
3. Participant cannot write another user’s `participants/{uid}` or `userVotes/.../{otherUid}/...`.
4. Participant can write own `participants/{uid}` with required fields (`name`, `consent`, `ts`).
5. Valid vote only through `POST /api/pulse/vote` (canonical tag IDs: `implement`, `discovery`, `partner`, `question`, `applicable`).

Vitest rule **structure** tests live in `tests/pulse/firebase-rules.test.ts`; they do not replace emulator runs.

## Production smoke (manual)

After deploy: note **git commit hash**, **Vercel URL**, confirm env vars; set `activeSessionId` via Telegram or `/api/pulse/operator`; register participant; vote once; confirm dashboard Audience Reactions +1 and heatmap updates; confirm `_meta.source === "live"` and `_meta.heatmapSource === "votes"` where applicable; confirm no `PERMISSION_DENIED` on legal paths.
