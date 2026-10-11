import { useSyncExternalStore } from 'react'
import { Aborted } from '../animation/timeline'

/** Minimal observable value. */
export function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (v: T) => {
      value = v
      listeners.forEach((l) => l())
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
}

export type Store<T> = ReturnType<typeof createStore<T>>

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

/** The current instruction, shown under the HUD and announced politely. */
export const objective = createStore<string | null>(null)

export interface ChoiceOption {
  id: string
  label: string
  tone?: 'yellow' | 'plain'
}

/** Pending choice buttons. */
export const choices = createStore<{ options: ChoiceOption[]; resolve: (id: string) => void } | null>(null)

export function ask(options: ChoiceOption[], signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Aborted())
    const onAbort = () => {
      choices.set(null)
      reject(new Aborted())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    choices.set({
      options,
      resolve: (id) => {
        signal?.removeEventListener('abort', onAbort)
        choices.set(null)
        resolve(id)
      },
    })
  })
}
