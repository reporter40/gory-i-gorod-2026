# Деплой на Vercel

## 1. Установи Vercel CLI (один раз)
```bash
npm install -g vercel
```

## 2. Залогинься
```bash
vercel login
```

## 3. Деплой из папки проекта
```bash
cd gory-i-gorod
vercel --prod
```

Vercel сам определит Next.js. Приложение получит URL вида `gory-i-gorod-xxx.vercel.app`.

## 4. Добавь переменные окружения

В Vercel Dashboard → Settings → Environment Variables:

| Переменная | Где взять |
|-----------|----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Project Settings |

> Без Supabase и Anthropic API приложение работает на mock-данных — это нормально для демо.

## 5. Кастомный домен (опционально)

Vercel Dashboard → Domains → Add → введи свой домен.

## Supabase схема (опционально для production)

```sql
create table pulse_tags (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  participant_id text not null,
  tag_type text not null,
  comment text,
  created_at timestamptz default now()
);

create table pulse_synthesis (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  synthesis_text text not null,
  tag_count int default 0,
  generated_at timestamptz default now()
);

-- RLS
alter table pulse_tags enable row level security;
create policy "public read" on pulse_tags for select using (true);
create policy "anon insert" on pulse_tags for insert with check (true);
```
