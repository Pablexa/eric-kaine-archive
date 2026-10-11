import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'
import { announce, SONG_LEVEL, TRACKS } from '../../../lib/audio/nowPlaying'
import { guardMusic } from '../../../lib/audio/musicGuard'

/**
 * Song 3: the owner's Bleood song, exactly as supplied (only a fixed gain to the same loudness as
 * "bloody"), looping once behind Bleoodity's act. One element, one copy (musicGuard pauses any other
 * song, in this tab or another), a steady level: SONG_LEVEL × VOL × the owner's Música × call duck.
 */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, SONG_LEVEL * sound.volume * sound.duck * sound.music)
  }, [sound.volume, sound.music, sound.duck, state])

  useEffect(() => {
    const el = audio.current
    if (!el || state !== 'on') return
    const unguard = guardMusic(el)
    const unannounce = announce(TRACKS.money, el)
    // plays for the whole act, even if sound was muted earlier; retries on a tap if the browser wants a gesture
    el.muted = false
    const play = () => { if (el.paused) void el.play().catch(() => {}) }
    play()
    window.addEventListener('pointerdown', play, { passive: true })
    window.addEventListener('keydown', play)
    return () => {
      window.removeEventListener('pointerdown', play)
      window.removeEventListener('keydown', play)
      el.pause()
      unguard()
      unannounce()
    }
  }, [state])

  if (state !== 'on') return null
  return <div data-troll-ui data-testid="background-music" data-playing={playing} className="pointer-events-none fixed bottom-1 left-1 z-[47] max-w-[60vw] bg-black px-1 font-mono text-[9px] text-[#00ff00]">
    <audio ref={audio} src="/media/bleoodity-loop.mp3" loop preload="auto" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setPlaying(!e.currentTarget.paused)} onError={() => setFailed(true)} data-testid="cheese-audio" />
    {failed ? 'MP3 failed to load :(' : `♫ ${TRACKS.money.artist.toLowerCase()} - ${TRACKS.money.title} • LOOP FOREVER.exe`}
  </div>
}
