/**
 * Live "developer line": the site owner can push messages to visitors and
 * call one of them. Shared between the browser (visitor + admin panel) and
 * the Worker's Durable Object (worker/index.ts).
 *
 * Text frames are JSON. Binary frames are call audio: raw PCM, signed 16-bit,
 * mono, 16 kHz (one frame ≈ 40 ms). Audio always relays through the server,
 * so neither side ever learns the other's IP address.
 */

export const LIVE_PATH = '/api/live'
export const PCM_RATE = 16000
export const FRAME_SAMPLES = 640
export const MAX_TEXT = 500
export const MAX_TTL = 120

/** Visitor IDs are five digits, shown small in the top-left corner. */
export const ID_RE = /^\d{5}$/

export interface VisitorState {
  phase: string
  scene: string | null
  route: string | null
  /** Site sound toggle (effects). */
  sound: boolean
  /** Tab is in the foreground. */
  visible: boolean
}

export interface VisitorInfo {
  id: string
  s: VisitorState
  /** First connection, ms epoch. */
  since: number
  tabs: number
  call: 'idle' | 'ringing' | 'connected'
}

export type CallPhase = 'ringing' | 'connected' | 'ended' | 'declined' | 'offline' | 'busy'

/** visitor → server */
export type VisitorOut =
  | { t: 'state'; s: VisitorState }
  | { t: 'accept' }
  | { t: 'decline' }
  | { t: 'hangup' }
  | { t: 'mic'; on: boolean }

/** server → visitor */
export type VisitorIn =
  | { t: 'welcome'; id: string }
  | { t: 'msg'; mid: string; text: string; ttl: number; all: boolean }
  | { t: 'clear' }
  | { t: 'ring' }
  | { t: 'hangup'; reason: 'admin' | 'elsewhere' | 'lost' }

/** admin → server */
export type AdminOut =
  | { t: 'auth'; key: string }
  | { t: 'msg'; to: 'all' | string; text: string; ttl: number }
  | { t: 'clear'; to: 'all' | string }
  | { t: 'call'; to: string }
  | { t: 'hangup' }

/** server → admin */
export type AdminIn =
  | { t: 'authed'; visitors: VisitorInfo[] }
  | { t: 'denied' }
  | { t: 'visitor'; v: VisitorInfo }
  | { t: 'gone'; id: string }
  | { t: 'sent'; to: 'all' | string; n: number }
  | { t: 'call'; id: string; phase: CallPhase }
  | { t: 'visitor-mic'; id: string; on: boolean }
