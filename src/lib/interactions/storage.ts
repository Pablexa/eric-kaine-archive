import type { EndingId } from '../experience/machine'

/** Per-visitor conveniences only. Everything degrades gracefully without storage. */

const ENDINGS_KEY = 'ek-archive:endings'

export function readEndings(): EndingId[] {
  try {
    const raw = localStorage.getItem(ENDINGS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === 'string') as EndingId[]) : []
  } catch {
    return []
  }
}

export function recordEnding(id: EndingId): EndingId[] {
  const set = new Set(readEndings())
  set.add(id)
  const list = [...set]
  try {
    localStorage.setItem(ENDINGS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  return list
}

export function clearEndings() {
  try {
    localStorage.removeItem(ENDINGS_KEY)
  } catch {
    /* ignore */
  }
}
