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
      `<b>Сессии (авто):</b>`,
      `/sync — 🔄 Авто-синхронизация по текущему времени`,
      `/next — ⏭ Переключить на следующую сессию`,
      `/session ID — переключить вручную по ID`,
      ``,
      `<b>Статистика зала:</b>`,
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

  // /sync — auto-activate session by current Moscow time
  if (text === '/sync') {
    try {
      const tok = await getAnonToken()
      const sessionsRaw = await fbGet('sessions', tok)
      if (!sessionsRaw) { await send(chatId, `❌ Сессии не найдены в Firebase`); return NextResponse.json({ ok: true }) }

      const now = Date.now()
      // Moscow is UTC+3
      const moscowOffset = 3 * 60 * 60 * 1000
      const moscowNow = now + moscowOffset

      type FbSession = { title: string; starts_at?: string; ends_at?: string; status?: string }
      const sessions = Object.entries(sessionsRaw as Record<string, FbSession>)

      let liveId: string | null = null
      let liveTitle = ''
      const updates: Promise<void>[] = []

      for (const [id, s] of sessions) {
        if (!s.starts_at || !s.ends_at) continue
        const start = new Date(s.starts_at).getTime()
        const end = new Date(s.ends_at).getTime()
        // Compare using UTC (Firebase stores ISO with timezone)
        const isLive = now >= start && now < end
        const isEnded = now >= end
        const newStatus = isLive ? 'live' : isEnded ? 'ended' : 'upcoming'
        if (newStatus !== s.status) {
          updates.push(fbSet(`sessions/${id}/status`, newStatus, tok))
        }
        if (isLive) { liveId = id; liveTitle = s.title }
      }

      await Promise.all(updates)
      if (liveId) {
        await fbSet('event/activeSessionId', liveId, tok)
        const t = new Date(now)
        const timeStr = t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
        await send(chatId, [
          `🔄 <b>Синхронизировано по времени</b>`,
          ``,
          `🕐 Московское время: ${timeStr}`,
          `▶ LIVE: <b>${liveTitle}</b>`,
          `ID: <code>${liveId}</code>`,
          ``,
          `Обновлено статусов: ${updates.length}`,
        ].join('\n'))
      } else {
        // Find next upcoming session
        const upcoming = sessions
          .filter(([, s]) => s.starts_at && new Date(s.starts_at).getTime() > now)
          .sort(([, a], [, b]) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
        const nextSession = upcoming[0]
        const timeStr = new Date(now).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
        if (nextSession) {
          const [nextId, nextData] = nextSession
          const startsIn = Math.round((new Date(nextData.starts_at!).getTime() - now) / 60000)
          await send(chatId, [
            `🔄 <b>Синхронизировано</b> (обновлено: ${updates.length})`,
            ``,
            `🕐 Сейчас: ${timeStr} МСК`,
            `⏳ Активных сессий нет`,
            `➡ Следующая через ${startsIn} мин: <b>${nextData.title}</b>`,
            ``,
            `/next — переключить на неё`,
          ].join('\n'))
        } else {
          await send(chatId, `🔄 Синхронизировано. Сейчас ${timeStr} МСК — активных сессий нет.`)
        }
      }
    } catch (e) { await send(chatId, `❌ ${e}`) }
    return NextResponse.json({ ok: true })
  }

  // /next — switch to next upcoming session
  if (text === '/next') {
    try {
      const tok = await getAnonToken()
      const [sessionsRaw, currentId] = await Promise.all([
        fbGet('sessions', tok),
        fbGet('event/activeSessionId', tok),
      ])
      if (!sessionsRaw) { await send(chatId, `❌ Сессии не найдены`); return NextResponse.json({ ok: true }) }

      type FbSession = { title: string; starts_at?: string; status?: string }
      const sessions = Object.entries(sessionsRaw as Record<string, FbSession>)
        .filter(([, s]) => s.starts_at)
        .sort(([, a], [, b]) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())

      const currentIdx = sessions.findIndex(([id]) => id === currentId)
      const nextEntry = sessions[currentIdx + 1] ?? sessions.find(([, s]) => s.status === 'upcoming')

      if (!nextEntry) { await send(chatId, `⏭ Следующих сессий нет`); return NextResponse.json({ ok: true }) }

      const [nextId, nextData] = nextEntry
      await Promise.all([
        fbSet('event/activeSessionId', nextId, tok),
        fbSet(`sessions/${nextId}/status`, 'live', tok),
        currentId ? fbSet(`sessions/${currentId}/status`, 'ended', tok) : Promise.resolve(),
      ])
      await send(chatId, [
        `⏭ <b>Следующая сессия</b>`,
        ``,
        `▶ LIVE: <b>${nextData.title}</b>`,
        `ID: <code>${nextId}</code>`,
      ].join('\n'))
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

    // Stats commands without argument — show usage
    if (['/audience', '/activity', '/engagement', '/pulse'].includes(text)) {
      await send(chatId, `Укажи число, например:\n/audience 450 — участников\n/activity 67 — активность %\n/engagement 72 — вовлечённость %\n/pulse 58 — пульс зала`)
      return NextResponse.json({ ok: true })
    }

  await send(chatId, `Не понял. Отправь /help`)
  return NextResponse.json({ ok: true })
}
