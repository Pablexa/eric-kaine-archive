import { createStore } from '../experience/store'
import { sfx } from '../audio/sfx'
import { chime, openMic, PcmPlayer, ring, type Mic } from './audio'
import { audioDevices, callGain, chooseDevices, chooseGain, refreshDevices, type AudioDevices, type CallGain } from './devices'
import { ID_RE, LIVE_PATH, type VisitorIn, type VisitorOut, type VisitorState } from './protocol'

/**
 * The visitor's end of the live developer line: a stable five-digit number,
 * real-time developer messages, and incoming calls from the site owner.
 */

export interface DevMessage {
  mid: string
  text: string
  /** Seconds on screen; 0 = until closed. */
  ttl: number
  all: boolean
}

export type MicState = 'off' | 'starting' | 'on' | 'blocked'

export type CallUi =
  | { phase: 'idle' }
  | { phase: 'ringing' }
  | { phase: 'connected'; since: number; mic: MicState; muted: boolean }
  | { phase: 'ended'; reason: string }

const STORAGE_KEY = 'ek-archive:live'
const MIX_KEY = 'ek-archive:mix'
const RING_FOR = 45_000
const DUCK = 0.2

export const liveId = createStore<string | null>(null)
export const liveOnline = createStore(false)
export const devMessages = createStore<DevMessage[]>([])
export const liveCall = createStore<CallUi>({ phase: 'idle' })

let ws: WebSocket | null = null
let started = false
let retry = 0
let lastState: VisitorState | null = null
let stateTimer = 0
let player: PcmPlayer | null = null
let mic: Mic | null = null
let stopRing: (() => void) | null = null
let ringTimer = 0
let endTimer = 0

/** Production only, unless forced with ?live=1 (local wrangler dev) or ?live=0. */
export function liveEnabled() {
  const q = new URLSearchParams(location.search)
  if (q.has('live')) return q.get('live') !== '0'
  if (q.has('fast')) return false
  return !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
}

function randomDigits() {
  return String(10000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000))
}

function identity(): { id: string; token: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { id?: string; token?: string } | null
    if (saved?.id && ID_RE.test(saved.id) && saved.token) return { id: saved.id, token: saved.token }
  } catch {
    /* storage unavailable */
  }
  const fresh = { id: randomDigits(), token: Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('') }
  saveIdentity(fresh)
  return fresh
}

function saveIdentity(v: { id: string; token: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch {
    /* keeps working for this page load */
  }
}

let ident: { id: string; token: string } | null = null

/** The owner's music/voice mix, remembered across reloads; the newest one (server time) wins. */
let mixAt = 0

function applyMix(m: { music?: number; voice?: number; at: number }) {
  if (m.at < mixAt) return
  mixAt = m.at
  sfx.setMix(m)
  try {
    localStorage.setItem(MIX_KEY, JSON.stringify({ music: sfx.musicMix, voice: sfx.voiceMix, at: m.at }))
  } catch {
    /* applies for this page load */
  }
}

function restoreMix() {
  try {
    const saved = JSON.parse(localStorage.getItem(MIX_KEY) ?? 'null') as { music?: number; voice?: number; at?: number } | null
    if (saved && typeof saved.at === 'number') applyMix({ music: saved.music, voice: saved.voice, at: saved.at })
  } catch {
    /* defaults */
  }
}

function send(m: VisitorOut) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m))
}

function connect() {
  ident ??= identity()
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const sock = new WebSocket(`${proto}//${location.host}${LIVE_PATH}?id=${ident.id}&token=${ident.token}`)
  sock.binaryType = 'arraybuffer'
  ws = sock
  sock.onopen = () => {
    retry = 0
    liveOnline.set(true)
    if (lastState) send({ t: 'state', s: lastState })
  }
  sock.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
    if (typeof e.data !== 'string') {
      if (liveCall.get().phase === 'connected') player?.push(e.data)
      return
    }
    try {
      handle(JSON.parse(e.data) as VisitorIn)
    } catch {
      /* ignore malformed */
    }
  }
  sock.onclose = () => {
    if (ws !== sock) return
    ws = null
    liveOnline.set(false)
    endCall('Call dropped')
    const delay = Math.min(20_000, 1000 * 2 ** retry++) + Math.random() * 500
    window.setTimeout(connect, delay)
  }
}

function handle(m: VisitorIn) {
  switch (m.t) {
    case 'welcome':
      if (ident && ident.id !== m.id) {
        ident = { ...ident, id: m.id }
        saveIdentity(ident)
      }
      liveId.set(m.id)
      if (m.mix) applyMix(m.mix)
      return
    case 'mix':
      // the developer turned the music or the characters' voices up or down
      applyMix(m)
      return
    case 'reload':
      // the developer asked this tab to load the latest deploy
      location.reload()
      return
    case 'msg':
      devMessages.set([...devMessages.get().filter((d) => d.mid !== m.mid), { mid: m.mid, text: m.text, ttl: m.ttl, all: m.all }].slice(-3))
      chime()
      return
    case 'clear':
      devMessages.set([])
      return
    case 'ring':
      if (liveCall.get().phase === 'connected' || liveCall.get().phase === 'ringing') return
      window.clearTimeout(endTimer)
      liveCall.set({ phase: 'ringing' })
      stopRing = ring(audioDevices.get().output)
      ringTimer = window.setTimeout(decline, RING_FOR)
      return
    case 'volume':
      // the developer turned this visitor's site volume up or down
      sfx.setVolume(m.v)
      return
    case 'hangup':
      endCall(m.reason === 'admin' ? 'The developer hung up' : m.reason === 'lost' ? 'Call dropped' : null)
      return
  }
}

