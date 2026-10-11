import { useEffect, useRef } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { lockScroll, unlockScroll } from '../../../lib/interactions/scroll'
import { pick, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const GOAL = 8

const REMARKS: Record<string, string[]> = {
  video: ['that video never happened.', 'unwatchable now. perfect.', 'goodbye, content.'],
  avatar: ['faceless. mysterious. unfamous.', 'who? exactly.'],
  stat: ['numbers? in this economy?', 'nobody needs to know that.'],
  heading: ['headings are how people find things.', 'can’t read it, can’t share it.'],
  title: ['title? what title.', 'redacted. like a real conspiracy.'],
  quote: ['…even that? ok. you’re good at this.'],
  handle: ['no handles. no fame.'],
  fact: ['classified.'],
}

/**
 * Cooperative path: the visitor helps. The real page stays scrollable and
 * every click on something "fame-adjacent" redacts it in place.
 */
export function RedactScene() {
  const { dispatch } = useExperience()
  const count = useRef(0)
  const done = useRef<(() => void) | null>(null)

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
      sfx.thud(0.35)
      objective.set(`Click things that make him look famous · ${Math.min(GOAL, count.current)}/${GOAL}`)
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
    objective.set(`Click things that make him look famous · 0/${GOAL}`)
    await chat.say('here’s the plan. click anything that makes him look famous.', { signal })
    await chat.say('titles. thumbnails. numbers. his face. scroll if you need to.', { signal })
    await new Promise<void>((resolve, reject) => {
      done.current = resolve
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
      if (count.current >= GOAL) resolve()
    })
    objective.set(null)
    lockScroll()
    sfx.fanfare()
    await chat.say('perfect. nobody can read anything now.', { signal })
    await wait(500, signal)
    await chat.say('…but they could still share it.', { signal, hold: 1200 })
    await chat.say('phase two. you’re going to love phase two.', { signal })
    dispatch({ type: 'SCENE', scene: 'uglify' })
  }, [])

  return null
}
