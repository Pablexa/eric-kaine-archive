import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Thumb } from './Thumb'
import { Icon } from '../shared/Icon'
import type { Video } from '../../lib/content/channel'
import { EASE } from '../../lib/animation/timeline'

/**
 * Click-to-load YouTube player. Nothing from YouTube's player loads until the
 * visitor asks for it (privacy-enhanced youtube-nocookie domain).
 */
export function LiteEmbed({ video, id }: { video: Video; id?: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="group relative aspect-video w-full overflow-hidden bg-ink-3" id={id}>
      <AnimatePresence initial={false}>
        {playing ? (
          <motion.iframe
            key="player"
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <motion.button
            key="poster"
            type="button"
            data-testid="featured-play"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full cursor-pointer text-left"
            aria-label={`Play “${video.title}”`}
            exit={{ opacity: 0 }}
          >
            <Thumb video={video} eager className="absolute inset-0 h-full w-full" alt="" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <span className="absolute bottom-5 left-5 flex items-center gap-3 sm:bottom-7 sm:left-7">
              <motion.span
                className="grid h-14 w-14 place-items-center rounded-full bg-paper text-ink sm:h-16 sm:w-16"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.25, ease: EASE.outExpo }}
              >
                <Icon name="play" size={22} />
              </motion.span>
              <span className="eyebrow text-paper/80">Play here</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
