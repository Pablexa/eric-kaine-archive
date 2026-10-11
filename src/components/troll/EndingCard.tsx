import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { ENDINGS, type EndingId } from '../../lib/experience/machine'
import { channel } from '../../lib/content/channel'
import { artistMedia, characterMedia, objectMedia } from '../../lib/assets/realMedia'
import { EASE } from '../../lib/animation/timeline'
import { Icon } from '../shared/Icon'
import './EndingCard.css'

const ORDER: EndingId[] = ['subscriber', 'obscure', 'gatekeeper']

const MARQUEE = '★ ENDING UNLOCKED ★ UNDERGROUND ONLY ★ DO NOT REPOST ★ GATEKEEP RESPONSIBLY ★ NOT TRYING TO BE FAMOUS ★ '

/** Eric's Top 8, as it would have looked on a 2008 profile. Real photos only. */
const TOP_8 = [
  { name: 'Bleood', photo: artistMedia.bleood },
  { name: '2Slimey', photo: artistMedia.slimey },
  { name: 'Slayr', photo: artistMedia.slayr },
  { name: 'OsamaSon', photo: artistMedia.osamason },
  { name: 'Carti', photo: artistMedia.carti },
  { name: 'Jaydes', photo: artistMedia.jaydes },
  { name: 'cheese', photo: objectMedia.cheese },
  { name: 'the seal', photo: objectMedia.seal },
] as const

export function EndingCard() {
  const { state, endings, replay, leave } = useExperience()
  const first = useRef<HTMLAnchorElement>(null)
  const id = state.ending
  useEffect(() => {
    first.current?.focus()
  }, [])
  if (!id) return null
  const e = ENDINGS[id]

  return (
    <div className="fixed inset-0 z-[49] grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby="ending-title" data-testid="ending">
      <motion.div
        className="ks-end relative w-full max-w-[680px]"
        initial={{ opacity: 0, y: 40, scale: 0.94, rotate: -3 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: -0.8 }}
        transition={{ duration: 0.7, ease: EASE.outExpo }}
      >
        <div className="ks-end__bar">
          <span>Eric Kaine’s fan page · the end (leaked)</span>
          <span className="ks-end__online">OFFLINE NOW!</span>
        </div>
        <div className="ks-end__marquee" aria-hidden="true">
          <span>
            {MARQUEE}
            {MARQUEE}
          </span>
        </div>

        <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-7">
          <span className="ks-end__sticker" aria-hidden="true">
            {endings.length}/3
            <small>leaked</small>
          </span>

          <p className="ks-end__eyebrow">ENDING UNLOCKED · {endings.length}/3 FOUND</p>
          <h2 id="ending-title" className="ks-end__title mt-3 pr-16 text-[clamp(38px,6.4vw,66px)] uppercase sm:pr-20">
            {e.title}
          </h2>
          <p className="ks-end__line mt-4 max-w-[50ch] text-[15px] leading-relaxed sm:text-[16px]">{e.line}</p>

          {id === 'gatekeeper' ? (
            <p className="ks-end__stamp mt-4">GATEKEEPER No. 1,501 · gatekept discord role unlocked</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
            <ol className="ks-end__list grid flex-1 gap-1" aria-label="Endings">
              {ORDER.map((k) => (
                <li key={k} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className={endings.includes(k) ? 'ks-end__found' : 'ks-end__hidden'}>{endings.includes(k) ? ENDINGS[k].title : '??? ??????'}</span>
                  <span className={endings.includes(k) ? 'ks-end__tag ks-end__tag--found' : 'ks-end__tag'}>{endings.includes(k) ? 'UNLOCKED' : 'UNRELEASED'}</span>
                </li>
              ))}
            </ol>

            <figure className="ks-end__top8 sm:w-[236px]">
              <figcaption>Eric’s Top 8</figcaption>
              <ul className="grid grid-cols-8 gap-1 sm:grid-cols-4">
                {TOP_8.map((f) => (
                  <li key={f.name} title={f.name}>
                    <img src={f.photo.src} alt={f.photo.alt} width={52} height={52} draggable={false} />
                  </li>
                ))}
              </ul>
            </figure>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              ref={first}
              href={channel.subscribeUrl}
              target="_blank"
              rel="noreferrer"
              className="ks-end__follow flex items-center justify-center gap-2 px-5 py-3"
              data-testid="subscribe-for-real"
            >
              Follow Eric for real <Icon name="arrow-up-right" size={16} />
            </a>
            <button type="button" className="ks-end__btn ks-end__btn--yellow flex items-center justify-center gap-2" onClick={() => void replay()} data-testid="replay">
              <Icon name="replay" size={16} /> Run it back
            </button>
            <button type="button" className="ks-end__btn" onClick={() => void leave({ quiet: true })} data-testid="back-to-archive">
              Back to the archive
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="ks-end__foot">
              {endings.length < 3 ? 'Other choices lead to other endings. Some are still unreleased.' : 'All endings found. Eric Kaineity and Bleoodity are both exhausted.'}
            </p>
            <p className="ks-end__visitors">
              <img src={characterMedia.bleoodity.src} alt="" width={22} height={22} draggable={false} />
              visitors <span>001501</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
