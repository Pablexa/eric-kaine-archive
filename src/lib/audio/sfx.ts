/**
 * Original, synthesized sound (Web Audio). No samples, no copyrighted music.
 *
 * Signal chain: voices → master gain → glue compressor → brick-wall limiter →
 * speakers. Act III is meant to be LOUD, so the limiter is what keeps "loud"
 * from ever turning into clipping or harsh peaks.
 *
 * Every voice accepts an optional `at` (AudioContext time) so the drum
 * machine can schedule sample-accurately.
 */

type Listener = () => void
type MoodVoice = 'calm' | 'annoyed' | 'angry' | 'meltdown' | 'tiny' | 'unhinged'

const STORAGE_KEY = 'ek-archive:sound'

interface ToneOpts {
  type?: OscillatorType
  gain?: number
  attack?: number
  glideTo?: number
  delay?: number
  at?: number
  detune?: number
}

interface NoiseOpts {
  gain?: number
  freq?: number
  q?: number
  type?: BiquadFilterType
  delay?: number
  at?: number
  sweepTo?: number
}

class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private humNodes: { osc: OscillatorNode[]; gain: GainNode } | null = null
  private listeners = new Set<Listener>()
  private lastChirp = 0
  private noiseBuf: AudioBuffer | null = null
  private distCurve: Float32Array<ArrayBuffer> | null = null
  private music: { timer: number; step: number; next: number } | null = null

  enabled = false
  volume = 0.9
  /** Whether the visitor has answered the "allow beeps?" question this session. */
  asked = false
  /** Set when Verity overrides "keep it silent". */
  forced = false

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const v = JSON.parse(raw) as { volume?: number }
        if (typeof v.volume === 'number') this.volume = Math.min(1, Math.max(0, v.volume))
      }
    } catch {
      /* storage unavailable: defaults are fine */
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  private emit() {
    this.listeners.forEach((l) => l())
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: this.volume }))
    } catch {
      /* ignore */
    }
  }

  /** Browsers only allow audio after the visitor has interacted with the page. */
  enable() {
    this.asked = true
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      const glue = this.ctx.createDynamicsCompressor()
      glue.threshold.value = -16
      glue.ratio.value = 4
      glue.attack.value = 0.005
      glue.release.value = 0.15
      const limiter = this.ctx.createDynamicsCompressor()
      limiter.threshold.value = -3
      limiter.knee.value = 0
      limiter.ratio.value = 20
      limiter.attack.value = 0.002
      limiter.release.value = 0.08
      this.master.connect(glue).connect(limiter).connect(this.ctx.destination)
      // a suspended context (no gesture yet) wakes on the next tap
      const wake = () => void this.ctx?.resume()
      window.addEventListener('pointerdown', wake, { passive: true })
      window.addEventListener('keydown', wake)
    }
    void this.ctx.resume()
    this.enabled = true
    this.emit()
  }

  disable() {
    this.asked = true
    this.enabled = false
    this.hum(false)
    this.stopMusic()
    this.emit()
  }

  toggle() {
    if (this.enabled) this.disable()
    else this.enable()
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02)
    this.emit()
  }

  /** AudioContext time, or null if there is no running audio. */
  now(): number | null {
    return this.ready()?.currentTime ?? null
  }

  private ready(): AudioContext | null {
    if (!this.enabled || !this.ctx || !this.master) return null
    return this.ctx
  }

  private t(ctx: AudioContext, at?: number, delay = 0) {
    return Math.max(ctx.currentTime, at ?? ctx.currentTime) + delay
  }

  private tone(freq: number, dur: number, { type = 'sine', gain = 0.2, attack = 0.004, glideTo = 0, delay = 0, at, detune = 0 }: ToneOpts = {}) {
    const ctx = this.ready()
    if (!ctx || !this.master) return
    const t0 = this.t(ctx, at, delay)
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.detune.value = detune
    osc.frequency.setValueAtTime(freq, t0)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g).connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.03)
  }

  private getNoise(ctx: AudioContext) {
    if (!this.noiseBuf) {
      const len = ctx.sampleRate * 2
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    }
    return this.noiseBuf
  }

  private noise(dur: number, { gain = 0.2, freq = 1200, q = 0.8, type = 'bandpass', delay = 0, at, sweepTo = 0 }: NoiseOpts = {}) {
    const ctx = this.ready()
    if (!ctx || !this.master) return
    const t0 = this.t(ctx, at, delay)
    const src = ctx.createBufferSource()
    src.buffer = this.getNoise(ctx)
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t0)
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur)
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t0, Math.random() * 1.5)
    src.stop(t0 + dur + 0.05)
  }

  private distortion(ctx: AudioContext) {
    if (!this.distCurve) {
      const n = 1024
      this.distCurve = new Float32Array(new ArrayBuffer(n * 4))
      for (let i = 0; i < n; i++) {
        const x = (i / n) * 2 - 1
        this.distCurve[i] = Math.tanh(x * 3.2)
      }
    }
    const ws = ctx.createWaveShaper()
    ws.curve = this.distCurve
    ws.oversample = '2x'
    return ws
  }

  // ───────────── Verity & UI ─────────────

  /** Verity's voice: one blip per few characters. */
  chirp(char = 'a', mood: MoodVoice = 'calm') {
    const now = performance.now()
    if (now - this.lastChirp < 55 || /\s/.test(char)) return
    this.lastChirp = now
    const base =
      mood === 'tiny' ? 1300 : mood === 'meltdown' ? 420 : mood === 'unhinged' ? 300 + Math.random() * 900 : mood === 'angry' ? 520 : mood === 'annoyed' ? 640 : 760
    const f = base + ((char.charCodeAt(0) * 37) % 220)
    this.tone(f, 0.05, { type: mood === 'angry' || mood === 'meltdown' || mood === 'unhinged' ? 'sawtooth' : 'square', gain: 0.045 })
  }

  click() {
    this.tone(2400, 0.03, { type: 'square', gain: 0.05 })
    this.noise(0.04, { gain: 0.08, freq: 3000 })
  }

  tick() {
    this.tone(1800, 0.025, { type: 'triangle', gain: 0.05 })
  }

  thud(intensity = 0.5) {
    const i = Math.min(1, Math.max(0.1, intensity))
    this.tone(110, 0.22, { type: 'sine', gain: 0.3 * i, glideTo: 50 })
    this.noise(0.08, { gain: 0.14 * i, freq: 500, q: 0.6 })
  }

  bonk() {
    this.tone(330, 0.16, { type: 'triangle', gain: 0.22, glideTo: 180 })
    this.tone(990, 0.06, { type: 'square', gain: 0.05 })
  }

  whoosh() {
    this.noise(0.45, { gain: 0.2, freq: 300, sweepTo: 2600, q: 1.2 })
  }

  alarm(cycles = 3) {
    for (let i = 0; i < cycles * 2; i++) {
      this.tone(i % 2 ? 660 : 880, 0.3, { type: 'triangle', gain: 0.1, delay: i * 0.32, attack: 0.03 })
    }
  }

  lightSwitch() {
    this.noise(0.03, { gain: 0.25, freq: 2500, q: 3 })
    this.tone(160, 0.08, { type: 'square', gain: 0.06, delay: 0.01 })
  }

  hum(on: boolean) {
    const ctx = this.ready()
    if (!on) {
      if (this.humNodes && this.ctx) {
        const { gain, osc } = this.humNodes
        gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15)
        osc.forEach((o) => o.stop(this.ctx!.currentTime + 0.8))
        this.humNodes = null
      }
      return
    }
    if (!ctx || !this.master || this.humNodes) return
    const gain = ctx.createGain()
    gain.gain.value = 0.0001
    gain.gain.setTargetAtTime(0.035, ctx.currentTime, 0.4)
    const osc = [55, 110, 165].map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i === 0 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.connect(gain)
      o.start()
      return o
    })
    gain.connect(this.master)
    this.humNodes = { osc, gain }
  }

  found(step = 0) {
    const root = 660 * Math.pow(2, step / 12)
    ;[0, 4, 7, 12].forEach((n, i) => this.tone(root * Math.pow(2, n / 12), 0.18, { type: 'triangle', gain: 0.08, delay: i * 0.06 }))
  }

  battery() {
    this.tone(523, 0.08, { type: 'square', gain: 0.06 })
    this.tone(784, 0.12, { type: 'square', gain: 0.06, delay: 0.08 })
  }

  lowBattery() {
    this.tone(220, 0.12, { type: 'square', gain: 0.05 })
  }

  nope() {
    this.tone(196, 0.12, { type: 'square', gain: 0.09 })
    this.tone(147, 0.2, { type: 'square', gain: 0.09, delay: 0.11 })
  }

  boing() {
    this.tone(180, 0.35, { type: 'sine', gain: 0.2, glideTo: 520 })
  }

  pop() {
    this.tone(900, 0.08, { type: 'sine', gain: 0.25, glideTo: 200 })
    this.noise(0.12, { gain: 0.22, freq: 1800, q: 0.7 })
  }

  bell() {
    this.tone(1318, 0.9, { type: 'sine', gain: 0.12 })
    this.tone(1318 * 2.76, 0.5, { type: 'sine', gain: 0.035 })
    this.tone(1760, 0.7, { type: 'sine', gain: 0.06, delay: 0.12 })
  }

  subscribeChime() {
    this.tone(1200, 0.04, { type: 'square', gain: 0.08 })
    this.bell()
  }

  fanfare() {
    const notes = [0, 4, 7, 12, 16, 19, 24]
    notes.forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), 0.35, { type: 'sawtooth', gain: 0.045, delay: i * 0.07 }))
    this.tone(392 * 4, 1.2, { type: 'triangle', gain: 0.07, delay: 0.5 })
  }

  meltdown() {
    this.tone(440, 1.4, { type: 'sawtooth', gain: 0.07, glideTo: 90 })
    this.noise(1.2, { gain: 0.07, freq: 800, sweepTo: 120, q: 0.9 })
  }

  // ───────────── Act III: chaos voices ─────────────

  /** Generic in-world "error" two-tone. Original, not any OS sound. */
  errorDing(pitch = 0) {
    const r = Math.pow(2, pitch / 12)
    this.tone(880 * r, 0.12, { type: 'triangle', gain: 0.16 })
    this.tone(587 * r, 0.22, { type: 'triangle', gain: 0.16, delay: 0.1 })
  }

  squeak() {
    this.tone(1200 + Math.random() * 600, 0.12, { type: 'square', gain: 0.08, glideTo: 2400 })
  }

  crash() {
    this.noise(0.9, { gain: 0.5, freq: 900, q: 0.4, sweepTo: 150 })
    this.tone(70, 0.6, { type: 'sine', gain: 0.5, glideTo: 30 })
    this.tone(160, 0.3, { type: 'square', gain: 0.12, glideTo: 60 })
  }

  mitosis(n = 0) {
    const f = 240 * Math.pow(2, n / 4)
    this.tone(f, 0.25, { type: 'sine', gain: 0.22, glideTo: f * 2.2 })
    this.tone(f * 1.5, 0.2, { type: 'triangle', gain: 0.08, glideTo: f * 3, delay: 0.05 })
  }

  popCombo(combo = 0) {
    const f = 500 * Math.pow(2, Math.min(combo, 36) / 12)
    this.tone(f, 0.09, { type: 'square', gain: 0.12, glideTo: f * 0.4 })
    this.noise(0.08, { gain: 0.18, freq: 2600, q: 0.8 })
  }

  recordScratch() {
    this.noise(0.55, { gain: 0.6, freq: 3000, q: 1.4, sweepTo: 200 })
    this.tone(600, 0.45, { type: 'sawtooth', gain: 0.18, glideTo: 60 })
  }

  airhorn(at?: number) {
    const ctx = this.ready()
    if (!ctx || !this.master) return
    const t0 = this.t(ctx, at)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    bp.Q.value = 0.7
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02)
    g.gain.setValueAtTime(0.35, t0 + 0.42)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
    bp.connect(g).connect(this.master)
    for (const d of [-14, 0, 9, 1200]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.detune.value = d
      o.frequency.setValueAtTime(495, t0)
      o.frequency.exponentialRampToValueAtTime(470, t0 + 0.08)
      o.connect(bp)
      o.start(t0)
      o.stop(t0 + 0.6)
    }
  }

  riser(dur = 2) {
    this.noise(dur, { gain: 0.32, freq: 200, sweepTo: 8000, q: 2 })
    this.tone(110, dur, { type: 'sawtooth', gain: 0.06, glideTo: 880, attack: dur * 0.8 })
  }

  boom(at?: number) {
    this.tone(55, 1.6, { type: 'sine', gain: 0.75, glideTo: 28, at })
    this.noise(0.5, { gain: 0.45, freq: 400, q: 0.5, at })
  }

  glitch() {
    for (let i = 0; i < 4; i++) this.tone(200 + Math.random() * 2000, 0.03, { type: 'square', gain: 0.07, delay: i * 0.035 })
  }

  // drum machine voices (scheduled)
  kick(at?: number, gain = 0.85) {
    this.tone(150, 0.28, { type: 'sine', gain, glideTo: 42, at })
    this.noise(0.02, { gain: 0.25, freq: 3000, q: 0.5, at })
  }

  snare(at?: number, gain = 0.4) {
    this.noise(0.18, { gain, freq: 1800, q: 0.6, at })
    this.tone(220, 0.1, { type: 'triangle', gain: gain * 0.5, glideTo: 160, at })
  }

  hat(at?: number, open = false) {
    this.noise(open ? 0.22 : 0.045, { gain: open ? 0.16 : 0.13, freq: 9000, q: 1, type: 'highpass', at })
  }

  clap(at?: number) {
    for (let i = 0; i < 3; i++) this.noise(0.05, { gain: 0.3, freq: 1400, q: 1.2, at: (at ?? 0) + i * 0.012 })
    this.noise(0.2, { gain: 0.22, freq: 1400, q: 1.2, at: (at ?? 0) + 0.036 })
  }

  bass808(freq: number, dur: number, at?: number, gain = 0.6) {
    const ctx = this.ready()
    if (!ctx || !this.master) return
    const t0 = this.t(ctx, at)
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq * 1.9, t0)
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.06)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    const ws = this.distortion(ctx)
    o.connect(ws).connect(g).connect(this.master)
    o.start(t0)
    o.stop(t0 + dur + 0.05)
  }

  cowbell(at?: number) {
    this.tone(540, 0.25, { type: 'square', gain: 0.08, at })
    this.tone(800, 0.25, { type: 'square', gain: 0.08, at })
  }

  stab(notes: number[], at?: number, gain = 0.07) {
    notes.forEach((m) => {
      const f = 440 * Math.pow(2, (m - 69) / 12)
      this.tone(f, 0.22, { type: 'sawtooth', gain, at, detune: -8 })
      this.tone(f, 0.22, { type: 'sawtooth', gain, at, detune: 8 })
    })
  }

  // ───────────── Act IV ─────────────

  chomp() {
    this.tone(180, 0.07, { type: 'square', gain: 0.22, glideTo: 90 })
    this.tone(150, 0.07, { type: 'square', gain: 0.22, glideTo: 70, delay: 0.09 })
    this.noise(0.06, { gain: 0.15, freq: 900, delay: 0.02 })
  }

  stamp() {
    this.tone(90, 0.25, { type: 'sine', gain: 0.6, glideTo: 40 })
    this.noise(0.12, { gain: 0.4, freq: 1200, q: 0.6 })
    this.tone(1400, 0.05, { type: 'square', gain: 0.08, delay: 0.02 })
  }

  donation() {
    ;[0, 4, 7, 12, 16].forEach((n, i) => this.tone(784 * Math.pow(2, n / 12), 0.2, { type: 'triangle', gain: 0.12, delay: i * 0.07 }))
    this.tone(2093, 0.4, { type: 'sine', gain: 0.08, delay: 0.38 })
  }

  coin() {
    this.tone(988, 0.06, { type: 'square', gain: 0.08 })
    this.tone(1319, 0.18, { type: 'square', gain: 0.08, delay: 0.06 })
  }

  siren(dur = 1.6) {
    const ctx = this.ready()
    if (!ctx || !this.master) return
    const t0 = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.05)
    g.gain.setValueAtTime(0.12, t0 + dur - 0.1)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    for (let i = 0; i <= 4; i++) o.frequency.linearRampToValueAtTime(i % 2 ? 1400 : 600, t0 + (dur / 4) * i)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 3000
    o.connect(f).connect(g).connect(this.master)
    o.start(t0)
    o.stop(t0 + dur + 0.05)
  }

  crowd(dur = 1.8) {
    this.noise(dur, { gain: 0.3, freq: 700, q: 0.4, sweepTo: 1600 })
    this.noise(dur * 0.8, { gain: 0.2, freq: 2400, q: 0.6, delay: 0.1 })
  }

  laser() {
    this.tone(1800, 0.18, { type: 'sawtooth', gain: 0.08, glideTo: 200 })
  }

  // ───────────── chiptune (an original 4-bar loop) ─────────────

  private static LEAD = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74, 72, 76, 79, 76, 74, 77, 81, 77, 79, 77, 76, 74, 72, 0, 72, 0]
  private static BASS = [48, 0, 55, 0, 50, 0, 57, 0, 48, 0, 55, 0, 53, 0, 55, 0]

  startMusic() {
    if (this.music) return
    const stepDur = 60 / 152 / 2 // eighth notes at 152 BPM
    const schedule = () => {
      const ctx = this.ready()
      if (!ctx || !this.music) return
      // never replay a backlog (e.g. sound was off for a while)
      if (this.music.next < ctx.currentTime - 0.05) this.music.next = ctx.currentTime + 0.05
      while (this.music.next < ctx.currentTime + 0.15) {
        const s = this.music.step
        const lead = Sfx.LEAD[s % Sfx.LEAD.length]
        if (lead) this.tone(440 * Math.pow(2, (lead - 69) / 12), stepDur * 0.9, { type: 'square', gain: 0.05, at: this.music.next })
        if (s % 2 === 0) {
          const b = Sfx.BASS[(s / 2) % Sfx.BASS.length]
          if (b) this.tone(440 * Math.pow(2, (b - 69) / 12), stepDur * 1.8, { type: 'triangle', gain: 0.12, at: this.music.next })
        }
        if (s % 4 === 0) this.noise(0.03, { gain: 0.06, freq: 8000, type: 'highpass', at: this.music.next })
        this.music.next += stepDur
        this.music.step++
      }
    }
    const ctx = this.ready()
    this.music = { timer: window.setInterval(schedule, 40), step: 0, next: (ctx?.currentTime ?? 0) + 0.05 }
    schedule()
  }

  stopMusic() {
    if (!this.music) return
    window.clearInterval(this.music.timer)
    this.music = null
  }
}

export const sfx = new Sfx()
