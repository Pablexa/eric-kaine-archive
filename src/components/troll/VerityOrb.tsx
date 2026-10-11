import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useTransform } from 'motion/react'
import { verity } from '../../lib/experience/verity'
import { bubble } from '../../lib/experience/chat'
import { useExperience } from '../../lib/experience/ExperienceContext'
import type { Mood } from '../../lib/experience/machine'
import { EASE } from '../../lib/animation/timeline'
import { characterMedia } from '../../lib/assets/realMedia'

/** Bleoodity's violet dreads, sprouting around the photo (viewBox 0 0 100 100). */
const DREADS = [
  { d: 'M50 4 C 47 -8, 52 -14, 49 -22', c: '#b44bff' },
  { d: 'M36 8 C 26 -2, 28 -10, 20 -16', c: '#d08cff' },
  { d: 'M64 8 C 74 -2, 72 -10, 80 -16', c: '#9b30ff' },
  { d: 'M22 18 C 6 16, 2 30, -6 36', c: '#7a1fd6' },
  { d: 'M78 18 C 94 16, 98 30, 106 36', c: '#d08cff' },
  { d: 'M12 34 C -2 44, 2 62, -8 74', c: '#b44bff' },
  { d: 'M88 34 C 102 44, 98 62, 108 74', c: '#7a1fd6' },
  { d: 'M6 52 C -4 66, 4 82, -2 96', c: '#e0b3ff' },
  { d: 'M94 52 C 104 66, 96 82, 102 96', c: '#b44bff' },
  { d: 'M28 10 C 16 8, 10 18, 4 22', c: '#e0b3ff' },
  { d: 'M72 10 C 84 8, 90 18, 96 22', c: '#9b30ff' },
]

/** Mood is shown on the real photo itself: no drawn face. */
const MOOD_FILTER: Record<Mood, string> = {
  calm: 'none',
  tiny: 'none',
  annoyed: 'saturate(1.4) contrast(1.1)',
  angry: 'saturate(2) contrast(1.3) hue-rotate(-12deg)',
  meltdown: 'saturate(2.6) contrast(1.5) hue-rotate(-38deg)',
  unhinged: 'saturate(3) contrast(1.6) brightness(1.15)',
}

export function VerityOrb() {
  const { state, reveal } = useExperience()
  const snap = useSyncExternalStore(verity.subscribe, verity.getSnapshot, verity.getSnapshot)
  const bubbleText = useSyncExternalStore(bubble.subscribe, bubble.getSnapshot, bubble.getSnapshot)
  const rootRef = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)
  const mood = state.mood
  const docked = snap.mode === 'docked'

  const left = useTransform(() => verity.x.get() - verity.size.get() / 2)
  const top = useTransform(() => verity.y.get() - verity.size.get() / 2)
  const glowSize = useTransform(verity.size, (s) => s * 3.2)
  const glowHalf = useTransform(glowSize, (s) => -s / 2)
  const glowOpacity = useTransform(verity.glow, (g) => g)
  const sizePx = useMotionTemplate`${verity.size}px`

  // keep the docked orb in the corner on resize
  useEffect(() => {
    const onResize = () => {
      if (verity.mode === 'docked') {
        const d = verity.dockPosition()
        verity.jump(d.x, d.y, d.size)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (snap.mode === 'hidden') return null

  const isFore = state.phase === 'foreshadow'
  const shaking = mood === 'meltdown'
  const bleoodity = snap.costume === 'bleoodity'

  return (
    <motion.button
      ref={rootRef}
      type="button"
      tabIndex={snap.interactive ? 0 : -1}
      aria-hidden={snap.interactive ? undefined : true}
      aria-label={isFore ? 'Eric Kaineity, the archive guide. Ask for help.' : verity.label}
      onClick={(e) => {
        if (verity.onPress) verity.onPress(e.detail === 0)
        else if (isFore) reveal('orb')
      }}
      onPointerDown={(e) => verity.onGrab?.(e.nativeEvent)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`fixed left-0 top-0 z-[46] block touch-none select-none rounded-full outline-offset-4 ${snap.interactive ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{ x: left, y: top, width: sizePx, height: sizePx, scale: verity.scale }}
      data-testid="verity"
      data-mood={mood}
      data-mode={snap.mode}
    >
      {/* the light she gives off */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          x: glowHalf,
          y: glowHalf,
          opacity: glowOpacity,
          background: `radial-gradient(circle, ${mood === 'meltdown' ? 'rgb(255 90 42 / 0.45)' : bleoodity ? 'rgb(180 75 255 / 0.42)' : 'rgb(255 210 31 / 0.38)'} 0%, transparent 62%)`,
        }}
      />
      <motion.div
        className="relative block h-full w-full"
        animate={shaking ? { x: [0, -1.5, 1.5, -1, 1, 0] } : { x: 0, y: [0, -3, 0] }}
        transition={shaking ? { duration: 0.18, repeat: Infinity } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {bleoodity ? (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-testid="bleoodity-dreads">
            <g className="origin-center animate-[dread-sway_1.6s_ease-in-out_infinite_alternate] motion-reduce:animate-none">
              {DREADS.map((dr, i) => (
                <motion.path
                  key={i}
                  d={dr.d}
                  stroke={dr.c}
                  strokeWidth="9"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease: EASE.outExpo }}
                />
              ))}
            </g>
          </svg>
        ) : null}
        <img
          src={bleoodity ? characterMedia.bleoodity.src : characterMedia.kaineity.src}
          alt=""
          draggable={false}
          data-testid="guide-photo"
          data-character={bleoodity ? 'bleoodity' : 'kaineity'}
          className={`relative block h-full w-full rounded-full border-[3px] object-cover ${bleoodity ? 'border-[#b44bff] shadow-[0_0_0_2px_#160021]' : 'border-[#ffd21f] shadow-[0_0_0_2px_#1a1400]'}`}
          style={{ filter: MOOD_FILTER[mood], transition: 'filter 300ms' }}
        />
      </motion.div>

      {/* foreshadow: the guide chip + remarks */}
      <AnimatePresence>
        {docked && isFore && (bubbleText || hovered) ? (
          <motion.span
            key={bubbleText ?? 'label'}
            role="status"
            className="pointer-events-none absolute bottom-[calc(100%+10px)] right-0 w-max max-w-[240px] rounded-[14px] rounded-br-[4px] bg-paper px-3.5 py-2 text-left font-mono text-[12px] leading-snug text-ink shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE.outExpo }}
          >
            {bubbleText ?? (
              <>
                <span className="font-semibold">Eric Kaineity</span> · archive guide
                <br />
                <span className="text-ink/60">click for help</span>
              </>
            )}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  )
}
