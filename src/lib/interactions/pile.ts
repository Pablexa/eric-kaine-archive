import Matter from 'matter-js'
import { Aborted, easeInOutCubic, tween } from '../animation/timeline'

/**
 * PileEngine turns real page elements into physical objects.
 *
 * capture()  → every [data-physics] element is cloned into a fixed layer at its
 *              exact on-screen position; the original keeps its layout but is
 *              hidden. Each clone gets a Matter body (static until released).
 * release()  → the piece starts obeying gravity.
 * reassemble → every clone flies back to where its original lives, then the
 *              originals reappear. The page is never actually destroyed.
 */

export interface Piece {
  el: HTMLElement
  clone: HTMLElement
  body: Matter.Body
  w: number
  h: number
  label: string
  released: boolean
}

export interface HitEvent {
  piece: Piece
  speed: number
  nx: number
  ny: number
}

const COPY_STYLES = [
  'font-family',
  'font-size',
  'font-weight',
  'font-stretch',
  'font-style',
  'font-variation-settings',
  'letter-spacing',
  'line-height',
  'color',
  'text-transform',
  'text-align',
] as const

export class PileEngine {
  engine: Matter.Engine
  pieces: Piece[] = []
  private walls: Matter.Body[] = []
  private verityBody: Matter.Body
  private layer: HTMLElement
  private raf = 0
  private running = false
  private acc = 0
  private last = 0
  private drag: { constraint: Matter.Constraint; pointerId: number; piece: Piece } | null = null
  private stage: HTMLElement | null = null
  private lastHit = 0
  private onHitCb: ((e: HitEvent) => void) | null = null
  private onGrabCb: ((p: Piece) => void) | null = null
  private vPrev = { x: -999, y: -999 }
  /** Only pieces the visitor actually threw can hit Verity. */
  private thrownAt = new Map<Matter.Body, number>()

  constructor(layer: HTMLElement) {
    this.layer = layer
    this.engine = Matter.Engine.create({ enableSleeping: true })
    this.engine.gravity.y = 1.15
    this.engine.positionIterations = 8
    this.engine.velocityIterations = 6
    this.verityBody = Matter.Bodies.circle(-500, -500, 24, { isStatic: true, label: 'verity', restitution: 0.9 })
    Matter.Composite.add(this.engine.world, this.verityBody)
    this.buildWalls()
    Matter.Events.on(this.engine, 'collisionStart', this.handleCollisions)
    window.addEventListener('resize', this.buildWalls)
  }

