/** One global pointer position, shared by every pair of eyes on the page. */

export const pointer = {
  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  /** True once a real pointer has moved; touch-only devices never set it. */
  moved: false,
  lastMove: 0,
  isTouch: false,
}

let installed = false
export function installPointer() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const update = (e: PointerEvent) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.moved = true
    pointer.lastMove = performance.now()
    pointer.isTouch = e.pointerType === 'touch'
  }
  window.addEventListener('pointermove', update, { passive: true })
  window.addEventListener('pointerdown', update, { passive: true })
}

export const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
