import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, pileDim, shake } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { artistMedia, objectMedia } from '../../../lib/assets/realMedia'
import { scrollToY } from '../../../lib/interactions/scroll'
import { TIME, easeInCubic, prefersReducedMotion, tween, wait, waitFor } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const TARGET = 12
const CROWD = [artistMedia.bleood, artistMedia.slayr, objectMedia.cheese, artistMedia.osamason, artistMedia.carti, artistMedia.slimey, objectMedia.seal, artistMedia.jaydes, artistMedia.verity, objectMedia.burger, objectMedia.drink]
const LINES = ['the typography is in the pit.', 'the subscribe button just lost a shoe.', 'OPEN UP THE FONT PIT.', 'the entire website is crowd surfing.']

/** Real pieces of the archive become the crowd, then Bleoodity stage-dives. */
export function MoshScene() {
  const { dispatch, ensurePile, pileRef } = useExperience()
  const [jumps, setJumps] = useState(0)
  const [ready, setReady] = useState(false)
  const [diving, setDiving] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const surface = useRef<HTMLDivElement>(null)
  const crowd = useRef<HTMLDivElement>(null)
  const jump = useRef<() => void>(() => {})
  const finish = useRef<() => void>(() => {})
  const n = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input,textarea,select,[contenteditable="true"]')) return
      if (target?.closest('button,a') && !target.closest('[data-testid="mosh-jump"]')) return
      e.preventDefault()
      jump.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      jump.current = () => {}
      finish.current = () => {}
      pileRef.current?.disablePointer()
      pileRef.current?.hideVerity()
      chaos.setKick(0)
      verity.scale.set(1)
      objective.set(null)
    }
  }, [pileRef])

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    n.current = 0
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    // Freeze the CSS transforms before measuring the actual page pieces.
    for (const step of ['jelly', 'wobble', 'tilt', 'drop', 'upside', 'beat'] as const) chaos.remove(step)
    chaos.setKick(0)
    backdrop.set('none')
    pileDim.set(false)
    await scrollToY(0, reduce ? 0 : 450 * TIME.scale, signal)
    await wait(200, signal)
    const pile = await ensurePile()
    if (!pile || signal.aborted) return

    const captured = new Set(pile.pieces.map((p) => p.el))
    const page = [...document.querySelectorAll<HTMLElement>('main [data-physics]')].filter((el) => {
      const r = el.getBoundingClientRect()
      return !captured.has(el) && getComputedStyle(el).visibility !== 'hidden' && r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
    })
    // Sprite placards fill out the crowd on narrow screens where fewer page
    // elements fit. They are real DOM bodies, using the same capture engine.
    const placards = [...(crowd.current?.querySelectorAll<HTMLElement>('[data-physics]') ?? [])]
    const selected = [...page, ...placards].slice(0, 28)
    pile.capture(selected)
    placards.filter((el) => !selected.includes(el)).forEach((el) => { el.style.visibility = 'hidden' })
    pile.releaseAll(reduce ? 0.2 : 2)
    if (reduce) pile.settle(300)
    else pile.start()
    if (surface.current) pile.enablePointer(surface.current)
    verity.setMode('free', false)
    await verity.moveTo(window.innerWidth / 2, Math.max(135, window.innerHeight * 0.22), { size: 94, duration: 0.5, signal })
    chat.post('the website is the mosh pit. jump. drag the wreckage.', 'bleoodity', 'loud')
    objective.set(`JUMP · Space or the button · 0/${TARGET}`)
    setReady(true)

    await waitFor<void>((done) => {
      let ended = false
      let last = -Infinity
      const end = () => {
        if (ended) return
        ended = true
        done()
      }
      finish.current = end
      jump.current = () => {
        const now = performance.now()
        if (ended || now - last < 120 * TIME.scale) return
        last = now
        const count = ++n.current
        setJumps(count)
        objective.set(`JUMP · Space or the button · ${count}/${TARGET}`)
        pile.quake(7 + count * 0.8)
        sfx.boom()
        if (count % 3 === 0) {
          sfx.airhorn()
          chat.post(LINES[count / 3 - 1], 'bleoodity', 'loud')
        }
        if (reduce) pile.settle(100)
        else shake.set(shake.get() + 1)
        if (count >= TARGET) end()
      }
      const hintTimer = window.setTimeout(() => {
        setCanSkip(true)
        chat.post('legs tired? there’s a stage-dive shortcut.', 'bleoodity')
      }, 60000 * TIME.scale)
      return () => {
        window.clearTimeout(hintTimer)
        jump.current = () => {}
        finish.current = () => {}
      }
    }, signal)

    setDiving(true)
    setReady(false)
    objective.set('BLEOODITY HAS LEFT THE STAGE')
    pile.disablePointer()
    sfx.crowd(1.5)
    await chat.say('CATCH ME, HTML.', { author: 'bleoodity', tone: 'loud', hold: 500, signal })
    sfx.whoosh()
    const x0 = verity.x.get()
    const y0 = verity.y.get()
    await tween(reduce ? 0 : 850 * TIME.scale, (t) => {
      const x = x0 + Math.sin(t * Math.PI) * Math.min(180, window.innerWidth * 0.25)
      const y = y0 + (window.innerHeight - 55 - y0) * easeInCubic(t) - Math.sin(t * Math.PI) * 120
      verity.jump(x, y)
      pile.setVerity(x, y, verity.size.get() / 2)
    }, { signal, ease: (t) => t })
    sfx.crash()
    sfx.boom()
    pile.quake(36)
    if (reduce) pile.settle(150)
    else shake.set(shake.get() + 1)
    await wait(1100, signal)
    dispatch({ type: 'SCENE', scene: 'legend' })
  }, [])

  return (
    <div className="fixed inset-0 z-[43]" data-troll-ui data-testid="mosh" data-jumps={jumps} data-ready={ready} data-diving={diving}>
      <div ref={surface} className="absolute inset-0 touch-none" aria-hidden="true" />
      <div ref={crowd} className="pointer-events-none absolute inset-x-4 top-[30%] flex flex-wrap justify-between gap-3" aria-hidden="true">
        {CROWD.map((id, i) => (
          <div key={id.src} data-physics={`mosh:${i}`} className="h-[70px] w-[64px] rounded-sm border-2 border-[#ff315d] bg-[#21040b] p-1 shadow-[4px_4px_0_#000]" style={{ marginTop: (i % 3) * 26 }}>
            <img src={id.src} alt="" className="h-full w-full object-cover" draggable={false} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[14%] px-4 text-center">
        <p className="pixel text-sm tracking-[0.2em] text-[#ff597e]">PROTOCOL 11 · NO REFUNDS</p>
        <h2 className="mt-2 text-[clamp(46px,9vw,112px)] font-black uppercase leading-none text-[#ffefdc]" style={{ fontFamily: 'Impact, sans-serif', textShadow: '5px 5px 0 #c81738' }}>
          {diving ? 'STAGE DIVE' : 'FONT PIT'}
        </h2>
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-[28%] flex flex-col items-center gap-3 px-4">
        <motion.button type="button" disabled={!ready} onClick={() => jump.current()} className="pixel touch-manipulation border-[5px] border-black bg-[#ff315d] px-10 py-3 text-4xl font-bold text-white shadow-[8px_8px_0_#ffd21f] disabled:opacity-60 focus-visible:outline-4 focus-visible:outline-white" whileTap={prefersReducedMotion() ? {} : { scale: 0.93, y: 4 }} data-testid="mosh-jump" aria-label={`Jump in the mosh pit, ${jumps} of ${TARGET}`}>
          {diving ? 'CATCH HIM' : `JUMP ${jumps}/${TARGET}`}
        </motion.button>
        <p className="pixel bg-black/80 px-3 py-1 text-center text-sm text-[#ffefdc]" aria-live="polite">Space / tap JUMP · drag the website</p>
        {canSkip && ready ? <button type="button" onClick={() => finish.current()} className="pixel bg-black px-3 py-2 text-sm text-[#ffd21f] underline" data-testid="mosh-skip">My legs are CSS · skip to the stage dive</button> : null}
      </div>
    </div>
  )
}
