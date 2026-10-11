import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { pileDim } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { clamp, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import { Icon } from '../../shared/Icon'

/**
 * Protocol 03 — a callback to the giant red SUBSCRIBE plate on Eric's channel
 * banner. The same joke four times, escalating: it dodges, Verity shields it,
 * it splits into decoys, and then… it doesn't do anything at all.
 */

type Stage = 'enter' | 'dodge' | 'shield' | 'shell' | 'calm' | 'pressed'

const DODGE_LINES = ['nope.', 'no.', 'it’s shy.', 'STOP CHASING IT.']
const WRONG_LINES = ['decoy. obviously.', 'wrong. so wrong.', 'that one was me in a costume.']
const IDLE_LINES = ['…why aren’t you pressing it.', 'is this reverse psychology.', 'it’s working. please just press it.']

const size = () => {
  const w = clamp(window.innerWidth * 0.34, 240, 440)
  return { w, h: w * 0.27 }
}
const centerPos = () => ({ x: window.innerWidth / 2, y: Math.max(window.innerHeight * 0.52, 300) })

interface Decoy {
  id: number
  slot: number
  real: boolean
  dead: boolean
}

export function ButtonScene() {
  const { dispatch } = useExperience()
  const [stage, setStage] = useState<Stage>('enter')
  const [pos, setPos] = useState(centerPos)
  const [dim, setDim] = useState(size)
  const [decoys, setDecoys] = useState<Decoy[]>([])
  const [wrong, setWrong] = useState(0)
  const stageRef = useRef<Stage>('enter')
  stageRef.current = stage
  const dodges = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const pressedResolve = useRef<(() => void) | null>(null)
  const shieldResolve = useRef<(() => void) | null>(null)
  const shieldDone = useRef(false)
  const shellResolve = useRef<(() => void) | null>(null)

  useEffect(() => {
    pileDim.set(true)
    const onResize = () => {
      setDim(size())
      if (stageRef.current !== 'dodge') setPos(centerPos())
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      verity.onGrab = null
      verity.onPress = null
      verity.setInteractive(false)
    }
  }, [])

  const relocate = useCallback(() => {
    const { w, h } = size()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let best = { x: vw / 2, y: vh / 2 }
    let bestD = -1
    for (let i = 0; i < 12; i++) {
      const c = { x: rand(w / 2 + 16, vw - w / 2 - 16), y: rand(170 + h / 2, vh - 150 - h / 2) }
      const d = Math.hypot(c.x - pointer.x, c.y - pointer.y)
      if (d > bestD) {
        best = c
        bestD = d
      }
    }
    setPos(best)
    sfx.boing()
    dodges.current++
    chat.post(DODGE_LINES[Math.min(DODGE_LINES.length - 1, dodges.current - 1)], 'verity', dodges.current >= 4 ? 'loud' : 'normal')
    if (dodges.current >= 4) {
      setStage('shield')
    }
  }, [])

  // desktop: the button runs before the cursor arrives
  useEffect(() => {
    if (stage !== 'dodge') return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = btnRef.current?.getBoundingClientRect()
      if (!r) return
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
      if (Math.hypot(dx, dy) < 34) relocate()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [stage, relocate])

  // shield: Verity parks on the button; drag her away (or press her with the keyboard)
  useEffect(() => {
    if (stage !== 'shield') return
    const c = centerPos()
    setPos(c)
    const big = Math.max(dim.h * 1.9, 110)
    void verity.moveTo(c.x, c.y, { size: big, duration: 0.7, ease: 'spring' }).catch(() => {})
    verity.setInteractive(true)
    void chat.say('over my dead orb.', { hold: 200 }).catch(() => {})
    objective.set('Get Verity off the button')
    let dragging = false
    let moved = false
    const done = () => {
      verity.setInteractive(false)
      verity.onGrab = null
      verity.onPress = null
      shieldDone.current = true
      shieldResolve.current?.()
    }
    verity.onPress = (viaKeyboard) => {
      if (viaKeyboard) {
        chat.post('fine. i’ll move. you asked nicely.')
        void verity.moveTo(c.x + dim.w * 0.7, c.y - dim.h * 1.4, { size: 70, duration: 0.6 }).catch(() => {})
        done()
      } else if (!moved) chat.post('don’t poke me.')
    }
    verity.onGrab = (e) => {
      e.preventDefault()
      dragging = true
      moved = false
      const ox = verity.x.get() - e.clientX
      const oy = verity.y.get() - e.clientY
      const sx = e.clientX
      const sy = e.clientY
      const move = (ev: PointerEvent) => {
        if (!dragging) return
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true
        verity.jump(ev.clientX + ox, ev.clientY + oy)
      }
      const up = () => {
        dragging = false
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        const d = Math.hypot(verity.x.get() - c.x, verity.y.get() - c.y)
        if (d > Math.max(170, dim.w * 0.6)) {
          sfx.bonk()
          chat.post('rude.')
          void verity.moveTo(verity.x.get(), verity.y.get(), { size: 70, duration: 0.4 }).catch(() => {})
          done()
        } else if (moved) {
          chat.post('nice try.')
          void verity.moveTo(c.x, c.y, { duration: 0.6, ease: 'spring' }).catch(() => {})
        }
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }
    return () => {
      verity.onGrab = null
      verity.onPress = null
    }
  }, [stage, dim.h, dim.w])

  const shuffle = useCallback(async (signal: AbortSignal, times: number) => {
    for (let i = 0; i < times; i++) {
      setDecoys((ds) => {
        const alive = ds.filter((d) => !d.dead)
        const slots = alive.map((d) => d.slot).sort(() => Math.random() - 0.5)
        return ds.map((d) => (d.dead ? d : { ...d, slot: slots[alive.indexOf(d)] }))
      })
      sfx.tick()
      await wait(420, signal)
    }
  }, [])

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    dispatch({ type: 'MOOD', mood: 'angry' })
    void verity.moveTo(window.innerWidth / 2, Math.max(150, window.innerHeight * 0.24), { size: 84, duration: 0.8 }).catch(() => {})
    await say('there is one button on this website i cannot let you press.')
    setStage('dodge')
    sfx.thud(0.9)
    objective.set('Press the button')

    // 1 → 2: dodge until the shield
    await new Promise<void>((resolve) => {
      const check = () => (stageRef.current === 'shield' ? resolve() : signal.aborted ? undefined : window.setTimeout(check, 100))
      check()
    })
    await new Promise<void>((resolve) => {
      if (shieldDone.current) resolve()
      else shieldResolve.current = resolve
    })
    dispatch({ type: 'MOOD', mood: 'annoyed' })

    // 3: the shell game
    objective.set('Find the real button')
    await say('fine. then find the real one.', { hold: 300 })
    const real = Math.floor(Math.random() * 5)
    // Listen before the decoys appear: the real one may be found mid-shuffle.
    const found = new Promise<void>((resolve) => (shellResolve.current = resolve))
    setDecoys(Array.from({ length: 5 }, (_, i) => ({ id: i, slot: i, real: i === real, dead: false })))
    setStage('shell')
    const shuffling = new AbortController()
    signal.addEventListener('abort', () => shuffling.abort(), { once: true })
    void wait(700, shuffling.signal).then(() => shuffle(shuffling.signal, 5)).catch(() => {})
    await found
    shuffling.abort()

    // 4: nothing happens
    // Listen before the button returns: pressing it before Verity finishes talking still counts.
    let pressedEarly = false
    const pressed = new Promise<void>((resolve) => (pressedResolve.current = () => { pressedEarly = true; resolve() }))
    setDecoys([])
    setPos(centerPos())
    setStage('calm')
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'calm' })
    const c = centerPos()
    await verity.moveTo(c.x + size().w * 0.62, c.y - size().h * 0.9, { size: 64, duration: 0.8, signal })
    if (!pressedEarly) await say('…fine.', { hold: 1400 })
    if (!pressedEarly) await say('press it. see if i care.', { hold: 200 })
    const idle = (async () => {
      for (const line of IDLE_LINES) {
        await wait(6500, signal)
        if (stageRef.current !== 'calm') return
        chat.post(line)
      }
    })().catch(() => {})
    await pressed
    void idle
    await wait(1100, signal)
    dispatch({ type: 'SCENE', scene: 'meltdown' })
  }, [])

  const onPick = async (d: Decoy) => {
    if (d.dead) return
    if (d.real) {
      sfx.bell()
      shellResolve.current?.()
      return
    }
    sfx.nope()
    setWrong((w) => w + 1)
    chat.post(WRONG_LINES[wrong % WRONG_LINES.length])
    setDecoys((ds) => ds.map((x) => (x.id === d.id ? { ...x, dead: true } : x)))
    const ac = new AbortController()
    await shuffle(ac.signal, 2).catch(() => {})
  }

  const onMainPress = (e: React.MouseEvent | React.PointerEvent) => {
    if (stage === 'dodge') {
      e.preventDefault()
      relocate()
      return
    }
    if (stage === 'calm') {
      setStage('pressed')
      sfx.subscribeChime()
      dispatch({ type: 'SUBSCRIBE' })
      pressedResolve.current?.()
    }
  }

  // decoy slot coordinates
  const slotPos = (slot: number) => {
    const vw = window.innerWidth
    const narrow = vw < 640
    const w = dim.w * (narrow ? 0.62 : 0.52)
    if (narrow) {
      const col = slot % 2
      const row = Math.floor(slot / 2)
      return { x: vw / 2 + (col - 0.5) * (w + 14) + (slot === 4 ? w / 2 + 7 : 0), y: 260 + row * (w * 0.27 + 46), w }
    }
    const gap = 18
    const total = 5 * w + 4 * gap
    return { x: vw / 2 - total / 2 + w / 2 + slot * (w + gap), y: centerPos().y, w }
  }

  return (
    <div className="absolute inset-0" data-testid="button-scene">
      <AnimatePresence>
        {stage !== 'enter' && stage !== 'shell' ? (
          <SubscribeButton
            key="main"
            ref={btnRef}
            x={pos.x}
            y={pos.y}
            w={dim.w}
            subscribed={stage === 'pressed'}
            disabled={stage === 'shield'}
            onPointerDown={(e) => {
              if (stage === 'dodge' && e.pointerType !== 'mouse') {
                e.preventDefault()
                relocate()
              }
            }}
            onClick={onMainPress}
            onKeyDown={(e) => {
              if (stage === 'dodge' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                relocate()
              }
            }}
          />
        ) : null}
        {stage === 'shell'
          ? decoys.map((d) => {
              const p = slotPos(d.slot)
              return d.dead ? null : (
                <SubscribeButton
                  key={`decoy-${d.id}`}
                  x={p.x}
                  y={p.y}
                  w={p.w}
                  ringing={d.real}
                  loudRing={d.real && wrong >= 2}
                  onClick={() => void onPick(d)}
                  testId={d.real ? 'decoy-real' : 'decoy'}
                />
              )
            })
          : null}
      </AnimatePresence>
    </div>
  )
}

