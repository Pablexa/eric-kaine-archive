import { createStore } from '../lib/experience/store'
import { openMic, PcmPlayer, ring, type Mic } from '../lib/live/audio'
import { audioDevices, chooseDevices, refreshDevices, type AudioDevices } from '../lib/live/devices'
import { ID_RE, LIVE_PATH, type AdminIn, type AdminOut, type CallPhase, type VisitorInfo } from '../lib/live/protocol'

/** The owner's end of the live developer line (admin panel). */

export type Conn = 'login' | 'connecting' | 'online' | 'denied' | 'offline'

export type AdminCallPhase = 'idle' | 'mic' | 'mic-blocked' | 'no-answer' | CallPhase

export interface AdminCall {
  id: string | null
  phase: AdminCallPhase
  since: number | null
  muted: boolean
  visitorMic: boolean
}

export interface LogEntry {
  at: number
  text: string
  tone?: 'ok' | 'warn'
}

const KEY_STORAGE = 'ek-admin:key'
const RING_FOR = 45_000

export const conn = createStore<Conn>('login')
export const visitors = createStore<Map<string, VisitorInfo>>(new Map())
export const call = createStore<AdminCall>({ id: null, phase: 'idle', since: null, muted: false, visitorMic: false })
export const log = createStore<LogEntry[]>([])

let ws: WebSocket | null = null
let key = ''
let retry = 0
let denied = false
let mic: Mic | null = null
let player: PcmPlayer | null = null
let stopRingback: (() => void) | null = null
let ringTimer = 0

const ACTIVE: AdminCallPhase[] = ['mic', 'ringing', 'connected']

function note(text: string, tone?: LogEntry['tone']) {
  log.set([{ at: Date.now(), text, tone }, ...log.get()].slice(0, 80))
}

function send(m: AdminOut) {
  if (ws?.readyState !== WebSocket.OPEN) return false
  ws.send(JSON.stringify(m))
  return true
}

export function savedKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function login(k: string) {
  key = k
  denied = false
  try {
    sessionStorage.setItem(KEY_STORAGE, k)
  } catch {
    /* fine: asks again after reload */
  }
  connect()
}

export function logout() {
  try {
    sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
  key = ''
  hangup()
  const old = ws
  ws = null
  old?.close()
  conn.set('login')
}

function connect() {
  conn.set('connecting')
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const sock = new WebSocket(`${proto}//${location.host}${LIVE_PATH}?role=admin`)
  sock.binaryType = 'arraybuffer'
  ws = sock
  sock.onopen = () => sock.send(JSON.stringify({ t: 'auth', key } satisfies AdminOut))
  sock.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
    if (typeof e.data !== 'string') {
      if (call.get().phase === 'connected') player?.push(e.data)
      return
    }
    try {
      handle(JSON.parse(e.data) as AdminIn)
    } catch {
      /* ignore malformed */
    }
  }
  sock.onclose = () => {
    if (ws !== sock) return
    ws = null
    if (ACTIVE.includes(call.get().phase)) finish('ended', 'Se cortó la conexión con el servidor')
    if (denied || !key) {
      conn.set(denied ? 'denied' : 'login')
      return
    }
    conn.set('offline')
    const delay = Math.min(15_000, 1000 * 2 ** retry++)
    window.setTimeout(() => {
      if (key && !ws) connect()
    }, delay)
  }
}

