import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useTransform } from 'motion/react'
import { verity } from '../../lib/experience/verity'
import { bubble } from '../../lib/experience/chat'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { pointer } from '../../lib/interactions/pointer'
import type { Mood } from '../../lib/experience/machine'
import { EASE } from '../../lib/animation/timeline'

const SKIN: Record<Mood, [string, string, string]> = {
  calm: ['#fff6c2', '#ffd21f', '#d99a00'],
  tiny: ['#fff6c2', '#ffd21f', '#d99a00'],
  annoyed: ['#fff0a0', '#ffc61a', '#cf8a00'],
  angry: ['#ffe08a', '#ffa51f', '#d85a00'],
  meltdown: ['#ffd0b0', '#ff5a2a', '#b3200f'],
  unhinged: ['#fffbe0', '#ffe14d', '#e09a00'],
}

const MOUTH: Record<Mood, string> = {
  calm: 'M41 67 Q50 73 59 67',
  tiny: 'M41 66 Q50 74 59 66',
  annoyed: 'M42 68 L58 68',
  angry: 'M41 71 Q50 63 59 71',
  meltdown: 'M44 66 Q50 58 56 66 Q50 76 44 66 Z',
  unhinged: 'M30 60 Q50 86 70 60 Z',
}

/** Bleoodity: Verity after Eric gave her Bleood's dreads on stream. */
const DREADS = [
  { d: 'M50 4 C 47 -8, 52 -14, 49 -22', c: '#ff3fbf' },
  { d: 'M36 8 C 26 -2, 28 -10, 20 -16', c: '#ff5ad1' },
  { d: 'M64 8 C 74 -2, 72 -10, 80 -16', c: '#ff3fbf' },
  { d: 'M22 18 C 6 16, 2 30, -6 36', c: '#c53cff' },
  { d: 'M78 18 C 94 16, 98 30, 106 36', c: '#ff5ad1' },
  { d: 'M12 34 C -2 44, 2 62, -8 74', c: '#ff3fbf' },
  { d: 'M88 34 C 102 44, 98 62, 108 74', c: '#c53cff' },
  { d: 'M6 52 C -4 66, 4 82, -2 96', c: '#26d0ce' },
  { d: 'M94 52 C 104 66, 96 82, 102 96', c: '#ff3fbf' },
  { d: 'M28 10 C 16 8, 10 18, 4 22', c: '#26d0ce' },
  { d: 'M72 10 C 84 8, 90 18, 96 22', c: '#ff5ad1' },
]

