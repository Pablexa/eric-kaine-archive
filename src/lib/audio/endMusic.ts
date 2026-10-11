import { createStore } from '../experience/store'
import { sfx } from './sfx'
import { announce, TRACKS } from './nowPlaying'

/**
 * The end credits song. When an ending is reached every other song stops and
 * only this one plays, with its own visible player (play/pause, skip, seek,
 * volume). It follows the owner's music level and ducks under live calls.
 */

export const PATIENCE = {
  src: '/media/patience.mp3',
  cover: '/media/patience-cover.png',
  title: 'patience',
  artist: 'revivle',
  link: 'https://soundcloud.com/revivle/patience',
} as const

const VOLUME_KEY = 'ek-archive:credits-volume'
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export interface EndMusicState {
  playing: boolean
  /** Seconds. */
  time: number
  duration: number
  volume: number
  muted: boolean
}

function savedVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    const v = raw === null ? NaN : Number(raw)
    return Number.isFinite(v) ? clamp01(v) : 0.8
  } catch {
    return 0.8
  }
}

export const endMusic = createStore<EndMusicState>({ playing: false, time: 0, duration: 0, volume: savedVolume(), muted: false })

let el: HTMLAudioElement | null = null
let wantPlay = false
let unsubscribe: (() => void) | null = null
let unannounce: (() => void) | null = null

const patch = (p: Partial<EndMusicState>) => endMusic.set({ ...endMusic.get(), ...p })

function applyVolume() {
  if (!el) return
  const s = endMusic.get()
  el.volume = clamp01(s.volume * sfx.musicMix * sfx.duck)
  el.muted = s.muted
}

/** If the browser blocked autoplay, the next tap anywhere (except the player's own buttons) starts it. */
function retry(e: Event) {
  if (!el || !el.paused || !wantPlay) return
  if (e.target instanceof Element && e.target.closest('[data-player-controls]')) return
  void el.play().catch(() => {})
}

const onPlay = () => patch({ playing: true })
const onPause = () => patch({ playing: false })
const onTime = () => el && patch({ time: el.currentTime })
const onMeta = () => el && Number.isFinite(el.duration) && patch({ duration: el.duration })

export function startEndMusic() {
  if (el) return
  el = new Audio(PATIENCE.src)
  el.loop = true
  el.preload = 'auto'
  el.addEventListener('play', onPlay)
  el.addEventListener('pause', onPause)
  el.addEventListener('timeupdate', onTime)
  el.addEventListener('loadedmetadata', onMeta)
  el.addEventListener('durationchange', onMeta)
  applyVolume()
  unsubscribe = sfx.subscribe(applyVolume)
  unannounce = announce(TRACKS.patience, el)
  window.addEventListener('pointerdown', retry, { passive: true })
  window.addEventListener('keydown', retry)
  wantPlay = true
  void el.play().catch(() => {})
}

export function stopEndMusic() {
  wantPlay = false
  window.removeEventListener('pointerdown', retry)
  window.removeEventListener('keydown', retry)
  unsubscribe?.()
  unsubscribe = null
  unannounce?.()
  unannounce = null
  if (el) {
    el.pause()
    el.removeEventListener('play', onPlay)
    el.removeEventListener('pause', onPause)
    el.removeEventListener('timeupdate', onTime)
    el.removeEventListener('loadedmetadata', onMeta)
    el.removeEventListener('durationchange', onMeta)
    el = null
  }
  patch({ playing: false, time: 0 })
}

export function togglePlay() {
  if (!el) return
  if (el.paused) {
    wantPlay = true
    void el.play().catch(() => {})
  } else {
    wantPlay = false
    el.pause()
  }
}

export function seek(seconds: number) {
  if (!el || !Number.isFinite(seconds)) return
  const end = Number.isFinite(el.duration) ? el.duration : seconds
  el.currentTime = Math.min(Math.max(0, seconds), Math.max(0, end - 0.05))
  patch({ time: el.currentTime })
}

export function skip(by: number) {
  if (el) seek(el.currentTime + by)
}

export function setEndVolume(v: number) {
  patch({ volume: clamp01(v), muted: false })
  try {
    localStorage.setItem(VOLUME_KEY, String(endMusic.get().volume))
  } catch {
    /* this visit only */
  }
  applyVolume()
}

export function toggleEndMute() {
  patch({ muted: !endMusic.get().muted })
  applyVolume()
}
