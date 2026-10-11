import { useEffect, useRef, useState } from 'react'
import type Matter from 'matter-js'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { objective } from '../../../lib/experience/store'
import { verity } from '../../../lib/experience/verity'
import { objectImage, type ObjectMediaId } from '../../../lib/assets/realMedia'
import { sfx } from '../../../lib/audio/sfx'
import { clamp, loop, prefersReducedMotion, wait, waitFor } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const TARGET = 18
const FOOD: ObjectMediaId[] = ['seal', 'burger', 'cheese', 'cheese', 'drink', 'draco', 'slime', 'cheese']
const LINES = ['the catering budget is gone.', 'do not feed me the draco. cheese only.', 'this is a food fight and also a payroll dispute.', 'seals are flying. normal label meeting.', 'mhm yeah. more cheese.']
type Piece = { body: Matter.Body; sprite: ObjectMediaId; size: number; thrown: boolean }
type Burst = { x: number; y: number; at: number; text: string; color: string }

export function FoodFightScene() {
  const { dispatch } = useExperience()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [fed, setFed] = useState(0)
  const [canSkip, setCanSkip] = useState(false)
  const fedRef = useRef(0)
  const complete = useRef<(() => void) | null>(null)
  const feedVisual = useRef<(() => void) | null>(null)
  const explodeAction = useRef<(() => void) | null>(null)
  const reduce = prefersReducedMotion()

  const feed = () => {
    if (fedRef.current >= TARGET) return
    fedRef.current++
    setFed(fedRef.current)
    sfx.chomp()
    objective.set(`Feed Bleoodity cheese · ${fedRef.current} / ${TARGET}`)
    if (fedRef.current % 6 === 0) chat.post(`mhm yeah. ${fedRef.current} cheese. financial freedom.`, 'bleoodity', 'loud')
    if (fedRef.current === TARGET) complete.current?.()
  }
  const feedAction = () => { feedVisual.current?.(); feed() }
  const feedCurrent = useRef(feed)
  feedCurrent.current = feed

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!['Space', 'KeyE'].includes(e.code) || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.target instanceof HTMLElement && e.target.closest('button, input, textarea, select, a, [contenteditable="true"]')) return
      e.preventDefault()
      if (e.code === 'KeyE') { explodeAction.current?.(); return }
      feedVisual.current?.()
      feedCurrent.current()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    const el = canvas.current
    if (!el) return
    let teardown = () => {}
    void import('matter-js').then(({ default: M }) => {
      if (ac.signal.aborted) return
      const ctx = el.getContext('2d')
      if (!ctx) return
      const engine = M.Engine.create({ enableSleeping: true })
      engine.gravity.y = reduce ? 0.65 : 0.24
      const pieces: Piece[] = []
      let walls: Matter.Body[] = []
      let bursts: Burst[] = []
      let w = 0
      let h = 0
      let ratio = 1
      let nextSpawn = performance.now() + 1600
      let lastBoom = 0
      let drag: { piece: Piece; joint: Matter.Constraint; pointer: number; start: { x: number; y: number }; last: { x: number; y: number; t: number }; vx: number; vy: number } | null = null
      const mouth = () => ({ x: w / 2, y: h - 165 })
      const resize = () => {
        w = window.innerWidth
        h = window.innerHeight
        ratio = Math.min(window.devicePixelRatio || 1, 2)
        el.width = Math.round(w * ratio)
        el.height = Math.round(h * ratio)
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        walls.forEach((wall) => M.Composite.remove(engine.world, wall))
        walls = [M.Bodies.rectangle(w / 2, h + 35, w + 100, 80, { isStatic: true }), M.Bodies.rectangle(-35, h / 2, 80, h * 2, { isStatic: true }), M.Bodies.rectangle(w + 35, h / 2, 80, h * 2, { isStatic: true }), M.Bodies.rectangle(w / 2, 45, w + 100, 80, { isStatic: true })]
        M.Composite.add(engine.world, walls)
        pieces.forEach((p) => M.Body.setPosition(p.body, { x: clamp(p.body.position.x, p.size / 2, w - p.size / 2), y: clamp(p.body.position.y, 100, h - p.size / 2) }))
        verity.jump(w / 2, h - 225, Math.min(110, w * 0.25))
      }
      resize()
      const spawn = (sprite = FOOD[Math.floor(Math.random() * FOOD.length)], nearMouth = false) => {
        const size = reduce ? 58 : 62 + Math.random() * 38
        const m = mouth()
        const body = M.Bodies.circle(nearMouth ? m.x - 95 : 35 + Math.random() * Math.max(1, w - 70), nearMouth ? m.y - 75 : 125 + Math.random() * Math.max(1, h * 0.58 - 125), size * 0.37, { restitution: 0.92, friction: 0.03, frictionAir: reduce ? 0.02 : 0.003, density: 0.001 })
        M.Body.setVelocity(body, nearMouth ? { x: 7, y: 0 } : { x: (Math.random() - 0.5) * (reduce ? 2 : 16), y: (Math.random() - 0.5) * (reduce ? 2 : 12) })
        if (!reduce) M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18)
        const piece = { body, sprite, size, thrown: nearMouth }
        pieces.push(piece)
        M.Composite.add(engine.world, body)
        return piece
      }
      for (let i = 0; i < (reduce ? 16 : Math.min(38, Math.max(24, Math.floor(w / 30)))); i++) spawn(FOOD[i % FOOD.length])
      const remove = (piece: Piece) => {
        M.Composite.remove(engine.world, piece.body)
        const index = pieces.indexOf(piece)
        if (index >= 0) pieces.splice(index, 1)
      }
      const burst = (x: number, y: number, text: string, color = '#ffd21f') => bursts.push({ x, y, at: performance.now(), text, color })
      feedVisual.current = () => burst(mouth().x, mouth().y - 35, '+1 CHEESE')
      const explode = (piece: Piece) => {
        const { x, y } = piece.body.position
        remove(piece)
        burst(x, y, '+1000 AURA', '#ff52bd')
        const now = performance.now()
        if (now - lastBoom > 180) { sfx.popCombo(Math.floor(Math.random() * 9)); lastBoom = now }
        if (!reduce) pieces.forEach((p) => {
          const dx = p.body.position.x - x
          const dy = p.body.position.y - y
          const d = Math.max(30, Math.hypot(dx, dy))
          if (d < 240) {
            M.Sleeping.set(p.body, false)
            M.Body.applyForce(p.body, p.body.position, { x: dx / d * 0.035, y: dy / d * 0.035 })
          }
        })
        spawn()
      }
      explodeAction.current = () => {
        const piece = pieces[Math.floor(Math.random() * pieces.length)]
        if (piece) explode(piece)
      }
      const point = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY })
      const down = (e: PointerEvent) => {
        if (drag || e.button !== 0) return
        const p = point(e)
        const piece = [...pieces].reverse().find((item) => Math.hypot(p.x - item.body.position.x, p.y - item.body.position.y) < item.size * 0.55)
        if (!piece) return
        e.preventDefault()
        M.Sleeping.set(piece.body, false)
        const joint = M.Constraint.create({ pointA: p, bodyB: piece.body, stiffness: 0.2, damping: 0.08, length: 0 })
        M.Composite.add(engine.world, joint)
        drag = { piece, joint, pointer: e.pointerId, start: p, last: { ...p, t: performance.now() }, vx: 0, vy: 0 }
        el.setPointerCapture(e.pointerId)
      }
      const move = (e: PointerEvent) => {
        if (!drag || drag.pointer !== e.pointerId) return
        const p = point(e)
        const now = performance.now()
        const dt = Math.max(8, now - drag.last.t)
        drag.vx = clamp((p.x - drag.last.x) / dt * 16.67, -24, 24)
        drag.vy = clamp((p.y - drag.last.y) / dt * 16.67, -24, 24)
        drag.joint.pointA = p
        drag.last = { ...p, t: now }
      }
      const up = (e: PointerEvent) => {
        if (!drag || drag.pointer !== e.pointerId) return
        const held = drag
        drag = null
        M.Composite.remove(engine.world, held.joint)
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        if (e.type === 'pointercancel') return
        const p = point(e)
        if (Math.hypot(p.x - held.start.x, p.y - held.start.y) < 8) explode(held.piece)
        else {
          held.piece.thrown = true
          M.Body.setVelocity(held.piece.body, { x: held.vx, y: held.vy })
        }
      }
      el.addEventListener('pointerdown', down)
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
      window.addEventListener('resize', resize)
      const stop = loop((dt, now) => {
        M.Engine.update(engine, Math.min(dt, 32))
        ctx.clearRect(0, 0, w, h)
        const m = mouth()
        // The mouth is the target; the one real Bleoodity orb sits just above it.
        ctx.fillStyle = '#12000c'
        ctx.strokeStyle = '#ff3fbf'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(m.x, m.y, 58, 25, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#fff5c0'
        ctx.fillRect(m.x - 31, m.y - 22, 17, 8)
        ctx.fillRect(m.x + 14, m.y - 22, 17, 8)
        for (const piece of [...pieces]) {
          const { x, y } = piece.body.position
          if (piece.sprite === 'cheese' && piece.thrown && Math.hypot(x - m.x, (y - m.y) * 1.6) < 63 && drag?.piece !== piece) {
            remove(piece)
            feedCurrent.current()
            burst(m.x, m.y - 35, '+1 CHEESE')
            spawn('cheese')
            continue
          }
          const image = objectImage(piece.sprite)
          if (!image.complete || !image.naturalWidth) continue
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(reduce ? 0 : piece.body.angle)
          const photoWidth = piece.size * clamp(image.naturalWidth / image.naturalHeight, 0.65, 1.7)
          ctx.fillStyle = piece.sprite === 'cheese' ? '#ffff00' : '#fff'
          ctx.fillRect(-photoWidth / 2 - 2, -piece.size / 2 - 2, photoWidth + 4, piece.size + 15)
          ctx.drawImage(image, -photoWidth / 2, -piece.size / 2, photoWidth, piece.size)
          ctx.font = 'bold 10px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#000'
          ctx.fillText(piece.sprite === 'drink' ? 'DOUBLE CUP' : piece.sprite.toUpperCase(), 0, piece.size / 2 + 10)
          ctx.restore()
        }
        bursts = bursts.filter((b) => now - b.at < 1000)
        ctx.font = 'bold 22px Impact, Arial Black, sans-serif'
        ctx.textAlign = 'center'
        bursts.forEach((b) => {
          const age = (now - b.at) / 1000
          ctx.globalAlpha = 1 - age
          ctx.lineWidth = 4
          ctx.strokeStyle = '#000'
          ctx.fillStyle = b.color
          const y = b.y - (reduce ? 0 : age * 65)
          ctx.strokeText(b.text, b.x, y)
          ctx.fillText(b.text, b.x, y)
        })
        ctx.globalAlpha = 1
        if (now > nextSpawn) {
          nextSpawn = now + (reduce ? 3800 : 1800)
          if (pieces.length < (reduce ? 18 : 42)) spawn()
          if (!reduce) pieces.forEach((p) => {
            M.Sleeping.set(p.body, false)
            M.Body.applyForce(p.body, p.body.position, { x: (Math.random() - 0.5) * 0.006, y: -0.014 })
          })
        }
      }, ac.signal)
      teardown = () => {
        stop()
        feedVisual.current = null
        explodeAction.current = null
        if (drag && el.hasPointerCapture(drag.pointer)) el.releasePointerCapture(drag.pointer)
        el.removeEventListener('pointerdown', down)
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
        window.removeEventListener('resize', resize)
        M.Composite.clear(engine.world, false)
        M.Engine.clear(engine)
      }
    }).catch((error) => { if (!ac.signal.aborted) console.error('Food fight physics unavailable', error) })
    return () => { ac.abort(); teardown() }
  }, [reduce])

  useScript(async (signal) => {
    verity.setMode('free', false)
    verity.setCostume('bleoodity')
    objective.set('Feed Bleoodity cheese · 0 / 18')
    chat.post('THE CATERING HAS ESCAPED. drag it. throw it. feed me the cheese.', 'bleoodity', 'loud')
    const done = waitFor<void>((resolve) => {
      complete.current = () => resolve()
      if (fedRef.current >= TARGET) resolve()
      return () => { complete.current = null }
    }, signal)
    const commentary = (async () => {
      for (const line of LINES) {
        await wait(10000, signal)
        if (fedRef.current >= TARGET) return
        chat.post(line, 'bleoodity')
      }
      await wait(10000, signal)
      if (fedRef.current < TARGET) setCanSkip(true)
    })().catch(() => {})
    await done
    void commentary
    setCanSkip(false)
    await chat.say('full of cheese. empty of thoughts. activate the brainrot.', { signal, author: 'bleoodity', hold: 1200 })
    sfx.airhorn()
    await wait(400, signal)
    dispatch({ type: 'SCENE', scene: 'brainrot' })
  }, [])

  return (
    <section data-troll-ui data-testid="foodfight" data-fed={fed} aria-label="Food fight: feed Bleoodity 18 cheese" className="pointer-events-none fixed inset-0 z-[46] text-white">
      <canvas ref={canvas} className="pointer-events-auto absolute inset-0 h-full w-full touch-none" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-3 top-[146px] mx-auto max-w-[560px] border-2 border-[#ffd21f] bg-[#150511e8] px-4 py-3 text-center shadow-[5px_5px_0_#ff3fbf]">
        <p className="pixel text-[11px] tracking-widest text-[#ff3fbf]">PROTOCOL 09 · CATERING EMERGENCY</p>
        <h2 className="text-[clamp(27px,5vw,42px)] leading-none text-[#ffd21f]" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>MHM. YEAH. I GOT THE CHEESE.</h2>
        <p className="pixel mt-2 text-[12px] sm:text-[14px]">Drag &amp; fling cheese into the mouth. Click anything to explode it.</p>
      </div>
      <div className="pointer-events-auto absolute bottom-[76px] left-1/2 flex w-[min(94vw,420px)] -translate-x-1/2 flex-col items-center gap-2 border-2 border-[#ff3fbf] bg-black/90 px-3 py-2">
        <div className="flex w-full items-center gap-3">
          <span className="pixel shrink-0 text-[16px] text-[#ffd21f]" aria-live="polite">{fed}/{TARGET} 🧀</span>
          <div className="h-3 flex-1 overflow-hidden border border-[#ffd21f] bg-[#3b2410]" role="progressbar" aria-label="Cheese eaten" aria-valuemin={0} aria-valuemax={TARGET} aria-valuenow={fed}><div className="h-full bg-[#ffd21f]" style={{ width: `${fed / TARGET * 100}%` }} /></div>
          <button type="button" data-testid="feed-cheese" disabled={fed >= TARGET} onClick={feedAction} className="pixel shrink-0 border-2 border-black bg-[#ffd21f] px-3 py-1 text-[14px] font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50">FEED CHEESE</button>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <span className="pixel text-[10px] text-white/70">Space feeds. E explodes. Cheese only.</span>
          <button type="button" data-testid="blast-food" onClick={() => explodeAction.current?.()} className="pixel shrink-0 border border-[#ff75cc] px-2 py-0.5 text-[10px] text-[#ff75cc] outline-none focus-visible:ring-2 focus-visible:ring-white">AURA BLAST</button>
        </div>
        {canSkip && <button type="button" data-testid="skip-foodfight" onClick={() => complete.current?.()} className="pixel text-[12px] text-[#ff75cc] underline underline-offset-4">The catering is too powerful. Skip the food fight →</button>}
      </div>
    </section>
  )
}
