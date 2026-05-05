import { SPEAKERS, SESSIONS } from '@/lib/data'

export default function SpeakersPage() {
  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead text-white/50 mb-2">Эксперты</p>
          <h1 className="heading text-white">{SPEAKERS.length} спикеров</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-2">
        {SPEAKERS.map(speaker => {
          const sessions = SESSIONS.filter(s => s.speaker_id === speaker.id)
          return (
            <div key={speaker.id} className="card p-4">
              <div className="flex gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={speaker.photo_url} alt={speaker.name}
                  className="w-14 h-14 rounded-2xl object-cover grayscale opacity-90 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-[#0f1f3d] text-base leading-tight">{speaker.name}</h2>
                  <p className="text-xs text-[#2563eb] font-medium mt-0.5">{speaker.role}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📍 {speaker.city}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{speaker.bio}</p>
              {sessions.length > 0 && (
                <div className="pt-2.5 border-t border-gray-100 space-y-1">
                  {sessions.map(s => (
                    <div key={s.id} className="flex gap-2 text-xs">
                      <span className="text-gray-400 font-mono w-14 flex-shrink-0">
                        {new Date(s.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })} д{s.day}
                      </span>
                      <span className="text-gray-600 line-clamp-1">{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