function handle(m: AdminIn) {
  switch (m.t) {
    case 'authed':
      retry = 0
      conn.set('online')
      visitors.set(new Map(m.visitors.map((v) => [v.id, v])))
      note(`Conectado. ${m.visitors.length} visitante(s) en la web.`, 'ok')
      return
    case 'denied':
      denied = true
      try {
        sessionStorage.removeItem(KEY_STORAGE)
      } catch {
        /* ignore */
      }
      return
    case 'visitor': {
      const next = new Map(visitors.get())
      if (!next.has(m.v.id)) note(`Entró #${m.v.id}`)
      next.set(m.v.id, m.v)
      visitors.set(next)
      return
    }
    case 'gone': {
      const next = new Map(visitors.get())
      if (next.delete(m.id)) note(`Se fue #${m.id}`)
      visitors.set(next)
      return
    }
    case 'sent':
      note(m.to === 'all' ? `Mensaje enviado a toda la página (${m.n} visitante/s)` : m.n ? `Mensaje enviado a #${m.to}` : `#${m.to} no está conectado: no le llegó`, m.n ? 'ok' : 'warn')
      return
    case 'call': {
      const c = call.get()
      if (c.id !== m.id) return
      if (m.phase === 'ringing') {
        call.set({ ...c, phase: 'ringing' })
        stopRingback?.()
        stopRingback = ring(audioDevices.get().output)
        window.clearTimeout(ringTimer)
        ringTimer = window.setTimeout(() => {
          if (call.get().phase !== 'ringing') return
          send({ t: 'hangup' })
          finish('no-answer', `#${m.id} no contestó`)
        }, RING_FOR)
        note(`Llamando a #${m.id}…`)
      } else if (m.phase === 'connected') {
        stopRingback?.()
        stopRingback = null
        window.clearTimeout(ringTimer)
        call.set({ ...c, phase: 'connected', since: Date.now() })
        note(`#${m.id} contestó. Estás en llamada.`, 'ok')
      } else {
        const text = { ended: `Llamada con #${m.id} terminada`, declined: `#${m.id} rechazó la llamada`, offline: `#${m.id} no está conectado`, busy: `#${m.id} ya está en otra llamada` }[m.phase]
        finish(m.phase, text)
      }
      return
    }
    case 'visitor-mic': {
      const c = call.get()
      if (c.id === m.id) call.set({ ...c, visitorMic: m.on })
      note(m.on ? `#${m.id} activó su micrófono` : `#${m.id} apagó su micrófono`)
      return
    }
  }
}

function release() {
  stopRingback?.()
  stopRingback = null
  window.clearTimeout(ringTimer)
  mic?.stop()
  mic = null
  player?.close()
  player = null
}

function finish(phase: AdminCallPhase, text: string) {
  release()
  const c = call.get()
  call.set({ ...c, phase, since: null, visitorMic: false, muted: false })
  note(text, phase === 'ended' ? undefined : 'warn')
}

/** Call from the click handler (the browser needs the gesture for audio). */
export async function startCall(id: string) {
  if (!ID_RE.test(id) || conn.get() !== 'online') return
  if (ACTIVE.includes(call.get().phase)) hangup()
  player = new PcmPlayer(audioDevices.get().output)
  call.set({ id, phase: 'mic', since: null, muted: false, visitorMic: false })
  try {
    mic = await openMic(sendPcm, audioDevices.get().input)
    void refreshDevices()
  } catch {
    finish('mic-blocked', 'No se pudo abrir tu micrófono (permiso bloqueado o sin micrófono)')
    return
  }
  if (call.get().id !== id || call.get().phase !== 'mic') {
    mic.stop()
    mic = null
    return
  }
  if (!send({ t: 'call', to: id })) finish('ended', 'Sin conexión con el servidor')
}

export function hangup() {
  const c = call.get()
  if (!ACTIVE.includes(c.phase)) return
  send({ t: 'hangup' })
  finish('ended', c.phase === 'connected' ? `Colgaste a #${c.id}` : `Cancelaste la llamada a #${c.id}`)
}

const sendPcm = (pcm: ArrayBuffer) => {
  if (call.get().phase === 'connected' && ws?.readyState === WebSocket.OPEN) ws.send(pcm)
}

/** Elegir micrófono y/o salida; se aplica al instante, también en plena llamada. */
export async function chooseCallDevices(next: Partial<AudioDevices>) {
  chooseDevices(next)
  if (next.output !== undefined) player?.setOutput(next.output)
  if (next.input === undefined || !mic) return
  const muted = call.get().muted
  mic.stop()
  mic = null
  try {
    mic = await openMic(sendPcm, next.input)
    mic.setMuted(muted)
    note('Cambiaste de micrófono')
  } catch {
    note('No se pudo abrir ese micrófono', 'warn')
  }
}

export function setMuted(muted: boolean) {
  mic?.setMuted(muted)
  call.set({ ...call.get(), muted })
}

export function sendMessage(to: 'all' | string, text: string, ttl: number) {
  const clean = text.trim()
  if (!clean) return false
  if (to !== 'all' && !ID_RE.test(to)) return false
  return send({ t: 'msg', to, text: clean, ttl })
}

export function clearScreens(to: 'all' | string) {
  if (send({ t: 'clear', to })) note(to === 'all' ? 'Borraste los mensajes de todas las pantallas' : `Borraste los mensajes de #${to}`)
}

export function levels() {
  return { me: mic?.level() ?? 0, them: player?.level() ?? 0, frames: player?.frames ?? 0 }
}
