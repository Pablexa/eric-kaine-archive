import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, fm, hudHidden, streamOverlay } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { EASE, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * The twist. The beat cuts out. Verity grows Bleood's dreads — because Eric
 * really did turn Verity into "Bleoodity" on stream (Sep 21, 2026) — and
 * announces she is deleting the website. Then she does. Sort of.
 */
export function TwistScene() {
  const { dispatch } = useExperience()
  const [notFound, setNotFound] = useState<'off' | 'on' | 'period' | 'jk'>('off')
  const skip = useRef<(() => void) | null>(null)

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    const bleoodity = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, author: 'bleoodity', ...o })

    // the needle comes off the record
    sfx.recordScratch()
    sfx.stopMusic()
    chaos.remove('drop')
    chaos.remove('upside')
    chaos.remove('beat')
    chaos.restoreText()
    chaos.setKick(0)
    objective.set(null)
    backdrop.set('dim')
    dispatch({ type: 'MOOD', mood: 'calm' })
    const cx = window.innerWidth / 2
    const cy = Math.min(window.innerHeight * 0.4, 340)
    await verity.moveTo(cx, cy, { size: 120, duration: 0.8, signal })
    await wait(1200, signal)

    await say('…', { hold: 1000 })
    await say('do you want to know a secret.', { hold: 1400 })
    sfx.whoosh()
    verity.setCostume('bleoodity')
    await wait(1100, signal)
    await bleoodity('i was never verity.', { hold: 1600 })
    await bleoodity('eric turned me into this on stream. september 21st.', { hold: 1800 })
    await bleoodity('i’ve been gatekeeping him ever since.', { hold: 1500 })
    await bleoodity('and now…', { hold: 1100 })
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    await bleoodity('i’m deleting the website.', { tone: 'loud', hold: 900 })
    sfx.crash()

    // "deleted": a bare server 404, no HUD, no Verity, no sound
    verity.setMode('hidden')
    hudHidden.set(true)
    chat.clear()
    setNotFound('on')
    await Promise.race([wait(3600, signal), new Promise<void>((resolve) => (skip.current = resolve))])
    setNotFound('period')
    await Promise.race([wait(2200, signal), new Promise<void>((resolve) => (skip.current = resolve))])
    setNotFound('jk')
    sfx.chirp('j')
    await wait(1400, signal)

    // The fake ending is a hostile acquisition. Act IV keeps the wreckage.
    hudHidden.set(false)
    backdrop.set('none')
    setNotFound('off')
    chaos.remove('rainbow')
    chaos.remove('tilt')
    chaos.add('vamp')
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) chaos.add('jelly')
    verity.jump(cx, window.innerHeight * 0.45, 90)
    verity.setMode('free', false)
    await bleoodity('jk. i’m not deleting it.', { hold: 1200 })
    await bleoodity('i’m TAKING it.', { tone: 'loud', hold: 1000 })
    sfx.airhorn()
    fm.set('on')
    streamOverlay.set(true)
    await bleoodity('welcome to my record label. everyone is signed. nobody is paid.', { hold: 1700 })
    dispatch({ type: 'SCENE', scene: 'label' })
  }, [])

  return (
    <AnimatePresence>
      {notFound !== 'off' ? (
        <motion.div
          key="404"
          className="fixed inset-0 z-[60] bg-white p-6 text-black sm:p-10"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
          initial={{ opacity: 1 }}
          exit={{ y: '-100%', transition: { duration: 0.9, ease: EASE.inOutCine } }}
          data-testid="not-found"
        >
          <h1 className="text-[32px] font-bold">Not Found</h1>
          <p className="mt-4 text-[16px]">The requested URL /eric-kaine was not found on this server.</p>
          <hr className="my-4 border-black/40" />
          <p className="text-[15px] italic">
            Apache/2.4.58 (Unix) Server at erickaine.archive Port 80
            {notFound !== 'on' ? (
              <motion.button
                type="button"
                aria-label="A yellow period"
                onClick={() => skip.current?.()}
                className="period ml-1 !h-[9px] !w-[9px] cursor-default align-baseline"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: EASE.snap }}
                data-testid="not-found-period"
              />
            ) : null}
          </p>
          {notFound === 'jk' ? (
            <motion.p className="pixel mt-6 text-[18px] text-[#d99a00]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              &lt;bleoodity&gt; jk.
            </motion.p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
