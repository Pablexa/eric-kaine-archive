import { useEffect, useRef, useState } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { objective } from '../../../lib/experience/store'
import { verity } from '../../../lib/experience/verity'
import { shake } from '../../../lib/experience/stage'
import { spriteImage, type SpriteId } from '../../../lib/assets/sprites'
import { sfx } from '../../../lib/audio/sfx'
import { TIME, loop, pick, prefersReducedMotion, wait, waitFor } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 11: "Subway Verity". An original three-lane runner drawn on a
 * canvas (no Subway Surfers assets). The real Bleoodity orb is the runner.
 * Trains block a lane (switch lanes), seals and tortas-on-the-tracks are low
 * (jump), cheese is points, a drank turns on slow-motion "lean mode" and a
 * cartoon draco blasts the next obstacles in your lane. Crashing costs aura,
 * never the run: there is no game over, only the clock.
 */

const RUN_MS = 45000
type Kind = 'train' | 'seal' | 'torta' | 'cheese' | 'drank' | 'draco' | 'coin'
type Thing = { lane: number; z: number; kind: Kind; dead?: number }
const LOW: Kind[] = ['seal', 'torta']
const SPRITE: Partial<Record<Kind, SpriteId>> = { seal: 'seal', torta: 'torta', cheese: 'cheese', drank: 'drank', draco: 'draco', coin: 'coin' }
const LINES = [
  'this is not subway surfers. legally it is "subway verity".',
  'slayr is running beside you in the full burger costume. respect.',
  'grab the double cup for lean mode. grab the draco to clear the tracks. cartoon rules.',
  'jump the seals. the seals have rights but they are on the tracks.',
  'the tortas are sandwiches. do not eat them at this speed.',
  'osamason on the aux. the train is going faster out of respect.',
]
const CHEER: SpriteId[] = ['burgerguy', 'sealdreads', 'fangs', 'flame', 'star', 'cheeseguy', 'slime']