interface SubscribeProps {
  x: number
  y: number
  w: number
  subscribed?: boolean
  disabled?: boolean
  ringing?: boolean
  loudRing?: boolean
  testId?: string
  onClick?: (e: React.MouseEvent) => void
  onPointerDown?: (e: React.PointerEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const SubscribeButton = forwardRef<HTMLButtonElement, SubscribeProps>(function SubscribeButton(
  { x, y, w, subscribed, disabled, ringing, loudRing, testId = 'subscribe', onClick, onPointerDown, onKeyDown },
  ref,
) {
  const h = w * 0.27
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      disabled={disabled}
      aria-label={subscribed ? 'Subscribed' : 'Subscribe'}
      className={`absolute left-0 top-0 flex touch-none select-none items-center justify-center gap-[0.45em] rounded-[0.55em] font-display font-black uppercase leading-none tracking-[-0.02em] [font-stretch:110%] focus-visible:outline-4 focus-visible:outline-verity ${
        subscribed ? 'bg-[#3a3a3a] text-pixel/80 shadow-[0_0.18em_0_#1d1d1d]' : 'bg-signal text-white shadow-[0_0.18em_0_#8f150f,0_1.4em_3em_-0.8em_rgba(232,48,43,0.65)]'
      }`}
      style={{ width: w, height: h, fontSize: h * 0.42 }}
      initial={{ x: x - w / 2, y: -h * 2, opacity: 0 }}
      animate={{ x: x - w / 2, y: y - h / 2, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      whileTap={{ y: y - h / 2 + 4 }}
      data-testid={testId}
    >
      <motion.span
        className="grid h-[1.25em] w-[1.25em] place-items-center rounded-full bg-white text-signal"
        animate={ringing || subscribed ? { rotate: [0, -16, 14, -10, 6, 0] } : { rotate: 0 }}
        transition={ringing ? { duration: loudRing ? 0.5 : 0.6, repeat: Infinity, repeatDelay: loudRing ? 0.25 : 1.2 } : { duration: 0.7 }}
      >
        <Icon name="bell" size={h * 0.36} strokeWidth={2.2} className={subscribed ? 'text-[#3a3a3a]' : ''} />
      </motion.span>
      {subscribed ? 'Subscribed' : 'Subscribe'}
    </motion.button>
  )
})

