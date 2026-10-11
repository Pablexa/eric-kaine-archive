import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective, useStore } from '../../../lib/experience/store'
import { backdrop, introCard } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { channel } from '../../../lib/content/channel'
import { EASE, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const OPENERS = {
  orb: 'hi. you clicked me. i’m verity, your archive guide.',
  share: 'whoa whoa whoa. you were about to share him?',
  period: 'you found me early. hi. i’m verity.',
  replay: 'back again? fine. from the top.',
} as const

export function IntroScene() {
  const { state, dispatch } = useExperience()

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    objective.set(null)
    backdrop.set('dim')
    introCard.set(null)
    verity.onPress = null
    verity.onGrab = null

    // Verity takes the stage from wherever she was summoned.
    const center = verity.centerPosition()
    if (verity.mode === 'hidden') {
      const src =
        state.revealSource === 'share'
          ? document.querySelector('[data-testid="share"]')
          : state.revealSource === 'period'
            ? document.querySelector('[data-testid="hero-period"]')
            : null
      const r = src?.getBoundingClientRect()
      if (r) verity.jump(r.left + r.width / 2, r.top + r.height / 2, 20)
      else verity.jump(center.x, center.y + 40, 10)
    }
    verity.setMode('free', false)
    sfx.whoosh()
    await verity.moveTo(center.x, center.y, { size: center.size, duration: 1, signal })

    await say(OPENERS[state.revealSource ?? 'orb'])

    if (!sfx.asked) {
      await say('before i continue: i communicate in beeps.', { hold: 300 })
      const s = await ask(
        [
          { id: 'on', label: 'Allow beeps', tone: 'yellow' },
          { id: 'off', label: 'Keep it silent' },
        ],
        signal,
      )
      if (s === 'on') {
        sfx.enable()
        sfx.chirp('b')
        await say('beep. thank you.')
      } else {
        sfx.disable()
        await say('silent mode. respectfully.')
      }
    }

    await say('i read eric’s channel description.')
    void verity.moveTo(center.x, Math.max(118, window.innerHeight * 0.16), { size: center.size * 0.72, duration: 0.7, signal }).catch(() => {})
    introCard.set('quote')
    await wait(400, signal)
    await say('he wrote that. himself. publicly.', { hold: 1600 })
    await say('and this website exists to make him more famous.')
    await wait(500, signal)
    await say('do you see the problem.', { hold: 1100 })
    dispatch({ type: 'MOOD', mood: 'annoyed' })
    introCard.set('stamped')
    sfx.boom()
    await wait(700, signal)
    await say('so i’m gatekeeping him. effective immediately.')
    introCard.set(null)
    void verity.moveTo(center.x, center.y, { size: center.size, duration: 0.8, signal }).catch(() => {})
    await say('you can help me. or you can be the problem.', { hold: 200 })

    const c = await ask(
      [
        { id: 'help', label: 'Help Verity gatekeep', tone: 'yellow' },
        { id: 'refuse', label: 'Absolutely not' },
      ],
      signal,
    )
    dispatch({ type: 'ROUTE', route: c === 'help' ? 'help' : 'refuse' })
    if (c === 'help') {
      dispatch({ type: 'MOOD', mood: 'calm' })
      await say('really? oh. ok. i’ve never had a partner.')
      dispatch({ type: 'SCENE', scene: 'redact' })
    } else {
      await say('ok.', { hold: 900 })
      await say('then we do this the hard way.', { hold: 600 })
      dispatch({ type: 'SCENE', scene: 'collapse' })
    }
  }, [])

  return <QuoteCard />
}

function QuoteCard() {
  const card = useStore(introCard)
  return (
    <AnimatePresence>
      {card ? (
        <motion.figure
          key="quote-card"
          className="fixed left-1/2 top-[54%] z-[44] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 border border-line-2 bg-ink-2 px-6 py-8 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:px-10 sm:py-12"
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: card === 'stamped' ? 1.5 : 0 }}
          exit={{ opacity: 0, y: -20, rotate: 3, transition: { duration: 0.4 } }}
          transition={{ duration: 0.7, ease: EASE.outExpo }}
          data-testid="intro-card"
        >
          <p className="eyebrow">Exhibit A · channel description</p>
          <blockquote className="mt-5 font-serif text-[clamp(34px,5.6vw,64px)] italic leading-[0.98] text-paper">“{channel.bio}”</blockquote>
          <figcaption className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">— Eric Kaine, {channel.handle}</figcaption>
          <AnimatePresence>
            {card === 'stamped' ? (
              <motion.span
                className="pixel absolute right-4 top-4 border-4 border-alarm px-3 py-1 text-[clamp(22px,4vw,40px)] text-alarm sm:right-8 sm:top-8"
                initial={{ opacity: 0, scale: 2.4, rotate: -24 }}
                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                transition={{ duration: 0.28, ease: EASE.snap }}
              >
                UNDERSTOOD
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.figure>
      ) : null}
    </AnimatePresence>
  )
}
