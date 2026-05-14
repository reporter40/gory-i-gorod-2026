# PULSE — Phase 1 manual review package

**Дата пакета:** 2026-05-14 (**BG2** — видимый raster под UI; **BG1 не принят**: SHA совпадал с ITER5, фон не читался).  
**Режим:** только **Phase 1** (статический `/pulse`, mock). **Не** Phase 2 / Phase 3.  
**Статус gate:** Phase 1 **пока не закрыт** — ручной visual review по **`docs/PULSE_FINAL_CANDIDATE_ITER5.png`** (layout lock) и по **`docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png`** (single global background: **`pulse-bg-atmosphere-approved-v1.png`**, без legacy stage-слоёв).  
**Iteration 6:** **FAILED** — см. [`docs/PULSE_ITER6_FAILED_REPORT.md`](PULSE_ITER6_FAILED_REPORT.md); восстановление: [`docs/PULSE_RESTORED_TO_ITER5.png`](PULSE_RESTORED_TO_ITER5.png).  
**Запрещено в рамках текущего gate:** Firebase, ECharts, подключение `/pulse/vote` как продуктового потока.

**Background Sovereignty V4 (2026-05-13):** единственный stage URL — `url('/pulse/pulse-bg-atmosphere-approved-v1.png')`; проверка `npm run pulse:bg:verify`. Артефакты: `docs/PULSE_BG_APPROVED_ONLY_V4.png` (`bgMode=bg-only`), `docs/PULSE_UI_NO_BACKGROUND_V4.png` (`bgMode=ui-only`), `docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V4.png` (full UI). Режимы: `/pulse?visualTest=1&bgMode=bg-only` | `&bgMode=ui-only` (legacy `bgDebug=1` → bg-only).

**V6 merge lock (2026-05-13):** `PULSE_BG_APPROVED_ONLY_V5.png` + `PULSE_UI_NO_BACKGROUND_V5.png` — оба **opaque** (Case B); финал = **тот же** production stack (approved asset + coded UI). Артефакты: `docs/PULSE_BG_ONLY_V6.png`, `docs/PULSE_UI_ONLY_V6.png`, `docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V6.png`, `docs/PULSE_LAYERING_DEBUG_V6.png` (вертикальный stack + `scripts/build-pulse-layering-debug-v6.cjs`). Режим `bgMode=final` дублирует normal для явного URL.

**V7 foreground purge:** Hero cinematic/orbits/halo/SVG trails скрыты в **production** (глобально под `.pulse-stage`); артефакты `PULSE_*_V7.png` + `scripts/build-pulse-layering-debug-v7.cjs`.

Этот файл — **единая точка входа** для ручного visual approval. Остальные документы — приложения.

**Главный actual UI после Iteration 5 (источник копии):** `docs/PULSE_CHECKPOINT_actual.png` — снимок `.pulse-stage` с `/pulse?visualTest=1` **без** `overlay=1` (чистый UI, не reference, не diff, не review sheet).

FINAL CANDIDATE PNG (layout baseline):  
`docs/PULSE_FINAL_CANDIDATE_ITER5.png`

**BG1 — не принят** (скриншот идентичен ITER5 по SHA; растр не был виден).

**BG APPROVED V2 (clean stage):**  
[`docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png`](PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png) — UI поверх **единственного** глобального растра + мягкий CSS-overlay (без SVG/gradient stage-слоёв).  
**Debug — сцена без старого фона и без approved:** [`docs/PULSE_BG_CLEAN_STAGE_ONLY.png`](PULSE_BG_CLEAN_STAGE_ONLY.png) — `/pulse?visualTest=1&bgCleanDebug=1`.  
**Debug — только approved PNG:** [`docs/PULSE_BG_APPROVED_ONLY.png`](PULSE_BG_APPROVED_ONLY.png) — `/pulse?visualTest=1&bgApprovedOnly=1` (legacy: `bgDebug=1`).  
**Ассет:** `public/pulse/pulse-bg-atmosphere-approved-v1.png` — **1672×941**; **`pulse-bg-atmosphere.png` не используется** в CSS.

Reference image:  
`public/reference/pulse-target.png`

Review sheet:  
`docs/PULSE_VISUAL_REVIEW_SHEET.png`

Diff:  
`docs/PULSE_CHECKPOINT_diff_vs_reference_scaled.png`

`docs/PULSE_FINAL_CANDIDATE_ITER5.png` — зафиксированный **layout** baseline (Iteration 5). **`docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png`** — текущий checkpoint (clean stage + approved-only raster).

---

## 1. Actual screenshot (чистый UI)

| Что | Путь |
|-----|------|
| **Checkpoint (для diff и review sheet)** | [`docs/PULSE_CHECKPOINT_actual.png`](PULSE_CHECKPOINT_actual.png) |
| **Финальный кандидат (копия для sign-off)** | [`docs/PULSE_FINAL_CANDIDATE_ITER5.png`](PULSE_FINAL_CANDIDATE_ITER5.png) |
| **BG APPROVED V2** | [`docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png`](PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png) |
| **Debug: clean stage (no legacy, no approved)** | [`docs/PULSE_BG_CLEAN_STAGE_ONLY.png`](PULSE_BG_CLEAN_STAGE_ONLY.png) |
| **Debug: approved PNG only** | [`docs/PULSE_BG_APPROVED_ONLY.png`](PULSE_BG_APPROVED_ONLY.png) |
| **BG layer debug (approved v1)** | [`docs/PULSE_BG_LAYER_DEBUG_APPROVED_V1.png`](PULSE_BG_LAYER_DEBUG_APPROVED_V1.png) |
| **BG2** | [`docs/PULSE_FINAL_CANDIDATE_BG2.png`](PULSE_FINAL_CANDIDATE_BG2.png) |
| **BG3 (финальный ассет)** | [`docs/PULSE_FINAL_CANDIDATE_BG3.png`](PULSE_FINAL_CANDIDATE_BG3.png) |
| **BG layer debug (только PNG)** | [`docs/PULSE_BG_LAYER_DEBUG.png`](PULSE_BG_LAYER_DEBUG.png) |
| **Playwright baseline (регрессия)** | `tests/pulse.visual.spec.ts-snapshots/pulse-stage-chromium-darwin.png` |

