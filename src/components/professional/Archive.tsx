import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { formatDate, formatLength, formatViews, thumb, videos, watchUrl, type Video, type VideoKind } from '../../lib/content/channel'
import { EASE } from '../../lib/animation/timeline'
import { Reveal } from '../shared/Reveal'
import { SectionHeading } from '../shared/SectionHeading'
import { Icon } from '../shared/Icon'
import { useGuideRemark } from '../troll/useGuideRemark'

type Filter = 'all' | VideoKind

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'video', label: 'Videos' },
  { id: 'stream', label: 'Streams' },
  { id: 'short', label: 'Shorts' },
]

const KIND_LABEL: Record<VideoKind, string> = { video: 'Video', stream: 'Stream', short: 'Short' }

const sorted = [...videos].sort((a, b) => +new Date(b.published) - +new Date(a.published))

export function Archive() {
  const [filter, setFilter] = useState<Filter>('all')
  const [hover, setHover] = useState<Video | null>(null)
  const reduce = useReducedMotion()
  const remark = useGuideRemark()
  const list = useMemo(() => (filter === 'all' ? sorted : sorted.filter((v) => v.kind === filter)), [filter])
  const counts = useMemo(
    () => ({
      all: videos.length,
      video: videos.filter((v) => v.kind === 'video').length,
      stream: videos.filter((v) => v.kind === 'stream').length,
      short: videos.filter((v) => v.kind === 'short').length,
    }),
    [],
  )

  // the pointer can stay still while the page scrolls out from under it
  useEffect(() => {
    if (!hover) return
    const hide = () => setHover(null)
    window.addEventListener('scroll', hide, { passive: true, once: true })
    return () => window.removeEventListener('scroll', hide)
  }, [hover])

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 260, damping: 28, mass: 0.5 })
  const sy = useSpring(py, { stiffness: 260, damping: 28, mass: 0.5 })

  return (
    <section id="archive" className="relative scroll-mt-24 py-24 sm:py-32" aria-labelledby="archive-title">
      <div className="shell">
        <SectionHeading
          id="archive-title"
          index="04 — Archive"
          title="Archive"
          aside={<>Every public upload, stream and short on the channel, newest first. All {videos.length} of them.</>}
        />

        <Reveal className="mt-12 flex flex-wrap gap-2" y={12}>
          <div role="group" aria-label="Filter the archive" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                data-testid={`filter-${f.id}`}
                className={`relative rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
                  filter === f.id ? 'border-paper text-ink' : 'border-line-2 text-paper-2 hover:border-paper/40 hover:text-paper'
                }`}
              >
                {filter === f.id ? (
                  <motion.span layoutId="archive-filter" className="absolute inset-0 rounded-full bg-paper" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                ) : null}
                <span className="relative">
                  {f.label} <span className="font-mono text-[11px] opacity-60">{counts[f.id]}</span>
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div
          className="relative mt-8"
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse') return
            px.set(e.clientX)
            py.set(e.clientY)
          }}
          onPointerLeave={() => setHover(null)}
        >
          <div className="hidden grid-cols-[56px_1fr_110px_120px_80px_70px_24px] gap-4 border-b border-line pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-dim lg:grid">
            <span>No.</span>
            <span>Title</span>
            <span>Type</span>
            <span>Date</span>
            <span className="text-right">Length</span>
            <span className="text-right">Views</span>
            <span />
          </div>
          <ol data-testid="archive-list">
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((v, i) => (
                <motion.li
                  key={v.id}
                  layout={!reduce}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE.outExpo }}
                >
                  <a
                    href={watchUrl(v.id, v.kind)}
                    target="_blank"
                    rel="noreferrer"
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') setHover(v)
                      remark('hover', v)
                    }}
                    onFocus={() => setHover(null)}
                    onClick={() => remark('click', v)}
                    className="group grid grid-cols-[72px_1fr_20px] items-center gap-4 border-b border-line py-4 transition-colors duration-200 hover:bg-ink-2 lg:grid-cols-[56px_1fr_110px_120px_80px_70px_24px] lg:py-5"
                    data-testid="archive-row"
                  >
                    <span className="hidden font-mono text-[11px] tabular-nums text-dim lg:block">{String(list.length - i).padStart(2, '0')}</span>
                    <span className="thumb-frame aspect-video w-[72px] lg:hidden">
                      <img src={thumb(v, 'mq')} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-paper transition-transform duration-300 group-hover:translate-x-1 sm:text-[17px]" data-redact="title">
                        {v.title}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:hidden">
                        {KIND_LABEL[v.kind]} · {formatDate(v.published)}
                        {v.length ? ` · ${formatLength(v.length)}` : ''}
                      </span>
                    </span>
                    <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-muted lg:block">{KIND_LABEL[v.kind]}</span>
                    <span className="hidden font-mono text-[11px] uppercase tracking-[0.1em] text-muted lg:block">{formatDate(v.published)}</span>
                    <span className="hidden text-right font-mono text-[11px] tabular-nums text-muted lg:block">{formatLength(v.length) || '—'}</span>
                    <span className="hidden text-right font-mono text-[11px] tabular-nums text-muted lg:block">{v.views ? formatViews(v.views) : '—'}</span>
                    <Icon name="arrow-up-right" size={16} className="text-dim transition-colors duration-200 group-hover:text-paper" />
                  </a>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {/* cursor-following preview */}
          <AnimatePresence>
            {hover ? (
              <motion.div
                key="preview"
                aria-hidden="true"
                className="pointer-events-none fixed left-0 top-0 z-40 hidden w-[300px] lg:block"
                style={{ x: sx, y: sy }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25, ease: EASE.outExpo }}
              >
                <div className="thumb-frame aspect-video w-full translate-x-6 -translate-y-1/2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-line-2">
                  <img key={hover.id} src={thumb(hover, 'max')} alt="" referrerPolicy="no-referrer" className={!hover.maxres ? 'is-letterboxed' : ''} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
