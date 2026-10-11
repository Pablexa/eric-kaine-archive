import { sfx } from './sfx'

/**
 * Protocol 07's cracked studio. The song is a real, owner-supplied cursed
 * underground beat (/media/beat-scene.mp3). This file maps that track (tempo,
 * grid, gap, drop) and runs a 16-step channel rack that FOLLOWS the song
 * instead of synthesizing one: the pads only light up, pulse and preview.
 *
 * Everything runs on song time (seconds into the MP3). SongClock reads it from
 * the playing <audio> element, so the audio clock drives the scene; when the
 * track cannot play (or always in fast/test mode) a virtual clock takes over.
 */

/** Measured from the file: 154 BPM, the drop on beat 32 (the first beat of bar 9). */
export const TRACK = {
  src: '/media/beat-scene.mp3',
  bpm: 154,
  /** The loud intro/build stutters out here (a silent-ish gap)… */
  gap: 11.4,
  /** …and THE DROP hits here. */
  drop: 12.55,
  /** The fade-out starts here. */
  fade: 39,
  length: 42,
} as const

export const BEAT_S = 60 / TRACK.bpm
export const BAR_S = BEAT_S * 4
export const STEP_S = BEAT_S / 4
/** Song time of step 0, derived so the drop lands exactly on a downbeat (≈ 0.08 s, as measured). */
export const GRID_OFFSET = TRACK.drop - 32 * BEAT_S
/** Bar index (in the 16-step grid) the drop starts on. */
export const DROP_BAR = 8

export type Section = 'intro' | 'cowbell' | 'horns' | 'build' | 'drop'

/** Song time (s) each section starts at: two bars each, then the drop. */
export const SECTION_AT: Record<Section, number> = {
  intro: 0,
  cowbell: GRID_OFFSET + BAR_S * 2,
  horns: GRID_OFFSET + BAR_S * 4,
  build: GRID_OFFSET + BAR_S * 6,
  drop: TRACK.drop,
}

/** The drop runs ten bars (~15.6 s of chaos), then the scene moves on. */
export const DROP_BARS = 10
export const DROP_END = TRACK.drop + DROP_BARS * BAR_S

/** 3 · 2 · 1 inside the gap, one per beat, so the count finishes exactly on the drop. */
export const COUNTDOWN: { at: number; label: string }[] = [
  { at: TRACK.gap, label: '3' },
  { at: TRACK.drop - BEAT_S * 2, label: '2' },
  { at: TRACK.drop - BEAT_S, label: '1' },
]

export const ROWS = ['kick', 'clap', 'hat', 'bass', 'cowbell', 'horn'] as const
export type Row = (typeof ROWS)[number]
export type Pattern = Record<Row, boolean[]>

export const ROW_LABEL: Record<Row, string> = {
  kick: 'BLEOOD KICK',
  clap: 'SLIMEY CLAP',
  hat: 'SLAYR HATS',
  bass: 'OSAMA 808',
  cowbell: 'JAYDES BELL',
  horn: 'CARTI HORN',
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

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** A short one-shot when a pad is switched on. The MP3 stays the song. */
export function previewPad(row: Row) {
  if (row === 'kick') sfx.kick(undefined, 0.6)
  else if (row === 'clap') sfx.clap()
  else if (row === 'hat') sfx.hat()
  else if (row === 'bass') sfx.bass808(midi(36), 0.35, undefined, 0.45)
  else if (row === 'cowbell') sfx.cowbell()
  else sfx.airhorn()
}

export interface StepInfo {
  /** Absolute step count since step 0 of the grid. */
  n: number
  /** 0–15 within the bar. */
  step: number
  bar: number
  /** performance.now() time the step was reached. */
  at: number
}

/**
 * A 16-step channel rack (in the spirit of FL Studio's) locked to the song's
 * grid. It never makes sound: call `advance(songTime)` every frame and it
 * fires `extra` / `onStep` once for every step crossed, and registers a visual
 * pulse for each lit kick pad.
 */
export class Sequencer {
  pattern: Pattern
  bpm: number
  /** Song time (s) of step 0. */
  offset: number
  /** No visual kick pulses while set (the gap before the drop). */
  muted = false
  /** Called for every step — scripted extras. */
  extra: ((s: StepInfo) => void) | null = null
  onStep: ((s: StepInfo) => void) | null = null
  /** Recent pulse times (performance.now ms). */
  kicks: number[] = []

  private n = -1

  constructor(pattern: Pattern, bpm: number = TRACK.bpm, offset: number = GRID_OFFSET) {
    this.pattern = pattern
    this.bpm = bpm
    this.offset = offset
  }

  get stepMs() {
    return (60 / this.bpm / 4) * 1000
  }

  /** Catch up to song time `t` (seconds). */
  advance(t: number, now = performance.now()) {
    const target = Math.floor((t - this.offset) / (this.stepMs / 1000))
    if (target <= this.n) return
    // after a long stall (hidden tab) only replay the last bar, not a backlog
    for (let n = Math.max(this.n + 1, target - 15, 0); n <= target; n++) {
      const info: StepInfo = { n, step: n % 16, bar: Math.floor(n / 16), at: now }
      if (!this.muted && this.pattern.kick[info.step]) this.pulse(now)
      this.extra?.(info)
      this.onStep?.(info)
    }
    this.n = target
  }

  /** Register a visual pulse (kicks, booms) at a performance.now() time. */
  pulse(at: number) {
    this.kicks.push(at)
    if (this.kicks.length > 8) this.kicks.shift()
  }

  /** 0 → 1 envelope of the most recent pulse that has already landed. */
  kickEnvelope(now = performance.now()) {
    let latest = -1e9
    for (const k of this.kicks) if (k <= now && k > latest) latest = k
    return Math.exp(-((now - latest) / 1000) * 7)
  }
}

/** How long to wait for the MP3 to start before running without it. */
const START_GRACE = 2.5
/** currentTime updates coarsely in some browsers: interpolate this long between updates. */
const INTERPOLATE = 0.35
/** A stalled track holds the clock this long (buffering), then the clock runs on its own. */
const STALL = 2

/**
 * Song time in seconds. While the <audio> element plays, its currentTime is
 * the clock. Without a usable element (none given, blocked, failed, stalled)
 * a virtual clock advances at `rate` × real time instead.
 */
export class SongClock {
  private t = 0
  private last = performance.now()
  private lastAudio = -1
  private sinceAudio = 0
  private waited = 0
  private started = false

  constructor(
    private readonly audio: HTMLAudioElement | null,
    private readonly rate = 1,
  ) {}

  /** The last value `now()` returned. */
  get time() {
    return this.t
  }

  /** Read the clock (call once per frame). */
  now(perf = performance.now()) {
    const dt = Math.min(1.5, Math.max(0, (perf - this.last) / 1000))
    this.last = perf
    const a = this.audio
    if (a && !a.paused && !a.ended && !a.error) {
      const at = a.currentTime
      if (at !== this.lastAudio) {
        this.lastAudio = at
        this.sinceAudio = 0
        if (at > 0) this.started = true
        if (this.started) return (this.t = at)
      }
      this.sinceAudio += dt
      if (!this.started) {
        // still loading: wait for the music instead of running ahead of it
        this.waited += dt
        if (this.waited < START_GRACE) return this.t
      } else if (this.sinceAudio < INTERPOLATE) {
        return (this.t = this.lastAudio + this.sinceAudio)
      } else if (this.sinceAudio < STALL) {
        return this.t
      }
    }
    this.t += dt * this.rate
    return this.t
  }
}