function stopRinging() {
  stopRing?.()
  stopRing = null
  window.clearTimeout(ringTimer)
}

function endCall(reason: string | null) {
  const was = liveCall.get().phase
  stopRinging()
  player?.close()
  player = null
  mic?.stop()
  mic = null
  if (sfx.duck !== 1) sfx.setDuck(1)
  if (was === 'idle' || was === 'ended') return
  if (was === 'connected' && reason) {
    liveCall.set({ phase: 'ended', reason })
    endTimer = window.setTimeout(() => {
      if (liveCall.get().phase === 'ended') liveCall.set({ phase: 'idle' })
    }, 3500)
  } else liveCall.set({ phase: 'idle' })
}

export function startLive() {
  if (started || !liveEnabled() || typeof WebSocket === 'undefined') return
  started = true
  restoreMix()
  connect()
}

/** What the developer sees in the panel (scene, sound, tab visibility). */
export function reportState(s: VisitorState) {
  lastState = s
  window.clearTimeout(stateTimer)
  stateTimer = window.setTimeout(() => send({ t: 'state', s }), 250)
}

/** Call from the click handler: the browser only lets audio start inside a gesture. */
export function answer() {
  if (liveCall.get().phase !== 'ringing') return
  stopRinging()
  player = new PcmPlayer(audioDevices.get().output, callGain.get().peer)
  send({ t: 'accept' })
  liveCall.set({ phase: 'connected', since: Date.now(), mic: 'off', muted: false })
  sfx.setDuck(DUCK)
}

export function decline() {
  if (liveCall.get().phase !== 'ringing') return
  send({ t: 'decline' })
  endCall(null)
}

export function hangUp() {
  if (liveCall.get().phase === 'idle') return
  send({ t: 'hangup' })
  endCall('Call ended')
}

const sendPcm = (pcm: ArrayBuffer) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(pcm)
}

/** Mute keeps the mic open but sends nothing; the developer sees "mic off". */
export function setCallMuted(muted: boolean) {
  const c = liveCall.get()
  if (c.phase !== 'connected' || !mic) return
  mic.setMuted(muted)
  send({ t: 'mic', on: !muted })
  liveCall.set({ ...c, muted })
}

/** Pick a mic and/or speaker; applies immediately, even in the middle of a call. */
export async function chooseCallDevices(next: Partial<AudioDevices>) {
  chooseDevices(next)
  if (next.output !== undefined) player?.setOutput(next.output)
  if (next.input === undefined || !mic) return
  const c = liveCall.get()
  const muted = c.phase === 'connected' && c.muted
  mic.stop()
  mic = null
  try {
    mic = await openMic(sendPcm, next.input, callGain.get().mic)
    mic.setMuted(muted)
  } catch {
    const now = liveCall.get()
    if (now.phase === 'connected') {
      send({ t: 'mic', on: false })
      liveCall.set({ ...now, mic: 'blocked' })
    }
  }
}

/** My mic loudness and how loud I hear the developer (0–3); applies live. */
export function setCallGain(next: Partial<CallGain>) {
  chooseGain(next)
  if (next.mic !== undefined) mic?.setGain(callGain.get().mic)
  if (next.peer !== undefined) player?.setVolume(callGain.get().peer)
}

export async function toggleMic() {
  const c = liveCall.get()
  if (c.phase !== 'connected') return
  if (mic) {
    mic.stop()
    mic = null
    send({ t: 'mic', on: false })
    liveCall.set({ ...c, mic: 'off', muted: false })
    return
  }
  liveCall.set({ ...c, mic: 'starting' })
  try {
    const opened = await openMic(sendPcm, audioDevices.get().input, callGain.get().mic)
    const now = liveCall.get()
    if (now.phase !== 'connected') {
      opened.stop()
      return
    }
    mic = opened
    send({ t: 'mic', on: true })
    liveCall.set({ ...now, mic: 'on', muted: false })
    void refreshDevices()
  } catch {
    const now = liveCall.get()
    if (now.phase === 'connected') liveCall.set({ ...now, mic: 'blocked' })
  }
}

export function dismissMessage(mid: string) {
  devMessages.set(devMessages.get().filter((d) => d.mid !== mid))
}

/** Incoming voice level and frame count, for the "talking" bars. */
export function callLevel() {
  return { level: player?.level() ?? 0, frames: player?.frames ?? 0, mic: mic?.level() ?? 0 }
}
