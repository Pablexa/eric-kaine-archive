import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../../lib/experience/store'
import { chaos, widgets, type UglyStep, type Widget } from '../../lib/experience/chaos'
import { chat } from '../../lib/experience/chat'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { UNDERGROUND_SCENES } from '../../lib/experience/machine'
import { sfx } from '../../lib/audio/sfx'
import { pointer } from '../../lib/interactions/pointer'
import { pick } from '../../lib/animation/timeline'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../lib/assets/realMedia'
import './ChaosLayer.css'

/**
 * Lives for the whole of Act III and IV. Renders the 2008 underground fan page
 * widgets the guide bolts onto the archive (marquee, visitor counter, a
 * SoundCloud rip player, photo stickers, a MySpace Top 8), and turns every click
 * on the page into a squeak.
 */

const POKE_LINES = ['stop poking the fan page.', 'that tickles.', 'you’re making it worse. good.', 'every click makes it more underground.', 'ow.']
const POKE_LINES_BLEOODITY = ['stop poking my page.', 'every click is a free leak. kidding.', 'slatt. now stop.', 'you poke it, you sign it.', 'ow.']

const MARQUEE: [string, RealMedia][] = [
  ['WELCOME 2 THE UNDERGROUND!!!', artistMedia.bleood],
  ['FREE LEAKS (NOT REALLY)', objectMedia.cheese],
  ['PLEASE DO NOT SHARE', artistMedia.slimey],
  ['BEST VIEWED IN INTERNET EXPLORER 6 AT 800×600', objectMedia.seal],
  ['NOT TRYING TO BE FAMOUS', artistMedia.osamason],
  ['SIGN MY GUESTBOOK', artistMedia.jaydes],
  ['GATEKEPT SINCE 2024', artistMedia.slayr],
  ['SLATT', artistMedia.carti],
]

/** Real photo stickers slapped onto the page once the borders go on. `top` is relative to <main>. */
const STICKERS: { media: RealMedia; caption: string; pos: string; tilt: number; tone?: 'lime' | 'yellow' | 'orange' }[] = [
  { media: artistMedia.carti, caption: 'slatt', pos: 'left-[2%] top-[300px]', tilt: -12, tone: 'lime' },
  { media: artistMedia.slimey, caption: '2slimey approved', pos: 'right-[24%] top-[230px] max-sm:hidden', tilt: 10 },
  { media: objectMedia.seal, caption: 'seal of approval', pos: 'right-[3%] top-[560px]', tilt: 8, tone: 'yellow' },
  { media: objectMedia.cheese, caption: 'cheese is a lifestyle', pos: 'left-[34%] top-[640px] max-sm:hidden', tilt: -7, tone: 'orange' },
  { media: artistMedia.osamason, caption: 'osamason was here', pos: 'left-[3%] top-[24%]', tilt: 6 },
  { media: artistMedia.jaydes, caption: 'jaydes fan club', pos: 'right-[4%] top-[38%]', tilt: -9, tone: 'lime' },
  { media: artistMedia.slayr, caption: 'slayr ate this', pos: 'left-[5%] top-[55%]', tilt: 11, tone: 'yellow' },
  { media: artistMedia.bleood, caption: 'bleood #1 fan', pos: 'right-[6%] top-[72%]', tilt: -5, tone: 'orange' },
  { media: objectMedia.slime, caption: 'free slime', pos: 'left-[40%] top-[86%] max-sm:hidden', tilt: 7 },
]

const TOP8: [string, RealMedia][] = [
  ['Bleood', artistMedia.bleood],
  ['2Slimey', artistMedia.slimey],
  ['Slayr', artistMedia.slayr],
  ['OsamaSon', artistMedia.osamason],
  ['Carti', artistMedia.carti],
  ['Jaydes', artistMedia.jaydes],
  ['Cheese', objectMedia.cheese],
  ['Seal', objectMedia.seal],
]

const TRAIL: RealMedia[] = [objectMedia.cheese, objectMedia.seal, artistMedia.slimey, artistMedia.bleood, artistMedia.carti, objectMedia.burger, objectMedia.slime, artistMedia.osamason]

