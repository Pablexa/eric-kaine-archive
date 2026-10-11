import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, fm, hudHidden, pileDim, streamOverlay, subsOverride } from '../../../lib/experience/stage'
import { channel } from '../../../lib/content/channel'
import { artistMedia, objectMedia } from '../../../lib/assets/realMedia'
import { sfx } from '../../../lib/audio/sfx'
import { scrollToY } from '../../../lib/interactions/scroll'
import { EASE, TIME, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const CONFETTI = [objectMedia.cheese, artistMedia.jaydes, objectMedia.seal, artistMedia.carti, artistMedia.slimey, artistMedia.bleood, objectMedia.burger, artistMedia.verity]
const COUNTS = ['1.5K', '15K', '1.5M', '1.5B']
type Beat = 'fame' | 'bio' | 'restore'

/** One billion imaginary subscribers meet one very real channel description. */
export function LegendScene() {
  const { state, dispatch, finishEnding, pileRef } = useExperience()
  const [beat, setBeat] = useState<Beat>('fame')
  const [count, setCount] = useState('1.5K')
  const [burst, setBurst] = useState(0)
  const soundBeforeCut = useRef<{ volume: number; enabled: boolean; forced: boolean } | null>(null)
  const reduce = prefersReducedMotion()

  const restoreSound = () => {
    const saved = soundBeforeCut.current
    if (!saved) return
    soundBeforeCut.current = null
    sfx.setVolume(saved.volume)
    sfx.forced = false
    if (saved.enabled && !saved.forced) sfx.enable()
  }

  // Esc/replay can interrupt the silent bio, so never persist its zero gain.
  useEffect(() => () => {
    restoreSound()
    hudHidden.set(false)
    subsOverride.set(null)
    objective.set(null)
  }, [])

  useScript(async (signal) => {
    const bleoodity = (text: string, hold = 1200) => chat.say(text, { author: 'bleoodity', signal, hold })
    objective.set('Fame speedrun · imaginary numbers')
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    backdrop.set('dim')
    void verity.moveTo(window.innerWidth / 2, window.innerHeight * 0.24, { size: 110, duration: 0.6, signal }).catch(() => {})
    for (let i = 0; i < COUNTS.length; i++) {
      subsOverride.set(COUNTS[i])
      setCount(COUNTS[i])
      setBurst(i + 1)
      if (i) {
        sfx.airhorn()
        sfx.fanfare()
      }
      if (i === 2) chat.post('we are medically famous.', 'bleoodity', 'loud')
      await wait(i === 3 ? 2200 : 1400, signal)
    }
    await bleoodity('ONE POINT FIVE BILLION. EVERYONE FOUND HIM.', 1700)

    // Remove both the real embedded player and the parody stream immediately.
    fm.set('off')
    streamOverlay.set(false)
    sfx.stopMusic()
    sfx.hum(false)
    // Gain reaches zero immediately too, cutting any fanfare voices still alive.
    soundBeforeCut.current = { volume: sfx.volume, enabled: sfx.enabled, forced: sfx.forced }
    sfx.setVolume(0)
    sfx.disable()
    objective.set(null)
    chat.clear()
    hudHidden.set(true)
    setBeat('bio')
    dispatch({ type: 'MOOD', mood: 'calm' })
    await wait(1800, signal)
    await bleoodity('…oh.', 1800)
    await bleoodity('right.', 1300)
    await bleoodity('my bad.', 1700)

    setBeat('restore')
    verity.setCostume('none')
    verity.scale.set(1)
    verity.glow.set(0.6)
    chaos.reset()
    document.querySelectorAll<HTMLElement>('[data-redacted]').forEach((el) => el.removeAttribute('data-redacted'))
    document.documentElement.classList.remove('is-redacting')
    await scrollToY(0, 0, signal)
    const pile = pileRef.current
    pileRef.current = null
    if (pile) await pile.reassemble(reduce ? 0 : 950 * TIME.scale, signal)
    if (signal.aborted) return
    subsOverride.set(null)
    pileDim.set(false)
    hudHidden.set(false)
    backdrop.set('none')
    dispatch({ type: 'MOOD', mood: 'tiny' })
    verity.jump(window.innerWidth * 0.72, window.innerHeight * 0.68, 16)
    verity.setMode('free', false)
    await chat.say('1.5K + 1. still pretty gatekept.', { signal, hold: 1500 })
    const home = document.querySelector<HTMLElement>('[data-testid="hero-period"]')?.getBoundingClientRect()
    if (home) await verity.moveTo(home.left + home.width / 2, home.top + home.height / 2, { size: Math.max(8, home.width), duration: 1.15, signal })
    verity.setMode('hidden', false)
    await wait(700, signal)
    restoreSound()
    backdrop.set('dim')
    finishEnding(state.route === 'help' ? 'gatekeeper' : 'subscriber')
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[46]" data-troll-ui data-testid="legend" data-beat={beat}>
      <AnimatePresence>
        {beat === 'fame' ? (
          <motion.div key="fame" className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#3b0628cc,transparent_75%)] px-4 text-center" exit={{ opacity: 0, transition: { duration: 0 } }}>
            <p className="pixel text-base tracking-[0.2em] text-[#ffd21f]">ERIC KAINE HAS CONQUERED THE INTERNET</p>
            <motion.p key={count} initial={reduce ? {} : { scale: 2, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.35 * TIME.scale, ease: EASE.snap }} className="mt-6 text-[clamp(84px,20vw,280px)] leading-none text-white" style={{ fontFamily: 'Impact, sans-serif', textShadow: '8px 8px 0 #ff315d, -5px -5px 0 #933bff' }} data-testid="legend-subs" aria-live="polite">{count}</motion.p>
            <p className="pixel mt-5 bg-black px-4 py-2 text-lg text-[#ffd21f]">SUBSCRIBERS · IN BLEOODITY’S IMAGINATION</p>
            <p className="pixel mt-2 text-xs text-white/70">Parody counter. The actual archive still says {channel.subscribersLabel}.</p>
            <div key={burst} className="absolute inset-0" aria-hidden="true">
              {Array.from({ length: reduce ? 12 : 32 }, (_, i) => (
                <motion.img key={i} src={CONFETTI[i % CONFETTI.length].src} alt="" draggable={false} className="absolute h-[clamp(30px,5vw,64px)] w-[clamp(30px,5vw,64px)]" style={{ left: `${(i * 31 + 7) % 96}%`, top: reduce ? `${(i * 17 + 5) % 90}%` : '-15%' }} initial={reduce ? { opacity: 0.6 } : { y: 0, rotate: i * 43, opacity: 1 }} animate={reduce ? { opacity: 0.6 } : { y: '120vh', rotate: i * 43 + 480, opacity: [1, 1, 0] }} transition={reduce ? { duration: 0 } : { duration: (2.8 + i % 4 * 0.2) * TIME.scale, delay: i % 8 * 0.055 * TIME.scale, ease: 'linear' }} />
              ))}
            </div>
          </motion.div>
        ) : null}
        {beat === 'bio' ? (
          <motion.div key="bio" className="absolute inset-0 flex flex-col justify-center bg-[#121312] px-7 text-center sm:px-20" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.8 * TIME.scale }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 1.2 * TIME.scale }}>
              <p className="mb-7 font-mono text-[11px] uppercase tracking-[0.2em] text-[#b1b2aa]">The channel description · Exhibit A, again</p>
              <blockquote className="mx-auto max-w-[17ch] font-serif text-[clamp(42px,7.5vw,104px)] italic leading-[1.05] tracking-[-0.03em] text-[#f4f1e8]" data-testid="legend-bio">“{channel.bio}”</blockquote>
              <p className="mt-8 font-mono text-xs text-[#b1b2aa]">— {channel.name}, {channel.handle}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

