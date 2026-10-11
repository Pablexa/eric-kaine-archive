import { useCallback, useRef } from 'react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { bubble } from '../../lib/experience/chat'
import { formatViews, type Video } from '../../lib/content/channel'

/**
 * Phase 2 — "the website reacts". Once Eric Kaineity has docked, it quietly
 * comments on what you hover and click. Throttled so it never nags. Still
 * calm here (Act I is the polished archive); the underground only leaks in
 * through the word choice.
 */

const HOVER_LINES = [
  'good choice. deep cut.',
  'you’re really scrolling, huh.',
  'i’d keep this one between us.',
  'please don’t share this one.',
  'he did say gatekeep.',
  'careful. that one could go mainstream.',
  'this one stays underground.',
  'real ones don’t repost.',
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
      bubble.show(kind === 'link' ? 'opening that. i’ll allow it. once. don’t tell the blogs.' : '…noted.', 2200)
      lastAt = now
      return
    }
    if (now - lastAt < 6500 || count > 7) return
    lastAt = now
    count++
    if (video && video.views > 10000) {
      bubble.show(`${formatViews(video.views)} views?? that’s basically mainstream.`)
      return
    }
    bubble.show(HOVER_LINES[cursor++ % HOVER_LINES.length])
  }, [])
}
