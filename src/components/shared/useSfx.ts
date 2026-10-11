import { useSyncExternalStore } from 'react'
import { sfx } from '../../lib/audio/sfx'

let snap = { enabled: sfx.enabled, volume: sfx.volume, asked: sfx.asked, duck: sfx.duck }
sfx.subscribe(() => {
  snap = { enabled: sfx.enabled, volume: sfx.volume, asked: sfx.asked, duck: sfx.duck }
})

export function useSfxState() {
  return useSyncExternalStore(
    (fn) => sfx.subscribe(fn),
    () => snap,
    () => snap,
  )
}
