# PULSE_VISUAL_CONTRACT

Источник правды по пикселям: `public/reference/pulse-target.png` (overlay в dev через `VisualOverlay`, не фон продакшена).

## Жёсткие правила

1. Вьюпорт теста: **1672×941**, без `fullPage` скриншота.
2. Режим стабилизации: `/pulse/live?visualTest=1` — нет `Math.random`, нет частиц, нет blink, нет Firebase, нет авто-рефреша. *(Участниковый экран — `/pulse`; проектор — `/pulse/live`.)*
3. Токены только из `styles/pulse.tokens.css` (+ локальные исключения с комментарием «ref match»).
4. Графики Phase 1: **SVG/CSS**; ECharts запрещён до visual lock.
5. UI-kit библиотеки (shadcn, MUI, Antd, Bootstrap) — **не использовать**.

## Структура URL

| URL | Назначение |
|-----|------------|
| `/pulse` | Лендинг участника (CTA vote / results) |
| `/pulse/live` | Дашборд зала / проектор (макет stage) |
| `/pulse/live?visualTest=1` | Режим регрессии Playwright и стабильного рендера |

## Приёмка

- Playwright `maxDiffPixelRatio: 0.01` против эталонного скриншота (обновление baseline после согласования с `pulse-target.png`).
