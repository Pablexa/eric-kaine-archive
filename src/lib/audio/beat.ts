import { sfx } from './sfx'

/**
 * A tiny step sequencer (16 steps, one bar) in the spirit of FL Studio's
 * channel rack — a nod to Eric's "making a beat but my chat chooses the
 * sounds" stream.
 *
 * Timing runs on performance.now() so the visuals keep perfect time even when
 * sound is muted; audio events are converted to AudioContext time with a
 * small lookahead.
 */

export const ROWS = ['kick', 'clap', 'hat', 'bass', 'cowbell', 'horn'] as const
export type Row = (typeof ROWS)[number]
export type Pattern = Record<Row, boolean[]>

export const ROW_LABEL: Record<Row, string> = {
  kick: 'KICK',
  clap: 'CLAP',
  hat: 'HAT',
  bass: '808',
  cowbell: 'COWBELL',
  horn: 'AIRHORN',
}

const steps = (on: number[]) => Array.from({ length: 16 }, (_, i) => on.includes(i))

export const startingPattern = (): Pattern => ({
  kick: steps([0, 7, 10]),
  clap: steps([4, 12]),
  hat: steps([0, 2, 4, 6, 8, 10, 12, 14]),
  bass: steps([0, 7, 10]),
  cowbell: steps([]),
  horn: steps([]),
})

/** 808 notes per step (MIDI), used whenever the bass pad is on. */
const BASS_NOTES = [36, 36, 36, 36, 36, 36, 36, 39, 39, 39, 34, 34, 34, 31, 31, 31]
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export interface StepInfo {
  /** Absolute step count since start. */
  n: number
  /** 0–15 within the bar. */
  step: number
  bar: number
  /** performance.now() time the step sounds at. */
  at: number
}

export class Sequencer {
  pattern: Pattern
  bpm: number
  muted = false
  /** Called for every step (in addition to the pattern) — scripted extras. */
  extra: ((s: StepInfo, audioAt: number | undefined) => void) | null = null
  onStep: ((s: StepInfo) => void) | null = null
  /** Upcoming and recent kick times (performance.now ms). */
  kicks: number[] = []

  private timer = 0
  private next = 0
  private n = 0

  constructor(pattern: Pattern, bpm = 140) {
    this.pattern = pattern
    this.bpm = bpm
  }

  get stepMs() {
    return (60 / this.bpm / 4) * 1000
  }

  start() {
    this.next = performance.now() + 80
    this.n = 0
    this.timer = window.setInterval(() => this.schedule(), 25)
    this.schedule()
  }

  stop() {
    window.clearInterval(this.timer)
  }

  private schedule() {
    const now = performance.now()
    while (this.next < now + 120) {
      const info: StepInfo = { n: this.n, step: this.n % 16, bar: Math.floor(this.n / 16), at: this.next }
      const ctxNow = sfx.now()
      const audioAt = ctxNow === null ? undefined : ctxNow + Math.max(0, (this.next - now) / 1000)
      if (!this.muted) this.play(info, audioAt)
      this.extra?.(info, audioAt)
      const delay = Math.max(0, this.next - now)
      window.setTimeout(() => this.onStep?.(info), delay)
      this.next += this.stepMs
      this.n++
    }
  }

  private play(s: StepInfo, at: number | undefined) {
    const p = this.pattern
    const i = s.step
    if (p.kick[i]) {
      sfx.kick(at)
      this.pulse(s.at)
    }
    if (p.clap[i]) sfx.clap(at)
    if (p.hat[i]) sfx.hat(at, i % 8 === 6)
    if (p.bass[i]) sfx.bass808(midi(BASS_NOTES[i]), 0.55, at)
    if (p.cowbell[i]) sfx.cowbell(at)
    if (p.horn[i]) sfx.airhorn(at)
  }

  /** Register a visual pulse (kicks, booms) at a performance.now() time. */
  pulse(at: number) {
    this.kicks.push(at)
    if (this.kicks.length > 8) this.kicks.shift()
  }

  /** 0 → 1 envelope of the most recent kick that has already landed. */
  kickEnvelope(now = performance.now()) {
    let latest = -1e9
    for (const k of this.kicks) if (k <= now && k > latest) latest = k
    return Math.exp(-((now - latest) / 1000) * 7)
  }
}
