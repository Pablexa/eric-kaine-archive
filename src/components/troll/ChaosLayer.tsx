import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../../lib/experience/store'
import { widgets, type Widget } from '../../lib/experience/chaos'
import { chat } from '../../lib/experience/chat'
import { sfx } from '../../lib/audio/sfx'
import { pointer } from '../../lib/interactions/pointer'
import { pick } from '../../lib/animation/timeline'

/**
 * Lives for the whole of Act III. Renders the 2003-homepage widgets Verity
 * bolts onto the archive, and turns every click on the page into a squeak.
 */

const POKE_LINES = ['stop poking the website.', 'that tickles.', 'you’re making it worse. good.', 'every click makes it uglier. keep going.', 'ow.']

export function ChaosLayer() {
  const list = useStore(widgets)
  const has = (w: Widget) => list.includes(w)
  const pokes = useRef(0)
  const main = typeof document !== 'undefined' ? document.querySelector('main') : null

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
      if (pokes.current % 6 === 0) chat.post(pick(POKE_LINES))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <>
      {main && (has('marquee') || has('badge') || has('webring'))
        ? createPortal(
            <div aria-hidden="true" data-testid="ugly-widgets">
              {has('marquee') ? (
                <div className="absolute inset-x-0 top-[88px] z-20 overflow-hidden border-y-4 border-double border-[#ffff00] bg-[#000080] py-1 sm:top-[96px]">
                  <div className="flex w-max gap-12 whitespace-nowrap text-[18px] font-bold text-[#ffff00]" style={{ animation: 'marquee 14s linear infinite', fontFamily: 'Comic Sans MS, cursive' }}>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <span key={i}>
                        ★ WELCOME 2 ERIC KAINE&apos;S HOMEPAGE!!! ★ PLEASE DO NOT SHARE ★ BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 AT 800×600 ★ YOU ARE NOT
                        SUPPOSED TO BE HERE ★ GATEKEPT SINCE 2024 ★
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {has('badge') ? (
                <div className="absolute right-[6%] top-[150px] z-20 grid h-28 w-28 rotate-12 place-items-center sm:top-[180px] sm:h-36 sm:w-36" style={{ animation: 'ug-spin-y 2.4s linear infinite' }}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="50,0 61,25 88,12 77,39 100,50 77,61 88,88 61,75 50,100 39,75 12,88 23,61 0,50 23,39 12,12 39,25"
                      fill="#ff0000"
                      stroke="#ffff00"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="relative text-[26px] font-black text-[#ffff00] sm:text-[32px]" style={{ fontFamily: 'Impact, sans-serif', animation: 'ug-blink 1s steps(1) infinite' }}>
                    NEW!
                  </span>
                </div>
              ) : null}
              {has('webring') ? (
                <div
                  className="absolute left-1/2 top-[140px] z-20 hidden -translate-x-1/2 border-4 border-[#c0c0c0] bg-[#c0c0c0] px-3 py-1.5 text-center text-[13px] text-black md:block"
                  style={{ fontFamily: 'Times New Roman, serif', borderStyle: 'ridge' }}
                >
                  <b>◄ ERIC KAINE WEBRING ►</b>
                  <br />
                  <u className="text-[#0000ee]">sign my guestbook</u> · <u className="text-[#0000ee]">random site</u> · <u className="text-[#551a8b]">next</u>
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
            className="pointer-events-none fixed right-3 top-[40%] z-[44] w-[150px] origin-top border-[5px] border-black bg-[#ffcc00] p-2 text-center text-black shadow-[6px_6px_0_#000] sm:right-6 sm:w-[190px]"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
            initial={{ y: -400, rotate: 0 }}
            animate={{ y: 0, rotate: [8, -8] }}
            exit={{ y: -400 }}
            transition={{ y: { type: 'spring', stiffness: 120, damping: 10 }, rotate: { duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }}
          >
            <div className="hazard h-3 border-2 border-black" />
            <p className="my-1 text-[22px] leading-none sm:text-[26px]">UNDER CONSTRUCTION</p>
            <p className="text-[12px] leading-tight" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              pardon our dust!! this site is being made worse
            </p>
            <div className="hazard mt-1 h-3 border-2 border-black" />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {has('trail') ? <CursorTrail /> : null}
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
      className="pointer-events-none fixed right-3 top-[118px] z-[44] border-4 border-[#c0c0c0] bg-black px-2 py-1 text-center sm:right-6 sm:top-[132px]"
      style={{ borderStyle: 'outset', fontFamily: 'Times New Roman, serif' }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      data-testid="hit-counter"
    >
      <p className="text-[11px] text-white">you are visitor no.</p>
      <p className="font-mono text-[22px] tracking-[0.15em] text-[#ff2020]" style={{ textShadow: '0 0 6px #ff0000' }}>
        {String(n).padStart(7, '0')}
      </p>
    </motion.div>
  )
}

function CursorTrail() {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  useEffect(() => {
    if (touch) return
    const pts = Array.from({ length: 8 }, () => ({ x: pointer.x, y: pointer.y }))
    let raf = 0
    const tick = () => {
      pts.forEach((p, i) => {
        const lead = i === 0 ? pointer : pts[i - 1]
        p.x += (lead.x - p.x) * 0.35
        p.y += (lead.y - p.y) * 0.35
        const el = refs.current[i]
        if (el) el.style.transform = `translate3d(${p.x - 8}px, ${p.y - 8}px, 0) scale(${1 - i * 0.08})`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [touch])
  if (touch) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[49]">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="absolute left-0 top-0 block h-4 w-4 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 30%, #fff6c2, #ffd21f 50%, #d99a00)', opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  )
}
