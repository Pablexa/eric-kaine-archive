import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'
import { announce, TRACKS } from '../../../lib/audio/nowPlaying'
import { speaking } from '../../../lib/audio/voice'
import { guardMusic } from '../../../lib/audio/musicGuard'

/** The loop (normalised to about -16 LUFS) starts at half level, then sits well under Bleoodity so her voice is clear. */
const START_LEVEL = 0.5
const UNDER_LEVEL = 0.15
const START_FOR = 9000
/** Extra dip while a voice line is audible. */
const UNDER_VOICE = 0.4

/** Song 3, Bleood's "i aint start making money till i started doing drugs", looping behind every underground scene. No separate player. */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  const talking = useStore(speaking)
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (state !== 'on') return
    setSettled(false)
    const t = window.setTimeout(() => setSettled(true), START_FOR)
    return () => window.clearTimeout(t)
  }, [state])

  // The visitor has no control here; the site owner does (live panel: site volume and music). Ducks under
  // live calls and Bleoodity's lines, and never restarts playback.
  const level = (settled ? UNDER_LEVEL : START_LEVEL) * (talking ? UNDER_VOICE : 1)
  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, level * sound.volume * sound.duck * sound.music)
  }, [level, sound.volume, sound.music, sound.duck, state])

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
  return <div data-troll-ui data-testid="background-music" data-playing={playing} data-level={settled ? 'under' : 'start'} className="pointer-events-none fixed bottom-1 left-1 z-[47] max-w-[60vw] bg-black px-1 font-mono text-[9px] text-[#00ff00]">
    <audio ref={audio} src="/media/bleoodity-loop.mp3" autoPlay loop preload="auto" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setPlaying(!e.currentTarget.paused)} onError={() => setFailed(true)} data-testid="cheese-audio" />
    {failed ? 'MP3 failed to load :(' : `♫ ${TRACKS.money.artist.toLowerCase()} - ${TRACKS.money.title} • LOOP FOREVER.exe`}
  </div>
}
