import { useEffect, useRef } from 'react'
import { useSfxState } from '../shared/useSfx'

/** Eric Kaineity's cursed underground loop under Acts II–III. Follows the HUD sound toggle. */
export function KaineityFM() {
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audio.current
    if (!el) return
    el.volume = sound.volume * 0.45 * sound.duck
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
  }, [sound.enabled, sound.volume, sound.duck])

  useEffect(() => () => audio.current?.pause(), [])

  return <audio ref={audio} src="/media/kaineity-loop.mp3" loop preload="auto" data-testid="kaineity-audio" data-troll-ui />
}