export function VerityOrb() {
  const { state, reveal } = useExperience()
  const snap = useSyncExternalStore(verity.subscribe, verity.getSnapshot, verity.getSnapshot)
  const bubbleText = useSyncExternalStore(bubble.subscribe, bubble.getSnapshot, bubble.getSnapshot)
  const eyesRef = useRef<SVGGElement>(null)
  const rootRef = useRef<HTMLButtonElement>(null)
  const [blink, setBlink] = useState(false)
  const [hovered, setHovered] = useState(false)
  const mood = state.mood
  const docked = snap.mode === 'docked'

  const left = useTransform(() => verity.x.get() - verity.size.get() / 2)
  const top = useTransform(() => verity.y.get() - verity.size.get() / 2)
  const glowSize = useTransform(verity.size, (s) => s * 3.2)
  const glowHalf = useTransform(glowSize, (s) => -s / 2)
  const glowOpacity = useTransform(verity.glow, (g) => g)
  const sizePx = useMotionTemplate`${verity.size}px`

  // eyes follow the pointer
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = rootRef.current
      const eyes = eyesRef.current
      if (el && eyes) {
        const cx = verity.x.get()
        const cy = verity.y.get()
        const dx = pointer.x - cx
        const dy = pointer.y - cy
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 160) * 7
        eyes.setAttribute('transform', `translate(${((dx / d) * k).toFixed(2)} ${((dy / d) * k * 0.8).toFixed(2)})`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // blink every few seconds
  useEffect(() => {
    let t = 0
    const schedule = () => {
      t = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 140)
        schedule()
      }, 2400 + Math.random() * 3200)
    }
    schedule()
    return () => window.clearTimeout(t)
  }, [])

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

  const [hi, mid, lo] = SKIN[mood]
  const isFore = state.phase === 'foreshadow'
  const shaking = mood === 'meltdown'

  return (
    <motion.button
      ref={rootRef}
      type="button"
      tabIndex={snap.interactive ? 0 : -1}
      aria-hidden={snap.interactive ? undefined : true}
      aria-label={isFore ? 'Verity, the archive guide. Ask for help.' : verity.label}
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
          background: `radial-gradient(circle, ${mood === 'meltdown' ? 'rgb(255 90 42 / 0.45)' : 'rgb(255 210 31 / 0.38)'} 0%, transparent 62%)`,
        }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="relative block h-full w-full overflow-visible"
        animate={shaking ? { x: [0, -1.5, 1.5, -1, 1, 0] } : { x: 0, y: [0, -3, 0] }}
        transition={shaking ? { duration: 0.18, repeat: Infinity } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <radialGradient id="verity-skin" cx="36%" cy="30%" r="72%">
            <stop offset="0" stopColor={hi} />
            <stop offset="0.48" stopColor={mid} />
            <stop offset="1" stopColor={lo} />
          </radialGradient>
        </defs>
        {snap.costume === 'bleoodity' ? (
          <g className="origin-center animate-[dread-sway_1.6s_ease-in-out_infinite_alternate]">
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
        ) : null}
        <circle cx="50" cy="50" r="48" fill="url(#verity-skin)" />
        <ellipse cx="34" cy="27" rx="12" ry="7" fill="#fff" opacity="0.55" transform="rotate(-24 34 27)" />
        <g ref={eyesRef}>
          <g style={{ transform: blink ? 'scaleY(0.1)' : 'scaleY(1)', transformOrigin: '50px 46px', transition: 'transform 90ms' }}>
            {mood === 'unhinged' ? (
              <>
                <circle cx="35" cy="42" r="12" fill="#fff" stroke="#1a1400" strokeWidth="2.5" />
                <circle cx="65" cy="42" r="12" fill="#fff" stroke="#1a1400" strokeWidth="2.5" />
                <circle cx="35" cy="42" r="3" fill="#1a1400" />
                <circle cx="65" cy="42" r="3" fill="#1a1400" />
              </>
            ) : (
              <>
                <ellipse cx="38" cy="46" rx={mood === 'meltdown' ? 3.5 : 5} ry={mood === 'meltdown' ? 3.5 : 8} fill="#1a1400" />
                <ellipse cx="62" cy="46" rx={mood === 'meltdown' ? 3.5 : 5} ry={mood === 'meltdown' ? 3.5 : 8} fill="#1a1400" />
              </>
            )}
          </g>
          {mood === 'annoyed' ? (
            <>
              <rect x="30" y="35" width="17" height="9" fill={mid} />
              <rect x="53" y="35" width="17" height="9" fill={mid} />
            </>
          ) : null}
          {mood === 'angry' ? (
            <>
              <rect x="28" y="33" width="20" height="10" fill={mid} transform="rotate(18 38 38)" />
              <rect x="52" y="33" width="20" height="10" fill={mid} transform="rotate(-18 62 38)" />
            </>
          ) : null}
        </g>
        <path d={MOUTH[mood]} fill={mood === 'meltdown' || mood === 'unhinged' ? '#1a1400' : 'none'} stroke="#1a1400" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        {mood === 'unhinged' ? <path d="M36 64 L64 64 L62 69 L38 69 Z" fill="#fff" /> : null}
      </motion.svg>

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
                <span className="font-semibold">Verity</span> · archive guide
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
