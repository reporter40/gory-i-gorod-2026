# Pulse RTDB — access model (SPRINT-PULSE-04)

## Summary

- **Participants (Firebase Auth, anonymous OK):** read public Pulse data (`event`, `sessions`, `speakers`, `votes`, `mood`). Write **only** `participants/{auth.uid}` (own profile). **No** direct writes to votes, userVotes, mood, event, sessions, or speakers.
- **Votes:** **Strategy A — server-authoritative.** `POST /api/pulse/vote` with `Authorization: Bearer <Firebase ID token>`. Server uses **Firebase Admin SDK** to claim `userVotes`, increment `votes`, push `mood`.
- **Operators:** writes to `event/activeSessionId`, `event/frozen`, `event/mode` via `POST /api/pulse/operator` with header `x-pulse-operator-key: <PULSE_OPERATOR_SECRET>` (length ≥ 16 on server). Telegram bot uses Admin SDK (`rtdbRead` / `rtdbWrite`) — requires `FIREBASE_SERVICE_ACCOUNT_JSON`.
- **Program seed:** `POST /api/seed-sessions` uses Admin SDK (`sessions` tree).
- **Participant vs monitor:** участники заходят на **`/pulse`**; экран зала / проектор — **`/pulse/live`** (стабильный URL дашборда).

## Environment variables

### Vercel — required for Pulse (checklist)

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase Web SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Auth host |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Client (+ server fallback) | RTDB URL; Admin uses `FIREBASE_DATABASE_URL` if set, else this |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Project id (`hasFirebaseConfig` / init) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | App id (set in Firebase Console → Project settings → Your apps; needed if you enable Analytics / some SDK features; safe to set for parity with Console) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server | Single-line JSON string of service account — Admin SDK for `/api/pulse/vote`, `/api/pulse/operator`, Telegram, `seed-sessions` |
| `FIREBASE_DATABASE_URL` | Server | Optional explicit RTDB URL for Admin (otherwise `NEXT_PUBLIC_FIREBASE_DATABASE_URL`) |
| `PULSE_OPERATOR_SECRET` | Server | Shared secret for `/api/pulse/operator`; must be **≥ 16 characters** where enforced |

### Telegram (optional)

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot API |
| `TELEGRAM_ADMIN_CHAT_ID` | Allowed chat id |

## Deployment Order

1. Set **all** Vercel env vars from the table above (Production + Preview if needed).
2. Deploy **`master`** at or after commit **`60d5afc`** (`fix(pulse): separate participant flow from live dashboard`).
3. In Firebase Console → Realtime Database → **Rules**, publish contents of `lib/pulse/firebase/rules.json`.
4. Verify `POST /api/pulse/vote` returns **not** `503` when `FIREBASE_SERVICE_ACCOUNT_JSON` is set (e.g. missing body still yields `400`, not missing-config `503`).
5. Verify `POST /api/pulse/operator` **without** `x-pulse-operator-key` returns **401** (`unauthorized`).
6. Set `event/activeSessionId` via operator API (or Telegram `/session`, `/sync`, etc.).
7. Run **production smoke** per **Production smoke (manual)** below (participant routes `/pulse`, `/pulse/vote`, `/pulse/results`, monitor `/pulse/live`, security gate).

## Operator — manual `curl` recipes

Replace placeholders:

- `BASE` — production origin, e.g. `https://YOUR_PROJECT.vercel.app`
- `OPERATOR_SECRET` — same value as `PULSE_OPERATOR_SECRET` on Vercel (do not commit real values)
- `ID_TOKEN` — Firebase Auth ID token (e.g. from anonymous sign-in in browser devtools)
- `RTDB` — `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (e.g. `https://YOUR_PROJECT.firebaseio.com`)
- `AUTH_TOKEN` — any valid Firebase **user** ID token for REST (not Admin)

### 1. Operator API without secret → must reject

Expect **401** JSON `{ "ok": false, "error": "unauthorized" }`:

```bash
curl -sS -X POST "$BASE/api/pulse/operator" \
  -H "Content-Type: application/json" \
  -d '{"activeSessionId":"session-1"}'
```

### 2. Set active session (with secret)

```bash
curl -sS -X POST "$BASE/api/pulse/operator" \
  -H "Content-Type: application/json" \
  -H "x-pulse-operator-key: OPERATOR_SECRET" \
  -d '{"activeSessionId":"session-1"}'
```

### 3. Set frozen = false (and optional mode)

