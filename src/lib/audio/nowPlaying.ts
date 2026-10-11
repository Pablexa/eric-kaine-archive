import { createStore } from '../experience/store'

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
  reasons: { title: 'Reasons I Should Stay', artist: 'Jaydes', cover: '/media/covers/reasons.jpg' },
  /** Protocols 04–06, the MySpace era (kaineity-loop.mp3) */
  bloody: { title: 'bloody', artist: '2Slimey', cover: '/media/covers/bloody.jpg' },
  /** 2 · Protocol 07, the underground song you make on the beat (beat-scene.mp3) */
  habits: { title: 'Habits', artist: 'OsamaSon', cover: '/media/covers/habits.jpg' },
  /** 3 · Bleoodity's act (Act IV) */
  money: { title: 'i aint start making money till i started doing drugs', artist: 'Bleood', cover: '/media/covers/money.jpg' },
  /** the end credits */
  patience: { title: 'patience', artist: 'revivle', cover: '/media/patience-cover.png' },
} satisfies Record<string, Track>

/** Every looping song plays at this level (× site volume × the owner's Música × call duck), so they all sound alike. */
export const SONG_LEVEL = 0.5

export const nowPlaying = createStore<{ track: Track; el: HTMLMediaElement } | null>(null)

/** Marks `el` as the song playing now; the returned function clears it again (if it is still this one). */
export function announce(track: Track, el: HTMLMediaElement) {
  const entry = { track, el }
  nowPlaying.set(entry)
  return () => {
    if (nowPlaying.get() === entry) nowPlaying.set(null)
  }
}
