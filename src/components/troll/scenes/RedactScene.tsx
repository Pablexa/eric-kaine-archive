import { useEffect, useRef, useState } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { lockScroll, unlockScroll } from '../../../lib/interactions/scroll'
import { artistMedia, objectMedia } from '../../../lib/assets/realMedia'
import { pick, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './RedactScene.css'

const GOAL = 8

const goalText = (n: number) => `Gatekeep everything that makes him look famous · ${Math.min(GOAL, n)}/${GOAL}`

const REMARKS: Record<string, string[]> = {
  video: ['that snippet never happened.', 'unreleased now. forever.', 'goodbye, leak.'],
  avatar: ['faceless. mysterious. underground.', 'who? exactly.'],
  stat: ['play counts? in this economy?', 'nobody needs to know that.'],
  heading: ['headings are how the blogs find things.', 'can’t read it, can’t share it.'],
  title: ['title? what title. untitled snippet.', 'gatekept. like a real leak.'],
  quote: ['…even that? ok. you’re good at this.'],
  handle: ['no handles. no fame. no blogs.'],
  fact: ['classified. underground only.'],
}

/** One real photo per redaction slot on the GATEKEEP-O-METER. */
const SLOTS = [
  objectMedia.cheese,
  artistMedia.bleood,
  objectMedia.seal,
  artistMedia.slayr,
  objectMedia.burger,
  artistMedia.slimey,
  objectMedia.slime,
  artistMedia.jaydes,
]

const MARQUEE = 'help eric kaineity keep eric underground ★ no blogs ★ no hype ★ not trying to be famous ★ '

/**
 * Cooperative path: the visitor helps Eric Kaineity gatekeep. The real page
 * stays scrollable and every click on something "fame-adjacent" gets a
 * GATEKEPT sticker slapped on it in place.
 */
export function RedactScene() {
  const { dispatch } = useExperience()
  const count = useRef(0)
  const done = useRef<(() => void) | null>(null)
  const [gatekept, setGatekept] = useState(0)

  useEffect(() => {
    backdrop.set('none')
    unlockScroll(true)
    document.documentElement.classList.add('is-redacting')

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || t.closest('[data-troll-ui]') || t.closest('header')) return
      const el =
        (t.closest('[data-redact]:not([data-redacted])') as HTMLElement | null) ??
        (t.querySelector?.('[data-redact]:not([data-redacted])') as HTMLElement | null)
      const anchor = t.closest('a,button')
      if (!el) {
        // links still shouldn't leave while we're busy
        if (anchor) {
          e.preventDefault()
          e.stopPropagation()
          chat.post('not that. something that makes him look famous.')
        }
        return
      }
      e.preventDefault()
      e.stopPropagation()
      el.setAttribute('data-redacted', '')
      count.current++
      setGatekept(count.current)
      sfx.thud(0.35)
      objective.set(goalText(count.current))
      chat.post(pick(REMARKS[el.dataset.redact ?? ''] ?? ['good.']))
      if (count.current >= GOAL) done.current?.()
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.documentElement.classList.remove('is-redacting')
    }
  }, [])

  useScript(async (signal) => {
    const d = verity.dockPosition()
    await verity.moveTo(d.x - 10, d.y - 10, { size: d.size * 1.3, duration: 0.9, signal })
    objective.set(goalText(0))
    await chat.say('here’s the plan. click anything that makes him look famous.', { signal })
    await chat.say('titles. photos. play counts. his face. scroll if you need to.', { signal })
    await new Promise<void>((resolve, reject) => {
      done.current = resolve
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
      if (count.current >= GOAL) resolve()
    })
    objective.set(null)
    lockScroll()
    sfx.fanfare()
    await chat.say('perfect. nobody can read anything now. fully gatekept.', { signal })
    await wait(500, signal)
    await chat.say('…but they could still share it.', { signal, hold: 1200 })
    await chat.say('phase two. you’re going to love phase two.', { signal })
    dispatch({ type: 'SCENE', scene: 'uglify' })
  }, [])

  return <GatekeepMeter n={gatekept} />
}

/**
 * Decorative sidebar box. It sits inside the troll stage, which ignores the
 * pointer during this scene, so clicks pass straight through to the page.
 */
function GatekeepMeter({ n }: { n: number }) {
  return (
    <aside className="ks-meter pointer-events-none fixed right-4 top-[132px] z-[44] hidden w-[184px] md:block" aria-hidden="true">
      <div className="ks-meter__bar">GATEKEEP-O-METER</div>
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {SLOTS.map((m, i) => (
          <div key={m.src} className="ks-meter__slot" data-done={i < n ? '' : undefined}>
            <img src={m.src} alt="" draggable={false} loading="lazy" decoding="async" />
            {i < n ? <span className="ks-meter__stamp">GATEKEPT</span> : null}
          </div>
        ))}
      </div>
      <p className="px-2 pb-2 text-center text-[12px] font-bold text-[#ffff00]">
        gatekept: <span className="ks-meter__count">{String(Math.min(GOAL, n)).padStart(2, '0')}/{String(GOAL).padStart(2, '0')}</span>
      </p>
      <div className="ks-meter__marquee">
        <span>
          {MARQUEE}
          {MARQUEE}
        </span>
      </div>
    </aside>
  )
}
