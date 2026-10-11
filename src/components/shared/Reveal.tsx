import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE } from '../../lib/animation/timeline'

/** Blur-fade-up on first entry into the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
  amount = 0.25,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'p' | 'span' | 'header'
  amount?: number
}) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : delay, ease: EASE.outExpo }}
    >
      {children}
    </Comp>
  )
}

/** Masked line reveal: text rises out of its own baseline. */
export function LineReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  // Observe the mask, not the line: the line starts clipped by the mask and
  // would never count as "in view" itself.
  return (
    <motion.span
      className={`block overflow-hidden pb-[0.06em] ${className ?? ''}`}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.span
        className="block"
        variants={{
          hidden: reduce ? { opacity: 0 } : { y: '105%' },
          shown: reduce ? { opacity: 1 } : { y: '0%' },
        }}
        transition={{ duration: reduce ? 0.2 : 0.9, delay, ease: EASE.outExpo }}
      >
        {children}
      </motion.span>
    </motion.span>
  )
}
