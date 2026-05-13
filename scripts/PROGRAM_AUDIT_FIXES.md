# Program Audit Fixes

Authoritative source: `scripts/xlsx_full_dump.txt`, sheet `Основная программа`, rows 1-71.

## Mismatch List

- Row 13, 11:15-11:30, `Главный зал`: XLSX title cell is empty; speaker cell is `Мальцева Наталья Владимировна Начальник управления архитектуры и градостроительства - главный архитектор`. Closest session `d1-p1-maltseva` had an added `администрация г. Геленджика` suffix; changed to the short role line from the dump.
- Rows 19-25, 13:30-15:00, `Главный зал`: several solo talk titles differed from column C by shortened wording, missing periods, or normalized punctuation. Updated `d1-s1-pyankova`, `d1-s1-bitarova`, `d1-s2-tyutin`, `d1-s2-astakhov`, and `d1-s2-morozova` to the dump text.
- Rows 34-35, 16:45-17:50, `Главный зал`: closest sessions used editorial plenary/QA wording. Updated the plenary title and `Вопрос - ответ` punctuation to match the dump.
- Row 44, 10:15-10:30, `Главный зал`: XLSX speaker cell uses `Авруцкая Ирина Гарриевна`; the session already matched the day-2 slot, with the row-18 day-1 mention left as a documented inconsistency.
- Row 46, 10:45-11:00, `Главный зал`: XLSX title says `А-система`; code intentionally keeps `AI-система` per editorial instruction. Speaker display name changed to `Кирилл Попельнюк` to match the cell order.
- Row 50, 12:00-13:00, `Главный зал`: title and speaker cell were paraphrased. Updated `d2-online` title to `Как события превращают локацию в дестинацию` and description to the dump speaker cell.
- Rows 56, 60-61, 15:00-16:50, `Главный зал`: long titles were shortened or missing final punctuation. Updated `d2-s2-kozyriskaya`, `d2-ins-komkov`, and `d2-ins-starkov` to column C.
- Rows 67-68, `Малый зал`: cinema title/description and workshop text were paraphrased. Updated the cinema slot to row 67 column C/speaker text, kept it at 16:30-18:00 on 16.05.26, and replaced workshop description with the row 68 text while preserving the intentional post-cinema org slot because the dump has no time.
- Rows 70-71, 10:00-10:40 and 11:00-12:30: KubGU descriptions invented organizer follow-up text. Replaced with neutral dump-only `Наставничество. Эксперты: 1. 2. 3. 4.` text and aligned titles to column C.

## Intentional Non-Fixes

- Row 18 lists `Авруцкая Ирина` in the right timing summary, but detailed rows 19-26 do not include a separate 14:15-14:45 Avrutskaya session. No day-1 session was added; `lib/data.ts` now documents this explicitly.
- Row 46 keeps `AI-система` instead of the XLSX `А-система`, as requested.
- Rows 62-63 are empty in title and speaker cells; the existing placeholder-note sessions remain file-only and do not invent speakers.
