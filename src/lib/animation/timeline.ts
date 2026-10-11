/**
 * Small cancelable-sequence primitives. Every scripted scene runs inside one
 * AbortController; leaving, replaying or unmounting aborts the whole script, so
 * no stray timeout can fire into a scene that no longer exists.
 */

export class Aborted extends Error {
  constructor() {
    super('aborted')
    this.name = 'Aborted'
  }
}

export const isAborted = (e: unknown) => e instanceof Aborted || (e instanceof DOMException && e.name === 'AbortError')

/**
 * Global pacing. `?fast=1` compresses every scripted beat (used by the
 * automated tests); real visitors always get 1.
 */
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
export const TIME = {
  scale: params.has('fast') ? 0.08 : 1,
  /** Test hook: `?fast=1&drain=1` empties the flashlight battery quickly. */
  drain: params.has('fast') && params.has('drain') ? 14 : 1,
  /** Test hook: `?fast=1&media=1` keeps the real YouTube players in fast runs. */
  media: params.has('media'),
  /** Test hook: `?fast=1&voice=1` keeps character voices in fast runs. */
  voice: params.has('voice'),
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  ms *= TIME.scale
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Aborted())
    const t = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(t)
      reject(new Aborted())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Resolve when `register` calls back, or reject on abort. */
export function waitFor<T>(register: (done: (v: T) => void) => () => void, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) return reject(new Aborted())
    let cleanup = () => {}
    const onAbort = () => {
      cleanup()
      reject(new Aborted())
    }
    cleanup = register((v) => {
      signal?.removeEventListener('abort', onAbort)
      cleanup()
      resolve(v)
    })
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** rAF loop that stops itself on abort. Return false from `tick` to stop. */
export function loop(tick: (dt: number, t: number) => boolean | void, signal?: AbortSignal) {
  let raf = 0
  let last = performance.now()
  const frame = (now: number) => {
    if (signal?.aborted) return
    const dt = Math.min(64, now - last)
    last = now
    if (tick(dt, now) === false) return
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  const stop = () => cancelAnimationFrame(raf)
  signal?.addEventListener('abort', stop, { once: true })
  return stop
}

/** Animate a 0→1 progress value with an easing; resolves on completion. */
export function tween(
  ms: number,
  onUpdate: (p: number) => void,
  { ease = easeOutExpo, signal }: { ease?: (t: number) => number; signal?: AbortSignal } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Aborted())
    if (ms <= 0) {
      onUpdate(1)
      return resolve()
    }
    const start = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(new Aborted())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      onUpdate(ease(t))
      if (t < 1) raf = requestAnimationFrame(frame)
      else {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }
    }
    raf = requestAnimationFrame(frame)
  })
}

export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
export const easeInCubic = (t: number) => t * t * t

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Motion tokens (mirrors DESIGN_SYSTEM.md). */
export const DUR = {
  hover: 0.2,
  state: 0.3,
  reveal: 0.75,
  cinematic: 1.1,
} as const

export const EASE = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  inOutCine: [0.65, 0, 0.35, 1] as const,
  snap: [0.34, 1.56, 0.64, 1] as const,
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
