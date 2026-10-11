import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { channel } from '../../lib/content/channel'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { verity } from '../../lib/experience/verity'
import { sfx } from '../../lib/audio/sfx'
import { EASE, wait, isAborted } from '../../lib/animation/timeline'
import { LineReveal, Reveal } from '../shared/Reveal'
import { SectionHeading } from '../shared/SectionHeading'

/**
 * Phase 1 lives here. When the bio quote is read, its yellow orb wakes up,
 * says one word, and leaves the paragraph to become the "archive guide".
 */
export function About() {
  const { state, dispatch } = useExperience()
  const reduce = useReducedMotion()
  const quoteRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(quoteRef, { amount: 0.75 })
  const [stage, setStage] = useState<'asleep' | 'awake' | 'speaking' | 'gone'>('asleep')
  const [typed, setTyped] = useState('')
  const started = useRef(false)
  const run = useRef<AbortController | null>(null)

  // a full archive reset puts Verity back to sleep inside the quote
  useEffect(() => {
    if (state.phase === 'professional' && !state.witnessed && stage === 'gone') {
      started.current = false
      setStage('asleep')
      setTyped('')
    }
    // the reveal started some other way mid-sequence: let it go
    if (state.phase !== 'professional' && state.phase !== 'foreshadow' && run.current && stage !== 'gone') {
      run.current.abort()
      setStage('gone')
    }
  }, [state.phase, state.witnessed, stage])

  useEffect(() => () => run.current?.abort(), [])

  useEffect(() => {
    if (!inView || state.phase !== 'professional' || started.current) return
    started.current = true
    const ac = new AbortController()
    run.current = ac
    const s = ac.signal
    ;(async () => {
      await wait(reduce ? 300 : 1100, s)
      setStage('awake')
      await wait(reduce ? 200 : 900, s)
      setStage('speaking')
      const word = 'understood.'
      for (let i = 1; i <= word.length; i++) {
        setTyped(word.slice(0, i))
        sfx.chirp(word[i - 1])
        await wait(reduce ? 0 : 70, s)
      }
      await wait(reduce ? 300 : 1300, s)
      // the orb leaves the quote and becomes Verity
      const r = orbRef.current?.getBoundingClientRect()
      if (r) verity.jump(r.left + r.width / 2, r.top + r.height / 2, r.width)
      verity.setMode('free', false)
      setStage('gone')
      dispatch({ type: 'FORESHADOW' })
      if (r) await verity.moveTo(r.left + r.width / 2 + 40, r.top - 30, { size: r.width * 1.1, duration: 0.5, signal: s })
      await verity.dock({ duration: 1.1, signal: s })
      run.current = null
    })().catch((e) => {
      if (!isAborted(e)) throw e
    })
  }, [inView, state.phase, reduce, dispatch])

  const orbVisible = state.phase === 'professional' && stage !== 'gone'

  return (
    <section id="about" className="relative scroll-mt-24 py-24 sm:py-32" aria-labelledby="about-title">
      <div className="shell">
        <SectionHeading id="about-title" index="03 — About" title="About" />

        <div className="grid-12 mt-14 gap-y-12 sm:mt-20">
          <Reveal className="col-span-12 md:col-span-5">
            <figure className="relative">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-3 ring-1 ring-line" data-redact="avatar">
                <img
                  src={channel.avatar}
                  alt="Eric Kaine’s channel avatar: a cartoon portrait with curly hair and round glasses"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  draggable={false}
                />
                <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Fig. 1</span>
              </div>
              <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Channel avatar · {channel.handle}</figcaption>
            </figure>
          </Reveal>

          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <p className="font-display text-[clamp(26px,2.9vw,40px)] font-semibold leading-[1.12] tracking-[-0.025em] text-paper [font-stretch:102%]">
              <LineReveal>The channel opened on 13 September 2024.</LineReveal>
              <LineReveal delay={0.08} className="text-muted">
                Two years later, to the day, a stream title read:
              </LineReveal>
              <LineReveal delay={0.16}>
                <span className="font-mono text-[0.62em] font-medium tracking-[0.02em] text-paper" data-redact="title">
                  IM BOUT TO HIT 1000 SUBS
                </span>
              </LineReveal>
            </p>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-[52ch] text-[16px] leading-[1.6] text-paper-2">
                Since then the channel has moved fast: Bleood added to the Verity horror mod (“and broke it”), underground-rapper Gartic Phone with viewers, beats built from sounds chat picks, and reactions to new drops — most of it live.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-6 text-[14px]">
                {[
                  ['Main channel', channel.handle],
                  ['Beats', '@eric1kaine'],
                  ['Live', 'twitch.tv/eric1kaine'],
                  ['Recurring cast', 'Verity, Bleood, chat'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{k}</dt>
                    <dd className="mt-1.5 text-paper" data-redact="fact">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>

        {/* The quote. */}
        <div ref={quoteRef} className="mt-28 border-t border-line pt-10 sm:mt-40" data-testid="bio-quote">
          <p className="eyebrow">In his own words</p>
          <blockquote className="mt-8 font-serif text-[clamp(44px,8.6vw,136px)] italic leading-[0.94] tracking-[-0.02em] text-paper">
            <span data-redact="quote">“please gatekeep me im not trying to be famous”</span>
            <span className="relative inline-block w-[0.32em] align-baseline">
              <motion.span
                ref={orbRef}
                aria-hidden="true"
                className="period absolute bottom-[0.1em] left-[0.08em] !h-[0.22em] !w-[0.22em]"
                animate={{ opacity: orbVisible ? 1 : 0, scale: stage === 'awake' || stage === 'speaking' ? 1.15 : 1 }}
                transition={{ duration: 0.4, ease: EASE.snap }}
                data-testid="quote-orb"
              >
                {stage === 'awake' || stage === 'speaking' ? (
                  <motion.span
                    className="absolute inset-0 flex items-center justify-center gap-[0.04em]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 1, 1, 0.1, 1] }}
                    transition={{ duration: 1.1, times: [0, 0.2, 0.7, 0.8, 1] }}
                  >
                    <span className="block h-[0.07em] w-[0.035em] rounded-full bg-[#1a1400]" />
                    <span className="block h-[0.07em] w-[0.035em] rounded-full bg-[#1a1400]" />
                  </motion.span>
                ) : null}
              </motion.span>
            </span>
          </blockquote>
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">— Eric Kaine, channel description (verbatim)</p>
            <p className="min-h-[1.5em] font-mono text-[13px] text-verity" aria-live="polite" data-testid="understood">
              {typed}
              {stage === 'speaking' ? <span className="ml-0.5 inline-block animate-[caret_1s_steps(1)_infinite]">▍</span> : null}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
