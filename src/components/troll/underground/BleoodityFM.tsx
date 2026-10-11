import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'
import { announce, SONG_LEVEL, TRACKS } from '../../../lib/audio/nowPlaying'
import { guardMusic } from '../../../lib/audio/musicGuard'


/** Song 3, Bleood's "i aint start making money till i started doing drugs", looping behind every underground scene. No separate player. */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  // The visitor has no control here; the site owner does (live panel: site volume and music). Ducks under
  // live calls and Bleoodity's lines, and never restarts playback.
  // Exactly the level of "bloody" (2Slimey) in Protocols 04–06: same file loudness (≈ −16.5 LUFS) and the same
  // chain (SONG_LEVEL × site volume × the owner's Música × call duck), so Bleoodity is heard like Eric Kaineity was.
  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, SONG_LEVEL * sound.volume * sound.duck * sound.music)
  }, [sound.volume, sound.music, sound.duck, state])

  useEffect(() => {
    if (state !== 'on' || !audio.current) return
    const el = audio.current
    const unguard = guardMusic(el)
    const unannounce = announce(TRACKS.money, el)
    return () => {
      unguard()
      unannounce()
    }
  }, [state])

  useEffect(() => {
    const el = audio.current
    if (!el || state !== 'on') return
    // The loop ignores the sound toggle: it plays for the whole Bleoodity act.
    el.muted = false
    // Retry on a tap if the browser requires a fresh gesture for media playback.
    const play = () => { if (el.paused) void el.play().catch(() => {}) }
    play()
    window.addEventListener('pointerdown', play, { passive: true })
    window.addEventListener('keydown', play)
    return () => {
      window.removeEventListener('pointerdown', play)
      window.removeEventListener('keydown', play)
      el.pause()
    }
  }, [state])

  if (state !== 'on') return null
  return <div data-troll-ui data-testid="background-music" data-playing={playing} className="pointer-events-none fixed bottom-1 left-1 z-[47] max-w-[60vw] bg-black px-1 font-mono text-[9px] text-[#00ff00]">
    <audio ref={audio} src="/media/bleoodity-loop.mp3" autoPlay loop preload="auto" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setPlaying(!e.currentTarget.paused)} onError={() => setFailed(true)} data-testid="cheese-audio" />
    {failed ? 'MP3 failed to load :(' : `♫ ${TRACKS.money.artist.toLowerCase()} - ${TRACKS.money.title} • LOOP FOREVER.exe`}
  </div>
}
