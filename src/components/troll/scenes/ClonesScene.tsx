import { useEffect, useRef, useState } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { clamp, prefersReducedMotion, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 06 — "if there are more of me, i can gatekeep faster."
 * Verity splits until there are 20 of her. You pop them. They chirp.
 * The last few run away. Space pops one at random (keyboard path).
 */

const TOTAL = 20
const SPLIT_LINES = ['two of me.', 'four.', 'eight.', 'sixteen.', 'twenty. payroll said stop.']

interface Clone {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alive: boolean
  wild: boolean
  pop: number // 0 = alive, >0 = pop animation progress
}

function makeSprite(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size * 0.36, size * 0.3, size * 0.05, size * 0.5, size * 0.5, size * 0.5)
  grad.addColorStop(0, '#fff6c2')
  grad.addColorStop(0.48, '#ffd21f')
  grad.addColorStop(1, '#d99a00')
  g.fillStyle = grad
  g.beginPath()
  g.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,.55)'
  g.beginPath()
  g.ellipse(size * 0.34, size * 0.27, size * 0.12, size * 0.07, -0.4, 0, Math.PI * 2)
  g.fill()
  return c
}

export function ClonesScene() {
  const { dispatch } = useExperience()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clones = useRef<Clone[]>([])
  const phase = useRef<'split' | 'hunt' | 'done'>('split')
  const combo = useRef({ n: 0, last: 0 })
  const allPopped = useRef<(() => void) | null>(null)
  const [left, setLeft] = useState(TOTAL)

  const popAt = (i: number) => {
    const c = clones.current[i]
    if (!c || !c.alive) return
    c.alive = false
    c.pop = 0.001
    const now = performance.now()
    combo.current.n = now - combo.current.last < 900 ? combo.current.n + 1 : 0
    combo.current.last = now
    sfx.popCombo(combo.current.n)
    const remaining = clones.current.filter((x) => x.alive).length
    setLeft(remaining)
    if (remaining === 0) allPopped.current?.()
    else if (remaining === 8) chat.post('wait. wait wait wait.')
    else if (remaining === 3) chat.post('please don’t.')
  }

  // clicking / tapping pops the nearest clone under the pointer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onDown = (e: PointerEvent) => {
      if (phase.current !== 'hunt') return
      let best = -1
      let bestD = Infinity
      clones.current.forEach((c, i) => {
        if (!c.alive) return
        const d = Math.hypot(c.x - e.clientX, c.y - e.clientY)
        if (d < c.r + 14 && d < bestD) {
          best = i
          bestD = d
        }
      })
      if (best >= 0) popAt(best)
      else sfx.tick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (phase.current !== 'hunt' || (e.key !== ' ' && e.key !== 'Enter')) return
      e.preventDefault()
      const aliveIdx = clones.current.map((c, i) => (c.alive ? i : -1)).filter((i) => i >= 0)
      if (aliveIdx.length) popAt(aliveIdx[Math.floor(Math.random() * aliveIdx.length)])
    }
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // simulation + drawing
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    const sprite = makeSprite(96)
    const reduce = prefersReducedMotion()
    let raf = 0
    let last = performance.now()
    let lastChirp = 0
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const w = window.innerWidth
      const h = window.innerHeight
      const list = clones.current
      const aliveCount = list.filter((c) => c.alive).length
      for (const c of list) {
        if (!c.alive) {
          if (c.pop > 0) c.pop += dt * 3
          continue
        }
        // the last few run from the pointer
        if (aliveCount <= 8 && phase.current === 'hunt') {
          const dx = c.x - pointer.x
          const dy = c.y - pointer.y
          const d = Math.hypot(dx, dy) || 1
          if (d < 220) {
            c.vx += (dx / d) * 900 * dt
            c.vy += (dy / d) * 900 * dt
          }
        }
        const sp = Math.hypot(c.vx, c.vy)
        const max = reduce ? 160 : aliveCount <= 8 ? 520 : 300
        if (sp > max) {
          c.vx = (c.vx / sp) * max
          c.vy = (c.vy / sp) * max
        }
        c.x += c.vx * dt
        c.y += c.vy * dt
        if (c.x < c.r) (c.x = c.r), (c.vx = Math.abs(c.vx))
        if (c.x > w - c.r) (c.x = w - c.r), (c.vx = -Math.abs(c.vx))
        if (c.y < 90 + c.r) (c.y = 90 + c.r), (c.vy = Math.abs(c.vy))
        if (c.y > h - c.r) (c.y = h - c.r), (c.vy = -Math.abs(c.vy))
      }
      // cheap elastic collisions between clones
      for (let i = 0; i < list.length; i++) {
        const a = list[i]
        if (!a.alive) continue
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j]
          if (!b.alive) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy)
          const min = a.r + b.r
          if (d > 0 && d < min) {
            const nx = dx / d
            const ny = dy / d
            const push = (min - d) / 2
            a.x -= nx * push
            a.y -= ny * push
            b.x += nx * push
            b.y += ny * push
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
            if (rel < 0) {
              a.vx += rel * nx
              a.vy += rel * ny
              b.vx -= rel * nx
              b.vy -= rel * ny
            }
          }
        }
      }
      // the choir
      if (aliveCount && now - lastChirp > 180) {
        lastChirp = now
        sfx.chirp(String.fromCharCode(97 + Math.floor(Math.random() * 26)), Math.random() < 0.3 ? 'unhinged' : 'calm')
      }

      ctx.clearRect(0, 0, w, h)
      for (const c of list) {
        if (!c.alive) {
          if (c.pop > 0 && c.pop < 1) {
            // pixel burst
            ctx.fillStyle = c.pop < 0.5 ? '#ffd21f' : '#ff5a2a'
            for (let k = 0; k < 8; k++) {
              const a = (k / 8) * Math.PI * 2
              const dist = c.r * (0.6 + c.pop * 2.2)
              const s = 6 * (1 - c.pop)
              ctx.fillRect(c.x + Math.cos(a) * dist - s / 2, c.y + Math.sin(a) * dist - s / 2, s, s)
            }
          }
          continue
        }
        ctx.drawImage(sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)
        // eyes follow the pointer
        const dx = pointer.x - c.x
        const dy = pointer.y - c.y
        const d = Math.hypot(dx, dy) || 1
        const ox = (dx / d) * c.r * 0.12
        const oy = (dy / d) * c.r * 0.1
        ctx.fillStyle = '#1a1400'
        if (c.wild) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(c.x - c.r * 0.3, c.y - c.r * 0.12, c.r * 0.24, 0, Math.PI * 2)
          ctx.arc(c.x + c.r * 0.3, c.y - c.r * 0.12, c.r * 0.24, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#1a1400'
          ctx.beginPath()
          ctx.arc(c.x - c.r * 0.3 + ox, c.y - c.r * 0.12 + oy, c.r * 0.07, 0, Math.PI * 2)
          ctx.arc(c.x + c.r * 0.3 + ox, c.y - c.r * 0.12 + oy, c.r * 0.07, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.ellipse(c.x - c.r * 0.24 + ox, c.y - c.r * 0.08 + oy, c.r * 0.1, c.r * 0.16, 0, 0, Math.PI * 2)
          ctx.ellipse(c.x + c.r * 0.24 + ox, c.y - c.r * 0.08 + oy, c.r * 0.1, c.r * 0.16, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.strokeStyle = '#1a1400'
        ctx.lineWidth = Math.max(1.5, c.r * 0.07)
        ctx.beginPath()
        ctx.arc(c.x, c.y + c.r * 0.18, c.r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'calm' })
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    await verity.moveTo(cx, cy, { size: 80, duration: 0.8, signal })
    await say('if there are more of me…', { hold: 700 })
    await say('i can gatekeep faster.', { hold: 500 })

    // mitosis: the real Verity hands over to the clone canvas
    verity.setMode('hidden')
    const small = window.innerWidth < 640
    clones.current = [{ x: cx, y: cy, vx: 0, vy: 0, r: small ? 22 : 30, alive: true, wild: false, pop: 0 }]
    for (let gen = 0; gen < SPLIT_LINES.length; gen++) {
      const next: Clone[] = []
      for (const c of clones.current) {
        const a = rand(0, Math.PI * 2)
        const s = rand(140, 260)
        next.push({ ...c, vx: Math.cos(a) * s, vy: Math.sin(a) * s, wild: Math.random() < 0.25 })
        next.push({ ...c, x: c.x + 2, vx: -Math.cos(a) * s, vy: -Math.sin(a) * s, wild: Math.random() < 0.25 })
      }
      clones.current = next.slice(0, TOTAL).map((c) => ({ ...c, r: clamp(c.r * (gen < 2 ? 1 : 0.94), small ? 14 : 18, 40) }))
      sfx.mitosis(gen)
      setLeft(clones.current.length)
      void say(SPLIT_LINES[gen], { hold: 200, tone: gen === 4 ? 'loud' : 'normal' }).catch(() => {})
      await wait(gen < 3 ? 450 : 350, signal)
    }

    phase.current = 'hunt'
    objective.set(`Pop the clones · ${TOTAL} left`)
    chat.post('click or tap to pop them. space works too.', 'system')
    const done = new Promise<void>((resolve) => (allPopped.current = resolve))
    // she gets impatient
    const impatience = (async () => {
      await wait(22000, signal)
      if (phase.current !== 'hunt') return
      await say('you’re taking forever. i’ll pop myself.', { hold: 300 })
      const idx = clones.current.map((c, i) => (c.alive ? i : -1)).filter((i) => i >= 0)
      for (const i of idx) {
        popAt(i)
        await wait(45, signal)
      }
    })().catch(() => {})
    await done
    void impatience
    phase.current = 'done'
    objective.set(null)
    await wait(900, signal)

    verity.jump(cx, cy, 10)
    verity.setMode('free', false)
    sfx.pop()
    await verity.moveTo(cx, cy, { size: 76, duration: 0.6, ease: 'spring', signal })
    await say('…ow.', { hold: 1100 })
    await say('ok. i have one more idea.', { hold: 600 })
    await say('if he’s going to be famous anyway…', { hold: 600 })
    await say('he needs a HIT.', { tone: 'loud' })
    dispatch({ type: 'SCENE', scene: 'beat' })
  }, [])

  useEffect(() => {
    if (phase.current === 'hunt') objective.set(`Pop the clones · ${left} left`)
  }, [left])

  useEffect(() => () => objective.set(null), [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[45] h-full w-full touch-none"
      style={{ cursor: 'crosshair' }}
      aria-label={`Verity clones. ${left} left. Click, tap or press space to pop them.`}
      role="img"
      data-testid="clones"
      data-left={left}
    />
  )
}

