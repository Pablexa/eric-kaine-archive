import { useCallback, useRef } from 'react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { bubble } from '../../lib/experience/chat'
import { formatViews, type Video } from '../../lib/content/channel'

/**
 * Phase 2 — "the website reacts". Once Verity has docked, she quietly
 * comments on what you hover and click. Throttled so it never nags.
 */

const HOVER_LINES = [
  'good choice.',
  'you’re really scrolling, huh.',
  'i’d keep this one between us.',
  'please don’t share this one.',
  'he did say gatekeep.',
  'careful. that’s content.',
]

let lastAt = 0
let count = 0
let cursor = 0

export function useGuideRemark() {
  const { state } = useExperience()
  const phaseRef = useRef(state.phase)
  phaseRef.current = state.phase

  return useCallback((kind: 'hover' | 'click' | 'link', video?: Video) => {
    if (phaseRef.current !== 'foreshadow') return
    const now = performance.now()
    if (kind === 'click' || kind === 'link') {
      bubble.show(kind === 'link' ? 'opening that. i’ll allow it. once.' : '…noted.', 2200)
      lastAt = now
      return
    }
    if (now - lastAt < 6500 || count > 7) return
    lastAt = now
    count++
    if (video && video.views > 10000) {
      bubble.show(`${formatViews(video.views)} views?? that’s basically famous.`)
      return
    }
    bubble.show(HOVER_LINES[cursor++ % HOVER_LINES.length])
  }, [])
}
