import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'
import { announce, TRACKS } from '../../../lib/audio/nowPlaying'

/** Base level of the loop (the MP3 is normalised to about -16 LUFS). */
const LEVEL = 0.7

/** Song 3, Bleood's "i aint start making money till i started doing drugs", looping behind every underground scene. No separate player. */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  // Only the site owner sets this level (live panel → music); it ducks under live calls and never restarts playback.
  useEffect(() => {
    if (audio.current) audio.current.volume = LEVEL * sound.duck * sound.music
  }, [sound.music, sound.duck, state])

  useEffect(() => {
    if (state !== 'on' || !audio.current) return
    return announce(TRACKS.money, audio.current)
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
