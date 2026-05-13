# PULSE — Component visual gaps (overlay review)

**Последнее обновление:** Pixel-Fix **Iteration 5** (cinematic depth + panorama) поверх iter 4 / 3.

**Reference:** `public/reference/pulse-target.png` (**1024×576**, upscale to stage = **rough**).  
**Overlay:** `/pulse?visualTest=1&overlay=1`  
**Review sheet:** `docs/PULSE_VISUAL_REVIEW_SHEET.png` (ref | actual crops per zone).

Легенда **priority:** `high` = зона ручной сверки в первую очередь; `medium` / `low` = после нативного референса или отдельной векторной работы.

---

## 0. Iteration 4–5 — atmosphere + cinematic depth

| Зона | Iter 4 | Iter 5 (дополнительно) | Файлы |
|------|--------|------------------------|--------|
| Stage | Базовый SVG + слои | **`pulse-city-mountains.svg`**, `.pulse-stage-panorama`; сильнее bg/horizon/silhouette; центральное затемнение для читаемости | `PulseStage.tsx`, `pulse.stage.css`, `public/pulse/*` |
| Hero | Cinematic + орбиты | Двойной backdrop, **520px** орбиты, **hgCore**, path **дуги**, больше внешних колец | `HeroPulsePanel.tsx` |
| Panels | Glass stack | Blur **26px**, lateral inset highlights, токены краёв | `pulse.tokens.css`, `pulse.stage.css` |
| Footer | Skyline 22px | Skyline **34px**, **cityglow** под силуэтом, сильнее bar | `PulseFooterTicker.tsx`, `pulse.stage.css` |
| Topic | Mesh + sparks | **sparkWeb**, больше sparks, плотнее mesh / primary stroke | `TopicMoodNetwork.tsx` |

---

## 1. Header (`PulseHeader.tsx`)

| Отличие от reference (rough) | Файл | Правки (3–5) | Priority |
|------------------------------|------|--------------|----------|
| Плотность/контраст bar, LIVE chip, CTA градиент | `PulseHeader.tsx` | Высота bar **70px**; nav **12px**/gap **9**; subtitle **10px** caps; CTA inset highlight; border-bottom cyan hairline | **high** (iter 3 applied) |
| **Iter 4:** premium glass bar, top cyan wash, inset highlights | same | blur **18px**, двойной градиент + inset cyan/gold | medium |
| Логотип GG размер/свечение vs макет | same | Радиус круга **38px** ок; при overlay усилить `box-shadow` на GG | medium |
| Иконки bell / avatar stroke | same | stroke **1.5** → **1.6** по overlay | low |

---

## 2. Программа сейчас (`ProgramNowPanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Таймлайн: отступ точки, толщина линии, rhythm строк | `ProgramNowPanel.tsx` | `pl-[19px]`; линия **6px**; `space-y-2`; тип **10px** caps; заголовок сессии **12px** semibold | **high** (iter 3) |
| LIVE pill vs макет | same | размер **9px** ok; при native ref — цвет красного | medium |
| Кнопка «Смотреть всю программу» | same | `py-1.5`, `11px` font | medium |

---

## 3. Hero AI-ПУЛЬС + 73% (`HeroPulsePanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Кегль «AI-ПУЛЬС», tracking, подзаголовок caps | `HeroPulsePanel.tsx` | **46px** black; subtitle **11px** / **0.24em**; блок метрик компактнее | **high** (iter 3) |
| Кольцо: stroke, blur, внешний контур | same | `ringR` **93**, stroke **10**, blur **5.5**; внешний stroke cyan **0.12** | **high** |
| **Iter 5:** energy-core дуги, 520px орбиты, двойной backdrop | same | калибровка bloom vs native ref | medium |
| Орбиты dashed / glow | same | border **cyan-400/32**; shadow усилен | **high** |
| Число **73%** и подпись «ОБЩАЯ…» | same | **66px** / **30%**; подпись **10px** tracking **0.2em** | **high** |
| Карточки метрик | same | `py-1.5`, labels **10px** semibold caps; **iter 4:** glass edge на metric cards | medium |

---

## 4. Топ-теги (`TopTagsPanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Плотность карточек, иконки emoji vs flat icons в макете | `TopTagsPanel.tsx` | После native ref: размеры чисел **18→20**; padding карточки | medium |
| Табы фильтра | same | высота **28px**; активная обводка cyan | low |

---

## 5. Live-пульс зала (`LiveHallPulsePanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Кривая vs макет | `LiveHallPulsePanel.tsx` | Сгладить gradient line; подписи оси **10px** | medium |
| **73%** размер в панели | same | Сверить с макетом **44px** vs **44** | low |

---

## 6. Геоактивность (`GeoActivityPanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Силуэт карты vs иллюстрация макета | `GeoActivityPanel.tsx` | Замена path или stroke под overlay — только с native ref | low |

---

## 7. Настроение по темам (`TopicMoodNetwork.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Позиции узлов и длины рёбер | `TopicMoodNetwork.tsx` | Сдвиг координат **+4…+8px** (iter 3); edges **0.24** alpha | **high** |
| Заливка pill / glow узла | same | fill **0.88** alpha; blur **2.6**; stroke **1.2** | **high** |
| **Iter 4–5:** mesh, weak edges, sparks, **sparkWeb** | same | живость карты без смены **LAYOUT** | medium |
| Подписи **%** / тренд / имя | same | после ref: `fontSize` 12/10 | medium |

---

## 8. Голосование / donuts (`TagVotingMoodPanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Толщина дуг, цвета градиентов | `TagVotingMoodPanel.tsx` | Уникальные gradient id; stroke **14→12** по overlay | medium |
| Бары справа | same | высота бара **8px** | low |

---

## 9. Heatmap (`SessionInterestHeatmap.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Ячейки и tooltip блок | `SessionInterestHeatmap.tsx` | Подгонка `cellW/H` и позиции tooltip — после native ref | medium |

---

## 10. AI-инсайты (`AIInsightsPanel.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Карточки, иконки, угол декора | `AIInsightsPanel.tsx` | padding **12px**; border-radius **11** | low |

---

## 11. Футер (`PulseFooterTicker.tsx`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Высота **68px**, три колонки, типографика caps | `PulseFooterTicker.tsx` | **68px**; `blur(16px)`; колонки **1.05 / 0.92 / 1**; тренды **10px** bold | **high** (iter 3) |
| **Iter 5:** panorama layer, усиленный footer scene | `pulse.stage.css`, `PulseStage.tsx`, `PulseFooterTicker.tsx` | При необходимости снизить opacity `.pulse-stage-panorama` | medium |
| Кнопка «Смотрите в программе» | `LinkButton` in same file | **10.5px** bold; градиент чуть ярче | medium |

---

## 12. Глобальная сцена (`pulse.stage.css`, `pulse.tokens.css`)

| Отличие | Файл | Правки | Priority |
|---------|------|--------|----------|
| Силуэт гор/горизонт над футером | `pulse.stage.css` | `bottom` силуэта синхрон с высотой футера (**68px**) | **high** (iter 3) |
| **Iter 5:** `.pulse-stage-panorama`, усиление гор/горизонта | `pulse.stage.css`, `public/pulse/pulse-city-mountains.svg` | баланс читаемости | **high** |

---

*Документ включает **Iteration 5** (cinematic), **4** (atmosphere) и **3** (geometry/tokens).*
