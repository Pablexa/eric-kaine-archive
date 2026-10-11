import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { artistMedia, characterMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { clamp, prefersReducedMotion, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './ClonesScene.css'

/**
 * Protocol 06 — "if there are more of me, i can gatekeep faster."
 * Eric Kaineity splits until there are 20 fake fans: industry plant clones,
 * each one a real photo (his yellow avatar, or a bootleg wearing an
 * underground artist's face). You pop them. They chirp. The last few run
 * away. Space pops one at random (keyboard path).
 */

const TOTAL = 20
const SPLIT_LINES = ['two of me.', 'four fake fans.', 'eight plants.', 'sixteen. all me.', 'twenty. the label said stop.']

/** What a clone can look like. Index 0 is the real guide photo; the rest are bootlegs. */
const LOOKS: { media: RealMedia; ring: string }[] = [
  { media: characterMedia.kaineity, ring: '#ffe600' },
  { media: artistMedia.bleood, ring: '#ff2bd6' },
  { media: artistMedia.slayr, ring: '#39ff14' },
  { media: artistMedia.osamason, ring: '#00e5ff' },
  { media: artistMedia.carti, ring: '#ff5500' },
  { media: artistMedia.jaydes, ring: '#b026ff' },
  { media: artistMedia.slimey, ring: '#00ff9c' },
]

/** Sticker slapped under each clone. */
const TAGS = ['FAKE FAN', 'PLANT', 'BOOTLEG', 'CLONE', 'NOT HIM', 'TYPE BEAT', 'NPC', 'LEAKER']

const MARQUEE =
  '*** WARNING: INDUSTRY PLANTS DETECTED *** 0 REAL FANS ONLINE *** POP THEM ALL *** they never heard the unreleased *** gatekeep the soundcloud *** not trying to be famous *** slatt *** '

interface Clone {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alive: boolean
  wild: boolean
  pop: number // 0 = alive, >0 = pop animation progress
  look: number // index into LOOKS
  tag: number // index into TAGS
  tilt: number // resting sticker tilt, degrees
}

interface Slot {
  look: number
  tag: number
}

/** A child either keeps the parent's face or turns into a bootleg of someone else. */
const childLook = (parent: number) => (Math.random() < 0.5 ? parent : Math.random() < 0.4 ? 0 : 1 + Math.floor(Math.random() * (LOOKS.length - 1)))

export function ClonesScene() {
  const { dispatch } = useExperience()
  const rootRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const clones = useRef<Clone[]>([])
  const phase = useRef<'split' | 'hunt' | 'done'>('split')
  const combo = useRef({ n: 0, last: 0 })
  const allPopped = useRef<(() => void) | null>(null)
  const [left, setLeft] = useState(TOTAL)
  const [slots, setSlots] = useState<Slot[]>([])

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
    else if (remaining === 3) chat.post('please don’t. they have my unreleased.')
  }

  // clicking / tapping pops the nearest clone under the pointer
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
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
    root.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // simulation + positioning the photo clones (DOM transforms, no drawing)
  useEffect(() => {
    const reduce = prefersReducedMotion()
    const sizes: number[] = []
    const states: string[] = []
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

      // move every photo sticker to its clone
      const t = now / 1000
      const els = slotRefs.current
      for (let i = 0; i < els.length; i++) {
        const el = els[i]
        if (!el) continue
        const c = list[i]
        if (!c || (!c.alive && (c.pop <= 0 || c.pop >= 1))) {
          if (states[i] !== 'gone') {
            el.style.visibility = 'hidden'
            states[i] = 'gone'
          }
          continue
        }
        const state = c.alive ? (c.wild ? 'wild' : 'calm') : 'pop'
        if (states[i] !== state) {
          if (states[i] === undefined || states[i] === 'gone') el.style.visibility = 'visible'
          el.dataset.state = state
          states[i] = state
        }
        const d = c.r * 2
        if (sizes[i] !== d) {
          el.style.width = `${d}px`
          el.style.height = `${d}px`
          el.style.setProperty('--d', `${d}px`)
          sizes[i] = d
        }
        // lean toward the pointer like they're listening in; wild ones twitch
        const lean = clamp((pointer.x - c.x) / 40, -8, 8)
        const twitch = c.wild && !reduce ? Math.sin(t * 14 + i * 1.7) * 9 : 0
        let rot = c.tilt + lean + twitch
        let scale = 1
        let alpha = 1
        if (!c.alive) {
          alpha = clamp(1 - c.pop, 0, 1)
          if (!reduce) {
            scale = 1 + c.pop * 0.9
            rot += c.pop * 35
          }
        }
        el.style.transform = `translate3d(${(c.x - c.r).toFixed(1)}px, ${(c.y - c.r).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`
        el.style.opacity = alpha.toFixed(3)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
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
    await say('i can gatekeep the underground faster.', { hold: 500 })

    // mitosis: the real Eric Kaineity hands over to the photo clones
    verity.setMode('hidden')
    const small = window.innerWidth < 640
    clones.current = [
      { x: cx, y: cy, vx: 0, vy: 0, r: small ? 22 : 30, alive: true, wild: false, pop: 0, look: 0, tag: 3, tilt: 0 },
    ]
    for (let gen = 0; gen < SPLIT_LINES.length; gen++) {
      const next: Clone[] = []
      for (const c of clones.current) {
        const a = rand(0, Math.PI * 2)
        const s = rand(140, 260)
        next.push({ ...c, vx: Math.cos(a) * s, vy: Math.sin(a) * s, wild: Math.random() < 0.25 })
        next.push({
          ...c,
          x: c.x + 2,
          vx: -Math.cos(a) * s,
          vy: -Math.sin(a) * s,
          wild: Math.random() < 0.25,
          look: childLook(c.look),
          tag: Math.floor(Math.random() * TAGS.length),
          tilt: rand(-9, 9),
        })
      }
      clones.current = next.slice(0, TOTAL).map((c) => ({ ...c, r: clamp(c.r * (gen < 2 ? 1 : 0.94), small ? 14 : 18, 40) }))
      sfx.mitosis(gen)
      setSlots(clones.current.map((c) => ({ look: c.look, tag: c.tag })))
      setLeft(clones.current.length)
      void say(SPLIT_LINES[gen], { hold: 200, tone: gen === 4 ? 'loud' : 'normal' }).catch(() => {})
      await wait(gen < 3 ? 450 : 350, signal)
    }

    phase.current = 'hunt'
    objective.set(`Pop the clones · ${TOTAL} industry plants left`)
    chat.post('click or tap to pop the plants. space works too.', 'system')
    const done = new Promise<void>((resolve) => (allPopped.current = resolve))
    // he gets impatient
    const impatience = (async () => {
      await wait(22000, signal)
      if (phase.current !== 'hunt') return
      await say('you’re taking forever. i’ll pop my own plants.', { hold: 300 })
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
    await say('if he’s going to blow up on soundcloud anyway…', { hold: 600 })
    await say('he needs a HIT.', { tone: 'loud' })
    dispatch({ type: 'SCENE', scene: 'beat' })
  }, [])

  useEffect(() => {
    if (phase.current === 'hunt') objective.set(`Pop the clones · ${left} industry plants left`)
  }, [left])

  useEffect(() => () => objective.set(null), [])

  const plantsShown = slots.length ? left : 0

  return (
    <div
      ref={rootRef}
      className="kcl-root fixed inset-0 z-[45] h-full w-full touch-none select-none overflow-hidden"
      style={{ cursor: 'crosshair' }}
      aria-label={`Eric Kaineity clones posing as industry plants. ${left} left. Click, tap or press space to pop them.`}
      role="img"
      data-testid="clones"
      data-left={left}
    >
      {slots.length ? (
        <div aria-hidden="true" className="pointer-events-none">
          <div className="kcl-alert absolute left-3 top-[112px] sm:left-6 sm:top-[126px]">
            <p className="kcl-alert__title">INDUSTRY PLANT ALERT</p>
            <p className="kcl-alert__sub">eric kaineity cloned himself into fake fans</p>
            <p className="kcl-alert__count">
              plants online <span className="kcl-digits">{String(plantsShown).padStart(4, '0')}</span>
            </p>
            <p className="kcl-alert__count">
              real fans online <span className="kcl-digits kcl-digits--real">0001</span>
            </p>
          </div>

          <div className="kcl-dl absolute bottom-12 right-4 hidden sm:block sm:right-8">
            <span className="kcl-dl__main">DOWNLOAD 20 MORE CLONES</span>
            <span className="kcl-dl__fine">100% free · no virus · plants.zip</span>
          </div>

          <div className="kcl-marquee absolute inset-x-0 bottom-0 overflow-hidden">
            <div className="kcl-marquee__track">
              <span>{MARQUEE}</span>
              <span>{MARQUEE}</span>
            </div>
          </div>
        </div>
      ) : null}

      {slots.map((s, i) => {
        const look = LOOKS[s.look] ?? LOOKS[0]
        return (
          <div
            key={i}
            ref={(el) => {
              slotRefs.current[i] = el
            }}
            className={`kcl-clone${s.look === 0 ? ' kcl-clone--kaineity' : ''}`}
            style={{ '--ring': look.ring } as CSSProperties}
          >
            <img className="kcl-photo" src={look.media.src} alt="" draggable={false} decoding="async" />
            <span className="kcl-tag">{TAGS[s.tag] ?? TAGS[0]}</span>
            <span className="kcl-stamp">EXPOSED</span>
          </div>
        )
      })}
    </div>
  )
}
