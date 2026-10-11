import { createStore } from '../experience/store'
import { artistMedia } from '../assets/realMedia'

/**
 * The songs of the experience, in order, and which one is playing right now
 * (shown by the small "currently playing" player in the top-right corner).
 */

export interface Track {
  title: string
  artist: string
  cover: string
}

export const TRACKS = {
  /** 1 · Acts II–III */
  reasons: { title: 'Reasons I Should Stay', artist: 'Jaydes', cover: artistMedia.jaydes.src },
  /** 2 · Protocol 07, the beat */
  bloody: { title: 'bloody', artist: '2Slimey', cover: artistMedia.slimey.src },
  /** 3 · Bleoodity's act (Act IV) */
  money: { title: 'i aint start making money till i started doing drugs', artist: 'Bleood', cover: artistMedia.bleood.src },
  /** the end credits */
  patience: { title: 'patience', artist: 'revivle', cover: '/media/patience-cover.png' },
} satisfies Record<string, Track>

export const nowPlaying = createStore<{ track: Track; el: HTMLMediaElement } | null>(null)

/** Marks `el` as the song playing now; the returned function clears it again (if it is still this one). */
export function announce(track: Track, el: HTMLMediaElement) {
  const entry = { track, el }
  nowPlaying.set(entry)
  return () => {
    if (nowPlaying.get() === entry) nowPlaying.set(null)
  }
}
