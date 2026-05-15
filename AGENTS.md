<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Правила регистрации участников

- **Регистрация происходит СТРОГО 1 РАЗ** на устройство
- Данные хранятся в `localStorage` под ключом `pulse_participant_v1`
- `RegistrationGate` (`components/RegistrationGate.tsx`) показывает форму только если ключ отсутствует
- После успешной регистрации ключ записывается — форма больше **никогда** не показывается
- Обходные пути (bypass): `/pulse/admin`, `/pulse/live`, `/pulse/qr` — для организаторов
- Данные участников пишутся в Firebase RTDB: `participants/{uid}`
- **Не удалять и не обходить эту проверку** — требование форума
