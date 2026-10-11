import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/animation/timeline'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/\\0123456789'

/**
 * Hyper-text scramble, adapted from the 21st.dev / Magic UI "Hyper Text"
 * idea: characters cycle through random glyphs and resolve left→right.
 * Re-runs whenever `text` changes.
 */
export function Scramble({ text, duration = 700, className }: { text: string; duration?: number; className?: string }) {
  const [out, setOut] = useState(text)
  const prev = useRef(text)

  useEffect(() => {
    if (prev.current === text) return
    prev.current = text
    if (prefersReducedMotion()) {
      setOut(text)
      return
    }
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const resolved = Math.floor(t * text.length)
      let s = ''
      for (let i = 0; i < text.length; i++) {
        if (i < resolved || text[i] === ' ') s += text[i]
        else s += GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setOut(s)
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [text, duration])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  )
}
