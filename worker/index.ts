/**
 * erickaine.site Worker.
 *
 * Static files come straight from dist/ (assets). Only /api/* reaches this
 * script: /api/live upgrades to a WebSocket held by the single `Hub` Durable
 * Object, which relays the owner's developer messages and call audio.
 *
 * Every per-socket fact lives in the socket attachment, so the hub can
 * hibernate between messages without losing who is who or who is on a call.
 */
import { DurableObject } from 'cloudflare:workers'
import {
  ID_RE,
  LIVE_PATH,
  MAX_TEXT,
  MAX_TTL,
  type AdminIn,
  type AdminOut,
  type VisitorIn,
  type VisitorInfo,
  type VisitorOut,
  type VisitorState,
} from '../src/lib/live/protocol'

interface Env {
  HUB: DurableObjectNamespace<Hub>
  ASSETS: Fetcher
  /** Set with `npx wrangler secret put ADMIN_KEY`. Without it, nobody can open the panel. */
  ADMIN_KEY?: string
}

interface VisitorTag {
  role: 'visitor'
  id: string
  token: string
  since: number
  at: number
  s: VisitorState
  call: 'idle' | 'ringing' | 'connected'
}

interface AdminTag {
  role: 'admin'
  authed: boolean
  /** Visitor ID this panel is calling or talking to. */
  call: string | null
}

type Tag = VisitorTag | AdminTag

const EMPTY: VisitorState = { phase: 'professional', scene: null, route: null, sound: false, visible: true }
const MAX_FRAME = 4096
const MAX_JSON = 2048

function send(ws: WebSocket, msg: VisitorIn | AdminIn) {
  try {
    ws.send(JSON.stringify(msg))
  } catch {
    /* socket already closing */
  }
}

const tagOf = (ws: WebSocket) => ws.deserializeAttachment() as Tag | null
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null)

async function keyOk(given: string, expected: string | undefined) {
  if (!expected || expected.length < 8) return false
  const enc = new TextEncoder()
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ])
  return crypto.subtle.timingSafeEqual(a, b)
}

export class Hub extends DurableObject<Env> {
  /** Per-socket throttle for state reports (lost on hibernation, which is fine). */
  private lastState = new WeakMap<WebSocket, number>()

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const [client, server] = Object.values(new WebSocketPair())

    if (url.searchParams.get('role') === 'admin') {
      this.ctx.acceptWebSocket(server, ['admin'])
      server.serializeAttachment({ role: 'admin', authed: false, call: null } satisfies AdminTag)
      return new Response(null, { status: 101, webSocket: client })
    }

