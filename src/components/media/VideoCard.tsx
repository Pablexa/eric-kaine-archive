import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { Thumb } from './Thumb'
import { Icon } from '../shared/Icon'
import { formatDate, formatLength, formatViews, watchUrl, type Video } from '../../lib/content/channel'
import { useGuideRemark } from '../troll/useGuideRemark'

/**
 * Editorial video card. The image drifts with the pointer inside its mask,
 * and a small "Watch" tag follows the cursor across the frame.
 */
export function VideoCard({
  video,
  aspect = 'aspect-video',
  titleClass = 'text-xl sm:text-2xl',
  meta = true,
  index,
}: {
  video: Video
  aspect?: string
  titleClass?: string
  meta?: boolean
  index?: string
}) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 160, damping: 22, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 160, damping: 22, mass: 0.4 })
  const tagX = useMotionValue(0)
  const tagY = useMotionValue(0)
  const remark = useGuideRemark()

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    mx.set(px * -14)
    my.set(py * -10)
    tagX.set(e.clientX - r.left)
    tagY.set(e.clientY - r.top)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.a
      href={watchUrl(video.id, video.kind)}
      target="_blank"
      rel="noreferrer"
      className="group relative block outline-none"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerEnter={() => remark('hover', video)}
      onClick={() => remark('click', video)}
      data-testid="video-card"
      data-video-id={video.id}
    >
      <div className={`relative overflow-hidden ${aspect}`} data-redact="video">
        <motion.div className="absolute inset-[-12px]" style={{ x: sx, y: sy }}>
          <Thumb video={video} className="absolute inset-0 h-full w-full" alt="" />
        </motion.div>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-40" />
        {video.length ? (
          <span className="absolute bottom-3 right-3 bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-paper backdrop-blur-sm">
            {formatLength(video.length)}
          </span>
        ) : null}
        {index ? <span className="absolute left-3 top-3 font-mono text-[11px] text-paper/80">{index}</span> : null}
        <motion.span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 hidden md:block" style={{ x: tagX, y: tagY }}>
          <span className="flex -translate-x-1/2 -translate-y-[130%] items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Watch <Icon name="arrow-up-right" size={12} />
          </span>
        </motion.span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-6">
        <h3 className={`font-display font-semibold leading-[1.08] tracking-[-0.02em] text-paper [font-stretch:100%] ${titleClass}`}>
          <span className="link-sweep">{video.title}</span>
        </h3>
      </div>
      {meta ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {formatDate(video.published)}
          {video.views ? <> · {formatViews(video.views)} views</> : null}
          {video.kind === 'stream' ? <> · Stream</> : null}
        </p>
      ) : null}
    </motion.a>
  )
}
