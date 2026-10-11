import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { ENDINGS, type EndingId } from '../../lib/experience/machine'
import { channel } from '../../lib/content/channel'
import { EASE } from '../../lib/animation/timeline'
import { Icon } from '../shared/Icon'

const ORDER: EndingId[] = ['subscriber', 'obscure', 'gatekeeper']

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
        className="relative w-full max-w-[640px] border-2 border-verity bg-hazard px-6 py-8 shadow-[0_0_0_6px_rgba(0,0,0,0.5),0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:px-10 sm:py-10"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE.outExpo }}
      >
        <span aria-hidden="true" className="hazard absolute inset-x-0 top-0 h-2" />
        <p className="pixel text-[16px] text-verity">
          ENDING UNLOCKED · {endings.length}/3 FOUND
        </p>
        <h2 id="ending-title" className="display mt-4 text-[clamp(40px,7vw,72px)] uppercase leading-[0.9] text-pixel [font-stretch:120%]">
          {e.title}
        </h2>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-pixel/80">{e.line}</p>

        {id === 'gatekeeper' ? (
          <p className="pixel mt-5 inline-block -rotate-2 border-2 border-verity px-3 py-1 text-[18px] text-verity">GATEKEEPER No. 1,501</p>
        ) : null}

        <ol className="mt-7 grid gap-1.5 border-t border-pixel/15 pt-5" aria-label="Endings">
          {ORDER.map((k) => (
            <li key={k} className="pixel flex items-center justify-between text-[16px]">
              <span className={endings.includes(k) ? 'text-pixel' : 'text-pixel/35'}>{endings.includes(k) ? ENDINGS[k].title : '??? ??????'}</span>
              <span className={endings.includes(k) ? 'text-verity' : 'text-pixel/30'}>{endings.includes(k) ? 'FOUND' : 'HIDDEN'}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            ref={first}
            href={channel.subscribeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-signal px-5 py-3.5 font-display text-[15px] font-bold text-white transition-colors hover:bg-signal-2"
            data-testid="subscribe-for-real"
          >
            Subscribe for real <Icon name="arrow-up-right" size={16} />
          </a>
          <button type="button" className="pixel-btn flex items-center justify-center gap-2" data-tone="yellow" onClick={() => void replay()} data-testid="replay">
            <Icon name="replay" size={16} /> Replay
          </button>
          <button type="button" className="pixel-btn" onClick={() => void leave({ quiet: true })} data-testid="back-to-archive">
            Back to the archive
          </button>
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-pixel/40">
          {endings.length < 3 ? 'Other choices lead to other endings.' : 'All endings found. Verity is exhausted.'}
        </p>
      </motion.div>
    </div>
  )
}
