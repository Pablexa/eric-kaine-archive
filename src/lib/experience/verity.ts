import { animate, motionValue, type MotionValue } from 'motion/react'
import { Aborted, TIME, prefersReducedMotion } from '../animation/timeline'

/**
 * Imperative handle for the one Verity orb that exists on the page.
 * Scenes move her around; the <VerityOrb> component only renders.
 */

export type VerityMode = 'hidden' | 'docked' | 'free'
export type Costume = 'none' | 'bleoodity'

type Listener = () => void

interface MoveOptions {
  size?: number
  duration?: number
  ease?: readonly [number, number, number, number] | 'spring'
  signal?: AbortSignal
}

class VerityController {
  x: MotionValue<number> = motionValue(-200)
  y: MotionValue<number> = motionValue(-200)
  size: MotionValue<number> = motionValue(40)
  /** Extra visual scale (meltdown swell, pops). */
  scale: MotionValue<number> = motionValue(1)
  /** 0 → 1 glow intensity; the light she gives off in the dark. */
  glow: MotionValue<number> = motionValue(0.6)

  mode: VerityMode = 'hidden'
  costume: Costume = 'none'
  /** When true, the orb's element accepts pointer input (drag / click). */
  interactive = false
  label = 'Eric Kaineity, the archive guide'
  /** Scenes can take over what pressing / grabbing Verity does. */
  onPress: ((viaKeyboard: boolean) => void) | null = null
  onGrab: ((e: PointerEvent) => void) | null = null
  private listeners = new Set<Listener>()

  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  private snapshot = { mode: this.mode, interactive: this.interactive, costume: this.costume }
  getSnapshot = () => this.snapshot

  setMode(mode: VerityMode, interactive = this.interactive) {
    this.mode = mode
    this.interactive = interactive
    this.snapshot = { mode, interactive, costume: this.costume }
    this.listeners.forEach((l) => l())
  }

  setCostume(costume: Costume) {
    this.costume = costume
    this.snapshot = { mode: this.mode, interactive: this.interactive, costume }
    this.listeners.forEach((l) => l())
  }

  setInteractive(v: boolean) {
    this.setMode(this.mode, v)
  }

  jump(x: number, y: number, size?: number) {
    this.x.jump(x)
    this.y.jump(y)
    if (size) this.size.jump(size)
  }

  moveTo(x: number, y: number, { size, duration = 0.9, ease = [0.16, 1, 0.3, 1], signal }: MoveOptions = {}): Promise<void> {
    if (signal?.aborted) return Promise.reject(new Aborted())
    const reduce = prefersReducedMotion()
    const d = reduce ? 0 : duration * TIME.scale
    const opts =
      ease === 'spring' && TIME.scale === 1 && !reduce
        ? { type: 'spring' as const, stiffness: 140, damping: 16 }
        : { duration: d, ease: (ease === 'spring' ? [0.16, 1, 0.3, 1] : ease) as [number, number, number, number] }
    const anims = [animate(this.x, x, opts), animate(this.y, y, opts)]
    if (size !== undefined) anims.push(animate(this.size, size, opts))
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        anims.forEach((a) => a.stop())
        reject(new Aborted())
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      Promise.all(anims.map((a) => a.finished)).then(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      })
    })
  }

  dockPosition() {
    const small = window.innerWidth < 640
    const size = small ? 40 : 46
    const pad = small ? 18 : 28
    return { x: window.innerWidth - pad - size / 2, y: window.innerHeight - pad - size / 2, size }
  }

  centerPosition(size = Math.min(140, Math.max(96, window.innerWidth * 0.09))) {
    return { x: window.innerWidth / 2, y: Math.min(window.innerHeight * 0.36, 320), size }
  }

  dock(opts: MoveOptions = {}) {
    const d = this.dockPosition()
    this.setMode('docked', true)
    return this.moveTo(d.x, d.y, { size: d.size, ...opts })
  }
}

export const verity = new VerityController()