    const token = str(url.searchParams.get('token'), 64) ?? ''
    let id = url.searchParams.get('id') ?? ''
    if (!ID_RE.test(id) || this.taken(id, token)) id = this.freshId()
    this.ctx.acceptWebSocket(server, ['visitor', `v:${id}`])
    const now = Date.now()
    server.serializeAttachment({ role: 'visitor', id, token, since: now, at: now, s: EMPTY, call: 'idle' } satisfies VisitorTag)
    send(server, { t: 'welcome', id })
    this.announce(id)
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    const tag = tagOf(ws)
    if (!tag) return
    if (typeof msg !== 'string') return this.relayAudio(tag, msg)
    if (msg.length > MAX_JSON) return
    let m: unknown
    try {
      m = JSON.parse(msg)
    } catch {
      return
    }
    if (!m || typeof m !== 'object') return
    if (tag.role === 'admin') await this.fromAdmin(ws, tag, m as AdminOut)
    else this.fromVisitor(ws, tag, m as VisitorOut)
  }

  async webSocketClose(ws: WebSocket) {
    this.dropSocket(ws)
  }

  async webSocketError(ws: WebSocket) {
    this.dropSocket(ws)
  }

  // ── admin ────────────────────────────────────────────────────────────

  private async fromAdmin(ws: WebSocket, tag: AdminTag, m: AdminOut) {
    if (!tag.authed) {
      const key = m.t === 'auth' ? str(m.key, 256) : null
      if (key === null || !(await keyOk(key, this.env.ADMIN_KEY))) {
        send(ws, { t: 'denied' })
        ws.close(4003, 'denied')
        return
      }
      tag.authed = true
      ws.serializeAttachment(tag)
      send(ws, { t: 'authed', visitors: this.list() })
      return
    }

    switch (m.t) {
      case 'msg': {
        const text = str(m.text, MAX_TEXT)?.trim()
        if (!text || !this.validTarget(m.to)) return
        const ttl = Math.max(0, Math.min(MAX_TTL, Math.round(Number(m.ttl) || 0)))
        const all = m.to === 'all'
        const reached = new Set<string>()
        const mid = crypto.randomUUID()
        for (const v of this.targets(m.to)) {
          send(v, { t: 'msg', mid, text, ttl, all })
          reached.add((tagOf(v) as VisitorTag).id)
        }
        send(ws, { t: 'sent', to: m.to, n: reached.size })
        return
      }
      case 'clear': {
        if (!this.validTarget(m.to)) return
        for (const v of this.targets(m.to)) send(v, { t: 'clear' })
        return
      }
      case 'call': {
        if (typeof m.to !== 'string' || !ID_RE.test(m.to)) return
        if (tag.call) this.endCall(tag.call, ws)
        const sockets = this.ctx.getWebSockets(`v:${m.to}`)
        if (!sockets.length) return send(ws, { t: 'call', id: m.to, phase: 'offline' })
        const busy = this.admins().some((a) => a !== ws && (tagOf(a) as AdminTag).call === m.to)
        if (busy) return send(ws, { t: 'call', id: m.to, phase: 'busy' })
        tag.call = m.to
        ws.serializeAttachment(tag)
        for (const v of sockets) {
          const vt = tagOf(v) as VisitorTag
          vt.call = 'ringing'
          v.serializeAttachment(vt)
          send(v, { t: 'ring' })
        }
        send(ws, { t: 'call', id: m.to, phase: 'ringing' })
        this.announce(m.to)
        return
      }
      case 'hangup': {
        if (tag.call) this.endCall(tag.call, null)
        return
      }
    }
  }

  // ── visitors ─────────────────────────────────────────────────────────

  private fromVisitor(ws: WebSocket, tag: VisitorTag, m: VisitorOut) {
    switch (m.t) {
      case 'state': {
        const now = Date.now()
        if (now - (this.lastState.get(ws) ?? 0) < 200) return
        this.lastState.set(ws, now)
        const s = m.s ?? EMPTY
        tag.s = {
          phase: str(s.phase, 24) ?? 'professional',
          scene: str(s.scene, 24),
          route: str(s.route, 12),
          sound: s.sound === true,
          visible: s.visible !== false,
        }
        tag.at = now
        ws.serializeAttachment(tag)
        this.announce(tag.id)
        return
      }
      case 'accept': {
        if (tag.call !== 'ringing') return
        const admin = this.callerOf(tag.id)
        if (!admin) {
          tag.call = 'idle'
          ws.serializeAttachment(tag)
          send(ws, { t: 'hangup', reason: 'lost' })
          return
        }
        tag.call = 'connected'
        ws.serializeAttachment(tag)
        // the same visitor in another tab stops ringing
        for (const other of this.ctx.getWebSockets(`v:${tag.id}`)) {
          if (other === ws) continue
          const ot = tagOf(other) as VisitorTag
          if (ot.call === 'idle') continue
          ot.call = 'idle'
          other.serializeAttachment(ot)
          send(other, { t: 'hangup', reason: 'elsewhere' })
        }
        send(admin, { t: 'call', id: tag.id, phase: 'connected' })
        this.announce(tag.id)
        return
      }
      case 'decline':
      case 'hangup': {
        if (tag.call === 'idle') return
        const wasConnected = tag.call === 'connected'
        tag.call = 'idle'
        ws.serializeAttachment(tag)
        const stillRinging = this.ctx
          .getWebSockets(`v:${tag.id}`)
          .some((o) => o !== ws && (tagOf(o) as VisitorTag).call !== 'idle')
        // a decline in one tab ends the call only when no other tab is still ringing
        if (wasConnected || !stillRinging) {
          for (const o of this.ctx.getWebSockets(`v:${tag.id}`)) {
            if (o === ws) continue
            const ot = tagOf(o) as VisitorTag
            if (ot.call === 'idle') continue
            ot.call = 'idle'
            o.serializeAttachment(ot)
            send(o, { t: 'hangup', reason: 'elsewhere' })
          }
          this.releaseAdmin(tag.id, m.t === 'decline' && !wasConnected ? 'declined' : 'ended')
        }
        this.announce(tag.id)
        return
      }
      case 'mic': {
        if (tag.call !== 'connected') return
        const admin = this.callerOf(tag.id)
        if (admin) send(admin, { t: 'visitor-mic', id: tag.id, on: m.on === true })
        return
      }
    }
  }

  // ── audio relay ──────────────────────────────────────────────────────

  private relayAudio(tag: Tag, frame: ArrayBuffer) {
    if (frame.byteLength > MAX_FRAME || frame.byteLength % 2) return
    if (tag.role === 'admin') {
      if (!tag.authed || !tag.call) return
      for (const v of this.ctx.getWebSockets(`v:${tag.call}`)) {
        if ((tagOf(v) as VisitorTag).call === 'connected') v.send(frame)
      }
    } else if (tag.call === 'connected') {
      this.callerOf(tag.id)?.send(frame)
    }
  }

  // ── bookkeeping ──────────────────────────────────────────────────────

  private dropSocket(ws: WebSocket) {
    const tag = tagOf(ws)
    if (!tag) return
    try {
      ws.serializeAttachment(null)
    } catch {
      /* already gone */
    }
    if (tag.role === 'admin') {
      if (tag.call) this.endCall(tag.call, ws)
      return
    }
    const rest = this.ctx.getWebSockets(`v:${tag.id}`).filter((o) => o !== ws && tagOf(o))
    if (tag.call !== 'idle' && !rest.some((o) => (tagOf(o) as VisitorTag).call !== 'idle')) {
      this.releaseAdmin(tag.id, 'ended')
    }
    if (rest.length) this.announce(tag.id, ws)
    else this.toAdmins({ t: 'gone', id: tag.id })
  }

  /** The owner hung up (or left): stop ringing / talking on every tab of `id`. */
  private endCall(id: string, except: WebSocket | null) {
    for (const v of this.ctx.getWebSockets(`v:${id}`)) {
      const vt = tagOf(v) as VisitorTag | null
      if (!vt || vt.call === 'idle') continue
      vt.call = 'idle'
      v.serializeAttachment(vt)
      send(v, { t: 'hangup', reason: 'admin' })
    }
    for (const a of this.admins()) {
      const at = tagOf(a) as AdminTag
      if (at.call !== id) continue
      at.call = null
      a.serializeAttachment(at)
      if (a !== except) send(a, { t: 'call', id, phase: 'ended' })
    }
    this.announce(id)
  }

  private releaseAdmin(id: string, phase: 'ended' | 'declined') {
    for (const a of this.admins()) {
      const at = tagOf(a) as AdminTag
      if (at.call !== id) continue
      at.call = null
      a.serializeAttachment(at)
      send(a, { t: 'call', id, phase })
    }
  }

  private callerOf(id: string) {
    return this.admins().find((a) => (tagOf(a) as AdminTag).call === id) ?? null
  }

  private admins() {
    return this.ctx.getWebSockets('admin').filter((a) => (tagOf(a) as AdminTag | null)?.authed)
  }

  private validTarget(to: unknown): to is 'all' | string {
    return to === 'all' || (typeof to === 'string' && ID_RE.test(to))
  }

  private targets(to: 'all' | string) {
    return this.ctx.getWebSockets(to === 'all' ? 'visitor' : `v:${to}`).filter((v) => tagOf(v))
  }

  private taken(id: string, token: string) {
    return this.ctx.getWebSockets(`v:${id}`).some((o) => (tagOf(o) as VisitorTag | null)?.token !== token)
  }

  private freshId() {
    for (;;) {
      const id = String(10000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000))
      if (!this.ctx.getWebSockets(`v:${id}`).length) return id
    }
  }

  private info(id: string, exclude?: WebSocket): VisitorInfo | null {
    const tags = this.ctx
      .getWebSockets(`v:${id}`)
      .filter((o) => o !== exclude)
      .map((o) => tagOf(o) as VisitorTag | null)
      .filter((t): t is VisitorTag => !!t)
    if (!tags.length) return null
    const latest = tags.reduce((a, b) => (b.at > a.at ? b : a))
    const call = tags.some((t) => t.call === 'connected') ? 'connected' : tags.some((t) => t.call === 'ringing') ? 'ringing' : 'idle'
    return { id, s: latest.s, since: Math.min(...tags.map((t) => t.since)), tabs: tags.length, call }
  }

  private list(): VisitorInfo[] {
    const ids = new Set<string>()
    for (const v of this.ctx.getWebSockets('visitor')) {
      const t = tagOf(v) as VisitorTag | null
      if (t) ids.add(t.id)
    }
    return [...ids].map((id) => this.info(id)).filter((v): v is VisitorInfo => !!v)
  }

  private announce(id: string, exclude?: WebSocket) {
    const v = this.info(id, exclude)
    this.toAdmins(v ? { t: 'visitor', v } : { t: 'gone', id })
  }

  private toAdmins(msg: AdminIn) {
    for (const a of this.admins()) send(a, msg)
  }
}

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === LIVE_PATH) {
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('Expected a WebSocket', { status: 426 })
      // only pages from this same site may connect
      const origin = req.headers.get('Origin')
      if (origin && new URL(origin).host !== url.host) return new Response('Forbidden', { status: 403 })
      return env.HUB.get(env.HUB.idFromName('hub')).fetch(req)
    }
    if (url.pathname.startsWith('/api/')) return Response.json({ error: 'not found' }, { status: 404 })
    return env.ASSETS.fetch(req)
  },
} satisfies ExportedHandler<Env>