```bash
curl -sS -X POST "$BASE/api/pulse/operator" \
  -H "Content-Type: application/json" \
  -H "x-pulse-operator-key: OPERATOR_SECRET" \
  -d '{"frozen":false,"mode":"live"}'
```

### 4. Vote API without Authorization → must reject

Expect **401**:

```bash
curl -sS -X POST "$BASE/api/pulse/vote" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session-1","tagId":"implement"}'
```

### 5. Direct client RTDB write to `event/*` — must be denied by rules

With a normal **client** ID token (not Admin REST), writing `event/activeSessionId` must fail. Example (Firebase REST):

```bash
curl -sS -X PUT "$RTDB/event/activeSessionId.json?auth=AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '"session-999"'
```

Expect HTTP **401** or **403** / permission denied from Firebase (exact shape depends on REST version); **must not** succeed while rules match `lib/pulse/firebase/rules.json`.

Authenticated vote still goes only through:

```bash
curl -sS -X POST "$BASE/api/pulse/vote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ID_TOKEN" \
  -d '{"sessionId":"session-1","tagId":"implement"}'
```

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

### Release target

- **Required git commit:** **`60d5afc` or newer** on deployed **`master`** (verify Vercel deployment revision / `git rev-parse HEAD` on the release artifact).

After deploy, record **git commit hash**, **production URL** (Vercel), and confirm env vars; set `event/activeSessionId` via Telegram or `POST /api/pulse/operator` before exercising participant flows.

### 1. `/pulse` (participant landing)

- Opens **participant landing** (not the conference dashboard).
- Shows **active session** card when `event/activeSessionId` is set (theme + speaker when present), or **empty state** («Пульс скоро начнётся») when there is no active session.
- Visible CTA **«Протегировать выступление»** → `/pulse/vote`.
- Visible CTA **«Смотреть итоги»** → `/pulse/results`.

### 2. `/pulse/vote`

- Header shows **theme / speaker / time / hall** when session data is available from RTDB.
- **Registration** completes successfully.
- Vote **`implement`** is sent **only** via **`POST /api/pulse/vote`** (Strategy A — no direct client writes to `votes` / `userVotes` / `mood`).
- After a **successful** vote, CTA **«Смотреть итоги»** → `/pulse/results` is visible.

### 3. `/pulse/results`

- Shows **live** aggregates from **`votes/{activeSessionId}/{tagId}`** for canonical tag IDs (`implement`, `discovery`, `partner`, `question`, `applicable`).
- **Must not** treat dashboard mocks as the primary source when Firebase is configured — compare counts with RTDB (Firebase Console or Admin read) for the same `activeSessionId`.

### 4. `/pulse/live` (conference AI Pulse dashboard)

- Renders the **AI Pulse dashboard** for the hall monitor / projector.
- After the same vote as in §2: **Audience Reactions** updates (e.g. +1 on the chosen reaction).
- **Heatmap** updates after that same vote.
- Client/live adapter state: **`_meta.source === "live"`** and **`_meta.heatmapSource === "votes"`** where applicable (devtools / debug trace per release).

### 5. Security gate (unchanged)

- Firebase **rules** from `lib/pulse/firebase/rules.json` are **published** in Console.
- **`POST /api/pulse/operator`** without `x-pulse-operator-key` → **401** / **403** (as deployed).
- **`POST /api/pulse/vote`** without **`Authorization: Bearer …`** → **401**.
- **Illegal** client writes under **`event/*`** are **denied** (`PERMISSION_DENIED`).
- **No** direct client writes to **`votes`**, **`userVotes`**, or **`mood`** as product behavior (votes only through **`POST /api/pulse/vote`**).

### Operator evidence → Sprint Report outcome

When operators send evidence:

| Evidence | Sprint Report |
|----------|----------------|
| All checks **PASSED** | **SPRINT-PULSE-04 + hotfix — final GO** |
| Any check **FAILED** | **SPRINT-PULSE-04-hotfix-failed — \<blocker\>** (name the failing step) |
| **NOT RUN** / **BLOCKED** | **Pending evidence** (do not claim GO) |

Do **not** start **SPRINT-PULSE-05** until there is a **full GO** with completed smoke evidence.

## Git / Cursor note (commit tooling)

If `git commit` fails with `unknown option trailer`, the IDE may be injecting `--trailer Co-authored-by: ...` while **PATH** prefers an old Git (< 2.22). Use **`/usr/bin/git`** (Apple Command Line Tools) or upgrade `/usr/local/bin/git`, or commit from a terminal outside Cursor injection.