![PULSE actual — Iteration 5](PULSE_FINAL_CANDIDATE_ITER5.png)

**Как снято:** viewport **1672×941**, `reducedMotion`, URL `/pulse?visualTest=1` (без `overlay`). Область: `.pulse-stage`.

**Обновить артефакты:** `npm run test:visual` / `npm run test:visual:update` → `docs/PULSE_CHECKPOINT_actual.png` + **`docs/PULSE_FINAL_CANDIDATE_BG_APPROVED_V2.png`**; тесты пишут **`docs/PULSE_BG_CLEAN_STAGE_ONLY.png`** и **`docs/PULSE_BG_APPROVED_ONLY.png`** → `node scripts/pulse-ref-diff.cjs` + `npm run docs:pulse-sheet`.

---

## 2. Review sheet

| Что | Путь |
|-----|------|
| **Сводная полоса:** scaled ref, actual, rough diff, blend ~0.18, 9 пар crop ref/actual по зонам | [`docs/PULSE_VISUAL_REVIEW_SHEET.png`](PULSE_VISUAL_REVIEW_SHEET.png) |

![PULSE review sheet — Iteration 5](PULSE_VISUAL_REVIEW_SHEET.png)

**Генерация:** `npm run docs:pulse-sheet` (`scripts/build-pulse-review-sheet.cjs`).

**Overlay (только alignment):** `/pulse?visualTest=1&overlay=1` — см. [`docs/PULSE_VISUAL_DIFF_REPORT.md`](PULSE_VISUAL_DIFF_REPORT.md). *Overlay mode is for alignment only, not for visual approval.*

---

## 3. Component gaps

| Документ | Назначение |
|----------|------------|
| [`docs/PULSE_COMPONENT_GAPS.md`](PULSE_COMPONENT_GAPS.md) | Матрица отличий vs reference + секция **Iteration 4–5** (atmosphere / cinematic). |

Дополнительно: [`docs/PULSE_LAYOUT_MAP.md`](PULSE_LAYOUT_MAP.md), [`docs/PULSE_VISUAL_DIFF_REPORT.md`](PULSE_VISUAL_DIFF_REPORT.md).

---

## 4. Зоны: PASS / NEEDS FIX / CRITICAL

Оценка после **Iteration 3** (композиция), **4–5** (atmosphere + cinematic depth). Композиция и порядок блоков **не менялись**.

### PASS

| Зона | Комментарий |
|------|-------------|
| **Глобальная сетка** | 1672×941, позиции блоков — принятая база. |
| **Cinematic background** | `pulse-atmosphere.svg` (усилен), **`pulse-city-mountains.svg`**, `.pulse-stage-panorama`, horizon wash, затемнение центра для читаемости. |
| **Hero depth** | Двойной backdrop, 520px орбиты, **hgCore**, path-дуги, усиленное кольцо 73%. |
| **Premium glass (панели)** | Blur 26px, lateral inset cyan/gold, токены краёв и glass stack. |
| **Нижняя сцена** | `.pulse-mountain-footer` усилен; футер: skyline **34px**, city glow, glass bar. |
| **Topic mood (декор)** | Mesh, weak edges, sparks, **sparkWeb**; **LAYOUT** узлов без изменений. |
| **Регрессия** | `npm run build` + `npm run test:visual` — зелёные после Iteration 5. |

### NEEDS FIX

| Зона | Суть |
|------|------|
| **Топ-теги** | Emoji vs плоские иконки макета. |
| **Голосование / donuts** | Микродуги vs ref. |
| **Live зал** | Текстура линии. |
| **Heatmap** | Ячейки / tooltip. |
| **Гео** | Силуэт vs иллюстрация. |
| **AI-инсайты** | Низкий приоритет. |

### CRITICAL

| ID | Статус |
|----|--------|
| **C1** | **Остаётся** — только upscaled ref; rough diff **~21.14%** advisory, не критерий approval. |
| **C2** | **Остаётся** — ручной sign-off Phase 1 после просмотра actual + sheet. |

---

## 5. Рекомендация: закрывать Phase 1?

| Исход | Условие |
|-------|---------|
| **Можно закрывать Phase 1** | Ревьюер подтверждает, что cinematic / premium depth **достаточны**; NEEDS FIX принимается как долг до native ref или отдельного **контентного** polish (не Phase 2). |
| **Продолжить polish** | Нужна доводка виджетов из NEEDS FIX — отдельная итерация по gaps, **не** смена фазы продукта. |

**Итог:** Iteration 5 закрывает запрос на **«Горы и Город»**, горизонт и **premium depth**. Phase 1 **всё ещё открыт** до явного ручного решения (**C2**).

---

## Команды верификации

```bash
npm run build
npm run test:visual
npm run docs:pulse-sheet
node scripts/pulse-ref-diff.cjs docs/PULSE_REFERENCE_scaled_1672.png docs/PULSE_CHECKPOINT_actual.png docs/PULSE_CHECKPOINT_diff_vs_reference_scaled.png
```
