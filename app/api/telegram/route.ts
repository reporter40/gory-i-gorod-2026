import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!
const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!

type TgUpdate = {
  message?: { chat: { id: number }; text?: string }
}

// ── Telegram ──────────────────────────────────────────────────────────────

async function send(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

// ── Firebase REST (no SDK — works in any serverless env) ──────────────────

async function getAnonToken(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }) }
  )
  const d = await res.json() as { idToken?: string; error?: { message: string } }
  if (!d.idToken) throw new Error(d.error?.message ?? 'auth failed')
  return d.idToken
}

async function fbSet(path: string, value: unknown, token: string) {
  const res = await fetch(`${DB_URL}/${path}.json?auth=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function fbGet(path: string, token: string) {
  const res = await fetch(`${DB_URL}/${path}.json?auth=${token}`)
  return res.json()
}

// ── Handlers ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ ok: false })

  const update: TgUpdate = await req.json()
  const msg = update.message
  if (!msg) return NextResponse.json({ ok: true })

  const chatId = msg.chat.id
  const text = (msg.text ?? '').trim()

  if (ADMIN_CHAT_ID && String(chatId) !== ADMIN_CHAT_ID) {
    await send(chatId, `⛔ Доступ запрещён. Твой chat_id: <code>${chatId}</code>`)
    return NextResponse.json({ ok: true })
  }

  if (text === '/start' || text === '/help') {
    await send(chatId, [
      `⚡ <b>AI-Пульс — управление</b>`,
      ``,
      `<b>Режимы экрана:</b>`,
      `/live — ▶ LIVE, данные в реальном времени`,
      `/vote — 📱 Показать QR-код на экране зала`,
      `/freeze — ⏸ Заморозить (тихо, зрители не видят)`,
      ``,
      `<b>Сессии:</b>`,
      `/session 1 ... /session 5`,
      ``,
      `<b>Статистика зала (обновить вручную):</b>`,
      `/audience 450 — участников онлайн`,
      `/activity 67 — активность зала %`,
      `/engagement 72 — вовлечённость %`,
      `/pulse 58 — пульс зала (Live-график)`,
      ``,
      `/status — текущее состояние`,
    ].join('\n'))
    return NextResponse.json({ ok: true })
  }

  if (text === '/status') {
    try {
      const tok = await getAnonToken()
      const [ev, hbTs] = await Promise.all([
        fbGet('event', tok),
        fbGet('heartbeat/main/lastSeen', tok),
      ])
      const frozen: boolean = !!ev?.frozen
      const mode: string = ev?.mode ?? 'live'
      const session: string = ev?.activeSessionId ?? '—'
      const age = hbTs ? Math.floor((Date.now() - hbTs) / 1000) : null
      const hb = age === null ? '❓ нет данных'
        : age < 15 ? `🟢 ${age}с назад`
        : age < 90 ? `🟡 ${age}с назад`
        : `🔴 ${age}с назад`
      const modeLabel = mode === 'vote' ? '📱 VOTE (QR на экране)'
        : frozen ? '⏸ FREEZE' : '▶ LIVE'
      await send(chatId, [
        `📊 <b>Статус AI-Пульс</b>`,
        ``,
        `Режим: ${modeLabel}`,
        `Сессия: ${session}`,
        `Экран зала: ${hb}`,
      ].join('\n'))
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  if (text === '/live') {
    try {
      const tok = await getAnonToken()
      await Promise.all([
        fbSet('event/frozen', false, tok),
        fbSet('event/mode', 'live', tok),
      ])
      await send(chatId, `▶ <b>LIVE</b>\nДанные идут в реальном времени. Голосование открыто.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  if (text === '/freeze') {
    try {
      const tok = await getAnonToken()
      await Promise.all([
        fbSet('event/frozen', true, tok),
        fbSet('event/mode', 'freeze', tok),
      ])
      await send(chatId, `⏸ <b>FREEZE</b>\nЭкран заморожен. Зрители ничего не замечают.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  if (text === '/vote') {
    try {
      const tok = await getAnonToken()
      await Promise.all([
        fbSet('event/frozen', false, tok),
        fbSet('event/mode', 'vote', tok),
      ])
      await send(chatId, `📱 <b>VOTE MODE</b>\nНа экране зала — QR-код. Зрители сканируют и голосуют.\n\nОтправь /live чтобы убрать QR.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  // /audience 450
  const audienceMatch = text.match(/^\/audience\s+(\d+)$/)
  if (audienceMatch) {
    const n = parseInt(audienceMatch[1])
    try {
      const tok = await getAnonToken()
      await fbSet('event/stats/onlineParticipants', n, tok)
      await send(chatId, `👥 <b>Участников онлайн: ${n}</b>\nОбновлено на дашборде.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  // /activity 67
  const activityMatch = text.match(/^\/activity\s+(\d+)$/)
  if (activityMatch) {
    const n = Math.min(100, parseInt(activityMatch[1]))
    try {
      const tok = await getAnonToken()
      await fbSet('event/stats/hallActivity', n, tok)
      await send(chatId, `📊 <b>Активность зала: ${n}%</b>\nОбновлено на дашборде.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  // /engagement 72
  const engMatch = text.match(/^\/engagement\s+(\d+)$/)
  if (engMatch) {
    const n = Math.min(100, parseInt(engMatch[1]))
    try {
      const tok = await getAnonToken()
      await fbSet('event/stats/engagement', n, tok)
      await send(chatId, `🎯 <b>Вовлечённость: ${n}%</b>\nОбновлено на дашборде.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  // /pulse 58
  const pulseMatch = text.match(/^\/pulse\s+(\d+)$/)
  if (pulseMatch) {
    const n = Math.min(100, parseInt(pulseMatch[1]))
    try {
      const tok = await getAnonToken()
      const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      await Promise.all([
        fbSet('event/stats/hallPulseCurrent', n, tok),
        fbSet(`event/stats/hallPulseTimeline/${Date.now()}`, { time: now, value: n }, tok),
      ])
      await send(chatId, `💓 <b>Пульс зала: ${n}%</b> (${now})\nОбновлено на дашборде.`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  const sessionMatch = text.match(/^\/session\s+(\d+)$/)
  if (sessionMatch) {
    const sessionId = `session-${sessionMatch[1]}`
    try {
      const tok = await getAnonToken()
      const session = await fbGet(`sessions/${sessionId}`, tok)
      if (!session) {
        await send(chatId, `❌ Сессия ${sessionId} не найдена`)
        return NextResponse.json({ ok: true })
      }
      await fbSet('event/activeSessionId', sessionId, tok)
      await send(chatId, `✅ <b>Сессия переключена</b>\n${session.title ?? sessionId}`)
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  await send(chatId, `Не понял. Отправь /help`)
  return NextResponse.json({ ok: true })
}
