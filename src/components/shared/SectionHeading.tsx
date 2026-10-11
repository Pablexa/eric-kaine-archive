import type { ReactNode } from 'react'
import { LineReveal, Reveal } from './Reveal'
import { Period } from './Period'

export function SectionHeading({
  index,
  title,
  aside,
  id,
}: {
  index: string
  title: string
  aside?: ReactNode
  id?: string
}) {
  return (
    <div className="grid-12 items-end gap-y-6 border-t border-line pt-6 sm:pt-8">
      <Reveal className="col-span-12 flex items-baseline gap-4 md:col-span-2" y={10}>
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted">{index}</span>
      </Reveal>
      <h2 id={id} className="display col-span-12 text-[clamp(56px,9.4vw,148px)] md:col-span-7" data-redact="heading">
        <LineReveal>
          {title}
          <Period />
        </LineReveal>
      </h2>
      {aside ? (
        <Reveal className="col-span-12 max-w-[36ch] text-[15px] leading-relaxed text-muted md:col-span-3 md:justify-self-end md:pb-3" delay={0.15}>
          {aside}
        </Reveal>
      ) : null}
    </div>
  )
}
