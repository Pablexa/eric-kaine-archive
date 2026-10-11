import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { pileDim } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { artistMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { clamp, EASE, TIME, prefersReducedMotion, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './LightsScene.css'

/**
 * Protocol 02 — "Lights out". The Verity mod's flashlight, rebuilt for a
 * website: the basement goes dark, your pointer is the only light, the battery
 * drains, and Eric Kaineity has hidden five unreleased leaks somewhere in the
 * wreckage. Every leak you dig up is one more play.
 */

interface Leak {
  id: string
  file: string
  tag: string
  length: string
  sticker: string
  photo: RealMedia
  /** Fake waveform bar heights, 0..1. */
  wave: number[]
}

const waveform = (seed: number) =>
  Array.from({ length: 22 }, (_, i) => 0.2 + 0.8 * Math.abs(Math.sin(seed * 7.13 + i * 1.77) * Math.cos(seed * 1.31 + i * 0.61)))

const LEAKS: Leak[] = [
  { id: 'slayr', file: 'slayr_unreleased_FINAL(2).mp3', tag: 'UNRELEASED', length: '1:47', sticker: 'FREE DL', photo: artistMedia.slayr },
  { id: 'carti', file: 'carti_snippet_leak.wav', tag: 'SNIPPET', length: '0:29', sticker: 'NO TAG', photo: artistMedia.carti },
  { id: 'osamason', file: 'osamason_rage_v3_NO_TAGS.mp3', tag: 'LEAKED', length: '2:13', sticker: 'HQ!!', photo: artistMedia.osamason },
  { id: 'jaydes', file: 'jaydes_plugg_bootleg_(real).m4a', tag: 'BOOTLEG', length: '1:02', sticker: '320 KBPS', photo: artistMedia.jaydes },
  { id: 'slimey', file: '2slimey_slatt_demo_DONT_LEAK.mp3', tag: 'CURSED', length: '0:58', sticker: 'DL NOW', photo: artistMedia.slimey },
].map((leak, i) => ({ ...leak, wave: waveform(i + 1) }))

const FOUND_LINES = [
  'that’s one play. calm down.',
  'two plays. people are going to talk.',
  'three plays. this is how a leak spreads.',
  'four plays. i’m calling the gatekeepers.',
  'FIVE PLAYS. THIS IS AN EMERGENCY.',
]

/** Words that glow in the dark and scatter when the beam touches them. */
const WHISPERS = ['slatt', 'leak?', 'plugg', 'who got the link', 'dm 4 link', 'gatekeep', 'snippet', 'rage', 'unreleased', 'free dl', '???', 'cdq', 'woah', 'not famous', 'fake', 'he heard it']
const GLOW = ['rgba(255, 43, 214, 0.8)', 'rgba(57, 255, 20, 0.75)', 'rgba(255, 230, 0, 0.8)', 'rgba(0, 229, 255, 0.75)']

/** Basement wall stickers, only ever seen inside the beam. */
const DECOR: { text: string; x: string; y: string; r: number; kind: 'a' | 'b' | 'c' | 'd' | 'e' }[] = [
  { text: 'LEAK ALERT!!!', x: '4%', y: '22%', r: -8, kind: 'a' },
  { text: 'not trying to be famous', x: '62%', y: '19%', r: 6, kind: 'b' },
  { text: 'DO NOT DM FOR LINKS', x: '30%', y: '41%', r: -4, kind: 'd' },
  { text: 'gatekept since 2008', x: '74%', y: '47%', r: -10, kind: 'c' },
  { text: 'SLATT', x: '9%', y: '63%', r: 11, kind: 'e' },
  { text: 'plugg 4 life', x: '46%', y: '69%', r: 5, kind: 'b' },
  { text: 'RAGE ROOM', x: '83%', y: '76%', r: -6, kind: 'a' },
  { text: 'bring ur own flashlight', x: '22%', y: '84%', r: -3, kind: 'c' },
]

const NEWS =
  ' +++ 5 unreleased snippets went missing in the basement +++ eric kaineity says nobody is allowed to hear them +++ every leak you find is one more play +++ not trying to be famous +++ do not refresh +++'

interface Tile {
  leak: Leak
  x: number
  y: number
  w: number
  h: number
  tilt: number
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
  const h = w * 0.8
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
  return LEAKS.map((leak) => {
    const free = cells.filter((c) => !c.taken)
    const cell = free[Math.floor(Math.random() * free.length)]
    cell.taken = true
    return { leak, x: cell.x, y: cell.y, w, h, tilt: rand(-6, 6), progress: 0, found: false }
  })
}

export function LightsScene() {
  const { state, dispatch, finishEnding } = useExperience()
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
    // glowing words in the dark: they lean toward the light and scatter when it touches them
    const whispers = Array.from({ length: 16 }, (_, i) => ({
      x: rand(30, window.innerWidth - 30),
      y: rand(140, window.innerHeight - 40),
      s: rand(0.85, 1.35),
      gone: 0,
      blink: rand(0, 4000),
      word: WHISPERS[i % WHISPERS.length],
      color: GLOW[i % GLOW.length],
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
        // Eric Kaineity hunts the light, a little faster for every leak found
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
            setFoundIds(tilesRef.current.filter((x) => x.found).map((x) => x.leak.id))
            objective.set(`Dig up the unreleased leaks · ${n}/5`)
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
        ctx.fillStyle = `rgba(6, 0, 10, ${0.988 * g.dark})`
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
        // Eric Kaineity carries his own light
        const vg = ctx.createRadialGradient(vx, vy, vr * 0.5, vx, vy, vr * 2.4)
        vg.addColorStop(0, 'rgba(0,0,0,0.55)')
        vg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = vg
        ctx.beginPath()
        ctx.arc(vx, vy, vr * 2.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        // the whispers
        if (g.dark > 0.9) {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          for (const e of whispers) {
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
            if ((now + e.blink) % 4200 < 140) continue
            ctx.save()
            ctx.translate(e.x, e.y)
            ctx.rotate(clamp(ddx / 900, -0.35, 0.35))
            ctx.font = `700 ${Math.round(12 * e.s)}px 'Comic Sans MS', 'Comic Neue', cursive`
            ctx.fillStyle = e.color
            ctx.fillText(e.word, 0, 0)
            ctx.restore()
          }
        }

        // download progress rings
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for (const t of tilesRef.current) {
          if (t.found || t.progress <= 0) continue
          const cx = t.x + t.w / 2
          const cy = t.y + t.h / 2
          const rr = Math.min(t.w, t.h) * 0.42
          ctx.strokeStyle = 'rgba(57, 255, 20, 0.95)'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(cx, cy, rr, -Math.PI / 2, -Math.PI / 2 + t.progress * Math.PI * 2)
          ctx.stroke()
          ctx.font = `700 12px 'Comic Sans MS', 'Comic Neue', cursive`
          ctx.fillStyle = 'rgba(255, 230, 0, 0.95)'
          ctx.fillText(`downloading ${Math.round(t.progress * 100)}%`, cx, cy + rr + 12)
        }
        // the beam's edge, as a faint ring
        if (radius > 0) {
          ctx.strokeStyle = 'rgba(255, 43, 214, 0.22)'
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
    await say('if nobody can hear his leaks, he can’t get famous.')
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
    objective.set('Dig up the unreleased leaks · 0/5')
    await say('i hid five unreleased leaks down here. good luck.', { hold: 900 })
    chat.post('move your flashlight with the mouse, a finger, or the arrow keys.', 'system')

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
      await say('the leaks stay gatekept down here. we could just stop.')
      const c = await ask(
        [
          { id: 'retry', label: 'New battery, dig again', tone: 'yellow' },
          { id: 'stop', label: 'Keep the leaks gatekept' },
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
  const plays = String(Math.max(0, state.views)).padStart(7, '0')

  return (
    <div className="lx-scene absolute inset-0" data-testid="lights-scene">
      {/* the basement wall, only ever seen inside the beam */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {DECOR.map((d) => (
          <span key={d.text} className={`lx-decor lx-decor-${d.kind}`} style={{ left: d.x, top: d.y, transform: `rotate(${d.r}deg)` }}>
            {d.text}
          </span>
        ))}
        <div className="lx-news">
          <span className="lx-news-label">UNDERGROUND NEWS</span>
          <div className="lx-marquee">
            <span className="lx-marquee-track">
              {NEWS}
              {NEWS}
            </span>
          </div>
        </div>
      </div>

      {/* hidden leaks, under the darkness */}
      {tiles.map((t) =>
        foundSet.has(t.leak.id) ? null : (
          <div
            key={t.leak.id}
            className="absolute"
            style={{ left: t.x, top: t.y, width: t.w, height: t.h, transform: `rotate(${t.tilt}deg)` }}
            data-testid="hidden-video"
            data-video-id={t.leak.id}
          >
            <div className="lx-leak-card">
              <div className="lx-leak-photo">
                <img src={t.leak.photo.src} alt="" draggable={false} />
                <span className="lx-leak-tag">{t.leak.tag}</span>
                <span className="lx-leak-play" />
                <span className="lx-leak-len">{t.leak.length}</span>
              </div>
              <span className="lx-leak-name">{t.leak.file}</span>
              <span className="lx-leak-wave">
                {t.leak.wave.map((v, i) => (
                  <i key={i} style={{ height: `${Math.round(v * 100)}%` }} />
                ))}
              </span>
            </div>
            <span className="lx-leak-sticker">{t.leak.sticker}</span>
          </div>
        ),
      )}
      {batteries.map((b) => (
        <div key={b.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: b.x, top: b.y }} data-testid="battery-pickup">
          <span className="lx-pickup-inner" aria-hidden="true">
            +BATTERY
            <small>free dl, not a virus</small>
          </span>
        </div>
      ))}

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-testid="darkness" />

      {/* battery meter */}
      <div
        className="lx-meter pointer-events-none fixed left-3 top-[118px] z-[47] flex items-center gap-2 sm:left-6 sm:top-[132px]"
        aria-label={`Flashlight battery ${battery}%`}
        role="meter"
        aria-valuenow={battery}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="lx-meter-label">FLASHLIGHT</span>
        <span className="lx-meter-bar flex h-4 w-28 gap-[2px] p-[2px]">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`h-full flex-1 ${i < Math.ceil(battery / 10) ? (battery < 20 ? 'bg-[#ff1a1a]' : 'bg-[#39ff14]') : 'bg-transparent'}`} />
          ))}
        </span>
        <span className="lx-meter-num w-10 tabular-nums" data-testid="battery">
          {battery}%
        </span>
      </div>

      {/* plays counter + found leaks */}
      <div className="pointer-events-none fixed left-3 top-[160px] z-[47] flex items-center gap-3 sm:left-auto sm:right-6 sm:top-[128px]">
        <span className="lx-counter hidden sm:flex" aria-label={`${state.views.toLocaleString('en-US')} plays`}>
          PLAYS
          <span className="lx-counter-digits" aria-hidden="true">
            {plays.split('').map((digit, i) => (
              <b key={i}>{digit}</b>
            ))}
          </span>
        </span>
        <ol className="flex gap-1.5" aria-label="Leaks found">
          {LEAKS.map((leak) => (
            <li key={leak.id} className="lx-slot">
              {foundSet.has(leak.id) ? null : <span className="lx-slot-q" aria-hidden="true">?</span>}
              <AnimatePresence>
                {foundSet.has(leak.id) ? (
                  <motion.img
                    src={leak.photo.src}
                    alt={`Found leak ${leak.file}: ${leak.photo.alt}`}
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
    </div>
  )
}
