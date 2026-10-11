import { PCM_RATE } from './protocol'

/**
 * Call audio for the live developer line. Raw 16 kHz PCM over the site's own
 * WebSocket: no WebRTC, no TURN, no IP addresses exchanged between the two
 * people on the call. Latency is roughly the jitter cushion (~120 ms) plus
 * the network.
 */

type AC = typeof AudioContext
const AudioCtx = (): AC => window.AudioContext || (window as unknown as { webkitAudioContext: AC }).webkitAudioContext

export interface Mic {
  /** Silences outgoing frames without releasing the microphone. */
  setMuted(muted: boolean): void
  /** Outgoing loudness, 0–3 (the worklet clips anything past full scale). */
  setGain(gain: number): void
  /** Latest peak, 0–1. */
  level(): number
  stop(): void
}

type SinkCapable = { setSinkId?: (id: string) => Promise<void> }

/** Routes an AudioContext or media element to a chosen output ('' = system default). */
export function routeTo(target: AudioContext | HTMLMediaElement, output: string) {
  const t = target as unknown as SinkCapable
  if (t.setSinkId) void t.setSinkId(output).catch(() => {})
}

/** Opens the microphone (a chosen one, or the default) and calls `onFrame` with each 40 ms PCM frame. */
export async function openMic(onFrame: (pcm: ArrayBuffer) => void, deviceId = '', gain = 1): Promise<Mic> {
  const base = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { ...base, deviceId: { exact: deviceId } } : base })
  } catch (e) {
    // the chosen mic was unplugged or renamed: fall back to the default one
    if (!deviceId) throw e
    stream = await navigator.mediaDevices.getUserMedia({ audio: base })
  }
  const ctx = new (AudioCtx())()
  try {
    await ctx.audioWorklet.addModule('/live/capture-worklet.js')
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop())
    void ctx.close()
    throw e
  }
  const source = ctx.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(ctx, 'live-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] })
  const sink = ctx.createGain()
  sink.gain.value = 0
  const pre = ctx.createGain()
  pre.gain.value = gain
  source.connect(pre).connect(node).connect(sink).connect(ctx.destination)
  void ctx.resume()

  let muted = false
  let peak = 0
  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; peak: number }>) => {
    peak = muted ? 0 : e.data.peak
    if (!muted) onFrame(e.data.pcm)
  }

  return {
    setMuted: (m) => {
      muted = m
    },
    setGain: (g) => {
      pre.gain.setTargetAtTime(Math.max(0, Math.min(3, g)), ctx.currentTime, 0.02)
    },
    level: () => peak,
    stop: () => {
      node.port.onmessage = null
      source.disconnect()
      pre.disconnect()
      node.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}

/** Plays incoming PCM frames back to back with a small jitter cushion. */
export class PcmPlayer {
  private ctx: AudioContext
  private out: GainNode
  private analyser: AnalyserNode
  private next = 0
  private probe = new Float32Array(256)
  /** Frames received (for the UI and for tests). */
  frames = 0

  /** Create inside a click/tap handler so the browser lets it start. */
  constructor(output = '', volume = 1) {
    this.ctx = new (AudioCtx())()
    if (output) routeTo(this.ctx, output)
    this.out = this.ctx.createGain()
    this.out.gain.value = volume
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.out.connect(this.analyser)
    this.out.connect(this.ctx.destination)
    void this.ctx.resume()
  }

  resume() {
    void this.ctx.resume()
  }

  /** Speaker or headphones ('' = system default). */
  setOutput(output: string) {
    routeTo(this.ctx, output)
  }

  setVolume(v: number) {
    this.out.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02)
  }

  push(frame: ArrayBuffer) {
    this.frames++
    const pcm = new Int16Array(frame)
    if (!pcm.length) return
    const buf = this.ctx.createBuffer(1, pcm.length, PCM_RATE)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000
    const now = this.ctx.currentTime
    // fell behind (gap) or drifted too far ahead: restart with a fresh cushion
    if (this.next < now + 0.02 || this.next > now + 0.6) this.next = now + 0.12
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.connect(this.out)
    src.start(this.next)
    this.next += buf.duration
  }

  /** Current output peak, 0–1 (drives the "talking" indicator). */
  level() {
    this.analyser.getFloatTimeDomainData(this.probe)
    let p = 0
    for (const v of this.probe) p = Math.max(p, Math.abs(v))
    return p
  }

  close() {
    void this.ctx.close()
  }
}

/** Tiny synthesized cues (fallback ring, message chime). Silent until the page has had a gesture. */
let cueCtx: AudioContext | null = null
function cues() {
  cueCtx ??= new (AudioCtx())()
  void cueCtx.resume()
  return cueCtx
}

function beep(ctx: AudioContext, at: number, freqs: number[], dur: number, gain: number) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.015)
  g.gain.setValueAtTime(gain, at + dur - 0.03)
  g.gain.linearRampToValueAtTime(0, at + dur)
  g.connect(ctx.destination)
  for (const f of freqs) {
    const o = ctx.createOscillator()
    o.frequency.value = f
    o.connect(g)
    o.start(at)
    o.stop(at + dur + 0.02)
  }
}

/** The owner's ringtone, looping until the call is answered, declined or ends. */
export const RINGTONE = '/media/ringtone.mp3'

export function ring(output = ''): () => void {
  const audio = new Audio(RINGTONE)
  if (output) routeTo(audio, output)
  audio.loop = true
  audio.volume = 0.9
  let fallback: (() => void) | null = null
  let stopped = false
  // Blocked or missing file: the synthesized two-tone ring still announces the call.
  void audio.play().catch(() => {
    if (!stopped) fallback = toneRing()
  })
  return () => {
    stopped = true
    audio.pause()
    audio.currentTime = 0
    fallback?.()
  }
}

/** Classic two-tone ring, repeating until stopped (fallback when the MP3 can't play). */
function toneRing(): () => void {
  let stopped = false
  let timer = 0
  const once = () => {
    if (stopped) return
    try {
      const ctx = cues()
      const t = ctx.currentTime + 0.02
      beep(ctx, t, [440, 480], 0.45, 0.12)
      beep(ctx, t + 0.6, [440, 480], 0.45, 0.12)
    } catch {
      /* no audio: the popup still shows */
    }
    timer = window.setTimeout(once, 2600)
  }
  once()
  return () => {
    stopped = true
    window.clearTimeout(timer)
  }
}

export function chime() {
  try {
    const ctx = cues()
    const t = ctx.currentTime + 0.02
    beep(ctx, t, [880], 0.12, 0.1)
    beep(ctx, t + 0.13, [1320], 0.2, 0.1)
  } catch {
    /* ignore */
  }
}
