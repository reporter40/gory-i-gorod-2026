# Runbook оператора AI-Пульс

## Контакты

- **Разработчик:** [ФИО] / [телефон] / [telegram]
- **Wi-Fi техник зала:** [ФИО] / [телефон]
- **Резервный ноутбук:** у организаторов

---

## Release target (код)

```text
Code release minimum: 60d5afc
Manual checklist version: 3dc63e7
Recommended deploy target: 3dc63e7 or newer
```

- **Минимальный коммит на проде:** **`60d5afc`** или новее (`master`); рекомендуется деплой **`3dc63e7`** или новее, чтобы версия чеклиста в репозитории совпадала с документом **Manual checklist version**.
- **Production smoke** (маршруты `/pulse`, `/pulse/vote`, `/pulse/results`, `/pulse/live`, security gate) и правила эвиденса для Sprint Report — в **`docs/PULSE_RTD_ACCESS_MODEL.md`** → раздел **Production smoke (manual)**.
- **SPRINT-PULSE-05** не начинать до **полного GO** по этому smoke.

---

## За день до форума — Репетиция

```bash
npx tsx scripts/pulse-rehearsal.ts
```

Должно напечатать: `REHEARSAL RESULT: ALL CHECKS PASSED`

Если что-то не прошло — звонить разработчику.

---

## Перед форумом (за 1 час)

1. Открыть **`/pulse/live`** на экране проектора в Chrome, полный экран (`F11`) — стабильный URL монитора (лендинг участника остаётся на `/pulse`).
2. Открыть `/pulse/admin` на своём ноутбуке
3. Проверить: **зелёная точка "Connected"** в admin
4. Проверить: **heartbeat dashboard < 5 сек** (зелёный)
5. Открыть `/pulse/health` в отдельном табе — должен быть `"status": "ok"`
6. На телефоне открыть **`/pulse`** — лендинг участника; проверить блок активной сессии или empty state и оба CTA (**«Протегировать выступление»**, **«Смотреть итоги»**).
7. Пройти **`/pulse/vote`** → регистрация → тестовый голос **`implement`**; убедиться, что после успеха есть CTA **«Смотреть итоги»**; проверить **`/pulse/results`** и что монитор **`/pulse/live`** обновил реакции и heatmap (полный чеклист — в `docs/PULSE_RTD_ACCESS_MODEL.md`).
8. Убедиться что QR-код ведёт на **`/pulse/vote`** (или на **`/pulse`**, если так задумано сценарием).

---

## Во время форума

### Смена сессии

1. В `/pulse/admin` → найти нужную сессию
2. Нажать **"Сделать LIVE"**
3. Убедиться что сессия стала активной (подсветилась)

### Мониторинг

- Heartbeat dashboard: **должен быть зелёным** (<15 сек)
- Если heartbeat **жёлтый** > 1 мин → обновить страницу dashboard (`F5`)
- Если heartbeat **красный** > 2 мин → переоткрыть **`/pulse/live`** в новом табе

---

## Если что-то сломалось

### Шаг 1 — НЕ паниковать

Числа на экране **застыли** — это нормально, зрители видят данные.

### Шаг 2 — Попробовать лёгкие решения

```
1. F5 на странице `/pulse/live`
2. Открыть `/pulse/live` в инкогнито-окне
3. Перезагрузить вкладку admin
```

### Шаг 3 — Emergency Freeze (если что-то мигает/глючит)

1. В `/pulse/admin` → нажать кнопку **"🚨 EMERGENCY FREEZE"**
2. В диалоге нажать **"Заморозить"**
3. Dashboard зафиксирует текущие числа. **Выглядит рабочим.**
4. Аудитория ничего не заметит.

### Шаг 4 — Если `/pulse/live` совсем не загружается

1. Открыть файл `pulse-fallback.html` в браузере
2. Статичная версия дашборда — работает без интернета
3. Переключить проектор на это окно

### Шаг 5 — Звонить разработчику

---

## Проверка статуса

```
GET /pulse/health
```

Ответ:
```json
{
  "status": "ok",
  "firebase": "connected",
  "activeSession": "session-1",
  "frozen": false,
  "dashboardHeartbeat": "2026-06-15T14:23:15Z",
  "uptime": 14523
}
```

| `status` | Значение |
|----------|----------|
| `ok` | Всё работает |
| `degraded` | Частичная проблема |
| `down` | Критическая проблема |

---

## Команды для разработчика

```bash
# Сидирование данных
npx tsx scripts/pulse-seed-firebase.ts

# Репетиция (12 проверок)
npx tsx scripts/pulse-rehearsal.ts

# Нагрузочный тест (500 users, 30 min)
npx tsx scripts/pulse-load-test.ts --users 500 --duration 1800 --interval 30

# Резервный снимок HTML из Firebase
npx tsx scripts/pulse-backup-snapshot.ts
```

---

## Firebase Console

URL: `https://console.firebase.google.com/project/{PROJECT_ID}/database`

Для ручной правки данных (только в крайнем случае):
- `event/activeSessionId` — сменить активную сессию
- `event/frozen` — разморозить вручную (set `false`)
