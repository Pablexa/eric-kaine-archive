import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { pileDim } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { byId, curation, thumb, type Video } from '../../../lib/content/channel'
import { clamp, EASE, TIME, prefersReducedMotion, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 02 — "Lights out". The Verity mod's flashlight, rebuilt for a
 * website: the room goes dark, your pointer is the only light, the battery
 * drains, and five of Eric's real videos are hidden somewhere in the wreckage.
 */

const VIDEOS = curation.hidden.map(byId)
const FOUND_LINES = [
  'that’s one view. calm down.',
  'two views. people are going to talk.',
  'three. this is how it starts.',
  'four views. i’m calling someone.',
  'FIVE. THIS IS AN EMERGENCY.',
]

interface Tile {
  video: Video
  x: number
  y: number
  w: number
  h: number
  progress: number
  found: boolean
}

interface Cell {
  x: number
  y: number
  taken: boolean
}

function layoutTiles(): Tile[] {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = clamp(vw * 0.15, 120, 210)
  const h = (w * 9) / 16
  const top = 150
  const bottom = vh - 140
  const cols = vw < 640 ? 2 : 4
  const rows = vw < 640 ? 4 : 3
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cw = vw / cols
      const ch = (bottom - top) / rows
      cells.push({ x: c * cw + rand(16, Math.max(17, cw - w - 16)), y: top + r * ch + rand(0, Math.max(1, ch - h)), taken: false })
    }
  return VIDEOS.map((video) => {
    const free = cells.filter((c) => !c.taken)
    const cell = free[Math.floor(Math.random() * free.length)]
    cell.taken = true
    return { video, x: cell.x, y: cell.y, w, h, progress: 0, found: false }
  })
}

