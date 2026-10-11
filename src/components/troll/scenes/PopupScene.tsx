import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { thumb, videos, type Video } from '../../../lib/content/channel'
import { TIME, clamp, pick, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 05 — popup hell. Closing a window spawns two more. Every other
 * button spawns even more. The only way out is volume: close enough of them,
 * or catch the CLOSE ALL button (it runs).
 */

const GOAL = 15
const CAP = 15

interface Win {
  id: number
  kind: number
  x: number
  y: number
  z: number
  video: Video
  rot: number
}

interface Kind {
  title: string
  body: (w: Win) => ReactNode
  buttons: string[]
}

const Dots = () => (
  <span className="inline-flex gap-0.5 align-middle">
    {[0, 1, 2].map((i) => (
      <motion.span key={i} className="block h-1.5 w-1.5 rounded-full bg-black" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
    ))}
  </span>
)

const KINDS: Kind[] = [
  { title: 'Alert', body: () => <>eric kaine is getting too famous.</>, buttons: ['OK', 'OK'] },
  { title: 'Notifications', body: () => <>verity wants to send you notifications.</>, buttons: ['Allow', 'Allow'] },
  {
    title: 'Congratulations!!!',
    body: () => (
      <>
        you are the <b>1,501st</b> subscriber!!! click below to claim your prize
      </>
    ),
    buttons: ['CLAIM PRIZE'],
  },
  {
    title: 'Messenger',
    body: () => (
      <>
        eric kaine is typing <Dots />
      </>
    ),
    buttons: ['Wait'],
  },
  {
    title: 'Now playing',
    body: (w) => (
      <span className="flex items-center gap-2">
        <img src={thumb(w.video, 'mq')} alt="" referrerPolicy="no-referrer" className="h-10 w-[72px] shrink-0 object-cover" />
        <span className="line-clamp-2 text-[12px]">{w.video.title}</span>
      </span>
    ),
    buttons: ['▶ Play'],
  },
  { title: 'Are you sure?', body: () => <>are you sure you want to close this window?</>, buttons: ['Yes', 'No'] },
  { title: 'Gatekept', body: () => <>this window has been gatekept.</>, buttons: ['Ungatekeep'] },
  {
    title: 'Installing',
    body: () => (
      <span className="block">
        installing more verity… 99%
        <span className="mt-1.5 block h-3 border border-black bg-white p-[1px]">
          <span className="block h-full w-[99%] bg-[repeating-linear-gradient(90deg,#000080_0_8px,transparent_8px_10px)]" />
        </span>
      </span>
    ),
    buttons: ['Cancel'],
  },
  { title: 'Question', body: () => <>unsubscribe from eric kaine?</>, buttons: ['No', 'NO'] },
  { title: 'Error 404', body: () => <>fame not found. try again later.</>, buttons: ['Retry'] },
  { title: 'Error', body: () => <>website is too nice. please make it worse.</>, buttons: ['Make worse'] },
  { title: 'Visitor counter', body: () => <>you are visitor <b>#0001501</b>!! (you are not special)</>, buttons: ['Thanks'] },
  { title: 'Verity', body: () => <>hi. it’s me. i’m in the popups now.</>, buttons: ['hi verity'] },
]

const CLOSE_LINES: Record<number, string> = {
  1: 'closing one makes two. that’s how popups work.',
  5: 'keep going. this is very healthy.',
  10: 'they’re multiplying. like fame.',
  14: 'last one. my computer is making soup.',
}

export function PopupScene() {
  const { dispatch } = useExperience()
  const [wins, setWins] = useState<Win[]>([])
  const [closed, setClosed] = useState(0)
  const [falling, setFalling] = useState(false)
  const [closeAll, setCloseAll] = useState<{ x: number; y: number; dodges: number } | null>(null)
  const nextId = useRef(1)
  const topZ = useRef(10)
  const lastDing = useRef(0)
  const finish = useRef<(() => void) | null>(null)
  const closedRef = useRef(0)
  const alive = useRef(0)
  alive.current = wins.length

  const ding = () => {
    const now = performance.now()
    if (now - lastDing.current < 70) return
    lastDing.current = now
    sfx.errorDing(Math.floor(rand(-4, 6)))
  }

  const spawn = useCallback((n: number, near?: { x: number; y: number }) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(300, vw * 0.78)
    setWins((ws) => {
      const room = Math.max(0, CAP - ws.length)
      const add: Win[] = Array.from({ length: Math.min(n, room) }, () => ({
        id: nextId.current++,
        kind: Math.floor(Math.random() * KINDS.length),
        x: clamp(near ? near.x + rand(-140, 140) : rand(8, vw - w - 8), 8, vw - w - 8),
        y: clamp(near ? near.y + rand(-100, 120) : rand(110, vh - 260), 96, vh - 200),
        z: ++topZ.current,
        video: pick(videos),
        rot: rand(-4, 4),
      }))
      return [...ws, ...add]
    })
    for (let i = 0; i < n; i++) window.setTimeout(ding, i * 60)
  }, [])

  const onClose = (w: Win) => {
    setWins((ws) => ws.filter((x) => x.id !== w.id))
    sfx.click()
    const c = ++closedRef.current
    setClosed(c)
    if (CLOSE_LINES[c]) chat.post(CLOSE_LINES[c])
    if (c >= 6 && !closeAll) setCloseAll({ x: window.innerWidth / 2, y: window.innerHeight - 150, dodges: 0 })
    if (c >= GOAL) finish.current?.()
    else spawn(2, { x: w.x, y: w.y })
  }

  const onButton = (w: Win) => {
    spawn(Math.random() < 0.5 ? 2 : 3, { x: w.x, y: w.y })
    if (Math.random() < 0.25) chat.post(pick(['that button makes more. obviously.', 'wrong button.', 'every button is the wrong button.']))
  }

  // the CLOSE ALL button runs from the cursor, three times
  useEffect(() => {
    if (!closeAll || closeAll.dodges >= 3 || falling) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (Math.hypot(e.clientX - closeAll.x, e.clientY - closeAll.y) < 110) dodge()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  })

  const dodge = () => {
    sfx.boing()
    setCloseAll((c) => {
      if (!c) return c
      const vw = window.innerWidth
      const vh = window.innerHeight
      let best = { x: c.x, y: c.y }
      let bestD = -1
      for (let i = 0; i < 10; i++) {
        const p = { x: rand(110, vw - 110), y: rand(150, vh - 120) }
        const d = Math.hypot(p.x - pointer.x, p.y - pointer.y)
        if (d > bestD) {
          best = p
          bestD = d
        }
      }
      return { ...best, dodges: c.dodges + 1 }
    })
  }

  // windows also just… show up
  useEffect(() => {
    if (falling) return
    const t = window.setInterval(() => {
      if (alive.current < 10) spawn(1)
    }, 1800 * Math.max(0.3, TIME.scale))
    return () => window.clearInterval(t)
  }, [falling, spawn])

  useScript(async (signal) => {
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    void verity.moveTo(window.innerWidth * 0.14, window.innerHeight * 0.3, { size: 64, duration: 0.8, signal }).catch(() => {})
    objective.set(`Close the popups · 0/${GOAL}`)
    spawn(1)
    await chat.say('close that for me?', { signal, hold: 400 })
    await new Promise<void>((resolve) => (finish.current = resolve))
    setFalling(true)
    sfx.crash()
    objective.set(null)
    await chat.say('FINE. alt + f4.', { signal, tone: 'loud', hold: 1200 })
    await wait(600, signal)
    await chat.say('ok. new idea. a better idea.', { signal })
    dispatch({ type: 'SCENE', scene: 'clones' })
  }, [])

  useEffect(() => {
    if (!falling) objective.set(`Close the popups · ${Math.min(closed, GOAL)}/${GOAL}`)
  }, [closed, falling])

  return (
    <div className="pointer-events-none fixed inset-0 z-[45]" data-testid="popup-scene" data-goal={GOAL} data-closed={closed}>
      <AnimatePresence>
        {wins.map((w) => (
          <PopupWindow key={w.id} w={w} falling={falling} onClose={() => onClose(w)} onButton={() => onButton(w)} onFocus={() => setWins((ws) => ws.map((x) => (x.id === w.id ? { ...x, z: ++topZ.current } : x)))} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {closeAll && !falling ? (
          <motion.button
            key="close-all"
            type="button"
            className="pointer-events-auto absolute left-0 top-0 border-[3px] border-black bg-alarm px-5 py-3 text-[18px] font-black uppercase text-white shadow-[5px_5px_0_#000]"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif', zIndex: 100000 }}
            initial={{ scale: 0, x: closeAll.x - 80, y: closeAll.y - 24 }}
            animate={{ scale: 1, x: closeAll.x - 80, y: closeAll.y - 24 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onPointerDown={(e) => {
              if (closeAll.dodges < 3 && e.pointerType !== 'mouse') {
                e.preventDefault()
                dodge()
              }
            }}
            onClick={() => {
              if (closeAll.dodges < 3) return dodge()
              finish.current?.()
            }}
            data-testid="close-all"
          >
            Close all
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function PopupWindow({ w, falling, onClose, onButton, onFocus }: { w: Win; falling: boolean; onClose: () => void; onButton: () => void; onFocus: () => void }) {
  const k = KINDS[w.kind]
  const [pos, setPos] = useState({ x: w.x, y: w.y })
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const width = Math.min(300, window.innerWidth * 0.78)

  return (
    <motion.div
      role="dialog"
      aria-label={k.title}
      className="pointer-events-auto absolute left-0 top-0 border-2 border-t-white border-l-white border-b-black border-r-black bg-[#c0c0c0] text-black shadow-[4px_4px_0_rgba(0,0,0,0.6)]"
      style={{ width, zIndex: w.z, fontFamily: 'Tahoma, Verdana, Segoe UI, sans-serif' }}
      initial={{ scale: 0.4, opacity: 0, x: pos.x, y: pos.y, rotate: 0 }}
      animate={
        falling
          ? { x: pos.x + rand(-200, 200), y: window.innerHeight + 300, rotate: w.rot * 20, opacity: 1, scale: 1, transition: { duration: rand(0.7, 1.3), ease: [0.5, 0, 1, 0.5] } }
          : { scale: 1, opacity: 1, x: pos.x, y: pos.y, rotate: w.rot * 0.2 }
      }
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      onPointerDown={onFocus}
      data-testid="popup"
    >
      <div
        className="flex cursor-grab touch-none select-none items-center justify-between gap-2 bg-gradient-to-r from-[#000080] to-[#1084d0] px-1.5 py-1 text-[12px] font-bold text-white active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (drag.current) setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy })
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="block h-3 w-3 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6c2,#ffd21f_55%,#d99a00)]" />
          <span className="truncate">VerityOS — {k.title}</span>
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="grid h-6 w-6 shrink-0 place-items-center border-2 border-t-white border-l-white border-b-black border-r-black bg-[#c0c0c0] text-[13px] font-black leading-none text-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
          aria-label={`Close ${k.title}`}
          data-testid="popup-close"
        >
          ✕
        </button>
      </div>
      <div className="flex items-start gap-3 px-3 py-3 text-[13px] leading-snug">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-black bg-[#ffd21f] text-[18px] font-black">
          !
        </span>
        <div className="min-w-0 flex-1">{k.body(w)}</div>
      </div>
      <div className="flex justify-end gap-2 px-3 pb-3">
        {k.buttons.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={onButton}
            className="min-w-[72px] border-2 border-t-white border-l-white border-b-black border-r-black bg-[#c0c0c0] px-3 py-1 text-[12px] text-black outline-1 outline-offset-[-5px] outline-dotted outline-black/60 active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
          >
            {b}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
