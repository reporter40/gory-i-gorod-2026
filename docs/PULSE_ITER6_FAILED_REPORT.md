# PULSE — Iteration 6 FAILED

**Дата:** 2026-05-13.

## 1. Статус

**Iteration 6 — FAILED.** Изменения не приняты; код и артефакты откатаны к **Iteration 5** baseline.

## 2. Почему

1. **Layout regression** — визуальная композиция dashboard перестала соответствовать принятому Phase 1 контракту.
2. **Глобальные слои фона** (full-screen stage layers, усиленная атмосфера) **перекрыли / размыли иерархию** основного UI.
3. **Атмосферные слои доминировали над интерфейсом** — фон стал главнее панелей и контента.
4. **Нижняя зона** — top-tags, voting, heatmap, insights **потеряли нормальную сцену** (визуально «исчезли» / уехали относительно ожидаемого baseline).
5. Снимок **`docs/PULSE_FINAL_CANDIDATE_ITER6.png`** (ветка с иным пайплайном рендера) **не является** допустимым продолжением Phase 1.

## 3. Последний принятый рабочий кандидат

**`docs/PULSE_FINAL_CANDIDATE_ITER5.png`** — последний **рабочий** visual baseline по композиции и блокам dashboard.

После отката фактический checkpoint выровнен с ним: **`docs/PULSE_RESTORED_TO_ITER5.png`** (тот же SHA256, что и `PULSE_FINAL_CANDIDATE_ITER5.png`).

## 4. Новое правило (обязательно)

**Нельзя менять full-screen visual-слои stage без layout lock.**

Имеется в виду: любые глобальные фоны, z-index, новые full-screen SVG/градиенты под/над `.pulse-stage` — только с **немедленной** проверкой скриншота всего dashboard и откатом при малейшем сдвиге композиции.

## 5. Phase 1 — статус после отката

**Reverted to Iteration 5 baseline.** Дальнейшая работа — только **micro-premium** внутри bounds компонентов (см. отдельную стратегию Iteration 7 в задаче), без глобальных atmosphere pass.

## 6. Инфра отката

- Код визуала и документов Pulse, затронутых Iteration 6: восстановлен из git commit **`c609e27`** (состояние репозитория на момент последнего зафиксированного pulse-пакета).
- **`next.config.ts`**: возвращён минимальный вариант (как до добавления `turbopack.root`), из **`e958240`**.
- **`docs/PULSE_FINAL_CANDIDATE_ITER6.png`**: удалён как недействительный артефакт failed-итерации.

## 7. Playwright после отката (только CI / стабильность)

В **`playwright.config.ts`** команда webServer заменена на **`next dev --webpack -p 3320`** (тот же порт **3320**, что и в baseline). Это **не** меняет Pulse UI; нужно, чтобы `npm run test:visual` не падал с **EMFILE** на Turbopack `next dev` в ограниченных окружениях.
