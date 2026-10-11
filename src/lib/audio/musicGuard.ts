/**
 * At most one song is ever audible: inside this page (a song that starts
 * pauses any other) and across this site's tabs (the tab that starts or
 * returns to its music wins; the others pause until they are looked at again).
 * Without this, two open tabs play the same loop out of sync, and turning one
 * down from the live panel leaves the other one loud.
 */
const registered = new Set<HTMLMediaElement>()
const yieldedTo = new Set<HTMLMediaElement>()
const tabId = Math.random().toString(36).slice(2)
let channel: BroadcastChannel | null = null
try {
  channel = new BroadcastChannel('ek-archive-music')
} catch {
  /* no cross-tab channel: the in-page rule still applies */
}

/** Another tab took the music and this one has not been looked at since. */
let otherTabOwns = false

function claim(el: HTMLMediaElement) {
  if (document.hidden && otherTabOwns) {
    // a background tab moving to its next song stays quiet until it is looked at
    yieldedTo.add(el)
    el.pause()
    return
  }
  for (const other of registered) if (other !== el && !other.paused) other.pause()
  if (!document.hidden) {
    otherTabOwns = false
    channel?.postMessage({ t: 'claim', from: tabId })
  }
}

channel?.addEventListener('message', (e: MessageEvent<{ t?: string; from?: string }>) => {
  if (e.data?.t !== 'claim' || e.data.from === tabId) return
  otherTabOwns = true
  for (const m of registered) {
    if (m.paused) continue
    yieldedTo.add(m)
    m.pause()
  }
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden || !otherTabOwns) return
  otherTabOwns = false
  // back on this tab: its song resumes (and silences the other tab)
  const resume = [...yieldedTo].filter((m) => registered.has(m))
  yieldedTo.clear()
  if (resume.length) for (const m of resume) void m.play().catch(() => {})
})

/** Registers a song's element; returns the cleanup. */
export function guardMusic(el: HTMLMediaElement) {
  registered.add(el)
  const onPlay = () => claim(el)
  el.addEventListener('play', onPlay)
  if (!el.paused) claim(el)
  return () => {
    registered.delete(el)
    yieldedTo.delete(el)
    el.removeEventListener('play', onPlay)
  }
}