export function RunnerScene() {
  const { dispatch } = useExperience()
  const canvas = useRef<HTMLCanvasElement>(null)
  const ctl = useRef({ left: () => {}, right: () => {}, jump: () => {} })
  const [hud, setHud] = useState({ lane: 1, cheese: 0, crashes: 0, aura: 0, left: Math.round(RUN_MS / 1000), mode: '' })
  const [done, setDone] = useState(false)
  const finish = useRef<(() => void) | null>(null)
  const reduce = prefersReducedMotion()

  // keyboard: arrows / WASD / Space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input,textarea,select,[contenteditable="true"]')) return
      if (t?.closest('button,a') && !t.closest('[data-testid^="runner-"]') && e.code === 'Space') return
      const k = e.code
      if (k === 'ArrowLeft' || k === 'KeyA') ctl.current.left()
      else if (k === 'ArrowRight' || k === 'KeyD') ctl.current.right()
      else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space') ctl.current.jump()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    let w = 0, h = 0
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      const r = Math.min(window.devicePixelRatio || 1, 2)
      el.width = Math.round(w * r)
      el.height = Math.round(h * r)
      ctx.setTransform(r, 0, 0, r, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const s = { lane: 1, laneX: 1, jumpT: 0, things: [] as Thing[], travel: 0, cheese: 0, crashes: 0, aura: 0, lean: 0, draco: 0, invuln: 0, nextSpawn: 600, started: performance.now(), lastHud: 0, cheer: 0 }
    const horizon = () => h * 0.3
    // the track ends above the touch controls on phones
    const ground = () => h - (w < 640 ? 230 : 120)
    const roadHalf = () => Math.min(w * 0.46, 520)
    // z: 1 = far (horizon), 0 = at the runner
    const project = (lane: number, z: number) => {
      const p = 1 - z
      const k = p * p
      const y = horizon() + (ground() - horizon()) * k
      const half = 40 + (roadHalf() - 40) * k
      return { x: w / 2 + (lane - 1) * (half * 2 / 3), y, scale: 0.12 + 0.88 * k }
    }
    const jumping = () => s.jumpT > 0

    ctl.current = {
      left: () => { if (s.lane > 0) { s.lane--; sfx.whoosh() } },
      right: () => { if (s.lane < 2) { s.lane++; sfx.whoosh() } },
      jump: () => { if (!jumping()) { s.jumpT = 1; sfx.boing() } },
    }

    // swipe on the canvas
    let touch: { x: number; y: number } | null = null
    const down = (e: PointerEvent) => { touch = { x: e.clientX, y: e.clientY } }
    const up = (e: PointerEvent) => {
      if (!touch) return
      const dx = e.clientX - touch.x, dy = e.clientY - touch.y
      touch = null
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { if (e.clientX < w / 3) ctl.current.left(); else if (e.clientX > w * 2 / 3) ctl.current.right(); else ctl.current.jump(); return }
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? ctl.current.left : ctl.current.right)()
      else if (dy < 0) ctl.current.jump()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)

    const spawn = () => {
      const roll = Math.random()
      const lane = Math.floor(Math.random() * 3)
      const kind: Kind = roll < 0.28 ? 'train' : roll < 0.42 ? pick(LOW) : roll < 0.78 ? 'cheese' : roll < 0.86 ? 'coin' : roll < 0.93 ? 'drank' : 'draco'
      // never block all three lanes with trains at the same depth
      if (kind === 'train' && s.things.filter((t) => t.kind === 'train' && t.z > 0.9).length >= 2) return
      s.things.push({ lane, z: 1, kind })
      if (kind === 'cheese') for (let i = 1; i < 4; i++) s.things.push({ lane, z: 1 + i * 0.07, kind: 'cheese' })
    }

    const label = (text: string, x: number, y: number, size: number, color: string) => {
      ctx.font = `900 ${size}px Impact, 'Arial Black', sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = Math.max(3, size / 6)
      ctx.strokeStyle = '#000'
      ctx.strokeText(text, x, y)
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
    }

    loop((dtRaw, now) => {
      const elapsed = (now - s.started) / TIME.scale
      const slow = s.lean > 0 ? 0.45 : 1
      const dt = dtRaw * slow
      const speed = (reduce ? 0.00032 : 0.00045) * (1 + Math.min(1.4, elapsed / 30000)) / Math.max(TIME.scale, 0.35)
      s.travel += dt * speed
      s.laneX += (s.lane - s.laneX) * Math.min(1, dtRaw / 70)
      if (s.jumpT > 0) s.jumpT = Math.max(0, s.jumpT - dtRaw / (650 * Math.max(TIME.scale, 0.35)))
      s.lean = Math.max(0, s.lean - dtRaw)
      s.draco = Math.max(0, s.draco - dtRaw)
      s.invuln = Math.max(0, s.invuln - dtRaw)
      s.nextSpawn -= dt
      if (s.nextSpawn <= 0) { spawn(); s.nextSpawn = (reduce ? 900 : 620) * Math.max(TIME.scale, 0.35) * (Math.random() * 0.6 + 0.7) }

      // sky + tracks
      const wob = s.lean > 0 && !reduce ? Math.sin(now / 260) * 18 : 0
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, s.lean > 0 ? '#3a0066' : '#1a0010')
      sky.addColorStop(0.3, s.lean > 0 ? '#9b30ff' : '#ff315d')
      sky.addColorStop(0.31, '#2a1a12')
      sky.addColorStop(1, '#120a06')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(wob, 0)
      ctx.strokeStyle = '#b9a58a'
      ctx.lineWidth = 3
      for (let lane = 0; lane < 3; lane++) {
        for (const off of [-0.3, 0.3]) {
          ctx.beginPath()
          for (let i = 0; i <= 12; i++) {
            const p = project(lane + off, 1 - i / 12)
            if (i) ctx.lineTo(p.x, p.y)
            else ctx.moveTo(p.x, p.y)
          }
          ctx.stroke()
        }
      }
      // sleepers scroll toward the camera
      ctx.fillStyle = '#5a3a22'
      for (let i = 0; i < 18; i++) {
        const z = 1 - ((i / 18 + s.travel * 3) % 1)
        const l = project(0, z), r = project(2, z)
        ctx.fillRect(l.x - 60 * l.scale, l.y, r.x - l.x + 120 * r.scale, Math.max(1, 6 * l.scale))
      }
      // cheering parody mascots on the platform
      for (let i = 0; i < 6; i++) {
        const z = 1 - ((i / 6 + s.travel * 1.2) % 1)
        const side = i % 2 ? 1 : -1
        const p = project(1, z)
        const x = w / 2 + side * (roadHalf() * (0.15 + 0.95 * (1 - z) ** 2) + 60 * p.scale)
        const img = spriteImage(CHEER[(i + Math.floor(s.travel * 1.2)) % CHEER.length])
        const size = 110 * p.scale
        if (img.complete) ctx.drawImage(img, x - size / 2, p.y - size, size, size)
      }

      // things, far to near
      const runnerY = ground()
      s.things.sort((a, b) => b.z - a.z)
      for (const t of s.things) {
        t.z -= dt * speed * 1.8
        // draco: clear the next obstacles in your lane
        if (s.draco > 0 && !t.dead && (t.kind === 'train' || LOW.includes(t.kind)) && t.lane === s.lane && t.z < 0.6) { t.dead = now; s.aura += 500; sfx.laser() }
        const p = project(t.lane, Math.max(0, t.z))
        if (t.dead) {
          const age = (now - t.dead) / 500
          if (age < 1) label('PEW', p.x, p.y - 40 * p.scale, 18 + 40 * p.scale, '#ff52bd')
          continue
        }
        if (t.z > 1) continue
        if (t.kind === 'train') {
          const tw = roadHalf() * 0.6 * p.scale, th = 240 * p.scale
          ctx.fillStyle = '#d7263d'
          ctx.fillRect(p.x - tw / 2, p.y - th, tw, th)
          ctx.fillStyle = '#ffd21f'
          ctx.fillRect(p.x - tw / 2, p.y - th * 0.82, tw, th * 0.12)
          ctx.fillStyle = '#9fe8ff'
          ctx.fillRect(p.x - tw * 0.38, p.y - th * 0.66, tw * 0.32, th * 0.22)
          ctx.fillRect(p.x + tw * 0.06, p.y - th * 0.66, tw * 0.32, th * 0.22)
          if (p.scale > 0.3) label('BLEOODITY LINE', p.x, p.y - th * 0.25, 10 + 14 * p.scale, '#fff')
        } else {
          const img = spriteImage(SPRITE[t.kind]!)
          const size = (LOW.includes(t.kind) ? 150 : 90) * p.scale
          const bob = t.kind === 'cheese' || t.kind === 'coin' ? Math.sin(now / 160 + t.z * 20) * 6 * p.scale : 0
          if (img.complete) ctx.drawImage(img, p.x - size / 2, p.y - size + bob, size, size)
        }
        // collision at the runner's depth
        if (t.z < 0.06 && t.z > -0.04 && Math.abs(s.laneX - t.lane) < 0.5) {
          const low = LOW.includes(t.kind)
          if (t.kind === 'train' || (low && !jumping())) {
            if (s.invuln <= 0) {
              s.crashes++
              s.aura -= 1000
              s.invuln = 1100
              sfx.crash()
              if (!reduce) shake.set(shake.get() + 1)
              if (s.crashes % 3 === 1) chat.post(pick(['-1000 aura. keep running.', 'you hit a seal. the seal is fine.', 'no game over. only shame.']), 'bleoodity')
            }
            t.dead = now - 600
          } else if (!low) {
            t.dead = now - 600
            if (t.kind === 'cheese') { s.cheese++; s.aura += 100; sfx.coin() }
            else if (t.kind === 'coin') { s.aura += 250; sfx.coin() }
            else if (t.kind === 'drank') { s.lean = 4500; sfx.riser(1); chat.post('LEAN MODE. everything is slow and purple now.', 'bleoodity', 'loud') }
            else if (t.kind === 'draco') { s.draco = 3500; sfx.airhorn(); chat.post('cartoon draco equipped. the tracks are getting cleared.', 'bleoodity', 'loud') }
          }
        }
      }
      s.things = s.things.filter((t) => t.z > -0.1 && (!t.dead || now - t.dead < 500))
      ctx.restore()

      // the runner is the real Bleoodity orb
      const rp = project(s.laneX, 0)
      const hop = Math.sin(s.jumpT * Math.PI) * 150
      const blink = s.invuln > 0 && !reduce ? 0.55 : 1
      verity.jump(rp.x + wob, runnerY - 40 - hop, 74)
      verity.glow.set(blink)
      if (s.lean > 0) label('LEAN MODE', w / 2, horizon() - 20, 34, '#d9a6ff')
      if (s.draco > 0) label('DRACO: PEW PEW', w / 2, horizon() + 22, 28, '#ff52bd')

      if (now - s.lastHud > 150) {
        s.lastHud = now
        const left = Math.max(0, Math.ceil((RUN_MS - elapsed) / 1000))
        setHud({ lane: s.lane, cheese: s.cheese, crashes: s.crashes, aura: s.aura, left, mode: s.lean > 0 ? 'lean' : s.draco > 0 ? 'draco' : '' })
        if (left === 0) { finish.current?.(); return false }
      }
    }, ac.signal)

    return () => {
      ac.abort()
      ctl.current = { left: () => {}, right: () => {}, jump: () => {} }
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      window.removeEventListener('resize', resize)
      verity.glow.set(0.6)
    }
  }, [reduce])

  useScript(async (signal) => {
    verity.setCostume('bleoodity')
    verity.setMode('free', false)
    objective.set('SUBWAY VERITY · ← → switch lanes · ↑ / Space jump')
    chat.post('new game. it’s called subway verity. it is legally distinct.', 'bleoodity', 'loud')
    sfx.siren(1.2)
    const ended = waitFor<void>((resolve) => {
      finish.current = () => resolve()
      return () => { finish.current = null }
    }, signal)
    void (async () => {
      for (const line of LINES) {
        await wait(7000, signal)
        if (finish.current === null) return
        chat.post(line, 'bleoodity')
      }
    })().catch(() => {})
    await ended
    setDone(true)
    objective.set(null)
    sfx.fanfare()
    await chat.say('run complete. the website is out of breath. MOSH PIT.', { signal, author: 'bleoodity', tone: 'loud', hold: 1100 })
    sfx.airhorn()
    dispatch({ type: 'SCENE', scene: 'mosh' })
  }, [])

  const btn = 'pixel touch-manipulation border-[4px] border-black bg-[#ffd21f] px-4 py-2 text-xl font-bold text-black shadow-[5px_5px_0_#ff315d] focus-visible:outline-4 focus-visible:outline-white active:translate-y-1'
  return (
    <section className="fixed inset-0 z-[45] text-white" data-troll-ui data-testid="runner" data-lane={hud.lane} data-cheese={hud.cheese} data-crashes={hud.crashes} data-mode={hud.mode} data-done={done} aria-label="Subway Verity: an endless runner. Left and right arrows switch lanes, up or Space jumps.">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-[120px] flex flex-col items-center px-3 text-center sm:top-[132px]">
        <p className="pixel bg-black/80 px-2 text-[11px] tracking-[0.2em] text-[#ff75cc]">PROTOCOL 11 · NOT AFFILIATED WITH ANY REAL SUBWAY</p>
        <h2 className="text-[clamp(30px,6vw,64px)] leading-none text-[#ffd21f]" style={{ fontFamily: 'Impact, sans-serif', textShadow: '4px 4px 0 #000, -2px -2px 0 #ff315d' }}>SUBWAY VERITY</h2>
        <p className="pixel mt-1 bg-black/80 px-3 py-0.5 text-[13px]" aria-live="off">
          🧀 {hud.cheese} · AURA {hud.aura} · CRASHES {hud.crashes} · <b className="text-[#ffd21f]">{hud.left}s</b>
        </p>
      </div>
      <div className="absolute bottom-[78px] left-1/2 flex -translate-x-1/2 gap-3" role="group" aria-label="Runner controls">
        <button type="button" className={btn} onClick={() => ctl.current.left()} data-testid="runner-left" aria-label="Switch lane left">←</button>
        <button type="button" className={btn} onClick={() => ctl.current.jump()} data-testid="runner-jump" aria-label="Jump">JUMP</button>
        <button type="button" className={btn} onClick={() => ctl.current.right()} data-testid="runner-right" aria-label="Switch lane right">→</button>
      </div>
    </section>
  )
}
