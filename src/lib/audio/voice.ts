import { sfx } from './sfx'
import { TIME } from '../animation/timeline'
import type { Author } from '../experience/chat'

/**
 * Character voices: pre-rendered lines in cloned voices (scripts/voice/), each
 * from a recording the site owner supplied with consent. Eric Kaineity uses
 * voice/eric/, Bleoodity voice/bleoodity/; a line not in the manifest gets a
 * short bark. If Bleoodity's files are missing she falls back to real snippets
 * of the Bleood meme clip. Voices follow the effects toggle and are skipped in
 * fast (test) mode.
 */
interface Manifest { lines: Record<string, string>; barks: string[] }
type Speaker = 'verity' | 'bleoodity'

const DIRS: Record<Speaker, string> = { verity: '/media/voice/eric/', bleoodity: '/media/voice/bleoodity/' }
const BLEOOD = Array.from({ length: 7 }, (_, i) => `/media/voice/bleood-${i + 1}.mp3`)
const EMPTY: Manifest = { lines: {}, barks: [] }
const manifests: Partial<Record<Speaker, Manifest>> = {}
const loading: Partial<Record<Speaker, Promise<void>>> = {}
let current: HTMLAudioElement | null = null

function load(who: Speaker) {
  loading[who] ??= fetch(`${DIRS[who]}manifest.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : EMPTY))
    .then((m) => { manifests[who] = m })
    .catch(() => { manifests[who] = EMPTY })
  return loading[who]
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]
const speakerOf = (author: Author): Speaker => (author === 'bleoodity' ? 'bleoodity' : 'verity')

function source(text: string, author: Author): { src: string; snippet: boolean } | null {
  const who = speakerOf(author)
  const m = manifests[who]
  if (!m) return null
  const file = m.lines[text.trim()] ?? (m.barks.length ? pick(m.barks) : null)
  if (file) return { src: DIRS[who] + file, snippet: false }
  return who === 'bleoodity' ? { src: pick(BLEOOD), snippet: true } : null
}

export const voice = {
  preload: () => {
    void load('verity')
    void load('bleoodity')
  },
  /**
   * Plays a line's voice. Resolves when it has finished (or was cut off, failed,
   * or there is nothing to play), so chat.say can wait for it before the next line.
   * `interrupt: false` keeps a line that is already playing (for rapid chat spam).
   */
  speak(text: string, author: Author, { interrupt = true } = {}): Promise<void> {
    if (author === 'system' || !sfx.enabled || (TIME.scale < 1 && !TIME.voice)) return Promise.resolve()
    if (!interrupt && current && !current.paused && !current.ended) return Promise.resolve()
    return new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        window.clearTimeout(cap)
        resolve()
      }
      // never let a stuck clip hold the script forever
      const cap = window.setTimeout(done, 15_000)
      const play = () => {
        const clip = source(text, author)
        if (!clip) return done()
        current?.pause()
        const audio = new Audio(clip.src)
        // through the effects chain so the owner's voice level can go above 100 %
        if (!sfx.route(audio, sfx.voiceMix)) audio.volume = Math.min(1, sfx.volume * sfx.duck * sfx.voiceMix)
        if (clip.snippet) {
          // fallback meme snippets: vary the pitch so repeats don't sound identical
          audio.preservesPitch = false
          audio.playbackRate = 0.85 + Math.random() * 0.35
        }
        audio.addEventListener('ended', done, { once: true })
        audio.addEventListener('error', done, { once: true })
        audio.addEventListener('pause', done, { once: true })
        current = audio
        void audio.play().catch(done)
      }
      const who = speakerOf(author)
      if (manifests[who]) play()
      else {
        const asked = performance.now()
        void load(who).then(() => (performance.now() - asked < 1500 ? play() : done()))
      }
    })
  },
  stop() {
    current?.pause()
    current = null
  },
}
