import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { byId, curation, formatDate, formatLength, formatViews, verticalThumb, watchUrl } from '../../lib/content/channel'
import { VideoCard } from '../media/VideoCard'
import { Reveal } from '../shared/Reveal'
import { SectionHeading } from '../shared/SectionHeading'
import { Icon } from '../shared/Icon'
import { useGuideRemark } from '../troll/useGuideRemark'
import { EASE } from '../../lib/animation/timeline'

const streams = curation.streams.map(byId)
const shorts = curation.shorts.map(byId)

export function Streams() {
  const track = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const remark = useGuideRemark()

  const update = () => {
    const el = track.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const step = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-slide]')
    const w = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * w, behavior: 'smooth' })
  }

  return (
    <section id="streams" className="relative scroll-mt-24 py-24 sm:py-32" aria-labelledby="streams-title">
      <div className="shell">
        <SectionHeading
          id="streams-title"
          index="02 — Streams"
          title="Live"
          aside={<>Fourteen streams and counting: Verity-mod builds, Gartic Phone, beats made with chat, and reactions to new drops.</>}
        />
        <div className="mt-10 flex items-center justify-between sm:mt-14">
          <p className="eyebrow">Selected streams · drag or use arrows</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={edge.start}
              className="grid h-11 w-11 place-items-center rounded-full border border-line-2 text-paper transition-opacity duration-200 hover:border-paper/50 disabled:opacity-30"
              aria-label="Previous streams"
              aria-controls="streams-track"
            >
              <Icon name="arrow-left" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={edge.end}
              className="grid h-11 w-11 place-items-center rounded-full border border-line-2 text-paper transition-opacity duration-200 hover:border-paper/50 disabled:opacity-30"
              aria-label="Next streams"
              aria-controls="streams-track"
              data-testid="streams-next"
            >
              <Icon name="arrow-right" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={track}
        id="streams-track"
        onScroll={update}
        tabIndex={0}
        aria-label="Selected streams"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !track.current) return
          drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          if (!drag.current || !track.current) return
          const dx = e.clientX - drag.current.x
          if (Math.abs(dx) > 4) drag.current.moved = true
          track.current.scrollLeft = drag.current.left - dx
        }}
        onPointerUp={() => {
          window.setTimeout(() => (drag.current = null), 0)
        }}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="mt-6 flex snap-x snap-mandatory scroll-px-[max(var(--gutter),calc((100vw-var(--maxw))/2))] gap-6 overflow-x-auto scroll-smooth px-[max(var(--gutter),calc((100vw-var(--maxw))/2))] pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-testid="streams-track"
      >
        {streams.map((v, i) => (
          <motion.div
            key={v.id}
            data-slide
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[400px]"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: Math.min(i, 4) * 0.06, ease: EASE.outExpo }}
          >
            <VideoCard video={v} titleClass="text-lg sm:text-xl" index={String(i + 1).padStart(2, '0')} />
          </motion.div>
        ))}
      </div>

      {/* Shorts: three tall frames */}
      <div className="shell mt-20 sm:mt-28">
        <div className="grid-12 gap-y-10">
          <Reveal className="col-span-12 md:col-span-4">
            <p className="eyebrow">Shorts</p>
            <p className="mt-4 max-w-[30ch] font-serif text-[clamp(28px,3vw,40px)] italic leading-[1.05] text-paper">
              Nineteen seconds is plenty when someone donates at exactly the wrong time.
            </p>
          </Reveal>
          <div className="col-span-12 grid grid-cols-3 gap-3 sm:gap-6 md:col-span-8">
            {shorts.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08} className={i === 1 ? 'md:mt-16' : i === 2 ? 'md:mt-8' : ''}>
                <a
                  href={watchUrl(s.id, 'short')}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                  onPointerEnter={() => remark('hover', s)}
                  onClick={() => remark('click', s)}
                  data-testid="short-card"
                >
                  <div className="thumb-frame aspect-[9/16] w-full" data-redact="video">
                    <img src={verticalThumb(s.id)} alt="" loading="lazy" referrerPolicy="no-referrer" draggable={false} />
                    <span className="absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-paper">{formatLength(s.length)}</span>
                  </div>
                  <p className="mt-3 text-[13px] font-semibold leading-snug text-paper sm:text-[15px]">
                    <span className="link-sweep">{s.title}</span>
                  </p>
                  <p className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:block">
                    {formatDate(s.published)} · {formatViews(s.views)} views
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
