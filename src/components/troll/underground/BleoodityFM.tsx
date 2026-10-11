import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'

/** Cursed 2Slimey bootleg, looping behind every underground scene. No separate player. */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  // Follows the HUD volume slider (down to silence) and ducks under live calls; never restarts playback.
  useEffect(() => {
    if (audio.current) audio.current.volume = sound.volume * 0.8 * sound.duck
  }, [sound.volume, sound.duck, state])

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
    {failed ? 'MP3 failed to load :(' : '♫ 2slimey (cursed bootleg) • LOOP FOREVER.exe'}
  </div>
}
