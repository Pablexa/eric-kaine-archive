import { sfx } from '../audio/sfx'
import { voice } from '../audio/voice'
import { Aborted, TIME, prefersReducedMotion } from '../animation/timeline'
import type { Mood } from './machine'

/**
 * Verity talks in Minecraft-style chat lines ("<verity> hi."), the same
 * format Eric's Verity-mod thumbnails use. Lines type out, chirp, hold, then
 * fade. Clicking / Space fast-forwards the current line.
 */

export type Author = 'verity' | 'system' | 'bleoodity'

export interface ChatLine {
  id: number
  author: Author
  text: string
  shown: number
  done: boolean
  at: number
  tone?: 'normal' | 'loud'
}

type Listener = () => void

class ChatStore {
  lines: ChatLine[] = []
  private listeners = new Set<Listener>()
  private skipFlag = false
  private nextId = 1
  mood: Mood = 'calm'
  /** Each line gets a fresh array so useSyncExternalStore sees the change. */
  private snapshot: ChatLine[] = []

  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  getSnapshot = () => this.snapshot

  private emit() {
    this.snapshot = [...this.lines]
    this.listeners.forEach((l) => l())
  }

  skip() {
    this.skipFlag = true
  }

  clear() {
    this.lines = []
    this.emit()
  }

  /** Post a line instantly (no typing). */
  post(text: string, author: Author = 'verity', tone: ChatLine['tone'] = 'normal') {
    const line: ChatLine = { id: this.nextId++, author, text, shown: text.length, done: true, at: Date.now(), tone }
    this.lines = [...this.lines.slice(-7), line]
    this.emit()
    void voice.speak(text, author, { interrupt: false })
    return line
  }

  /**
   * Type a line out. Resolves after the hold time (or immediately when skipped).
   * `hold` defaults to a reading-time estimate.
   */
  say(
    text: string,
    { signal, speed = 26, hold, author = 'verity', tone = 'normal' }: { signal?: AbortSignal; speed?: number; hold?: number; author?: Author; tone?: ChatLine['tone'] } = {},
  ): Promise<void> {
    const reduce = prefersReducedMotion() || TIME.scale < 1
    const line: ChatLine = { id: this.nextId++, author, text, shown: reduce ? text.length : 0, done: reduce, at: Date.now(), tone }
    this.lines = [...this.lines.slice(-7), line]
    this.skipFlag = false
    this.emit()
    // The next line waits for this one's voice to finish, so lines never talk over each other.
    let voiced = false
    void voice.speak(text, author).then(() => { voiced = true })
    const holdMs = (hold ?? Math.min(2600, 700 + text.length * 32)) * TIME.scale

    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Aborted())
      let timer = 0
      const finish = () => {
        window.clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }
      const onAbort = () => {
        window.clearTimeout(timer)
        reject(new Aborted())
      }
      signal?.addEventListener('abort', onAbort, { once: true })

      const holdPhase = () => {
        line.done = true
        line.shown = text.length
        this.emit()
        const start = performance.now()
        this.skipFlag = false
        const check = () => {
          if (signal?.aborted) return
          if (this.skipFlag) {
            // skipping also cuts the voice, so the next line never talks over it
            this.skipFlag = false
            voice.stop()
            finish()
          } else if (voiced && performance.now() - start >= holdMs) finish()
          else timer = window.setTimeout(check, 50)
        }
        check()
      }

      if (reduce) return holdPhase()

      const typeNext = () => {
        if (signal?.aborted) return
        if (this.skipFlag) {
          this.skipFlag = false
          return holdPhase()
        }
        line.shown++
        sfx.chirp(text[line.shown - 1], this.mood)
        this.emit()
        if (line.shown >= text.length) holdPhase()
        else timer = window.setTimeout(typeNext, /[.,?!]/.test(text[line.shown - 1]) ? speed * 5 : speed)
      }
      timer = window.setTimeout(typeNext, speed)
    })
  }
}

export const chat = new ChatStore()

/** Small bubble messages next to the docked orb (Act I foreshadowing). */
class BubbleStore {
  text: string | null = null
  private listeners = new Set<Listener>()
  private timer = 0
  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  getSnapshot = () => this.text
  show(text: string, ms = 2800) {
    this.text = text
    this.listeners.forEach((l) => l())
    window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => this.hide(), ms)
  }
  hide() {
    this.text = null
    this.listeners.forEach((l) => l())
  }
}

export const bubble = new BubbleStore()
