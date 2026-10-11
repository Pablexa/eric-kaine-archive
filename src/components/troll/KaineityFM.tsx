import { useEffect, useRef } from 'react'
import { useSfxState } from '../shared/useSfx'
import { announce, TRACKS } from '../../lib/audio/nowPlaying'

/** The first song of the experience ("Reasons I Should Stay"), looping under Acts II–III. Follows the HUD sound toggle. */
export function KaineityFM() {
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audio.current
    if (!el) return
    el.volume = sound.volume * 0.5 * sound.duck * sound.music
    if (!sound.enabled) {
      el.pause()
      return
    }
    const play = () => { void el.play().catch(() => {}) }
    play()
    window.addEventListener('pointerdown', play, { passive: true })
    window.addEventListener('keydown', play)
    return () => {
      window.removeEventListener('pointerdown', play)
      window.removeEventListener('keydown', play)
    }
  }, [sound.enabled, sound.volume, sound.duck, sound.music])

  useEffect(() => () => audio.current?.pause(), [])
  useEffect(() => (audio.current ? announce(TRACKS.reasons, audio.current) : undefined), [])

  return <audio ref={audio} src="/media/reasons-i-should-stay.mp3" loop preload="auto" data-testid="kaineity-audio" data-troll-ui />
}
