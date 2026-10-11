import { useEffect, useRef } from 'react'
import { useSfxState } from '../shared/useSfx'
import { announce, type Track } from '../../lib/audio/nowPlaying'

/**
 * One of the experience's songs, looping while its scenes run. Follows the
 * HUD sound toggle and volume, the owner's music level and the call duck,
 * and tells the "currently playing" card what it is.
 */
export function SongLoop({ src, track, level, testid }: { src: string; track: Track; level: number; testid: string }) {
  const sound = useSfxState()
  const audio = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audio.current
    if (!el) return
    el.volume = Math.min(1, sound.volume * level * sound.duck * sound.music)
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
  }, [sound.enabled, sound.volume, sound.duck, sound.music, level])

  useEffect(() => () => audio.current?.pause(), [])
  useEffect(() => (audio.current ? announce(track, audio.current) : undefined), [track])

  return <audio ref={audio} src={src} loop preload="auto" data-testid={testid} data-troll-ui />
}
