import { NextRequest, NextResponse } from 'next/server'
import { getAdminApp } from '@/lib/pulse/firebase/admin-app'
import { rtdbRead, rtdbWrite } from '@/lib/pulse/server/rtdb-admin'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

type TgUpdate = {
  message?: { chat: { id: number }; text?: string }
}

async function send(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function sendCsv(chatId: number, filename: string, content: string, caption?: string) {
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('document', new Blob(['﻿' + content], { type: 'text/csv' }), filename)
  if (caption) form.append('caption', caption)
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { method: 'POST', body: form })
}

async function ensureAdmin(chatId: number): Promise<boolean> {
  if (!getAdminApp()) {
    await send(
      chatId,
      '❌ Firebase Admin не настроен. Задай <code>FIREBASE_SERVICE_ACCOUNT_JSON</code> и URL базы на сервере.'
    )
    return false
  }
  return true
}

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
      `/program — 📋 Программа + обновить дашборд`,
      `/day2 — 📅 Переключить на День 2`,
      ``,
      `<b>Голоса:</b>`,
      `/reset — 🗑 Обнулить голоса текущей сессии`,
      `/resetall — 💥 Сбросить ВСЕ голоса (все сессии)`,
      ``,
      `<b>Участники:</b>`,
      `/clearparticipants — 🧹 Очистить всех участников`,
      `/engage — 🎯 Вовлечённость (статистика)`,
      `/seteng 72 — ✏️ Установить вручную`,
      `/geo — 🗺 Статистика городов`,
      ``,
      `<b>Экстренный режим:</b>`,
      `/snapshot — 📸 Ссылка на снимок (если экран погас)`,
      `/save — 💾 Скачать данные форума (CSV)`,
      ``,
      `/status — текущее состояние`,
    ].join('\n'))
    return NextResponse.json({ ok: true })
  }

  if (text === '/status') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const [ev, hbTs] = await Promise.all([
        rtdbRead('event'),
        rtdbRead('heartbeat/main/lastSeen'),
      ])
      const evObj = ev as { frozen?: boolean; mode?: string; activeSessionId?: string } | null
      const frozen: boolean = !!evObj?.frozen
      const mode: string = evObj?.mode ?? 'live'
      const session: string = evObj?.activeSessionId ?? '—'
      const ts = typeof hbTs === 'number' ? hbTs : null
      const age = ts ? Math.floor((Date.now() - ts) / 1000) : null
      const hb =
        age === null
          ? '❓ нет данных'
          : age < 15
            ? `🟢 ${age}с назад`
            : age < 90
              ? `🟡 ${age}с назад`
              : `🔴 ${age}с назад`
      const modeLabel =
        mode === 'vote' ? '📱 VOTE (QR на экране)' : frozen ? '⏸ FREEZE' : '▶ LIVE'
      await send(chatId, [
        `📊 <b>Статус AI-Пульс</b>`,
        ``,
        `Режим: ${modeLabel}`,
        `Сессия: ${session}`,
        `Экран зала: ${hb}`,
      ].join('\n'))
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/engage') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const statsRaw = await rtdbRead('event/stats') as Record<string, unknown> | null
      const regCount = typeof statsRaw?.registeredCount === 'number' ? statsRaw.registeredCount : 0
      const manualEng = typeof statsRaw?.engagement === 'number' ? statsRaw.engagement : null
      const autoEng = Math.min(100, Math.round((regCount / 1700) * 100))
      await send(chatId, [
        `🎯 <b>Вовлечённость аудитории</b>`,
        ``,
        `Зарегистрировано: ${regCount} из 1700`,
        `Авто (по регистрациям): ${autoEng}%`,
        manualEng !== null ? `Ручной override: ${manualEng}%` : `Ручной override: не задан`,
        ``,
        `Установить вручную: /seteng 72`,
      ].join('\n'))
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const setEngMatch = text.match(/^\/seteng\s+(\d+)$/)
  if (setEngMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const n = Math.min(100, parseInt(setEngMatch[1], 10))
    try {
      await rtdbWrite('event/stats/engagement', n)
      await send(chatId, `🎯 <b>Вовлечённость установлена: ${n}%</b>\nОбновлено на дашборде.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/day2') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const { SESSIONS } = await import('@/lib/data')
      const day2 = SESSIONS.filter(s => s.day === 2).sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
      if (day2.length === 0) {
        await send(chatId, `❌ Сессии второго дня не найдены`)
        return NextResponse.json({ ok: true })
      }
      const firstId = day2[0].id
      await rtdbWrite('event/activeSessionId', firstId)
      await send(chatId, [
        `📅 <b>День 2 активирован</b>`,
        ``,
        `Первая сессия: <b>${day2[0].title}</b>`,
        `ID: <code>${firstId}</code>`,
        ``,
        `Дашборд переключится автоматически.`,
        `Голоса обнулить: /reset`,
      ].join('\n'))
    } catch (e) {
      await send(chatId, `❌ /day2 ошибка: ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/geo') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const geoRaw = await rtdbRead('geo') as Record<string, number> | null
      if (!geoRaw || Object.keys(geoRaw).length === 0) {
        await send(chatId, `🗺 Геоданных пока нет. Участники появятся после регистрации.`)
        return NextResponse.json({ ok: true })
      }
      const entries = Object.entries(geoRaw).sort(([, a], [, b]) => b - a)
      const total = entries.reduce((s, [, c]) => s + c, 0)
      const lines = [`🗺 <b>Геоактивность участников</b>`, `Всего городов: ${entries.length} · Регистраций: ${total}`, ``]
      for (const [city, count] of entries.slice(0, 15)) {
        const pct = Math.round((count / total) * 100)
        lines.push(`${city} — ${count} (${pct}%)`)
      }
      if (entries.length > 15) lines.push(`...ещё ${entries.length - 15} городов`)
      await send(chatId, lines.join('\n'))
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/reset') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const activeId = await rtdbRead('event/activeSessionId') as string | null
      const tags = ['implement', 'discovery', 'partner', 'question', 'applicable']
      const zeros: Record<string, number> = {}
      for (const t of tags) zeros[t] = 0
      const tasks: Promise<void>[] = [
        rtdbWrite('speakerVotes', null),
        rtdbWrite('voteTimeline', null),
        rtdbWrite('userVotes', null),
      ]
      if (activeId) tasks.push(rtdbWrite(`votes/${activeId}`, zeros))
      await Promise.all(tasks)
      await send(chatId, `🗑 <b>Голоса обнулены</b>\nТеги: 0. Рейтинг спикеров: очищен. Карта: сброшена. userVotes: очищены.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/resetall') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await Promise.all([
        rtdbWrite('votes', null),
        rtdbWrite('speakerVotes', null),
        rtdbWrite('voteTimeline', null),
        rtdbWrite('userVotes', null),
        rtdbWrite('mood', null),
      ])
      await send(chatId, `💥 <b>Все голоса полностью сброшены</b>\nvotes, speakerVotes, voteTimeline, userVotes, mood — всё очищено.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/clearparticipants') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await rtdbWrite('participants', null)
      await send(chatId, `🧹 <b>Участники очищены</b>\nСписок /network пуст.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/program') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const sessionsRaw = await rtdbRead('sessions')
      if (!sessionsRaw) {
        await send(chatId, `❌ Сессии не найдены. Загрузи через /pulse/admin → "Загрузить программу"`)
        return NextResponse.json({ ok: true })
      }
      const now = Date.now()
      type FbSession = { title: string; starts_at?: string; ends_at?: string; status?: string }
      const sessions = Object.entries(sessionsRaw as Record<string, FbSession>)
        .filter(([, s]) => s.starts_at)
        .sort(([, a], [, b]) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
      let liveId: string | null = null
      const updates: Promise<void>[] = []
      const lines: string[] = [`📋 <b>Программа сейчас</b>`, ``]
      for (const [id, s] of sessions) {
        const start = new Date(s.starts_at!).getTime()
        const end = s.ends_at ? new Date(s.ends_at).getTime() : start + 3600000
        const isLive = now >= start && now < end
        const isEnded = now >= end
        const newStatus = isLive ? 'live' : isEnded ? 'ended' : 'upcoming'
        if (newStatus !== s.status) updates.push(rtdbWrite(`sessions/${id}/status`, newStatus))
        if (isLive) liveId = id
        const time = new Date(s.starts_at!).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
        const icon = isLive ? '▶' : isEnded ? '✓' : '○'
        lines.push(`${icon} ${time} ${isLive ? `<b>${s.title}</b>` : s.title}`)
      }
      await Promise.all(updates)
      if (liveId) await rtdbWrite('event/activeSessionId', liveId)
      lines.push(``, liveId ? `✅ Дашборд обновлён` : `⏳ Активных сессий нет`)
      await send(chatId, lines.join('\n'))
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/save') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await send(chatId, '💾 Собираю данные форума...')

      const [votesRaw, timelineRaw, participantsRaw, geoRaw, speakerVotesRaw] = await Promise.all([
        rtdbRead('votes'),
        rtdbRead('voteTimeline'),
        rtdbRead('participants'),
        rtdbRead('geo'),
        rtdbRead('speakerVotes'),
      ])

      const TAG_NAMES: Record<string, string> = {
        implement: 'Хочу внедрить',
        discovery: 'Открытие',
        partner: 'Ищу партнёров',
        question: 'Есть вопрос',
        applicable: 'Применимо у нас',
      }

      // --- votes.csv ---
      const voteLines = ['Сессия,Тег,Название тега,Голосов']
      const votesObj = votesRaw as Record<string, Record<string, number>> | null
      if (votesObj) {
        for (const [sessionId, tags] of Object.entries(votesObj)) {
          for (const [tagId, count] of Object.entries(tags)) {
            voteLines.push(`${sessionId},${tagId},"${TAG_NAMES[tagId] ?? tagId}",${count}`)
          }
        }
      }

      // --- timeline.csv ---
      const tlLines = ['Тег,Название тега,Час,Голосов']
      const tlObj = timelineRaw as Record<string, Record<string, number>> | null
      if (tlObj) {
        for (const [tagId, slots] of Object.entries(tlObj)) {
          for (const [slot, count] of Object.entries(slots).sort()) {
            tlLines.push(`${tagId},"${TAG_NAMES[tagId] ?? tagId}",${slot},${count}`)
          }
        }
      }

      // --- participants.csv ---
      const partLines = ['Имя,Город,Дата регистрации']
      const partObj = participantsRaw as Record<string, { name?: string; city?: string; createdAt?: number }> | null
      if (partObj) {
        for (const p of Object.values(partObj)) {
          const name = (p.name ?? '').replace(/"/g, '""')
          const city = (p.city ?? '').replace(/"/g, '""')
          const date = p.createdAt ? new Date(p.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : ''
          partLines.push(`"${name}","${city}","${date}"`)
        }
      }

      // --- geo.csv ---
      const geoLines = ['Город,Участников']
      const geoObj = geoRaw as Record<string, number> | null
      if (geoObj) {
        for (const [city, count] of Object.entries(geoObj).sort(([, a], [, b]) => b - a)) {
          geoLines.push(`"${city}",${count}`)
        }
      }

      // --- speaker_votes.csv ---
      const spLines = ['Спикер,Тег,Название тега,Голосов']
      const spObj = speakerVotesRaw as Record<string, { counts?: Record<string, number> }> | null
      if (spObj) {
        for (const [speakerId, data] of Object.entries(spObj)) {
          const counts = data?.counts ?? {}
          for (const [tagId, count] of Object.entries(counts)) {
            spLines.push(`${speakerId},${tagId},"${TAG_NAMES[tagId] ?? tagId}",${count}`)
          }
        }
      }

      const now = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }).replace(/\./g, '-')

      await sendCsv(chatId, `votes_${now}.csv`, voteLines.join('\n'), '📊 Голоса по тегам и сессиям')
      await sendCsv(chatId, `timeline_${now}.csv`, tlLines.join('\n'), '⏱ Активность по времени')
      await sendCsv(chatId, `participants_${now}.csv`, partLines.join('\n'), `👥 Участники (${partLines.length - 1} чел.)`)
      await sendCsv(chatId, `geo_${now}.csv`, geoLines.join('\n'), '🗺 Города')
      await sendCsv(chatId, `speaker_votes_${now}.csv`, spLines.join('\n'), '🎤 Голоса за спикеров')

    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/snapshot') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gory-i-gorod-2026.vercel.app'
    await send(chatId, [
      `📸 <b>Снимок дашборда</b>`,
      ``,
      `Открой эту ссылку на мониторе зала:`,
      `<a href="${baseUrl}/pulse/snapshot">${baseUrl}/pulse/snapshot</a>`,
      ``,
      `Страница покажет последний сохранённый снимок без подключения к интернету.`,
      `Когда связь восстановится — открой /live.`,
    ].join('\n'))
    return NextResponse.json({ ok: true })
  }

  if (text === '/live') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await Promise.all([rtdbWrite('event/frozen', false), rtdbWrite('event/mode', 'live')])
      await send(chatId, `▶ <b>LIVE</b>\nДанные идут в реальном времени. Голосование открыто.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/freeze') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await Promise.all([rtdbWrite('event/frozen', true), rtdbWrite('event/mode', 'freeze')])
      await send(chatId, `⏸ <b>FREEZE</b>\nЭкран заморожен. Зрители ничего не замечают.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/vote') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      await Promise.all([rtdbWrite('event/frozen', false), rtdbWrite('event/mode', 'vote')])
      await send(
        chatId,
        `📱 <b>VOTE MODE</b>\nНа экране зала — QR-код. Зрители сканируют и голосуют.\n\nОтправь /live чтобы убрать QR.`
      )
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const audienceMatch = text.match(/^\/audience\s+(\d+)$/)
  if (audienceMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const n = parseInt(audienceMatch[1], 10)
    try {
      await rtdbWrite('event/stats/onlineParticipants', n)
      await send(chatId, `👥 <b>Участников онлайн: ${n}</b>\nОбновлено на дашборде.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const activityMatch = text.match(/^\/activity\s+(\d+)$/)
  if (activityMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const n = Math.min(100, parseInt(activityMatch[1], 10))
    try {
      await rtdbWrite('event/stats/hallActivity', n)
      await send(chatId, `📊 <b>Активность зала: ${n}%</b>\nОбновлено на дашборде.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const engMatch = text.match(/^\/engagement\s+(\d+)$/)
  if (engMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const n = Math.min(100, parseInt(engMatch[1], 10))
    try {
      await rtdbWrite('event/stats/engagement', n)
      await send(chatId, `🎯 <b>Вовлечённость: ${n}%</b>\nОбновлено на дашборде.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const pulseMatch = text.match(/^\/pulse\s+(\d+)$/)
  if (pulseMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const n = Math.min(100, parseInt(pulseMatch[1], 10))
    try {
      const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      await Promise.all([
        rtdbWrite('event/stats/hallPulseCurrent', n),
        rtdbWrite(`event/stats/hallPulseTimeline/${Date.now()}`, { time: now, value: n }),
      ])
      await send(chatId, `💓 <b>Пульс зала: ${n}%</b> (${now})\nОбновлено на дашборде.`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/sync') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const sessionsRaw = await rtdbRead('sessions')
      if (!sessionsRaw) {
        await send(chatId, `❌ Сессии не найдены в Firebase`)
        return NextResponse.json({ ok: true })
      }

      const now = Date.now()

      type FbSession = { title: string; starts_at?: string; ends_at?: string; status?: string }
      const sessions = Object.entries(sessionsRaw as Record<string, FbSession>)

      let liveId: string | null = null
      let liveTitle = ''
      const updates: Promise<void>[] = []

      for (const [id, s] of sessions) {
        if (!s.starts_at || !s.ends_at) continue
        const start = new Date(s.starts_at).getTime()
        const end = new Date(s.ends_at).getTime()
        const isLive = now >= start && now < end
        const isEnded = now >= end
        const newStatus = isLive ? 'live' : isEnded ? 'ended' : 'upcoming'
        if (newStatus !== s.status) {
          updates.push(rtdbWrite(`sessions/${id}/status`, newStatus))
        }
        if (isLive) {
          liveId = id
          liveTitle = s.title
        }
      }

      await Promise.all(updates)
      if (liveId) {
        await rtdbWrite('event/activeSessionId', liveId)
        const timeStr = new Date(now).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Moscow',
        })
        await send(
          chatId,
          [
            `🔄 <b>Синхронизировано по времени</b>`,
            ``,
            `🕐 Московское время: ${timeStr}`,
            `▶ LIVE: <b>${liveTitle}</b>`,
            `ID: <code>${liveId}</code>`,
            ``,
            `Обновлено статусов: ${updates.length}`,
          ].join('\n')
        )
      } else {
        const upcoming = sessions
          .filter(([, s]) => s.starts_at && new Date(s.starts_at).getTime() > now)
          .sort(([, a], [, b]) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
        const nextSession = upcoming[0]
        const timeStr = new Date(now).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Moscow',
        })
        if (nextSession) {
          const [, nextData] = nextSession
          const startsIn = Math.round((new Date(nextData.starts_at!).getTime() - now) / 60000)
          await send(
            chatId,
            [
              `🔄 <b>Синхронизировано</b> (обновлено: ${updates.length})`,
              ``,
              `🕐 Сейчас: ${timeStr} МСК`,
              `⏳ Активных сессий нет`,
              `➡ Следующая через ${startsIn} мин: <b>${nextData.title}</b>`,
              ``,
              `/next — переключить на неё`,
            ].join('\n')
          )
        } else {
          await send(chatId, `🔄 Синхронизировано. Сейчас ${timeStr} МСК — активных сессий нет.`)
        }
      }
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (text === '/next') {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    try {
      const [sessionsRaw, currentId] = await Promise.all([
        rtdbRead('sessions'),
        rtdbRead('event/activeSessionId'),
      ])
      if (!sessionsRaw) {
        await send(chatId, `❌ Сессии не найдены`)
        return NextResponse.json({ ok: true })
      }

      type FbSession = { title: string; starts_at?: string; status?: string }
      const sessions = Object.entries(sessionsRaw as Record<string, FbSession>)
        .filter(([, s]) => s.starts_at)
        .sort(([, a], [, b]) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())

      const currentIdx = sessions.findIndex(([id]) => id === currentId)
      const nextEntry = sessions[currentIdx + 1] ?? sessions.find(([, s]) => s.status === 'upcoming')

      if (!nextEntry) {
        await send(chatId, `⏭ Следующих сессий нет`)
        return NextResponse.json({ ok: true })
      }

      const [nextId, nextData] = nextEntry
      const cur = typeof currentId === 'string' ? currentId : null
      await Promise.all([
        rtdbWrite('event/activeSessionId', nextId),
        rtdbWrite(`sessions/${nextId}/status`, 'live'),
        cur ? rtdbWrite(`sessions/${cur}/status`, 'ended') : Promise.resolve(),
      ])
      await send(
        chatId,
        [`⏭ <b>Следующая сессия</b>`, ``, `▶ LIVE: <b>${nextData.title}</b>`, `ID: <code>${nextId}</code>`].join(
          '\n'
        )
      )
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  const sessionMatch = text.match(/^\/session\s+(\d+)$/)
  if (sessionMatch) {
    if (!(await ensureAdmin(chatId))) return NextResponse.json({ ok: true })
    const sessionId = `session-${sessionMatch[1]}`
    try {
      const session = await rtdbRead(`sessions/${sessionId}`)
      if (!session) {
        await send(chatId, `❌ Сессия ${sessionId} не найдена`)
        return NextResponse.json({ ok: true })
      }
      await rtdbWrite('event/activeSessionId', sessionId)
      const s = session as { title?: string }
      await send(chatId, `✅ <b>Сессия переключена</b>\n${s.title ?? sessionId}`)
    } catch (e) {
      await send(chatId, `❌ ${e}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (['/audience', '/activity', '/engagement', '/pulse'].includes(text)) {
    await send(
      chatId,
      `Укажи число, например:\n/audience 450 — участников\n/activity 67 — активность %\n/engagement 72 — вовлечённость %\n/pulse 58 — пульс зала`
    )
    return NextResponse.json({ ok: true })
  }

  await send(chatId, `Не понял. Отправь /help`)
  return NextResponse.json({ ok: true })
}