/** True while `html.ug-<step>` is on. */
function useUglyStep(step: UglyStep) {
  const [on, setOn] = useState(() => typeof document !== 'undefined' && chaos.has(step))
  useEffect(() => {
    const sync = () => setOn(chaos.has(step))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [step])
  return on
}

export function ChaosLayer() {
  const { state } = useExperience()
  const underground = !!state.scene && UNDERGROUND_SCENES.includes(state.scene)
  const list = useStore(widgets)
  const has = (w: Widget) => list.includes(w)
  const stickers = useUglyStep('borders')
  const pokes = useRef(0)
  const undergroundRef = useRef(underground)
  useEffect(() => {
    undergroundRef.current = underground
  }, [underground])
  const main = typeof document !== 'undefined' ? document.querySelector('main') : null
  const owner = underground ? 'Bleoodity' : 'Eric Kaineity'

  // the tiled wallpaper photo (used by html.ug-rainbow in ChaosLayer.css)
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--ck-wall', `url("${objectMedia.cheese.src}")`)
    return () => {
      root.style.removeProperty('--ck-wall')
    }
  }, [])

  // poking the page: squeak + spin, never navigate
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || t.closest('[data-troll-ui]') || t.closest('header')) return
      if (!t.closest('main') && !t.closest('footer')) return
      e.preventDefault()
      e.stopPropagation()
      sfx.squeak()
      const el = (t.closest('h1,h2,h3,p,img,a,button,li,figure,blockquote,.thumb-frame') as HTMLElement | null) ?? t
      el.animate([{ rotate: '0deg', scale: 1 }, { rotate: '360deg', scale: 1.15 }, { rotate: '720deg', scale: 1 }], { duration: 650, easing: 'cubic-bezier(.34,1.56,.64,1)' })
      pokes.current++
      if (pokes.current % 6 === 0) {
        if (undergroundRef.current) chat.post(pick(POKE_LINES_BLEOODITY), 'bleoodity')
        else chat.post(pick(POKE_LINES))
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  const marquee: [string, RealMedia][] = underground ? [['BLEOODITY RUNS THIS PAGE NOW', characterMedia.bleoodity], ...MARQUEE] : MARQUEE
  const top8: [string, RealMedia][] = underground ? [...TOP8.slice(0, 7), ['Eric Kaineity (demoted)', characterMedia.kaineity]] : TOP8

  return (
    <>
      {main && (has('marquee') || has('badge') || has('webring') || stickers)
        ? createPortal(
            <div aria-hidden="true" data-testid="ugly-widgets">
              {has('marquee') ? (
                <div className="ck-marquee absolute inset-x-0 top-[88px] z-20 overflow-hidden py-1 sm:top-[96px]">
                  <div className="ck-marquee-track flex w-max gap-12 whitespace-nowrap text-[18px] font-bold" style={{ animation: 'marquee 22s linear infinite' }}>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <span key={i}>
                        {marquee.map(([text, media]) => (
                          <span key={text}>
                            ★ {text}
                            <img src={media.src} alt="" className="ck-marquee-pic" draggable={false} />
                          </span>
                        ))}
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {stickers
                ? STICKERS.map((s) => (
                    <figure key={s.caption} className={`ck-sticker absolute z-20 ${s.pos}`} style={{ rotate: `${s.tilt}deg` }} data-tone={s.tone}>
                      <img src={s.media.src} alt="" loading="lazy" draggable={false} />
                      <figcaption>{s.caption}</figcaption>
                    </figure>
                  ))
                : null}

              {has('badge') ? (
                <div className="absolute right-[6%] top-[150px] z-20 grid h-28 w-28 rotate-12 place-items-center sm:top-[180px] sm:h-36 sm:w-36" style={{ animation: 'ug-spin-y 2.4s linear infinite' }}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="50,0 61,25 88,12 77,39 100,50 77,61 88,88 61,75 50,100 39,75 12,88 23,61 0,50 23,39 12,12 39,25"
                      fill="#ff2bd6"
                      stroke="#39ff14"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="ck-badge-text relative text-center text-[22px] sm:text-[28px]">
                    NEW
                    <br />
                    LEAK!!
                  </span>
                </div>
              ) : null}

              {has('webring') ? (
                <div className="ck-top8 absolute left-1/2 top-[140px] z-20 hidden -translate-x-1/2 md:block">
                  <div className="ck-top8-head">{owner}&apos;s Friend Space</div>
                  <p className="ck-top8-count">
                    {owner} has <b>8</b> friends.
                  </p>
                  <ol className="ck-top8-grid">
                    {top8.map(([name, media]) => (
                      <li key={name}>
                        <img src={media.src} alt="" draggable={false} />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="ck-top8-foot">
                    <u>View All of {owner}&apos;s Friends</u> · <u>sign my guestbook</u>
                  </p>
                </div>
              ) : null}
            </div>,
            main,
          )
        : null}

      <AnimatePresence>
        {has('counter') ? <HitCounter key="counter" /> : null}
        {has('construction') ? (
          <motion.div
            key="construction"
            aria-hidden="true"
            className="ck-player pointer-events-none fixed right-3 top-[40%] z-[44] w-[170px] origin-top sm:right-6 sm:w-[220px]"
            initial={{ y: -400, rotate: 0 }}
            animate={{ y: 0, rotate: [6, -6] }}
            exit={{ y: -400 }}
            transition={{ y: { type: 'spring', stiffness: 120, damping: 10 }, rotate: { duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }}
          >
            <SoundCloudRip plays={state.views} artist={underground ? 'bleoodity' : 'bleood'} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {has('trail') ? <CursorTrail /> : null}
    </>
  )
}

const BARS = Array.from({ length: 30 }, (_, i) => ({ h: 28 + ((i * 37) % 72), d: (i % 7) * 0.09 }))

function SoundCloudRip({ plays, artist }: { plays: number; artist: string }) {
  return (
    <>
      <div className="ck-player-bar">SOUNDCLOUD RIP · 128kbps</div>
      <div className="flex gap-2 p-1.5">
        <img src={artistMedia.bleood.src} alt="" className="h-12 w-12 flex-none border-2 border-black object-cover sm:h-16 sm:w-16" draggable={false} />
        <div className="min-w-0 text-[10px] leading-tight sm:text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="ck-player-play">▶</span>
            <span className="truncate font-bold text-[#999]">{artist}</span>
          </div>
          <p className="mt-1 break-words font-bold text-[#333]">untitled (snippet) FINAL v2.mp3</p>
        </div>
      </div>
      <div className="ck-wave">
        {BARS.map((b, i) => (
          <i key={i} style={{ '--h': `${b.h}%`, '--d': `${b.d}s` } as CSSProperties} data-played={i < 12 ? '' : undefined} />
        ))}
      </div>
      <div className="flex justify-between px-1.5 pt-1 text-[9px] text-[#666] sm:text-[10px]">
        <span>0:13 / 0:30</span>
        <span>▶ {plays.toLocaleString('en-US')} plays</span>
      </div>
      <p className="ck-player-dl">FREE DOWNLOAD (BROKEN)</p>
    </>
  )
}

function HitCounter() {
  const [n, setN] = useState(1501)
  useEffect(() => {
    const t = window.setInterval(() => setN((v) => v + 1 + Math.floor(Math.random() * 3)), 700)
    return () => window.clearInterval(t)
  }, [])
  return (
    <motion.div
      aria-hidden="true"
      className="ck-counter pointer-events-none fixed right-3 top-[118px] z-[44] px-2 py-1 text-center sm:right-6 sm:top-[132px]"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      data-testid="hit-counter"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#39ff14]">you are visitor no.</p>
      <p className="ck-counter-digits my-0.5">
        {String(n)
          .padStart(7, '0')
          .split('')
          .map((d, i) => (
            <span key={i}>{d}</span>
          ))}
      </p>
      <p className="text-[9px] text-[#ff2bd6]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        slatt since 2008
      </p>
    </motion.div>
  )
}

function CursorTrail() {
  const refs = useRef<(HTMLImageElement | null)[]>([])
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  useEffect(() => {
    if (touch) return
    const pts = Array.from({ length: TRAIL.length }, () => ({ x: pointer.x, y: pointer.y }))
    let raf = 0
    const tick = () => {
      pts.forEach((p, i) => {
        const lead = i === 0 ? pointer : pts[i - 1]
        p.x += (lead.x - p.x) * 0.35
        p.y += (lead.y - p.y) * 0.35
        const el = refs.current[i]
        if (el) el.style.transform = `translate3d(${p.x - 11}px, ${p.y - 11}px, 0) scale(${1 - i * 0.07})`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [touch])
  if (touch) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[49]">
      {TRAIL.map((m, i) => (
        <img
          key={m.src}
          ref={(el) => {
            refs.current[i] = el
          }}
          src={m.src}
          alt=""
          draggable={false}
          className="ck-trail-pic"
          style={{ opacity: 1 - i * 0.09 }}
        />
      ))}
    </div>
  )
}
