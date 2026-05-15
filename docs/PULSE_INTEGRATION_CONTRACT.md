# Integration Contract — Live Engine ↔ Visual Dashboard

## Overview

This document describes how to connect the `feature/pulse-live-engine` branch
to the visual dashboard from `feature/pulse-visual`.

---

## Шаг 1 — Merge

```bash
git checkout main
git merge feature/pulse-visual      # merge visual first
git merge feature/pulse-live-engine # then live engine
```

Conflicts are unlikely — branches touch different files.

---

## Шаг 2 — Подключить hook в PulseStage / PulseDashboard

В `components/pulse/PulseDashboard.tsx` (visual branch):

**БЫЛО:**
```ts
const data = mockPulseState
// или
const data = defaultPulseMock()
```

**СТАЛО:**
```ts
import { usePulseRealtime } from '@/lib/pulse/usePulseRealtime'
const data = usePulseRealtime()
```

`usePulseRealtime()` returns `PulseState` (new type from `lib/pulse/types.ts`).

> Note: `PulseState` and `MockPulseState` have the same field names for all
> visual fields. The new type adds `connection` and `_meta`. Components
> that type-check against `MockPulseState` may need a cast or type update.

---

## Шаг 3 — Обернуть панели в Error Boundary

```tsx
import { PulseErrorBoundary } from '@/lib/pulse/reliability/errorBoundary'

<PulseErrorBoundary panelName="TopTags">
  <TopTagsPanel data={data} />
</PulseErrorBoundary>
```

Apply to each panel. Crashed panel shows `—`, others keep working.

---

## Шаг 4 — Connection status indicator

В `PulseHeader` или `PulseFooterTicker`:

```tsx
import { useConnectionStatus } from '@/lib/pulse/useConnectionStatus'

const connection = useConnectionStatus()
if (connection.status !== 'connected') {
  // show yellow/red dot
}
```

---

## Шаг 5 — Stale data indicator

```tsx
if (data._meta.staleSince) {
  const mins = Math.floor((Date.now() - data._meta.staleSince) / 60000)
  // show "обновлено N мин назад"
}
```

---

## Шаг 6 — Freeze banner

```tsx
if (data._meta.source === 'frozen') {
  // show "Данные зафиксированы" banner
}
```

---

## Шаг 7 — Tab Keep-Alive (на странице проектора)

В `app/pulse/page.tsx`:

```ts
import { useEffect } from 'react'
import { startTabKeepAlive, deactivateTabKeepAlive } from '@/lib/pulse/reliability/tabKeepAlive'

useEffect(() => {
  const stop = startTabKeepAlive()
  return () => stop()
}, [])
```

---

## Шаг 8 — Heartbeat (опционально)

В `app/pulse/page.tsx`:

```ts
import { startHeartbeat } from '@/lib/pulse/reliability/heartbeat'

useEffect(() => {
  const stop = startHeartbeat('main')
  return () => stop()
}, [])
```

---

## Шаг 9 — State Snapshot (мгновенная загрузка)

В `app/pulse/page.tsx`:

```ts
import { startSnapshotSaver } from '@/lib/pulse/reliability/stateSnapshot'

useEffect(() => {
  const stop = startSnapshotSaver(() => currentState)
  return () => stop()
}, [currentState])
```

`usePulseRealtime()` already reads the snapshot on first render automatically.

---

## Шаг 10 — Запустить тесты

```bash
npm run build          # must pass
npm run test           # 42+ unit tests must pass
npm run test:visual    # Playwright snapshots must pass
```

Visual tests use `?visualTest=1` → mock adapter → deterministic output.

---

## Smoke Test

```text
Code release minimum: 60d5afc
Manual checklist version: 3dc63e7
Recommended deploy target: 3dc63e7 or newer
```

Deploy **`master`** accordingly (**recommended deploy target** includes checklist/docs alignment). Full operator checklist (participant flows + monitor + security gate + evidence rules) — **`docs/PULSE_RTD_ACCESS_MODEL.md`** → **Production smoke (manual)**.

1. **`/pulse`** → participant landing (not dashboard); active session or empty state; CTAs **«Протегировать выступление»** and **«Смотреть итоги»**.
2. **`/pulse/live`** without `?visualTest` → live AI Pulse dashboard for monitor (or mock if no Firebase).
3. **`/pulse/live?visualTest=1`** → mock data; Playwright snapshot matches.
4. **`/pulse/vote`** → registration → vote **`implement`** via **`POST /api/pulse/vote`** → **`/pulse/live`** Audience Reactions + heatmap update within ~2s; **`_meta.source === "live"`**, **`_meta.heatmapSource === "votes"`** where applicable.
5. **`/pulse/results`** → live counts from **`votes/{activeSessionId}`**; cross-check RTDB when Firebase is configured.
6. In **`/pulse/admin`** → freeze → dashboard shows "Данные зафиксированы"; unfreeze → live updates resume.
7. Kill network → **`/pulse/vote`** offline toast, queues vote; restore network → queued vote sent.

---

## Что НЕ менять при интеграции

- Styles of panels (CSS, Tailwind classes)
- Component positioning / layout
- Colors and dimensions
- Playwright snapshot baselines (`tests/pulse.visual.spec.ts-snapshots/`)
- Any file under `components/pulse/`, `styles/pulse.*`, `public/pulse/*`

## Env Vars Required

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_PULSE_ADMIN_ENABLED=true
```
