import { useEffect, useRef } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import type { HitEvent, Piece } from '../../../lib/interactions/pile'
import { loop, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const HITS_NEEDED = 3

const grabLine = (p: Piece) => {
  const [kind, ch] = p.label.split(':')
  switch (kind) {
    case 'avatar':
      return 'put his face down.'
    case 'period':
      return 'that’s my cousin. be gentle.'
    case 'cta':
      return 'that button doesn’t go anywhere anymore.'
    case 'letter':
      return `that’s the letter ${ch}. there are only nine of them.`
    case 'latest':
      return 'that’s evidence of content. drop it.'
    case 'eyebrow':
      return 'that’s a label. it labels things. leave it.'
    case 'copy':
      return 'that paragraph was very well written. put it down.'
    case 'meta':
      return 'those numbers are classified now.'
    default:
      return 'i said don’t touch anything.'
  }
}

const hitLine = (p: Piece, n: number) => {
  if (n === 2) return 'do that again. see what happens.'
  const kind = p.label.split(':')[0]
  if (kind === 'avatar') return 'you threw his FACE at me.'
  if (kind === 'period') return 'that was my cousin.'
  if (kind === 'cta') return 'that button was load-bearing.'
  if (kind === 'letter') return 'assault with a typeface.'
  return 'ow.'
}

/**
 * The wreckage is physical: drag it, fling it. Verity drifts above the pile.
 * Hit her three times and she escalates to Protocol 02.
 */
export function PileScene({ stage }: { stage: React.RefObject<HTMLDivElement | null> }) {
  const { dispatch, pileRef } = useExperience()
  const hits = useRef(0)
  const advance = useRef<(() => void) | null>(null)

  useEffect(() => {
    const pile = pileRef.current
    const el = stage.current
    if (!pile || !el) return
    pile.enablePointer(el)
    let lastGrab = 0
    let grabs = 0
    pile.onGrab((p) => {
      const now = performance.now()
      if (now - lastGrab < 2600) return
      lastGrab = now
      grabs++
      chat.post(grabs === 1 ? 'i said don’t touch anything.' : grabLine(p))
    })
    pile.onHit((e: HitEvent) => {
      hits.current++
      sfx.bonk()
      const n = hits.current
      dispatch({ type: 'MOOD', mood: n >= 2 ? 'angry' : 'annoyed' })
      // knocked back along the impact
      const x = verity.x.get() - e.nx * 70
      const y = verity.y.get() - e.ny * 70
      knock = { x, y, t: performance.now() }
      chat.post(hitLine(e.piece, n), 'verity', n >= HITS_NEEDED ? 'loud' : 'normal')
      if (n >= HITS_NEEDED) advance.current?.()
    })
    return () => {
      pile.disablePointer()
      pile.onHit(null)
      pile.onGrab(null)
      pile.hideVerity()
    }
  }, [pileRef, stage, dispatch])

  // Verity drifts in a lazy figure-eight; the pile treats her as a solid body.
  useEffect(() => {
    const pile = pileRef.current
    if (!pile) return
    const ac = new AbortController()
    const reduce = prefersReducedMotion()
    const t0 = performance.now()
    const startX = verity.x.get()
    const startY = verity.y.get()
    loop((_, now) => {
      const t = (now - t0) / 1000
      const w = window.innerWidth
      const h = window.innerHeight
      const ax = Math.min(w * 0.32, 420)
      const ay = Math.min(h * 0.12, 90)
      const speed = reduce ? 0.25 : 0.55
      let x = w / 2 + Math.sin(t * speed) * ax
      let y = Math.max(160, h * 0.3) + Math.sin(t * speed * 2) * ay
      const ease = Math.min(1, t / 1.2)
      x = startX + (x - startX) * ease
      y = startY + (y - startY) * ease
      if (knock) {
        const k = Math.max(0, 1 - (now - knock.t) / 700)
        x = x + (knock.x - x) * k
        y = y + (knock.y - y) * k
        if (k === 0) knock = null
      }
      verity.jump(x, y)
      pile.setVerity(x, y, verity.size.get() / 2)
    }, ac.signal)
    return () => ac.abort()
  }, [pileRef])

  useScript(async (signal) => {
    hits.current = 0
    knock = null
    objective.set('Don’t touch anything. (Please.)')
    await chat.say('please don’t touch anything. it’s evidence.', { signal })
    const advanced = new Promise<void>((resolve) => (advance.current = resolve))
    const hint = (async () => {
      await wait(9000, signal)
      if (hits.current === 0) chat.post('psst — the pieces can be thrown. verity is a valid target.', 'system')
      await wait(12000, signal)
      if (hits.current < HITS_NEEDED) {
        const c = await ask([{ id: 'skip', label: 'Skip to protocol 02' }], signal)
        if (c === 'skip') advance.current?.()
      }
    })().catch(() => {})
    await Promise.race([advanced, new Promise((_, rej) => signal.addEventListener('abort', () => rej(new DOMException('a', 'AbortError'))))])
    void hint
    await wait(600, signal)
    await chat.say('fine. FINE.', { signal, hold: 500 })
    await chat.say('lights off.', { signal, hold: 400 })
    dispatch({ type: 'SCENE', scene: 'lights' })
  }, [])

  return null
}

let knock: { x: number; y: number; t: number } | null = null
