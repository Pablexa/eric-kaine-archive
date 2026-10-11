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

/**
 * The owner's mix for a visitor: `music` scales every song on the site (0–1),
 * `voice` scales the characters' spoken lines (0–3, so above normal is allowed).
 */
export interface Mix {
  music: number
  voice: number
}
export const DEFAULT_MIX: Mix = { music: 1, voice: 1 }
export const MAX_VOICE = 3

export interface VisitorState {
  phase: string
  scene: string | null
  route: string | null
  /** Site sound toggle (effects). */
  sound: boolean
  /** Tab is in the foreground. */
  visible: boolean
  /** Site volume, 0–1 (music, effects and voices). */
  volume: number
  /** The owner's mix as applied on this visitor (see Mix). */
  music: number
  voice: number
  /** Which deploy this tab runs (an old tab may still be open after a new deploy). */
  build?: string
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
  | { t: 'welcome'; id: string; mix?: Mix & { at: number } }
  | { t: 'msg'; mid: string; text: string; ttl: number; all: boolean }
  | { t: 'clear' }
  | { t: 'ring' }
  | { t: 'hangup'; reason: 'admin' | 'elsewhere' | 'lost' }
  | { t: 'volume'; v: number }
  | { t: 'mix'; music?: number; voice?: number; at: number }
  | { t: 'reload' }

/** admin → server */
export type AdminOut =
  | { t: 'auth'; key: string }
  | { t: 'msg'; to: 'all' | string; text: string; ttl: number }
  | { t: 'clear'; to: 'all' | string }
  | { t: 'call'; to: string }
  | { t: 'volume'; to: 'all' | string; v: number }
  | { t: 'mix'; to: 'all' | string; music?: number; voice?: number }
  | { t: 'reload'; to: 'all' | string }
  | { t: 'hangup' }

/** server → admin */
export type AdminIn =
  | { t: 'authed'; visitors: VisitorInfo[]; mix: Mix }
  /** The mix every visitor gets (also new ones), after a change to 'all'. */
  | { t: 'mix-default'; mix: Mix }
  | { t: 'denied' }
  | { t: 'visitor'; v: VisitorInfo }
  | { t: 'gone'; id: string }
  | { t: 'sent'; to: 'all' | string; n: number }
  | { t: 'call'; id: string; phase: CallPhase }
  | { t: 'visitor-mic'; id: string; on: boolean }
