import { sfx } from './sfx'
import { TIME } from '../animation/timeline'
import type { Author } from '../experience/chat'

/**
 * Character voices. Eric Kaineity speaks pre-rendered lines in a voice cloned,
 * with consent, from the site owner's own recording (scripts/voice/). Bleoodity
 * speaks in real snippets cut from the Bleood meme clip. Voices follow the
 * effects toggle and are skipped in fast (test) mode.
 */
interface Manifest { lines: Record<string, string>; barks: string[] }

const BLEOOD = Array.from({ length: 7 }, (_, i) => `/media/voice/bleood-${i + 1}.mp3`)
const ERIC_DIR = '/media/voice/eric/'
let manifest: Manifest | null = null
let loading: Promise<void> | null = null
let current: HTMLAudioElement | null = null

function load() {
  loading ??= fetch(`${ERIC_DIR}manifest.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : { lines: {}, barks: [] }))
    .then((m) => { manifest = m })
    .catch(() => { manifest = { lines: {}, barks: [] } })
  return loading
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

function source(text: string, author: Author): string | null {
  if (author === 'bleoodity') return pick(BLEOOD)
  if (!manifest) return null
  const file = manifest.lines[text.trim()] ?? (manifest.barks.length ? pick(manifest.barks) : null)
  return file ? ERIC_DIR + file : null
}

export const voice = {
  preload: () => void load(),
  /** `interrupt: false` keeps a line that is already playing (for rapid chat spam). */
  speak(text: string, author: Author, { interrupt = true } = {}) {
    if (author === 'system' || !sfx.enabled || TIME.scale < 1) return
    if (!interrupt && current && !current.paused && !current.ended) return
    const play = () => {
      const src = source(text, author)
      if (!src) return
      current?.pause()
      const audio = new Audio(src)
      audio.volume = Math.min(1, sfx.volume * sfx.duck)
      if (author === 'bleoodity') {
        audio.preservesPitch = false
        audio.playbackRate = 0.85 + Math.random() * 0.35
      }
      current = audio
      void audio.play().catch(() => {})
    }
    if (manifest) play()
    else {
      const asked = performance.now()
      void load().then(() => { if (performance.now() - asked < 1500) play() })
    }
  },
  stop() {
    current?.pause()
    current = null
  },
}