  private buildWalls = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    if (this.walls.length) Matter.Composite.remove(this.engine.world, this.walls)
    const t = 200
    const opts = { isStatic: true, friction: 0.8, restitution: 0.2, label: 'wall' }
    this.walls = [
      Matter.Bodies.rectangle(w / 2, h + t / 2, w * 3, t, opts), // floor
      Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 4, opts), // left
      Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 4, opts), // right
      Matter.Bodies.rectangle(w / 2, -h - t, w * 3, t, opts), // ceiling, far up
    ]
    Matter.Composite.add(this.engine.world, this.walls)
    // anything that slipped outside after a resize comes back in
    for (const p of this.pieces) {
      const { x, y } = p.body.position
      if (x < 0 || x > w || y > h) {
        Matter.Body.setPosition(p.body, { x: Math.min(w - p.w / 2, Math.max(p.w / 2, x)), y: Math.min(h - p.h / 2 - 4, y) })
        Matter.Sleeping.set(p.body, false)
      }
    }
  }

  capture(elements: HTMLElement[]) {
    for (const el of elements) {
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue
      const computed = getComputedStyle(el)
      const clone = el.cloneNode(true) as HTMLElement
      clone.removeAttribute('id')
      clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
      clone.removeAttribute('data-physics')
      clone.setAttribute('aria-hidden', 'true')
      clone.setAttribute('tabindex', '-1')
      clone.querySelectorAll('a,button').forEach((n) => n.setAttribute('tabindex', '-1'))
      for (const prop of COPY_STYLES) clone.style.setProperty(prop, computed.getPropertyValue(prop))
      Object.assign(clone.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        margin: '0px',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        boxSizing: 'border-box',
        transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
        transformOrigin: '50% 50%',
        willChange: 'transform',
        pointerEvents: 'none',
        whiteSpace: computed.whiteSpace,
        opacity: '1',
      })
      this.layer.appendChild(clone)

      const shape = el.dataset.physicsShape
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const common = { friction: 0.55, frictionAir: 0.012, restitution: 0.28, density: 0.0016, label: el.dataset.physics || 'piece' }
      const body =
        shape === 'circle'
          ? Matter.Bodies.circle(cx, cy, Math.min(rect.width, rect.height) / 2, common)
          : Matter.Bodies.rectangle(cx, cy, rect.width, rect.height, { ...common, chamfer: { radius: Math.min(8, rect.height / 4) } })
      Matter.Body.setStatic(body, true)
      Matter.Composite.add(this.engine.world, body)

      el.style.visibility = 'hidden'
      this.pieces.push({ el, clone, body, w: rect.width, h: rect.height, label: el.dataset.physics || 'piece', released: false })
    }
  }

  release(p: Piece, vx = 0, vy = 0, spin = 0) {
    if (p.released) return
    p.released = true
    Matter.Body.setStatic(p.body, false)
    Matter.Sleeping.set(p.body, false)
    Matter.Body.setVelocity(p.body, { x: vx, y: vy })
    Matter.Body.setAngularVelocity(p.body, spin)
  }

  releaseAll(jitter = 1) {
    for (const p of this.pieces) {
      if (!p.released) this.release(p, (Math.random() - 0.5) * 4 * jitter, -Math.random() * 3 * jitter, (Math.random() - 0.5) * 0.08 * jitter)
    }
  }

  /** Pieces whose bounds touch a circle — used for Verity's wrecking pass. */
  piecesNear(x: number, y: number, r: number) {
    return this.pieces.filter((p) => {
      if (p.released) return false
      const b = p.body.bounds
      const cx = Math.max(b.min.x, Math.min(x, b.max.x))
      const cy = Math.max(b.min.y, Math.min(y, b.max.y))
      return (cx - x) ** 2 + (cy - y) ** 2 < r * r
    })
  }

  setVerity(x: number, y: number, r: number) {
    const vx = this.vPrev.x < -900 ? 0 : x - this.vPrev.x
    const vy = this.vPrev.y < -900 ? 0 : y - this.vPrev.y
    this.vPrev = { x, y }
    const current = this.verityBody.circleRadius ?? 24
    if (Math.abs(current - r) > 1) Matter.Body.scale(this.verityBody, r / current, r / current)
    Matter.Body.setPosition(this.verityBody, { x, y })
    Matter.Body.setVelocity(this.verityBody, { x: vx, y: vy })
  }

  hideVerity() {
    this.vPrev = { x: -999, y: -999 }
    Matter.Body.setPosition(this.verityBody, { x: -600, y: -600 })
  }

  onHit(cb: ((e: HitEvent) => void) | null) {
    this.onHitCb = cb
  }
  onGrab(cb: ((p: Piece) => void) | null) {
    this.onGrabCb = cb
  }

  private handleCollisions = (e: Matter.IEventCollision<Matter.Engine>) => {
    const now = performance.now()
    for (const pair of e.pairs) {
      const a = pair.bodyA
      const b = pair.bodyB
      const other = a === this.verityBody ? b : b === this.verityBody ? a : null
      if (!other || now - this.lastHit < 500) continue
      const piece = this.pieces.find((p) => p.body === other)
      if (!piece || !piece.released) continue
      const thrown = this.thrownAt.get(other)
      if (!thrown || now - thrown > 3000) continue
      const speed = Math.hypot(other.velocity.x, other.velocity.y)
      if (speed < 6) continue
      this.lastHit = now
      const n = pair.collision.normal
      this.onHitCb?.({ piece, speed, nx: a === this.verityBody ? n.x : -n.x, ny: a === this.verityBody ? n.y : -n.y })
    }
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const step = 1000 / 60
    const frame = (now: number) => {
      if (!this.running) return
      this.acc += Math.min(80, now - this.last)
      this.last = now
      while (this.acc >= step) {
        Matter.Engine.update(this.engine, step)
        this.acc -= step
      }
      this.render()
      this.raf = requestAnimationFrame(frame)
    }
    this.raf = requestAnimationFrame(frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  /** Advance the simulation instantly (reduced motion: show the settled pile). */
  settle(steps = 360) {
    for (let i = 0; i < steps; i++) Matter.Engine.update(this.engine, 1000 / 60)
    this.render()
  }

  private render() {
    for (const p of this.pieces) {
      if (!p.released) continue
      const { x, y } = p.body.position
      p.clone.style.transform = `translate3d(${x - p.w / 2}px, ${y - p.h / 2}px, 0) rotate(${p.body.angle}rad)`
    }
  }

  // ───────────── pointer dragging ─────────────

  enablePointer(stage: HTMLElement) {
    this.disablePointer()
    this.stage = stage
    stage.addEventListener('pointerdown', this.onDown)
    stage.addEventListener('pointermove', this.onMove)
    stage.addEventListener('pointerup', this.onUp)
    stage.addEventListener('pointercancel', this.onUp)
  }

  disablePointer() {
    if (!this.stage) return
    this.stage.removeEventListener('pointerdown', this.onDown)
    this.stage.removeEventListener('pointermove', this.onMove)
    this.stage.removeEventListener('pointerup', this.onUp)
    this.stage.removeEventListener('pointercancel', this.onUp)
    this.endDrag()
    this.stage = null
  }

  pieceAt(x: number, y: number) {
    const bodies = this.pieces.filter((p) => p.released).map((p) => p.body)
    const hit = Matter.Query.point(bodies, { x, y })[0]
    return hit ? this.pieces.find((p) => p.body === hit) ?? null : null
  }

  private onDown = (e: PointerEvent) => {
    const piece = this.pieceAt(e.clientX, e.clientY)
    if (!piece) return
    e.preventDefault()
    const body = piece.body
    const offset = { x: e.clientX - body.position.x, y: e.clientY - body.position.y }
    const local = Matter.Vector.rotate(offset, -body.angle)
    const constraint = Matter.Constraint.create({
      pointA: { x: e.clientX, y: e.clientY },
      bodyB: body,
      pointB: local,
      stiffness: 0.18,
      damping: 0.08,
      length: 0,
    })
    Matter.Composite.add(this.engine.world, constraint)
    Matter.Sleeping.set(body, false)
    this.drag = { constraint, pointerId: e.pointerId, piece }
    this.stage?.setPointerCapture(e.pointerId)
    this.stage?.style.setProperty('cursor', 'grabbing')
    piece.clone.style.zIndex = '2'
    this.onGrabCb?.(piece)
  }

  private onMove = (e: PointerEvent) => {
    if (!this.drag || e.pointerId !== this.drag.pointerId) {
      if (this.stage) this.stage.style.cursor = this.pieceAt(e.clientX, e.clientY) ? 'grab' : ''
      return
    }
    this.drag.constraint.pointA = { x: e.clientX, y: e.clientY }
  }

  private onUp = (e: PointerEvent) => {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return
    this.endDrag()
  }

  private endDrag() {
    if (!this.drag) return
    Matter.Composite.remove(this.engine.world, this.drag.constraint)
    this.thrownAt.set(this.drag.piece.body, performance.now())
    this.drag.piece.clone.style.zIndex = ''
    this.drag = null
    if (this.stage) this.stage.style.cursor = ''
  }

  /** Nudge every resting piece — used when Verity slams into the floor. */
  quake(power = 6) {
    for (const p of this.pieces) {
      if (!p.released) continue
      Matter.Sleeping.set(p.body, false)
      Matter.Body.setVelocity(p.body, { x: (Math.random() - 0.5) * power, y: -Math.random() * power * 1.4 })
      Matter.Body.setAngularVelocity(p.body, (Math.random() - 0.5) * 0.1)
    }
  }

  // ───────────── restore ─────────────

  async reassemble(duration = 900, signal?: AbortSignal) {
    this.disablePointer()
    this.stop()
    if (duration <= 0 || signal?.aborted) {
      this.destroy()
      return
    }
    const starts = this.pieces.map((p) => {
      const angle = p.released ? p.body.angle : 0
      const turns = Math.round(angle / (Math.PI * 2)) * Math.PI * 2
      const target = p.el.getBoundingClientRect()
      return {
        p,
        x0: p.released ? p.body.position.x - p.w / 2 : target.left,
        y0: p.released ? p.body.position.y - p.h / 2 : target.top,
        a0: angle,
        x1: target.left,
        y1: target.top,
        a1: turns,
      }
    })
    const n = Math.max(1, starts.length)
    try {
      await tween(
        duration + n * 25,
        (t) => {
          starts.forEach((s, i) => {
            const local = Math.min(1, Math.max(0, (t * (duration + n * 25) - i * 25) / duration))
            const k = easeInOutCubic(local)
            const x = s.x0 + (s.x1 - s.x0) * k
            const y = s.y0 + (s.y1 - s.y0) * k - Math.sin(local * Math.PI) * 60
            const a = s.a0 + (s.a1 - s.a0) * k
            s.p.clone.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${a}rad)`
          })
        },
        { ease: (t) => t, signal },
      )
    } catch (e) {
      if (!(e instanceof Aborted)) throw e
    }
    this.destroy()
  }

  destroy() {
    this.stop()
    this.disablePointer()
    window.removeEventListener('resize', this.buildWalls)
    Matter.Events.off(this.engine, 'collisionStart', this.handleCollisions)
    for (const p of this.pieces) {
      p.el.style.visibility = ''
      p.clone.remove()
    }
    this.pieces = []
    Matter.Composite.clear(this.engine.world, false)
    Matter.Engine.clear(this.engine)
  }
}
