import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { ask, objective, useStore } from '../../../lib/experience/store'
import { backdrop, introCard } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { channel } from '../../../lib/content/channel'
import { characterMedia } from '../../../lib/assets/realMedia'
import { EASE, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './IntroScene.css'

const OPENERS = {
  orb: 'hi. you clicked me. i’m eric kaineity. eric’s gatekeeper.',
  share: 'whoa whoa whoa. you were about to share him? i’m eric kaineity. his gatekeeper.',
  period: 'you found me early. hi. i’m eric kaineity. eric’s gatekeeper.',
  replay: 'back again? fine. from the top.',
} as const

const MARQUEE = '★ EXHIBIT A ★ LEAKED BIO.TXT ★ NOT FOR THE BLOGS ★ DO NOT REPOST ★ UNDERGROUND ONLY ★ '

export function IntroScene() {
  const { state, dispatch } = useExperience()

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    objective.set(null)
    backdrop.set('dim')
    introCard.set(null)
    verity.onPress = null
    verity.onGrab = null

    // Eric Kaineity takes the stage from wherever it was summoned.
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
      await say('before i continue: i talk in beeps and voice notes.', { hold: 300 })
      const s = await ask(
        [
          { id: 'on', label: 'Turn it up (sound on)', tone: 'yellow' },
          { id: 'off', label: 'Keep it muted' },
        ],
        signal,
      )
      if (s === 'on') {
        sfx.enable()
        sfx.chirp('b')
        await say('beep. thank you. speakers on.')
      } else {
        sfx.disable()
        await say('muted. respectfully. very underground of you.')
      }
    }

    await say('i read eric’s bio.')
    void verity.moveTo(center.x, Math.max(118, window.innerHeight * 0.16), { size: center.size * 0.72, duration: 0.7, signal }).catch(() => {})
    introCard.set('quote')
    await wait(400, signal)
    await say('he wrote that. himself. publicly.', { hold: 1600 })
    await say('and this fan page exists to make him more famous.')
    await wait(500, signal)
    await say('do you see the problem.', { hold: 1100 })
    dispatch({ type: 'MOOD', mood: 'annoyed' })
    introCard.set('stamped')
    sfx.boom()
    await wait(700, signal)
    await say('so i’m gatekeeping him. effective immediately.')
    introCard.set(null)
    void verity.moveTo(center.x, center.y, { size: center.size, duration: 0.8, signal }).catch(() => {})
    await say('he stays underground. no blogs. no hype. just snippets.')
    await say('help me keep eric underground. or be the problem.', { hold: 200 })

    const c = await ask(
      [
        { id: 'help', label: 'Help Eric Kaineity gatekeep', tone: 'yellow' },
        { id: 'refuse', label: 'Absolutely not. Leak him.' },
      ],
      signal,
    )
    dispatch({ type: 'ROUTE', route: c === 'help' ? 'help' : 'refuse' })
    if (c === 'help') {
      dispatch({ type: 'MOOD', mood: 'calm' })
      await say('really? oh. ok. i’ve never had a co-sign before.')
      dispatch({ type: 'SCENE', scene: 'redact' })
    } else {
      await say('ok.', { hold: 900 })
      await say('then we do this the hard way.', { hold: 600 })
      dispatch({ type: 'SCENE', scene: 'collapse' })
    }
  }, [])

  return <QuoteCard />
}

/** Exhibit A: Eric's real bio as a leaked 2008 profile box. */
function QuoteCard() {
  const card = useStore(introCard)
  return (
    <AnimatePresence>
      {card ? (
        <motion.figure
          key="quote-card"
          className="ks-bio fixed left-1/2 top-[54%] z-[44] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, y: 30, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: card === 'stamped' ? 2 : -1.5 }}
          exit={{ opacity: 0, y: -20, rotate: 5, transition: { duration: 0.4 } }}
          transition={{ duration: 0.7, ease: EASE.outExpo }}
          data-testid="intro-card"
        >
          <div className="ks-bio__bar">
            <span>Eric Kaine’s Bio (leaked)</span>
            <span className="ks-bio__online">ONLINE NOW!</span>
          </div>
          <div className="ks-bio__marquee" aria-hidden="true">
            <span>
              {MARQUEE}
              {MARQUEE}
            </span>
          </div>
          <div className="flex gap-4 px-4 py-5 sm:gap-6 sm:px-7 sm:py-7">
            <img
              src={characterMedia.ericPfp.src}
              alt={characterMedia.ericPfp.alt}
              className="ks-bio__pfp h-[72px] w-[72px] shrink-0 sm:h-[132px] sm:w-[132px]"
              width={132}
              height={132}
              draggable={false}
            />
            <div className="min-w-0">
              <p className="ks-bio__label">Exhibit A · About me:</p>
              <blockquote className="ks-bio__quote mt-3 text-[clamp(28px,5vw,58px)] leading-[0.98]">“{channel.bio}”</blockquote>
              <figcaption className="ks-bio__meta mt-4">
                — Eric Kaine, {channel.handle} · Mood: underground · Status: gatekept
              </figcaption>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-black bg-[#6698cb] px-4 py-2 text-[12px] font-bold text-black sm:px-7" aria-hidden="true">
            <span>
              visitors: <span className="ks-bio__counter">000001</span>
            </span>
            <span className="ks-bio__download">FREE DOWNLOAD (REAL) (NOT A VIRUS)</span>
          </div>
          <AnimatePresence>
            {card === 'stamped' ? (
              <motion.span
                className="ks-bio__stamp absolute right-3 top-12 px-3 py-1.5 text-[clamp(26px,4.4vw,46px)] sm:right-8 sm:top-14"
                initial={{ opacity: 0, scale: 2.4, rotate: -24 }}
                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                transition={{ duration: 0.28, ease: EASE.snap }}
              >
                UNDERSTOOD.
                <small>(gatekept)</small>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.figure>
      ) : null}
    </AnimatePresence>
  )
}
