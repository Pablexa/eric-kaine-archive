import { useState } from 'react'
import { isLetterboxed, thumb, type Video } from '../../lib/content/channel'

/**
 * Real YouTube thumbnail, served from YouTube's own image CDN.
 * Falls back from maxres → hq if a size is missing, and crops hq letterboxing.
 */
export function Thumb({
  video,
  size = 'max',
  className = '',
  eager = false,
  alt,
}: {
  video: Video
  size?: 'max' | 'hq' | 'mq'
  className?: string
  eager?: boolean
  alt?: string
}) {
  const [fallback, setFallback] = useState(false)
  const effective = fallback ? 'hq' : size
  return (
    <div className={`thumb-frame ${className}`}>
      <img
        src={thumb(video, effective)}
        alt={alt ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={isLetterboxed(video, effective) ? 'is-letterboxed' : ''}
        onError={() => setFallback(true)}
        draggable={false}
      />
    </div>
  )
}
