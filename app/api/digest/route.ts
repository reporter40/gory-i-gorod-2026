import { NextRequest, NextResponse } from 'next/server'
import { generateDayDigest } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { day, sessionSyntheses } = await req.json()

  if (!day || !sessionSyntheses) {
    return NextResponse.json({ error: 'day and sessionSyntheses required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key') {
    return NextResponse.json({
      digest: `**Дайджест дня ${day}**\n\nДля генерации дайджеста необходимо подключить ANTHROPIC_API_KEY. Добавьте ключ в .env.local и перезапустите сервер.\n\nВ дайджесте будут отражены ключевые инсайты, консенсус аудитории и рекомендации для городов.`,
    })
  }

  try {
    const digest = await generateDayDigest(day, sessionSyntheses)
    return NextResponse.json({ digest })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
