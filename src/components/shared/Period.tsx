import { forwardRef, useEffect, useRef, type HTMLAttributes } from 'react'
import { pointer } from '../../lib/interactions/pointer'
import { useExperience } from '../../lib/experience/ExperienceContext'

/**
 * The recurring yellow period. In Act I it is only typography.
 * After any ending has been reached, every period grows eyes and watches you.
 */
export const Period = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(function Period({ className, ...rest }, ref) {
  const { state } = useExperience()
  return (
    <span ref={ref} className={`period ${className ?? ''}`} aria-hidden="true" {...rest}>
      {state.witnessed ? <PeriodEyes /> : null}
    </span>
  )
})

function PeriodEyes() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const r = el.getBoundingClientRect()
        // only bother when on screen
        if (r.bottom > 0 && r.top < window.innerHeight) {
          const dx = pointer.x - (r.left + r.width / 2)
          const dy = pointer.y - (r.top + r.height / 2)
          const d = Math.hypot(dx, dy) || 1
          const k = Math.min(1, d / 200) * 0.045
          el.style.transform = `translate(${(dx / d) * k}em, ${(dy / d) * k}em)`
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <span ref={ref} className="absolute inset-0 flex items-center justify-center gap-[0.035em]">
      <span className="block h-[0.07em] w-[0.034em] rounded-full bg-[#1a1400]" />
      <span className="block h-[0.07em] w-[0.034em] rounded-full bg-[#1a1400]" />
    </span>
  )
}
