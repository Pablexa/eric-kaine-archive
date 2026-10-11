import { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { chat } from '../../lib/experience/chat'
import { choices, objective, useStore } from '../../lib/experience/store'
import { EASE } from '../../lib/animation/timeline'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { UNDERGROUND_SCENES } from '../../lib/experience/machine'

/** Minecraft-style chat: bottom-left, "<verity> message", fades with age. */
export function ChatLog() {
  const { state } = useExperience()
  const underground = !!state.scene && UNDERGROUND_SCENES.includes(state.scene)
  const lines = useSyncExternalStore(chat.subscribe, chat.getSnapshot, chat.getSnapshot)
  const pending = useStore(choices)
  const [, force] = useState(0)

  // re-render periodically so old lines fade out
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  const now = Date.now()
  const visible = lines.slice(underground ? -2 : -5)

  return (
    <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-[48] flex flex-col items-start gap-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[min(640px,70vw)]">
      <ol className="flex w-full flex-col items-start gap-1" aria-live="polite" aria-relevant="additions" data-testid="chat-log">
        <AnimatePresence initial={false}>
          {visible.map((l, i) => {
            const age = now - l.at
            const isRecent = i >= visible.length - 2
            const faded = !isRecent && age > 9000
            return (
              <motion.li
                key={l.id}
                layout="position"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: faded ? 0 : 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE.outExpo }}
                className={`chat-line max-w-full px-2 py-0.5 leading-[1.25] sm:px-2.5 sm:py-1 ${underground ? 'text-[12px] sm:text-[16px]' : l.tone === 'loud' ? 'text-[17px] sm:text-[28px]' : 'text-[14px] sm:text-[19px]'} ${i < visible.length - 3 ? 'max-sm:hidden' : ''}`}
              >
                {l.author === 'verity' ? (
                  <span className="text-verity">&lt;eric kaineity&gt; </span>
                ) : l.author === 'bleoodity' ? (
                  <span className="text-[#ff4fd8]">&lt;bleoodity&gt; </span>
                ) : (
                  <span className="text-pixel/60">[archive] </span>
                )}
                <span className={l.tone === 'loud' ? 'text-alarm' : ''}>{l.text.slice(0, l.shown)}</span>
                <span className="sr-only">{l.done ? '' : l.text.slice(l.shown)}</span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
      <AnimatePresence>
        {pending ? (
          <motion.div
            key="choices"
            className="pointer-events-auto flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: EASE.outExpo }}
            role="group"
            aria-label="Respond to Eric Kaineity"
          >
            {pending.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                className="pixel-btn"
                data-tone={o.tone ?? 'plain'}
                onClick={() => pending.resolve(o.id)}
                autoFocus={i === 0}
                data-testid={`choice-${o.id}`}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Objective() {
  const text = useStore(objective)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[76px] z-[48] flex justify-center px-4 sm:top-[86px]" aria-live="polite">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.p
            key={text}
            className="pixel bg-hazard/85 px-3 py-1.5 text-center text-[15px] text-pixel ring-1 ring-verity/30 sm:text-[17px]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE.outExpo }}
            data-testid="objective"
          >
            {text}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
