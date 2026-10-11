import { useEffect, useRef, useState } from 'react'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { useSfxState } from '../../shared/useSfx'

/** Local meme MP3, looping behind every underground scene. No separate player. */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = audio.current
    if (!el || state !== 'on') return
    el.volume = sound.volume * 0.8
    el.muted = !sound.enabled
    // Retry on a tap if the browser requires a fresh gesture for media playback.
    const play = () => { void el.play().catch(() => {}) }
    play()
    window.addEventListener('pointerdown', play, { passive: true })
    window.addEventListener('keydown', play)
    return () => {
      window.removeEventListener('pointerdown', play)
      window.removeEventListener('keydown', play)
      el.pause()
    }
  }, [state, sound.enabled, sound.volume])

  if (state !== 'on') return null
  return <div data-troll-ui data-testid="background-music" data-playing={playing} data-muted={!sound.enabled} className="pointer-events-none fixed bottom-1 left-1 z-[47] max-w-[60vw] bg-black px-1 font-mono text-[9px] text-[#00ff00]">
    <audio ref={audio} src="/media/bleood-cheese.mp3" autoPlay loop preload="auto" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} data-testid="cheese-audio" />
    {failed ? 'MP3 failed to load :(' : '♫ bleood — mhm i got the cheese • LOOP FOREVER.exe'}
  </div>
}
