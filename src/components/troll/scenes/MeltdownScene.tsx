import { useState } from 'react'
import { AnimatePresence, animate, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, pileDim, shake } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { EASE, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * The finale. One hypothetical subscriber is treated as a global emergency,
 * Verity overloads and pops, and then — after a long, quiet beat — a much
 * smaller Verity rolls back in to put things in perspective. The archive
 * rebuilds itself… and Verity notices it is still far too nice. (→ Act III)
 */

const TICKER = [
  'EXPERTS URGE CALM',
  'VERITY DOES NOT URGE CALM',
  'SUBSCRIBER COUNT NOW 1.5K + 1',
  'ERIC REPORTEDLY “NOT TRYING TO BE FAMOUS”',
  'ARCHIVE IN RUINS',
  'FAME LEVELS DESCRIBED AS “TECHNICALLY HIGHER”',
  'PLEASE GATEKEEP RESPONSIBLY',
  'MORE AT 11 (STREAM)',
]

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

    // …and then she looks at the rebuilt archive
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
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            data-testid="broadcast"
          >
            {/* the number */}
            <div className="absolute inset-x-0 top-[36%] flex -translate-y-1/2 justify-center">
              <p className="display flex items-baseline text-[clamp(84px,19vw,300px)] text-pixel [font-stretch:125%]">
                <span>1.5K</span>
                <AnimatePresence>
                  {plus ? (
                    <motion.span
                      className="ml-[0.08em] text-alarm"
                      initial={{ scale: 3, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.35, ease: EASE.snap }}
                    >
                      +1
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </p>
            </div>

            <motion.div
              className="absolute left-3 top-[84px] flex items-center gap-2 bg-alarm px-3 py-1.5 sm:left-6 sm:top-[96px]"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE.outExpo }}
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
              <span className="pixel text-[16px] text-white">LIVE · ARCHIVE NEWS</span>
            </motion.div>

            <div className="absolute inset-x-0 bottom-[34%] sm:bottom-[30%]">
              <motion.div
                className="flex flex-col sm:flex-row"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
              >
                <span className="display bg-alarm px-4 py-3 text-[clamp(22px,3.2vw,46px)] text-white [font-stretch:125%] sm:px-6">BREAKING</span>
                <span className="display flex-1 bg-pixel px-4 py-3 text-[clamp(18px,2.6vw,38px)] leading-[1.02] text-hazard [font-stretch:108%] sm:px-6">
                  Local YouTuber gains one (1) hypothetical subscriber
                </span>
              </motion.div>
              <div className="overflow-hidden bg-verity py-2">
                <div
                  className="pixel flex w-max gap-10 whitespace-nowrap text-[17px] text-hazard sm:text-[20px]"
                  style={{ animation: 'marquee 26s linear infinite', animationPlayState: broadcast === 'frozen' ? 'paused' : 'running' }}
                >
                  {[...TICKER, ...TICKER].map((t, i) => (
                    <span key={i}>✦ {t}</span>
                  ))}
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
  const bits = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2 + Math.random() * 0.3
    const d = 140 + Math.random() * 260
    return { a, d, s: 6 + Math.random() * 12, c: i % 3 === 0 ? '#ff5a2a' : i % 3 === 1 ? '#ffd21f' : '#fff3a6' }
  })
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[47]" style={{ transform: `translate(${x}px, ${y}px)` }} aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ width: b.s, height: b.s, background: b.c, marginLeft: -b.s / 2, marginTop: -b.s / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(b.a) * b.d, y: Math.sin(b.a) * b.d + 120, opacity: 0, rotate: 180 }}
          transition={{ duration: 1.3, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
