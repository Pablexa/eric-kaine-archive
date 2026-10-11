import { useEffect, useRef } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import type { HitEvent, Piece } from '../../../lib/interactions/pile'
import { artistMedia, characterMedia, objectMedia } from '../../../lib/assets/realMedia'
import { loop, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './PileScene.css'

const HITS_NEEDED = 3

/** What Eric Kaineity says when you pick up one of the real photos (`photo:<id>`). */
const PHOTO_GRAB: Record<string, string> = {
  cheese: 'put the cheese down. it’s aged. like his unreleased stuff.',
  seal: 'not the seal. the seal is innocent.',
  burger: 'that burger is evidence. do not throw the burger.',
  drink: 'that cup is not a toy. put it down.',
  slime: 'that’s slime. 2slimey would be proud. still. drop it.',
}

const PHOTO_HIT: Record<string, string> = {
  cheese: 'you threw CHEESE at me.',
  seal: 'you threw a SEAL at me.',
  burger: 'a burger? in this economy?',
  drink: 'not the cup. NOT THE CUP.',
  slime: 'slimed. i have been slimed.',
}

const grabLine = (p: Piece) => {
  const [kind, ch] = p.label.split(':')
  switch (kind) {
    case 'photo':
      return PHOTO_GRAB[ch] ?? 'that’s an underground legend. handle with care.'
    case 'avatar':
      return 'put his face down. he’s faceless now. very underground.'
    case 'period':
      return 'that’s my cousin. be gentle.'
    case 'cta':
      return 'that button leads nowhere now. like a deleted leak.'
    case 'letter':
      return `that’s the letter ${ch}. there are only nine of them. limited pressing.`
    case 'latest':
      return 'that’s a leaked snippet. drop it.'
    case 'eyebrow':
      return 'that’s a label. not a record label. just a label. leave it.'
    case 'copy':
      return 'that paragraph was very well written. basically lyrics. put it down.'
    case 'meta':
      return 'those play counts are classified now.'
    default:
      return 'i said don’t touch anything.'
  }
}

const hitLine = (p: Piece, n: number) => {
  if (n === 2) return 'do that again. see what happens.'
  const [kind, id] = p.label.split(':')
  if (kind === 'photo') return PHOTO_HIT[id] ?? 'you threw a whole RAPPER at me.'
  if (kind === 'avatar') return 'you threw his FACE at me.'
  if (kind === 'period') return 'that was my cousin.'
  if (kind === 'cta') return 'that button was load-bearing.'
  if (kind === 'letter') return 'assault with a typeface.'
  return 'ow.'
}

const MARQUEE =
  '!!! PROTOCOL 01 !!! THE ARCHIVE GOT LEAKED !!! DON’T TOUCH THE WRECKAGE !!! (THROW IT AT ERIC KAINEITY) !!! NOT TRYING TO BE FAMOUS !!! '

const TOP8 = [
  { name: 'Bleood', media: artistMedia.bleood },
  { name: 'Slayr', media: artistMedia.slayr },
  { name: 'OsamaSon', media: artistMedia.osamason },
  { name: 'Carti', media: artistMedia.carti },
  { name: 'Jaydes', media: artistMedia.jaydes },
  { name: '2Slimey', media: artistMedia.slimey },
  { name: 'cheese', media: objectMedia.cheese },
  { name: 'seal', media: objectMedia.seal },
]

/**
 * The wreckage is physical: drag it, fling it (page pieces and real photos
 * alike). Eric Kaineity drifts above the pile. Hit it three times and it
 * escalates to Protocol 02.
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

  // Eric Kaineity drifts in a lazy figure-eight; the pile treats it as a solid body.
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
    objective.set('Don’t touch the leaks. (Please.)')
    await chat.say('please don’t touch anything. it’s all unreleased.', { signal })
    const advanced = new Promise<void>((resolve) => (advance.current = resolve))
    const hint = (async () => {
      await wait(9000, signal)
      if (hits.current === 0) chat.post('psst — the pieces can be thrown. eric kaineity is a valid target.', 'system')
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
    await chat.say('lights off. underground rules.', { signal, hold: 400 })
    dispatch({ type: 'SCENE', scene: 'lights' })
  }, [])

  return <PileChrome />
}

/** 2008 profile-page chrome over the wreckage. Purely decorative and click-through. */
function PileChrome() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ks-pile-marquee absolute -inset-x-4 top-[118px] -rotate-1 sm:top-[132px]">
        <span>
          {MARQUEE}
          {MARQUEE}
        </span>
      </div>

      <section className="ks-pile-box ks-top8 absolute left-4 top-[188px] hidden w-[236px] xl:block">
        <div className="ks-pile-box__bar">Eric Kaineity’s Top 8</div>
        <div className="grid grid-cols-4 gap-1.5 p-2">
          {TOP8.map((f) => (
            <figure key={f.name} className="min-w-0">
              <img src={f.media.src} alt="" draggable={false} decoding="async" />
              <figcaption>{f.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="ks-pile-box ks-player absolute right-4 top-[192px] hidden w-[236px] xl:block">
        <div className="ks-pile-box__bar">NOW PLAYING (UNRELEASED)</div>
        <div className="flex gap-2 p-2">
          <img className="ks-player__art shrink-0" src={characterMedia.kaineity.src} alt="" draggable={false} decoding="async" />
          <div className="min-w-0 flex-1">
            <p className="ks-player__track">kaineity_snippet_FINAL_v3 (leak).mp3</p>
            <div className="ks-player__progress mt-1.5">
              <span />
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-[#ffff00]">
              plays: <span className="ks-player__counter">0000413</span>
            </p>
          </div>
        </div>
        <div className="px-2 pb-2">
          <span className="ks-player__download">
            <span className="ks-player__blink text-[#e00000]">NEW!</span> FREE DOWNLOAD (REAL) (NOT A VIRUS)
          </span>
        </div>
      </section>
    </div>
  )
}

let knock: { x: number; y: number; t: number } | null = null
