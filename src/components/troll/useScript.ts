import { useEffect } from 'react'
import { isAborted } from '../../lib/animation/timeline'

/**
 * Run an async scene script for as long as the component is mounted.
 * Unmounting (scene change, leave, replay) aborts every pending step.
 *
 * The script starts on the next microtask so that a mount that is immediately
 * undone (React StrictMode's double-invoke) never runs at all.
 */
export function useScript(script: (signal: AbortSignal) => Promise<void>, deps: unknown[] = []) {
  useEffect(() => {
    const ac = new AbortController()
    void Promise.resolve().then(() => {
      if (ac.signal.aborted) return
      script(ac.signal).catch((e) => {
        if (!isAborted(e)) console.error(e)
      })
    })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
