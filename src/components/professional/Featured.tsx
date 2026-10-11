import { byId, curation, formatDate, formatLength, formatViews, watchUrl } from '../../lib/content/channel'
import { LiteEmbed } from '../media/LiteEmbed'
import { VideoCard } from '../media/VideoCard'
import { Reveal } from '../shared/Reveal'
import { SectionHeading } from '../shared/SectionHeading'
import { Icon } from '../shared/Icon'
import { useGuideRemark } from '../troll/useGuideRemark'

const featured = byId(curation.featured)
const [a, b] = curation.supporting.map(byId)

export function Featured() {
  const remark = useGuideRemark()
  return (
    <section id="latest" className="relative scroll-mt-24 py-24 sm:py-32" aria-labelledby="latest-title">
      <div className="shell">
        <SectionHeading
          id="latest-title"
          index="01 — Latest"
          title="Latest"
          aside={<>Fresh from the channel. The newest upload, plus the two that people keep coming back to.</>}
        />

        <div className="grid-12 mt-12 gap-y-8 sm:mt-16">
          <Reveal className="col-span-12 lg:col-span-8">
            <LiteEmbed video={featured} />
          </Reveal>
          <Reveal className="col-span-12 flex flex-col justify-between gap-8 lg:col-span-4 lg:pl-4" delay={0.1}>
            <div>
              <p className="eyebrow">Now showing</p>
              <h3 className="mt-4 font-display text-[clamp(30px,3.2vw,44px)] font-bold leading-[1.02] tracking-[-0.03em] [font-stretch:104%]" data-redact="title">
                {featured.title}
              </h3>
              <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-paper-2">
                The upload that follows three weeks of Verity-mod streams. Bleood, added to the horror mod — properly this time.
              </p>
            </div>
            <div>
              <dl className="grid grid-cols-3 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.12em]">
                <div>
                  <dt className="text-muted">Released</dt>
                  <dd className="mt-1.5 text-paper">{formatDate(featured.published)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Runtime</dt>
                  <dd className="mt-1.5 tabular-nums text-paper">{formatLength(featured.length)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Views</dt>
                  <dd className="mt-1.5 tabular-nums text-paper" data-redact="stat">{formatViews(featured.views)}</dd>
                </div>
              </dl>
              <a
                href={watchUrl(featured.id)}
                target="_blank"
                rel="noreferrer"
                onClick={() => remark('link')}
                className="group mt-6 flex items-center justify-between border-b border-line-2 pb-3 text-[15px] font-medium text-paper"
                data-testid="featured-link"
              >
                <span className="link-sweep">Watch on YouTube</span>
                <Icon name="arrow-up-right" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>

        {/* asymmetric supporting pair */}
        <div className="grid-12 mt-20 gap-y-14 sm:mt-28">
          <Reveal className="col-span-12 md:col-span-7">
            <VideoCard video={a} index="A" titleClass="text-2xl sm:text-[34px]" />
            <p className="mt-10 hidden max-w-[24ch] font-serif text-[clamp(28px,2.6vw,38px)] italic leading-[1.05] text-paper-2 md:block">
              The most-watched upload on the channel, by a distance.
            </p>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-4 md:col-start-9 md:mt-40" delay={0.12}>
            <VideoCard video={b} index="B" aspect="aspect-[4/5]" titleClass="text-xl sm:text-2xl" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
