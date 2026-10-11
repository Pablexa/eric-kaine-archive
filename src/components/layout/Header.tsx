import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { CHAOS_SCENES, isTrollActive, PROTOCOLS } from '../../lib/experience/machine'
import { useStore } from '../../lib/experience/store'
import { hudHidden, subsOverride } from '../../lib/experience/stage'
import { channel } from '../../lib/content/channel'
import { EASE } from '../../lib/animation/timeline'
import { scrollToSection } from '../../lib/interactions/scroll'
import { sfx } from '../../lib/audio/sfx'
import { Icon } from '../shared/Icon'
import { Period } from '../shared/Period'
import { Scramble } from '../effects/Scramble'
import { useSfxState } from '../shared/useSfx'
import { MobileMenu } from './MobileMenu'

export const NAV = [
  { id: 'latest', label: 'Latest' },
  { id: 'streams', label: 'Streams' },
  { id: 'about', label: 'About' },
  { id: 'archive', label: 'Archive' },
  { id: 'links', label: 'Links' },
] as const

function useActiveSection() {
  const [active, setActive] = useState<string>('')
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
    const seen = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0))
        let best = ''
        let bestRatio = 0
        seen.forEach((r, id) => {
          if (r > bestRatio) {
            best = id
            bestRatio = r
          }
        })
        setActive(bestRatio > 0 ? best : '')
      },
      { threshold: [0, 0.15, 0.35, 0.6], rootMargin: '-35% 0px -45% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

export function Header() {
  const { state } = useExperience()
  const troll = isTrollActive(state)
  const reduce = useReducedMotion()
  const hud = troll && state.scene !== 'ending'
  const hazard = hud && state.scene !== 'intro' && state.scene !== 'redact'
  const hidden = useStore(hudHidden)

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 transition-opacity duration-300 sm:pt-4 ${hidden ? 'invisible opacity-0' : ''}`}
      data-testid="site-header"
      data-mode={hud ? 'hud' : 'nav'}
    >
      <div className="shell">
        <motion.div
          layout={!reduce}
          transition={{ duration: 0.6, ease: EASE.outExpo }}
          className={`pointer-events-auto relative flex h-14 items-center justify-between gap-3 overflow-hidden border px-2 pl-4 backdrop-blur-xl transition-colors duration-500 sm:h-[60px] sm:pl-5 ${
            hazard
              ? 'rounded-none border-verity/70 bg-hazard/90'
              : hud
                ? 'rounded-none border-verity/40 bg-ink/80'
                : 'rounded-full border-line bg-ink/55'
          }`}
        >
          {hazard ? (
            <motion.span
              aria-hidden="true"
              className="hazard absolute inset-y-0 left-0 w-2"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: EASE.outExpo }}
            />
          ) : null}
          <AnimatePresence mode="wait" initial={false}>
            {hud ? <HudContent key="hud" hazard={hazard} /> : <NavContent key="nav" />}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  )
}

function NavContent() {
  const active = useActiveSection()
  const [menu, setMenu] = useState(false)
  return (
    <motion.div
      className="flex w-full items-center justify-between gap-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: EASE.outExpo }}
    >
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className="flex items-baseline font-display text-[19px] font-extrabold tracking-[-0.04em] [font-stretch:115%]"
        aria-label="Eric Kaine archive, back to top"
      >
        EK<Period />
        <span className="ml-3 hidden font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-muted lg:inline">Fan archive</span>
      </a>

      <nav aria-label="Sections" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(n.id)
                }}
                aria-current={active === n.id ? 'true' : undefined}
                className={`relative block rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.005em] transition-colors duration-200 ${
                  active === n.id ? 'text-ink' : 'text-paper-2 hover:text-paper'
                }`}
              >
                {active === n.id ? (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                ) : null}
                <span className="relative">{n.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <a
          href={channel.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-full bg-signal px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-signal-2"
          data-testid="header-youtube"
        >
          YouTube <Icon name="arrow-up-right" size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-line-2 text-paper md:hidden"
          aria-label="Open menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
          data-testid="menu-button"
        >
          <Icon name="menu" />
        </button>
      </div>
      <MobileMenu open={menu} onClose={() => setMenu(false)} active={active} />
    </motion.div>
  )
}

function HudContent({ hazard }: { hazard: boolean }) {
  const { state, leave } = useExperience()
  const snd = useSfxState()
  const override = useStore(subsOverride)
  const redact = state.scene === 'redact'
  const current = PROTOCOLS.findIndex((p) => p.scene === state.scene)
  const label = state.scene === 'intro' ? 'ARCHIVE GUIDE' : redact ? 'OPERATION GATEKEEP' : 'GATEKEEPER PROTOCOL'
  const subs = override ?? (state.plusSubs ? `1.5K+${state.plusSubs}` : '1.5K')

  return (
    <motion.div
      className="flex w-full items-center justify-between gap-3 pl-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: EASE.outExpo }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={`pixel truncate text-[15px] sm:text-[17px] ${hazard ? 'text-verity' : 'text-verity/90'}`}>
          <span className="sm:hidden">{state.scene === 'intro' ? 'GUIDE' : redact ? 'GATEKEEP' : 'PROTOCOL'}</span>
          <Scramble text={label} className="hidden sm:inline" />
        </span>
        {hazard && current >= 0 ? (
          <span className="pixel text-[13px] text-pixel/60 xl:hidden">
            {PROTOCOLS[current].index}/{String(PROTOCOLS.length).padStart(2, '0')}
          </span>
        ) : null}
      </div>

      {hazard ? (
        <ol className="hidden items-center gap-0.5 xl:flex" aria-label="Protocol progress">
          {PROTOCOLS.map((p, i) => (
            <li
              key={p.scene}
              aria-current={i === current ? 'step' : undefined}
              className={`pixel px-1.5 py-1 text-[14px] ${
                i === current ? 'bg-verity text-hazard' : i < current || state.scene === 'twist' ? 'text-pixel/40 line-through' : 'text-pixel/60'
              }`}
              title={p.label}
            >
              {p.index}
              {i === current ? ` ${p.label}` : ''}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="flex items-center gap-1.5 sm:gap-2">
        <dl className="hidden items-center gap-4 pr-2 sm:flex" aria-label="Fame telemetry">
          <div className="flex items-baseline gap-1.5">
            <dt className="pixel text-[12px] text-pixel/50">SUBS</dt>
            <dd className={`pixel text-[16px] tabular-nums ${state.plusSubs ? 'text-alarm' : 'text-pixel'}`} data-testid="hud-subs">
              <Scramble text={subs} duration={500} />
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="pixel text-[12px] text-pixel/50">VIEWS</dt>
            <dd className="pixel text-[16px] tabular-nums text-pixel" data-testid="hud-views">
              {state.views.toLocaleString('en-US')}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => sfx.toggle()}
          className="pixel flex h-10 items-center gap-1.5 border border-pixel/20 px-2.5 text-[14px] text-pixel hover:border-verity"
          aria-pressed={snd.enabled}
          aria-label={snd.enabled ? 'Mute sound' : 'Turn sound on'}
          data-testid="sound-toggle"
        >
          <Icon name={snd.enabled ? 'sound-on' : 'sound-off'} size={16} />
          <span className="hidden sm:inline">{snd.enabled ? 'ON' : 'OFF'}</span>
        </button>
        {snd.enabled ? (
          <label className="hidden items-center xl:flex">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={snd.volume}
              onChange={(e) => sfx.setVolume(Number(e.target.value))}
              className="w-20 accent-[var(--color-verity)]"
              data-testid="volume"
            />
          </label>
        ) : null}
        <LeaveButton chaotic={!!state.scene && CHAOS_SCENES.includes(state.scene)} onLeave={() => void leave()} />
      </div>
    </motion.div>
  )
}

/**
 * During Act III the first press of LEAVE is… processed. It still leaves,
 * just after a fake progress bar. (Esc always leaves instantly.)
 */
let leaveTrolled = false
function LeaveButton({ chaotic, onLeave }: { chaotic: boolean; onLeave: () => void }) {
  const [label, setLabel] = useState<string | null>(null)
  const go = () => {
    if (label) return
    if (!chaotic || leaveTrolled) return onLeave()
    leaveTrolled = true
    const frames = ['LEAVING.', 'LEAVING..', 'LEAVING...', '12%', '58%', '99%', '99%', '99%', 'jk', 'ok bye']
    frames.forEach((f, i) => window.setTimeout(() => setLabel(f), i * 230))
    window.setTimeout(() => {
      setLabel(null)
      onLeave()
    }, frames.length * 230 + 150)
  }
  return (
    <button
      type="button"
      onClick={go}
      className="pixel flex h-10 min-w-[86px] items-center justify-center gap-1.5 bg-pixel px-3 text-[14px] text-hazard hover:bg-verity"
      data-testid="leave"
    >
      <Icon name="close" size={14} />
      <span>{label ?? 'LEAVE'}</span>
    </button>
  )
}