export function LightsScene() {
  const { dispatch, finishEnding } = useExperience()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tilesRef = useRef<Tile[]>([])
  const [tiles, setTiles] = useState<Tile[]>([])
  const [battery, setBattery] = useState(100)
  const [foundIds, setFoundIds] = useState<string[]>([])
  const [batteries, setBatteries] = useState<{ id: number; x: number; y: number }[]>([])
  const game = useRef({
    on: false,
    battery: 100,
    light: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    keyboard: false,
    dark: 0,
    lastCaught: 0,
    lastLow: 0,
    batteries: [] as { id: number; x: number; y: number }[],
    onWin: null as null | (() => void),
    onDead: null as null | (() => void),
  })

  useEffect(() => {
    const t = layoutTiles()
    tilesRef.current = t
    setTiles(t)
    pileDim.set(false)
  }, [])

  // keyboard control for the flashlight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = game.current
      const step = e.shiftKey ? 48 : 24
      const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
      const v = d[e.key]
      if (!v) return
      e.preventDefault()
      g.keyboard = true
      g.light.x = clamp(g.light.x + v[0], 0, window.innerWidth)
      g.light.y = clamp(g.light.y + v[1], 0, window.innerHeight)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // the render + simulation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    const reduce = prefersReducedMotion()
    let raf = 0
    let last = performance.now()
    let lastPointerMove = pointer.lastMove
    let lastShown = 100
    // eyes in the dark: they watch the light and vanish when it touches them
    const eyes = Array.from({ length: 16 }, () => ({
      x: rand(30, window.innerWidth - 30),
      y: rand(140, window.innerHeight - 40),
      s: rand(0.7, 1.4),
      gone: 0,
      blink: rand(0, 4000),
    }))

    const frame = (now: number) => {
      const dt = Math.min(64, now - last) / 1000
      last = now
      const g = game.current
      const w = window.innerWidth
      const h = window.innerHeight

      // follow the real pointer unless the keyboard took over
      if (pointer.lastMove !== lastPointerMove) {
        lastPointerMove = pointer.lastMove
        g.keyboard = false
      }
      if (!g.keyboard && pointer.moved) {
        g.light.x += (pointer.x - g.light.x) * Math.min(1, dt * 18)
        g.light.y += (pointer.y - g.light.y) * Math.min(1, dt * 18)
      }

      const vx = verity.x.get()
      const vy = verity.y.get()
      const vr = verity.size.get() / 2
      const base = clamp(w * 0.11, 92, 150)
      const radius = g.battery <= 0 ? 0 : base * (0.5 + 0.5 * (g.battery / 100))

      if (g.on) {
        // Verity hunts the light, a little faster for every video found
        const found = tilesRef.current.filter((t) => t.found).length
        const speed = (reduce ? 40 : 70) + found * 18
        const dx = g.light.x - vx
        const dy = g.light.y - vy
        const d = Math.hypot(dx, dy) || 1
        const wobble = Math.sin(now / 700) * 40
        const nx = vx + (dx / d) * speed * dt + Math.cos(now / 900) * wobble * dt
        const ny = vy + (dy / d) * speed * dt + Math.sin(now / 800) * wobble * dt
        verity.jump(clamp(nx, 30, w - 30), clamp(ny, 110, h - 30))

        const caught = d < radius * 0.8 + vr * 1.4
        const drain = (reduce ? 1.8 : 2.4) * (caught ? 3 : 1) * TIME.drain
        g.battery = Math.max(0, g.battery - drain * dt)
        if (caught && now - g.lastCaught > 6000) {
          g.lastCaught = now
          chat.post('found you.')
        }
        if (g.battery < 15 && g.battery > 0 && now - g.lastLow > 1800) {
          g.lastLow = now
          sfx.lowBattery()
        }

        // batteries
        for (const b of g.batteries) {
          if (Math.hypot(b.x - g.light.x, b.y - g.light.y) < 40 && radius > 0) {
            g.batteries = g.batteries.filter((x) => x !== b)
            setBatteries(g.batteries)
            g.battery = Math.min(100, g.battery + 38)
            sfx.battery()
            chat.post('where did you get a battery.')
          }
        }

        // searching
        for (const t of tilesRef.current) {
          if (t.found) continue
          const inside = g.light.x > t.x - 12 && g.light.x < t.x + t.w + 12 && g.light.y > t.y - 12 && g.light.y < t.y + t.h + 12 && radius > 0
          t.progress = inside ? Math.min(1, t.progress + dt / 0.75) : Math.max(0, t.progress - dt / 1.5)
          if (t.progress >= 1) {
            t.found = true
            const n = tilesRef.current.filter((x) => x.found).length
            sfx.found(n * 2)
            dispatch({ type: 'VIEW' })
            setFoundIds(tilesRef.current.filter((x) => x.found).map((x) => x.video.id))
            objective.set(`Find Eric’s videos in the dark · ${n}/5`)
            chat.post(FOUND_LINES[n - 1], 'verity', n === 5 ? 'loud' : 'normal')
            if (n === 3) dispatch({ type: 'MOOD', mood: 'angry' })
            if (n === 5) g.onWin?.()
          }
        }

        if (g.battery <= 0) g.onDead?.()
        const rounded = Math.round(g.battery)
        if (rounded !== lastShown) {
          lastShown = rounded
          setBattery(rounded)
        }
      }

      // exposed for keyboard/accessibility tests
      canvas.dataset.lx = String(Math.round(g.light.x))
      canvas.dataset.ly = String(Math.round(g.light.y))

      // draw the darkness
      ctx.clearRect(0, 0, w, h)
      if (g.dark > 0) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = `rgba(2, 2, 1, ${0.988 * g.dark})`
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'destination-out'
        if (radius > 0) {
          const flick = g.battery < 15 && !reduce ? 0.9 + 0.1 * Math.sin(now / 260) : 1
          const r = radius * flick
          const grad = ctx.createRadialGradient(g.light.x, g.light.y, r * 0.15, g.light.x, g.light.y, r)
          grad.addColorStop(0, 'rgba(0,0,0,1)')
          grad.addColorStop(0.65, 'rgba(0,0,0,0.85)')
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(g.light.x, g.light.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
        // Verity carries her own light
        const vg = ctx.createRadialGradient(vx, vy, vr * 0.5, vx, vy, vr * 2.4)
        vg.addColorStop(0, 'rgba(0,0,0,0.55)')
        vg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = vg
        ctx.beginPath()
        ctx.arc(vx, vy, vr * 2.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        // the eyes
        if (g.dark > 0.9) {
          for (const e of eyes) {
            if (e.gone > now) continue
            const ddx = g.light.x - e.x
            const ddy = g.light.y - e.y
            const dd = Math.hypot(ddx, ddy) || 1
            if (dd < radius * 1.05 && radius > 0) {
              e.gone = now + 3000 + Math.random() * 3000
              e.x = rand(30, w - 30)
              e.y = rand(140, h - 40)
              continue
            }
            const blinking = (now + e.blink) % 4200 < 140
            const px = (ddx / dd) * 2.2 * e.s
            const py = (ddy / dd) * 2 * e.s
            ctx.fillStyle = 'rgba(255, 244, 190, 0.85)'
            for (const side of [-1, 1]) {
              ctx.beginPath()
              ctx.ellipse(e.x + side * 9 * e.s, e.y, 5 * e.s, blinking ? 0.6 : 3.4 * e.s, 0, 0, Math.PI * 2)
              ctx.fill()
            }
            if (!blinking) {
              ctx.fillStyle = '#000'
              for (const side of [-1, 1]) {
                ctx.beginPath()
                ctx.arc(e.x + side * 9 * e.s + px, e.y + py, 1.6 * e.s, 0, Math.PI * 2)
                ctx.fill()
              }
              ctx.fillStyle = 'rgba(255, 244, 190, 0.85)'
            }
          }
        }

        // search progress rings
        for (const t of tilesRef.current) {
          if (t.found || t.progress <= 0) continue
          ctx.strokeStyle = 'rgba(255, 210, 31, 0.95)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(t.x + t.w / 2, t.y + t.h / 2, Math.min(t.w, t.h) * 0.42, -Math.PI / 2, -Math.PI / 2 + t.progress * Math.PI * 2)
          ctx.stroke()
        }
        // the beam's edge, as a faint ring
        if (radius > 0) {
          ctx.strokeStyle = 'rgba(255, 246, 194, 0.12)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(g.light.x, g.light.y, radius * 0.98, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [dispatch])

  useScript(async (signal) => {
    const g = game.current
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    objective.set(null)
    await say('if you can’t see him, he can’t get famous.')
    sfx.lightSwitch()
    // fade the darkness in quickly but not as a flash
    const t0 = performance.now()
    await new Promise<void>((resolve) => {
      const f = () => {
        g.dark = Math.min(1, (performance.now() - t0) / 380)
        if (g.dark < 1) requestAnimationFrame(f)
        else resolve()
      }
      f()
    })
    sfx.hum(true)
    verity.glow.set(1)
    objective.set('Find Eric’s videos in the dark · 0/5')
    await say('i hid five of his videos in here. good luck.', { hold: 900 })
    chat.post('move your light with the mouse, a finger, or the arrow keys.', 'system')

    let round = 0
    while (true) {
      round++
      g.battery = 100
      g.on = true
      // two spare batteries turn up during each attempt
      let id = round * 10
      const spawn = async (delay: number) => {
        await wait(delay, signal)
        if (!g.on) return
        const b = { id: id++, x: rand(60, window.innerWidth - 60), y: rand(170, window.innerHeight - 160) }
        g.batteries = [...g.batteries, b]
        setBatteries(g.batteries)
      }
      void spawn(9000).catch(() => {})
      void spawn(21000).catch(() => {})

      const outcome = await new Promise<'win' | 'dead'>((resolve, reject) => {
        g.onWin = () => resolve('win')
        g.onDead = () => resolve('dead')
        signal.addEventListener('abort', () => reject(new DOMException('a', 'AbortError')), { once: true })
      })
      g.on = false
      g.onWin = g.onDead = null

      if (outcome === 'win') {
        await wait(700, signal)
        sfx.hum(false)
        sfx.lightSwitch()
        g.dark = 0
        objective.set(null)
        await say('the lights are back on because i am PANICKING.', { tone: 'loud' })
        dispatch({ type: 'SCENE', scene: 'button' })
        return
      }

      // battery died
      sfx.hum(false)
      dispatch({ type: 'MOOD', mood: 'calm' })
      await say('battery’s dead.', { hold: 700 })
      await say('he’s safe in the dark now. we could just… stop here.')
      const c = await ask(
        [
          { id: 'retry', label: 'New battery, try again', tone: 'yellow' },
          { id: 'stop', label: 'Leave him obscure' },
        ],
        signal,
      )
      if (c === 'stop') {
        await say('thank you. truly.')
        finishEnding('obscure')
        return
      }
      dispatch({ type: 'MOOD', mood: 'angry' })
      sfx.hum(true)
      await say('where do you keep getting batteries.', { hold: 600 })
    }
  }, [])

  useEffect(
    () => () => {
      sfx.hum(false)
      objective.set(null)
    },
    [],
  )

  const foundSet = new Set(foundIds)

  return (
    <div className="absolute inset-0" data-testid="lights-scene">
      {/* hidden videos, under the darkness */}
      {tiles.map((t) =>
        foundSet.has(t.video.id) ? null : (
          <div
            key={t.video.id}
            className="absolute overflow-hidden ring-1 ring-white/10"
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
            data-testid="hidden-video"
            data-video-id={t.video.id}
          >
            <img src={thumb(t.video, 'hq')} alt="" referrerPolicy="no-referrer" className="h-full w-full scale-[1.34] object-cover" draggable={false} />
          </div>
        ),
      )}
      {batteries.map((b) => (
        <div key={b.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: b.x, top: b.y }} data-testid="battery-pickup">
          <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
            <rect x="1" y="1" width="28" height="18" fill="#111" stroke="#f4f1e6" strokeWidth="2" />
            <rect x="29" y="6" width="4" height="8" fill="#f4f1e6" />
            <rect x="4" y="4" width="22" height="12" fill="#5be36b" />
          </svg>
        </div>
      ))}

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-testid="darkness" />

      {/* battery meter */}
      <div className="pointer-events-none fixed left-3 top-[118px] z-[47] flex items-center gap-2 sm:left-6 sm:top-[132px]" aria-label={`Battery ${battery}%`} role="meter" aria-valuenow={battery} aria-valuemin={0} aria-valuemax={100}>
        <span className="pixel text-[14px] text-pixel/70">BATTERY</span>
        <span className="flex h-4 w-28 gap-[2px] border-2 border-pixel/80 p-[2px]">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`h-full flex-1 ${i < Math.ceil(battery / 10) ? (battery < 20 ? 'bg-alarm' : 'bg-[#5be36b]') : 'bg-transparent'}`} />
          ))}
        </span>
        <span className="pixel w-10 text-[14px] tabular-nums text-pixel" data-testid="battery">
          {battery}%
        </span>
      </div>

      {/* found tray */}
      <ol className="pointer-events-none fixed left-3 top-[148px] z-[47] flex gap-1.5 sm:left-auto sm:right-6 sm:top-[132px]" aria-label="Videos found">
        {VIDEOS.map((v) => (
          <li key={v.id} className="relative h-[26px] w-[46px] border-2 border-pixel/30 bg-black/50 sm:h-[34px] sm:w-[60px]">
            <AnimatePresence>
              {foundSet.has(v.id) ? (
                <motion.img
                  src={thumb(v, 'mq')}
                  alt={v.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ scale: 2.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE.snap }}
                />
              ) : null}
            </AnimatePresence>
          </li>
        ))}
      </ol>
    </div>
  )
}

