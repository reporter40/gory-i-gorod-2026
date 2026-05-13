# PULSE_LAYOUT_MAP — координатная карта (reference: `public/reference/pulse-target.png`)

**Stage:** `1672×941` px (`PulseStage`), `deviceScaleFactor: 1`, Chromium.

**Референс в репо:** `pulse-target.png` остаётся **1024×576** — **нет** экспорта 1672×941 (проверен дубликат в assets). Поэтому `node scripts/pulse-ref-diff.cjs` vs `docs/PULSE_REFERENCE_scaled_1672.png` (**sips** upscale) помечен как **ROUGH reference diff**, не финальная метрика до нативного макета.

| Блок | Компонент | x | y | w | h | z |
|------|-----------|---|---|---|---|---|
| Хедер | `PulseHeader` | 0 | 0 | 1672 | **70** | 20 |
| Программа сейчас | `ProgramNowPanel` | 12 | 76 | 298 | 332 | 2 |
| Live-пульс зала | `LiveHallPulsePanel` | 12 | 414 | 298 | 200 | 2 |
| Геоактивность | `GeoActivityPanel` | 12 | 620 | 298 | 235 | 2 |
| Hero / метрики | `HeroPulsePanel` | 318 | 76 | 994 | **290** | 2 |
| Топ-теги | `TopTagsPanel` | 318 | 374 | 994 | 154 | 2 |
| Настроение / голосование | `TagVotingMoodPanel` | 318 | 538 | 482 | 317 | 2 |
| Карта интереса | `SessionInterestHeatmap` | **804** | 538 | **508** | **319** | 2 |
| Настроение по темам | `TopicMoodNetwork` | 1326 | 76 | 334 | 420 | 2 |
| AI-инсайты | `AIInsightsPanel` | 1326 | 502 | 334 | 353 | 2 |
| Футер | `PulseFooterTicker` | 0 | **873** | 1672 | **68** | 15 |

### Типографика (уточнено по референсу)

| Уровень | px | Вес |
|---------|-----|-----|
| Логотип GG (круг) | 38 | bold |
| Название конференции (хедер) | 17 | 700 |
| Подзаголовок хедера | 11 | 500 |
| Нав пункт | 13 | 500 / 600 active |
| Заголовок панели (ПРОГРАММА…) | 11 | 700, letter-spacing 0.12em |
| AI-ПУЛЬС hero title | 44 | 800 |
| Подзаголовок под AI-ПУЛЬС | 12 | 600 |
| Центральное 73% | 72 | 800 |
| Метрики строки | 13 | 500 |
| Карточка тега число | 20 | 700 |
| Body панелей | 12–13 | 400–500 |

### Радиусы и обводки

- Панели: `--pulse-panel-radius: 14px`
- Кнопки CTA: `12px`
- Карточки тегов: `10px`

### Цвета (hex)

- Фон stage: `#050a14` → `#0a0e1a` градиент вертикальный
- Панель: `rgba(13, 17, 30, 0.82)` + blur
- Текст: `#ffffff` / secondary `rgba(255,255,255,0.72)` / muted `rgba(255,255,255,0.45)`
- Cyan акцент: `#00e5ff`, glow `rgba(0, 229, 255, 0.35)`
- Золото: `#f59e0b`; зелёный LIVE: `#22c55e`
- Heatmap cold: `#0f1729`; hot: `#00d4aa` / `#22c55e`

### Glow

- Soft: `0 0 24px rgba(0, 229, 255, 0.12), 0 0 48px rgba(0, 229, 255, 0.06)`
- Active nav: нижнее подчёркивание cyan + text-shadow лёгкий
- Hero gauge: два box-shadow слоя cyan + белый highlight

Все координаты — **целевые** для сверки; допуск ±2px допустим до visual lock.

---

## PHASE 1 (Visual only) — не acceptance

- Нет Firebase / ECharts / `/pulse/vote`.
- Overlay: `/pulse?visualTest=1&overlay=1` → `VisualOverlay`.
- Playwright baseline обновлён для **зелёного CI** только; финальный SSOT — согласованный макет **1672×941**, не snapshot.

---

## Pixel-Fix Iteration 1 (final)

**Изменена геометрия только** у `SessionInterestHeatmap.tsx`: сдвиг **левее на 4px** (`808→804`), **шире на 4px**, **выше на 2px** (319 vs 317), сохраняя `y=538` и зазор с `TagVotingMoodPanel` (`318+482=800`, затем **4px** до `804`). Цель — ближе к сетке heatmap после overlay на rough-scaled референсе.

Промежуточные полные перестройки колонок (отменены) временно подняли rough diff >20.89% — откат.

---

## Pixel-Fix Iteration 3 (component-level)

- **Header:** высота **70px** (было 72 в таблице до iter 3).
- **Hero:** высота блока **290px** (было 292).
- **Footer:** высота **68px**, верх полосы на stage **y=873** при `height:941`.
- **Topic network:** см. массив `LAYOUT` в `TopicMoodNetwork.tsx` (сдвиг узлов).
