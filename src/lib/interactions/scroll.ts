import { easeInOutCubic, tween } from '../animation/timeline'

let lockCount = 0

export function lockScroll() {
  lockCount++
  document.documentElement.classList.add('is-locked')
}

export function unlockScroll(force = false) {
  lockCount = force ? 0 : Math.max(0, lockCount - 1)
  if (lockCount === 0) document.documentElement.classList.remove('is-locked')
}

/** Programmatic scroll that works while the page is locked. */
export async function scrollToY(y: number, ms = 700, signal?: AbortSignal) {
  const from = window.scrollY
  if (Math.abs(from - y) < 2 || ms <= 0) {
    window.scrollTo(0, y)
    return
  }
  await tween(ms, (t) => window.scrollTo(0, from + (y - from) * t), { ease: easeInOutCubic, signal })
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = el.getBoundingClientRect().top + window.scrollY - 24
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
}
