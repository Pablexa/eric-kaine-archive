import { useState } from 'react'
import { AnimatePresence, animate, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, pileDim, shake, songOne } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { EASE, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import './MeltdownScene.css'

/**
 * The finale of Act II. One follower is treated as an underground emergency:
 * a 2008 leak-alert broadcast cuts in, Eric Kaineity overloads and pops, and
 * then — after a long, quiet beat — a much smaller Eric Kaineity rolls back in
 * to put things in perspective. The archive rebuilds itself… and he notices it
 * is still far too nice. (→ Act III)
 */

const TICKER = [
  'EXPERTS URGE CALM',
  'ERIC KAINEITY DOES NOT URGE CALM',
  'FOLLOWER COUNT NOW 1.5K + 1',
  'ERIC REPORTEDLY “NOT TRYING TO BE FAMOUS”',
  'BLEOOD SNIPPET STILL UNRELEASED',
  'GATEKEPT DISCORD NOW DANGEROUSLY POPULAR (1 NEW MEMBER)',
  'SOUNDCLOUD PLAYS DESCRIBED AS “TECHNICALLY HIGHER”',
  'CARTI FANS STILL REFRESHING',
  'SEAL SPOTTED NEAR THE SCENE',
  'CHEESE PRICES UNAFFECTED',
  'PLEASE GATEKEEP RESPONSIBLY',
  'MORE AT 11 (SNIPPET)',
]

/** The underground reacts, live. Captions carry the names, so the photos are decorative. */
const REACTIONS: { photo: RealMedia; name: string; note: string; pos: React.CSSProperties; rot: number; wide: 'sm' | 'md' }[] = [
  { photo: artistMedia.bleood, name: 'BLEOOD', note: 'reacting live', pos: { left: '2.5%', top: '25%' }, rot: -7, wide: 'md' },
  { photo: artistMedia.slayr, name: 'SLAYR', note: 'left the chat', pos: { left: '12%', top: '33%' }, rot: 5, wide: 'md' },
  { photo: artistMedia.osamason, name: 'OSAMASON', note: 'rage levels: critical', pos: { right: '2.5%', top: '25%' }, rot: 6, wide: 'md' },
  { photo: artistMedia.carti, name: 'CARTI', note: 'still no release date', pos: { right: '12%', top: '33%' }, rot: -5, wide: 'md' },
  { photo: artistMedia.jaydes, name: 'JAYDES', note: 'not available for comment', pos: { right: '3%', bottom: '4%' }, rot: 4, wide: 'sm' },
  { photo: artistMedia.slimey, name: '2SLIMEY', note: 'slatt (concerned)', pos: { right: '14%', bottom: '6%' }, rot: -6, wide: 'sm' },
]

/** What flies out when Eric Kaineity pops. */
const BURST_PHOTOS = [objectMedia.cheese, objectMedia.burger, objectMedia.seal, objectMedia.slime]

export function MeltdownScene() {
  const { dispatch, pileRef } = useExperience()
  const [broadcast, setBroadcast] = useState<'off' | 'on' | 'frozen'>('off')
  const [plus, setPlus] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    objective.set(null)
    await wait(400, signal)

    dispatch({ type: 'MOOD', mood: 'meltdown' })
    sfx.meltdown()
    const cx = window.innerWidth / 2
    const cy = Math.min(window.innerHeight * 0.36, 330)
    await verity.moveTo(cx, cy, { size: 110, duration: 0.6, signal })
    setBroadcast('on')
    sfx.alarm(3)
    if (!reduce) void animate(verity.scale, 1.9, { duration: 2.6, ease: 'easeIn' })
    await wait(500, signal)
    setPlus(true)
    sfx.thud(1)

    await say('no.', { tone: 'loud', hold: 450, speed: 40 })
    await say('no no no no.', { tone: 'loud', hold: 400, speed: 30 })
    await say('HE’S FAMOUS NOW.', { tone: 'loud', hold: 500 })
    await say('IT’S OVER.', { tone: 'loud', hold: 500 })
    await say('TELL BLEOOD I’M SORRY.', { tone: 'loud', hold: 700 })

    // pop
    if (!reduce) await animate(verity.scale, 2.6, { duration: 0.35, ease: 'easeIn' })
    setBurst({ x: verity.x.get(), y: verity.y.get() })
    sfx.pop()
    sfx.boom()
    shake.set(shake.get() + 1)
    verity.setMode('hidden')
    verity.scale.set(1)
    setBroadcast('frozen')
    chat.clear()

    // the quiet beat
    await wait(1700, signal)

    dispatch({ type: 'MOOD', mood: 'tiny' })
    const ty = window.innerHeight * 0.64
    verity.jump(window.innerWidth + 30, ty, 22)
    verity.setMode('free', false)
    await verity.moveTo(cx, ty, { size: 22, duration: reduce ? 0 : 1.6, ease: [0.22, 1, 0.36, 1], signal })
    // song 1 stops here: the "1.5K" moment is quiet
    songOne.set('stopped')
    await say('…', { hold: 900 })
    await say('actually.', { hold: 700 })
    await say('1.5K + 1 is still pretty gatekept.', { hold: 1400 })

    // the archive puts itself back together
    setBroadcast('off')
    setBurst(null)
    pileDim.set(false)
    backdrop.set('none')
    const pile = pileRef.current
    pileRef.current = null
    if (pile) await pile.reassemble(reduce ? 0 : 1100, signal)

    // …and then he looks at the rebuilt archive
    await wait(900, signal)
    await say('…wait.', { hold: 1100 })
    await say('it’s still a really nice website.', { hold: 1200 })
    await say('people share nice websites.', { hold: 1300 })
    dispatch({ type: 'SCENE', scene: 'uglify' })
  }, [])

  return (
    <>
      <AnimatePresence>
        {broadcast !== 'off' ? (
          <motion.div
            key="broadcast"
            className="mt-broadcast pointer-events-none absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            data-testid="broadcast"
            data-frozen={broadcast === 'frozen' ? 'true' : 'false'}
          >
            <div className="mt-wash" aria-hidden="true" />

            {/* the underground reacts */}
            {REACTIONS.map((r) => (
              <figure
                key={r.name}
                className={`mt-reaction hidden ${r.wide === 'md' ? 'md:block' : 'sm:block'}`}
                style={{ ...r.pos, rotate: `${r.rot}deg` }}
              >
                <img src={r.photo.src} alt="" draggable={false} />
                <figcaption>
                  <b>{r.name}</b>
                  {r.note}
                </figcaption>
              </figure>
            ))}

            {/* the number */}
            <div className="absolute inset-x-0 top-[36%] flex -translate-y-1/2 flex-col items-center">
              <p className="mt-number" aria-label={plus ? '1.5K plus 1 followers' : '1.5K followers'}>
                <span>1.5K</span>
                <AnimatePresence>
                  {plus ? (
                    <motion.span
                      className="mt-plus"
                      initial={{ scale: 3, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 7 }}
                      transition={{ duration: 0.35, ease: EASE.snap }}
                    >
                      +1
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </p>
              <span className="mt-unit">followers · underground status: AT RISK</span>
            </div>

            {broadcast === 'frozen' ? (
              <div className="absolute inset-x-0 top-[36%] flex -translate-y-1/2 justify-center px-4" data-testid="broadcast-frozen">
                <div className="mt-buffering">
                  signal lost. buffering… 99%
                  <div className="mt-buffering-bar" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => (
                      <i key={i} className={i === 9 ? 'mt-empty' : undefined} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <motion.div
              className="absolute left-3 top-[84px] sm:left-6 sm:top-[96px]"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE.outExpo }}
            >
              <div className="mt-live">
                <span className="mt-dot" aria-hidden="true" />
                <span>LIVE · UNDERGROUND NEWS</span>
              </div>
              <div className="mt-alert">
                <span>⚠ LEAK ALERT ⚠</span>
              </div>
            </motion.div>

            <div className="absolute right-3 top-[84px] hidden sm:right-6 sm:top-[96px] sm:block" aria-hidden="true">
              <div className="mt-counter">
                <span>tuned in rn</span>
                <span className="mt-digits">
                  {'0001502'.split('').map((n, i) => (
                    <span key={i}>{n}</span>
                  ))}
                </span>
                <span>on air since 2008</span>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-[34%] sm:bottom-[30%]">
              <motion.div
                className="mt-lower"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
              >
                <div className="mt-pictured">
                  <img src={characterMedia.ericPfp.src} alt={characterMedia.ericPfp.alt} draggable={false} />
                  <span aria-hidden="true">PICTURED</span>
                </div>
                <span className="mt-breaking">BREAKING</span>
                <span className="mt-headline">
                  <strong>Eric Kaine gained 1 follower — underground status at risk</strong>
                  <em>eyewitnesses report one (1) click on a follow button · the gatekept discord is in shambles</em>
                </span>
              </motion.div>
              <div className="mt-ticker">
                <span className="mt-ticker-label">UNDERGROUND NEWS</span>
                <div className="mt-ticker-window">
                  <div className="mt-ticker-track">
                    {[...TICKER, ...TICKER].map((t, i) => (
                      <span key={i} aria-hidden={i >= TICKER.length ? true : undefined}>
                        ★ {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {burst ? <Burst x={burst.x} y={burst.y} /> : null}
    </>
  )
}

function Burst({ x, y }: { x: number; y: number }) {
  if (prefersReducedMotion()) return null
  const neon = ['#ff2bd6', '#39ff14', '#ffe600', '#00e5ff']
  const bits = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2 + Math.random() * 0.3
    const d = 140 + Math.random() * 260
    const photo = i % 3 === 0 ? BURST_PHOTOS[(i / 3) % BURST_PHOTOS.length] : null
    return { a, d, photo, s: photo ? 30 + Math.random() * 26 : 6 + Math.random() * 12, c: neon[i % neon.length], spin: (Math.random() - 0.5) * 540 }
  })
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[47]" style={{ transform: `translate(${x}px, ${y}px)` }} aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute block overflow-hidden"
          style={{
            width: b.s,
            height: b.s,
            background: b.photo ? '#000' : b.c,
            border: b.photo ? '2px solid #ffe600' : undefined,
            boxShadow: b.photo ? '3px 3px 0 #ff2bd6' : undefined,
            marginLeft: -b.s / 2,
            marginTop: -b.s / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(b.a) * b.d, y: Math.sin(b.a) * b.d + 120, opacity: 0, rotate: b.spin }}
          transition={{ duration: 1.3, ease: [0.2, 0.7, 0.4, 1] }}
        >
          {b.photo ? <img src={b.photo.src} alt="" draggable={false} className="h-full w-full object-cover" /> : null}
        </motion.span>
      ))}
    </div>
  )
}
