import { useState } from 'react'
import { motion } from 'motion/react'
import { links } from '../../lib/content/channel'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { EASE } from '../../lib/animation/timeline'
import { Icon } from '../shared/Icon'
import { LineReveal, Reveal } from '../shared/Reveal'
import { Period } from '../shared/Period'
import { useGuideRemark } from '../troll/useGuideRemark'

export function Links() {
  const { reveal, state } = useExperience()
  const [copied, setCopied] = useState(false)
  const remark = useGuideRemark()

  const onShare = async () => {
    // Before the experience has been seen, sharing is… intercepted.
    if (!state.witnessed) {
      reveal('share')
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0])
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="links" className="relative scroll-mt-24 pb-16 pt-24 sm:pt-32" aria-labelledby="links-title">
      <div className="shell">
        <div className="border-t border-line pt-6 sm:pt-8">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted">05 — Links</p>
          <h2 id="links-title" className="display mt-6 text-[clamp(64px,13vw,210px)]" data-redact="heading">
            <LineReveal>Find</LineReveal>
            <LineReveal delay={0.08}>
              Eric<Period />
            </LineReveal>
          </h2>
        </div>

        <ul className="mt-14 border-t border-line" data-testid="links-list">
          {links.map((l, i) => (
            <Reveal as="li" key={l.id} delay={i * 0.04} y={16}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => remark('link')}
                className="group relative grid grid-cols-[1fr_auto] items-center gap-4 overflow-hidden border-b border-line py-5 sm:grid-cols-[64px_1fr_1fr_auto] sm:py-7"
                data-testid={`link-${l.id}`}
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-paper transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-y-100" />
                <span className="relative hidden font-mono text-[11px] text-muted transition-colors duration-300 group-hover:text-ink/60 sm:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative font-display text-[clamp(30px,4.6vw,64px)] font-bold leading-none tracking-[-0.035em] text-paper transition-[color,transform] duration-500 [font-stretch:108%] group-hover:translate-x-3 group-hover:text-ink">
                  {l.label}
                </span>
                <span className="relative hidden font-mono text-[12px] uppercase tracking-[0.12em] text-muted transition-colors duration-300 group-hover:text-ink/70 sm:block" data-redact="handle">
                  {l.handle}
                </span>
                <Icon name="arrow-up-right" size={28} className="relative text-paper transition-[color,transform] duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink" />
              </a>
            </Reveal>
          ))}
        </ul>

        <div className="mt-16 grid gap-8 sm:mt-24 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            <p className="max-w-[40ch] font-serif text-[clamp(26px,2.6vw,36px)] italic leading-[1.1] text-paper">
              Know someone who would like this archive?
            </p>
          </Reveal>
          <Reveal className="flex items-start md:col-span-6 md:justify-end" delay={0.1}>
            <motion.button
              type="button"
              onClick={onShare}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE.outExpo }}
              className="group flex items-center gap-3 rounded-full border border-line-2 py-4 pl-6 pr-5 text-[15px] font-semibold text-paper transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-ink"
              data-testid="share"
            >
              {copied ? 'Link copied — Verity has been notified' : 'Share the archive'}
              <Icon name="link" size={16} />
            </motion.button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
