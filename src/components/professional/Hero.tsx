import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useMotionValue } from 'motion/react'
import { byId, channel, curation, formatDate, formatLength, thumb } from '../../lib/content/channel'
import { EASE } from '../../lib/animation/timeline'
import { scrollToSection } from '../../lib/interactions/scroll'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { Icon } from '../shared/Icon'
import { Period } from '../shared/Period'
import { Thumb } from '../media/Thumb'

const latest = byId(curation.featured)

function Letters({ word, delay, line }: { word: string; delay: number; line: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      {word.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.02em] align-top">
          <motion.span
            className="inline-block"
            data-physics={`letter:${ch}`}
            data-line={line}
            initial={reduce ? { opacity: 0 } : { y: '108%' }}
            animate={reduce ? { opacity: 1 } : { y: '0%' }}
            transition={{ duration: 1.1, delay: delay + i * 0.055, ease: EASE.outExpo }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </>
  )
}

export function Hero() {
  const reduce = useReducedMotion()
  const { reveal } = useExperience()
  const ref = useRef<HTMLElement>(null)
  const clicks = useRef<number[]>([])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90])
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.25])

  // avatar leans toward the pointer
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 90, damping: 18 })
  const sry = useSpring(ry, { stiffness: 90, damping: 18 })

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse') return
    const px = e.clientX / window.innerWidth - 0.5
    const py = e.clientY / window.innerHeight - 0.5
    rx.set(px * 16)
    ry.set(py * 12)
  }

  /** Hidden trigger: three quick taps on the period. */
  const onPeriod = () => {
    const now = performance.now()
    clicks.current = [...clicks.current.filter((t) => now - t < 900), now]
    if (clicks.current.length >= 3) {
      clicks.current = []
      reveal('period')
    }
  }

  return (
    <section ref={ref} id="top" className="relative isolate min-h-[100svh] overflow-hidden pt-[104px] sm:pt-[120px]" onPointerMove={onMove} aria-labelledby="hero-title">
      {/* ambient light pulled from the latest thumbnail */}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ y: glowY, opacity: fade }}>
        <img
          src={thumb(latest)}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute right-[-10%] top-[-10%] h-[90%] w-[80%] object-cover opacity-[0.28] blur-[90px] saturate-150"
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_20%,transparent,var(--color-ink)_70%)]" />
      </motion.div>

      <div className="shell flex flex-col sm:min-h-[min(calc(100svh-120px),880px)]">
        <div className="flex items-start justify-between gap-6">
          <motion.p
            className="eyebrow"
            data-physics="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Independent fan archive
          </motion.p>
          <motion.p
            className="eyebrow text-right"
            data-physics="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Since Sep 2024 — {channel.handle}
          </motion.p>
        </div>

        <motion.h1
          id="hero-title"
          className="display relative mt-6 select-none text-[clamp(76px,17.2vw,252px)] text-paper sm:mt-8 md:max-lg:mt-14 md:max-lg:text-[18.5vw]"
          style={{ y: titleY }}
          aria-label="Eric Kaine"
        >
          <span className="block whitespace-nowrap" aria-hidden="true">
            <Letters word="ERIC" delay={0.15} line={1} />
          </span>
          <span className="relative block whitespace-nowrap pl-[18%] sm:pl-[26%] md:max-lg:pl-[22%]" aria-hidden="true">
            <Letters word="KAINE" delay={0.32} line={2} />
            <motion.span
              className="inline-block"
              initial={reduce ? { opacity: 0 } : { scale: 0 }}
              animate={reduce ? { opacity: 1 } : { scale: 1 }}
              transition={{ duration: 0.7, delay: 1.05, ease: EASE.snap }}
            >
              <Period data-physics="period" data-physics-shape="circle" onClick={onPeriod} data-testid="hero-period" className="cursor-default" />
            </motion.span>
          </span>

          {/* avatar lives in the gap the indent leaves behind */}
          <motion.span
            className="absolute left-[1%] top-[53%] block w-[15%] sm:top-[51%] sm:w-[17.5%]"
            data-redact="avatar"
            style={{ rotate: srx, y: sry }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: EASE.outExpo }}
          >
            <img
              src={channel.avatar}
              alt="Eric Kaine’s channel avatar"
              referrerPolicy="no-referrer"
              data-physics="avatar"
              data-physics-shape="circle"
              className="aspect-square w-full rounded-full bg-paper object-cover ring-1 ring-line-2"
              draggable={false}
            />
          </motion.span>
        </motion.h1>

        <div className="mt-auto grid gap-10 pb-12 pt-16 sm:pb-8 sm:pt-12 md:grid-cols-12 md:items-end md:gap-6 md:pb-10">
          <motion.div
            className="md:col-span-6 lg:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE.outExpo }}
          >
            <p className="max-w-[34ch] text-pretty text-[17px] leading-[1.45] text-paper-2 sm:text-lg" data-physics="copy">
              A fan-made archive of Verity-mod experiments, live streams with Bleood and FL Studio sessions — collected in one place.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('latest')}
                className="group flex items-center gap-3 rounded-full bg-paper py-3.5 pl-6 pr-5 text-[15px] font-semibold text-ink transition-transform duration-300 hover:scale-[1.02]"
                data-physics="cta"
                data-testid="cta-latest"
              >
                Watch the latest
                <Icon name="arrow-down" size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('archive')}
                className="rounded-full border border-line-2 px-6 py-3.5 text-[15px] font-medium text-paper transition-colors duration-300 hover:border-paper/50"
                data-physics="cta"
              >
                Explore the archive
              </button>
            </div>
          </motion.div>

          <motion.p
            className="hidden font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-muted lg:col-span-3 lg:col-start-6 lg:block"
            data-physics="meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.1 }}
          >
            <span className="text-paper" data-redact="stat">{channel.subscribersLabel}</span> subscribers
            <br />
            <span className="text-paper" data-redact="stat">{channel.videoCount}</span> videos
            <br />
            <span className="text-paper" data-redact="stat">{channel.totalViews.toLocaleString('en-US')}</span> views
            <br />
            <span className="text-dim">As of Oct 10, 2026</span>
          </motion.p>

          <motion.a
            href="#latest"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('latest')
            }}
            className="group grid grid-cols-[132px_1fr] items-end gap-4 sm:grid-cols-[168px_1fr] md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-9"
            data-physics="latest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: EASE.outExpo }}
          >
            <Thumb video={latest} eager className="aspect-video w-full" alt="" />
            <span className="block">
              <span className="eyebrow block text-[10px]">Latest upload · {formatLength(latest.length)}</span>
              <span className="mt-1.5 block text-[15px] font-semibold leading-tight text-paper">
                <span className="link-sweep">{latest.title}</span>
              </span>
              <span className="mt-1 block font-mono text-[11px] text-muted">{formatDate(latest.published)}</span>
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  )
}
