import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { pointer } from '../../../lib/interactions/pointer'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { TIME, clamp, pick, rand, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './PopupScene.css'

/**
 * Protocol 05 — popup hell, 2008 underground edition. Every window is a fake
 * leak download, a scam prize or a gatekept invite, each with a real photo.
 * Closing one spawns two more. Every other button spawns even more. The only
 * way out is volume: close enough of them, or catch the CLOSE ALL button (it runs).
 */

const GOAL = 15
const CAP = 15

const popupWidth = () => Math.min(310, window.innerWidth * 0.8)

/** Underground artists a random popup can be "about". */
const ARTISTS: { name: string; media: RealMedia }[] = [
  { name: 'bleood', media: artistMedia.bleood },
  { name: 'slayr', media: artistMedia.slayr },
  { name: 'osamason', media: artistMedia.osamason },
  { name: 'carti', media: artistMedia.carti },
  { name: 'jaydes', media: artistMedia.jaydes },
  { name: '2slimey', media: artistMedia.slimey },
]

const SNIPPETS = [
  'untitled snippet (0:14)',
  'unreleased ft. a seal',
  'cheese freestyle (LEAK)',
  'slatt slatt slatt (prod. nobody)',
  'plugg demo 47 FINAL final',
  'rage bootleg (cursed)',
]

type Skin = 'scam' | 'toxic' | 'dark' | 'myspace' | 'sc' | 'err'

/** Fake program names in each skin's title bar. */
const SKIN_APP: Record<Skin, string> = {
  scam: 'FREE-LEAKZ.biz',
  toxic: 'sl4tt.exe',
  dark: 'gatekept.net',
  myspace: 'mySpace Bulletin',
  sc: 'snippet player 2008',
  err: 'Slatt Explorer',
}

interface Win {
  id: number
  kind: number
  x: number
  y: number
  z: number
  artist: number
  snippet: number
  rot: number
}

interface Kind {
  title: string
  skin: Skin
  /** A fixed real photo; without one the popup shows its random artist. */
  photo?: RealMedia
  sticker?: string
  marquee?: string
  footer?: string
  body: (w: Win) => ReactNode
  buttons: string[]
}

const artistOf = (w: Win) => ARTISTS[w.artist % ARTISTS.length]

const Dots = () => (
  <span className="inline-flex gap-0.5 align-middle">
    {[0, 1, 2].map((i) => (
      <motion.span key={i} className="block h-1.5 w-1.5 rounded-full bg-current" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
    ))}
  </span>
)

const Counter = ({ value }: { value: string }) => (
  <span className="ks-pop__counter" aria-hidden="true">
    {value.split('').map((d, i) => (
      <span key={i}>{d}</span>
    ))}
  </span>
)

const WAVE = [6, 12, 9, 18, 14, 20, 11, 7, 16, 22, 13, 9, 17, 12, 6, 15, 19, 10, 8, 14, 5]

const KINDS: Kind[] = [
  {
    title: 'FREE CARTI LEAK DOWNLOAD',
    skin: 'scam',
    photo: artistMedia.carti,
    sticker: 'NO VIRUS!!',
    marquee: '*** 100% REAL LEAK *** FAST MIRROR *** NOT A VIRUS *** TRUST ***',
    body: () => (
      <>
        <b className="break-all">carti_unreleased_FINAL_v2(1).mp3</b>
        <br />
        real leak. fast mirror. just click download.
      </>
    ),
    buttons: ['DOWNLOAD NOW', 'MIRROR 2'],
  },
  {
    title: '2SLIMEY UNRELEASED.zip',
    skin: 'toxic',
    photo: artistMedia.slimey,
    sticker: 'LEAKED',
    body: () => (
      <>
        <b className="break-all">2SLIMEY_UNRELEASED.zip</b> (13.37 MB)
        <br />
        extract 47 unreleased snippets?
      </>
    ),
    buttons: ['Extract all', 'Extract here'],
  },
  {
    title: 'CONGRATULATIONS!!!',
    skin: 'scam',
    photo: objectMedia.seal,
    sticker: 'WINNER',
    marquee: '!!! YOU WON !!! YOU WON !!! YOU WON !!!',
    body: () => (
      <>
        YOU ARE THE <b>1,000,000th</b> SLATT VISITOR!!! claim your prize: one (1) seal
      </>
    ),
    buttons: ['CLAIM PRIZE'],
  },
  {
    title: 'join the gatekept discord',
    skin: 'dark',
    photo: characterMedia.ericPfp,
    sticker: 'INVITE ONLY',
    footer: '3 members · 0 online · 1 seal',
    body: () => <>shhh. invite only. you are not trying to be famous, right?</>,
    buttons: ['Join', 'Join anyway'],
  },
  {
    title: 'cheese.exe',
    skin: 'err',
    photo: objectMedia.cheese,
    body: () => (
      <>
        <b>cheese.exe has stopped working.</b>
        <br />
        windows is checking for more cheese…
      </>
    ),
    buttons: ['Debug', 'Send cheese report'],
  },
  {
    title: 'Messenger',
    skin: 'myspace',
    photo: artistMedia.bleood,
    footer: 'status: not trying to be famous',
    body: () => (
      <>
        bleood is typing <Dots />
      </>
    ),
    buttons: ['Wait'],
  },
  {
    title: 'Now playing',
    skin: 'sc',
    body: (w) => (
      <span className="block">
        <b>{artistOf(w).name}</b> – {SNIPPETS[w.snippet % SNIPPETS.length]}
        <span className="ks-pop__wave mt-1" aria-hidden="true">
          {WAVE.map((h, i) => (
            <span key={i} style={{ height: h }} />
          ))}
        </span>
        <span className="mt-0.5 block text-[11px] text-[#ff9a00]">► 1,501 plays · unreleased</span>
      </span>
    ),
    buttons: ['► Play snippet'],
  },
  {
    title: 'Are you sure?',
    skin: 'myspace',
    body: () => <>are you sure you want to close this leak? it took 3 years to leak.</>,
    buttons: ['Yes', 'No'],
  },
  {
    title: 'Gatekept',
    skin: 'dark',
    photo: artistMedia.slayr,
    sticker: 'GATEKEPT',
    body: () => <>this window has been gatekept. you were not supposed to find it.</>,
    buttons: ['Ungatekeep'],
  },
  {
    title: 'Installing',
    skin: 'toxic',
    photo: artistMedia.osamason,
    body: () => (
      <span className="block">
        installing more rage… 99%
        <span className="ks-pop__progress mt-1.5">
          <span />
        </span>
      </span>
    ),
    buttons: ['Cancel'],
  },
  {
    title: 'Question',
    skin: 'myspace',
    photo: artistMedia.jaydes,
    body: () => <>unfollow jaydes on soundcloud?</>,
    buttons: ['No', 'NO'],
  },
  {
    title: 'Error 404',
    skin: 'err',
    photo: objectMedia.burger,
    body: () => <>snippet not found. it got leaked twice. try again in 2008.</>,
    buttons: ['Retry'],
  },
  {
    title: 'Error',
    skin: 'err',
    photo: objectMedia.slime,
    sticker: 'SLIMED',
    body: () => <>this page is not ugly enough. add more glitter?</>,
    buttons: ['Make worse'],
  },
  {
    title: 'Visitor counter',
    skin: 'myspace',
    photo: objectMedia.seal,
    body: () => (
      <span className="block">
        <Counter value="0001501" />
        <span className="mt-1 block">
          you are visitor <b>#0001501</b>!! (you are not special)
        </span>
      </span>
    ),
    buttons: ['Thanks'],
  },
  {
    title: 'Eric Kaineity',
    skin: 'dark',
    photo: characterMedia.kaineity,
    body: () => <>hi. it’s me. i’m in the popups now.</>,
    buttons: ['hi eric kaineity'],
  },
  {
    title: 'seal.mp3',
    skin: 'sc',
    photo: objectMedia.seal,
    footer: '0:03 · 1 play (it was the seal)',
    body: () => <>a seal sent you a voice note. it is mostly barking.</>,
    buttons: ['Listen'],
  },
  {
    title: 'FREE RINGTONE',
    skin: 'scam',
    sticker: 'FREE!!!',
    marquee: '>>> TEXT SLATT NOW >>> TEXT SLATT NOW >>>',
    body: (w) => (
      <>
        text <b>SLATT</b> to 00000 for a free {artistOf(w).name} ringtone. (not real)
      </>
    ),
    buttons: ['GET RINGTONE'],
  },
  {
    title: 'Top 8 update',
    skin: 'myspace',
    footer: 'mood: gatekept',
    body: (w) => (
      <>
        <b>{artistOf(w).name}</b> removed you from their top 8.
      </>
    ),
    buttons: ['Cry', 'Cry more'],
  },
]

const CLOSE_LINES: Record<number, string> = {
  1: 'closing one makes two. that’s how leaks work.',
  5: 'keep going. this is very underground of you.',
  10: 'they’re multiplying. like unreleased snippets.',
  14: 'last one. my computer is playing a carti snippet by itself.',
}

const BUTTON_LINES = ['that button makes more. obviously.', 'wrong button. that was a fake download.', 'every download button is fake. it’s 2008.']

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
    const w = popupWidth()
    setWins((ws) => {
      const room = Math.max(0, CAP - ws.length)
      const add: Win[] = Array.from({ length: Math.min(n, room) }, () => ({
        id: nextId.current++,
        kind: Math.floor(Math.random() * KINDS.length),
        x: clamp(near ? near.x + rand(-140, 140) : rand(8, vw - w - 8), 8, vw - w - 8),
        y: clamp(near ? near.y + rand(-100, 120) : rand(110, vh - 260), 96, vh - 200),
        z: ++topZ.current,
        artist: Math.floor(Math.random() * ARTISTS.length),
        snippet: Math.floor(Math.random() * SNIPPETS.length),
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
    if (Math.random() < 0.25) chat.post(pick(BUTTON_LINES))
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
    objective.set(`Close the leak popups · 0/${GOAL}`)
    spawn(1)
    await chat.say('a free leak? close that for me?', { signal, hold: 400 })
    await new Promise<void>((resolve) => (finish.current = resolve))
    setFalling(true)
    sfx.crash()
    objective.set(null)
    await chat.say('FINE. alt f4. the whole page.', { signal, tone: 'loud', hold: 1200 })
    await wait(600, signal)
    await chat.say('ok. new idea. a more underground idea.', { signal })
    dispatch({ type: 'SCENE', scene: 'clones' })
  }, [])

  useEffect(() => {
    if (!falling) objective.set(`Close the leak popups · ${Math.min(closed, GOAL)}/${GOAL}`)
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
            className="ks-pop-closeall pointer-events-auto absolute left-0 top-0 px-5 py-3 text-[18px] uppercase"
            style={{ zIndex: 100000 }}
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
            Close all (free)
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
  const width = popupWidth()
  const photo = k.photo ?? artistOf(w).media

  return (
    <motion.div
      role="dialog"
      aria-label={k.title}
      className={`ks-pop ks-pop--${k.skin} pointer-events-auto absolute left-0 top-0`}
      style={{ width, zIndex: w.z }}
      initial={{ scale: 0.4, opacity: 0, x: pos.x, y: pos.y, rotate: 0 }}
      animate={
        falling
          ? { x: pos.x + rand(-200, 200), y: window.innerHeight + 300, rotate: w.rot * 20, opacity: 1, scale: 1, transition: { duration: rand(0.7, 1.3), ease: [0.5, 0, 1, 0.5] } }
          : { scale: 1, opacity: 1, x: pos.x, y: pos.y, rotate: w.rot * 0.4 }
      }
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      onPointerDown={onFocus}
      data-testid="popup"
    >
      <div
        className="ks-pop__bar flex cursor-grab touch-none select-none items-center justify-between gap-2 px-1.5 py-1 text-[13px] active:cursor-grabbing"
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
          <span aria-hidden="true" className="shrink-0 text-[#ffff00]">
            ★
          </span>
          <span className="ks-pop__title truncate">
            {SKIN_APP[k.skin]} — {k.title}
          </span>
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="ks-pop__close grid h-7 w-7 shrink-0 place-items-center text-[15px] leading-none"
          aria-label={`Close ${k.title}`}
          data-testid="popup-close"
        >
          ✕
        </button>
      </div>
      <div className="relative flex items-start gap-3 px-3 py-3 text-[13px] font-bold leading-snug">
        <img src={photo.src} alt={photo.alt} draggable={false} className="ks-pop__photo shrink-0" />
        <div className="min-w-0 flex-1">{k.body(w)}</div>
        {k.sticker ? (
          <span className="ks-pop__sticker" aria-hidden="true">
            {k.sticker}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2 px-3 pb-3">
        {k.buttons.map((b, i) => (
          <button key={i} type="button" onClick={onButton} className="ks-pop__btn">
            {b}
          </button>
        ))}
      </div>
      {k.footer ? <div className="ks-pop__footer px-3 pb-2 text-right">{k.footer}</div> : null}
      {k.marquee ? (
        <div className="ks-pop__marquee" aria-hidden="true">
          <span>{k.marquee}</span>
        </div>
      ) : null}
    </motion.div>
  )
}
