import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop, fm, hudHidden, streamOverlay } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { artistMedia, characterMedia, objectMedia } from '../../../lib/assets/realMedia'
import { EASE, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './TwistScene.css'

const MARQUEE = '★ LEAK ALERT ★ UNDERGROUND NEWS ★ THIS FAN PAGE GOT BOOTLEGGED ★ 0 PLAYS ★ DO NOT REPOST ★ SIGNED TO BLEOODITY RECORDS ★ '

/** The "removed" snippets on the dead page. Real photos only. */
const REMOVED = [
  { photo: artistMedia.bleood, title: 'eric x bleood (unreleased)' },
  { photo: artistMedia.slimey, title: 'slime season snippet' },
  { photo: objectMedia.cheese, title: 'cheese (cursed bootleg)' },
  { photo: artistMedia.osamason, title: 'plugg leak #404' },
] as const

/**
 * The twist. The beat cuts out. Eric Kaineity turns out to be Bleoodity —
 * because Eric really did turn his guide into "Bleoodity" on stream
 * (Sep 21, 2026) — signs Eric to Bleoodity Records, and leaks then
 * "deletes" the website. Then takes it. Sort of.
 */
export function TwistScene() {
  const { dispatch } = useExperience()
  const [notFound, setNotFound] = useState<'off' | 'on' | 'period' | 'jk'>('off')
  const [signed, setSigned] = useState(false)
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
    await say('psst. want to hear an unreleased secret.', { hold: 1400 })
    sfx.whoosh()
    verity.setCostume('bleoodity')
    setSigned(true)
    await wait(1100, signal)
    await bleoodity('i was never eric kaineity.', { hold: 1600 })
    await bleoodity('eric turned me into this on stream. september 21st.', { hold: 1800 })
    await bleoodity('i’ve been gatekeeping him ever since. he’s signed to me now.', { hold: 1500 })
    await bleoodity('and now…', { hold: 1100 })
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    await bleoodity('i’m leaking the whole website. then deleting it.', { tone: 'loud', hold: 900 })
    sfx.crash()

    // "deleted": a dead, leaked fan page. No HUD, no guide, no sound.
    verity.setMode('hidden')
    hudHidden.set(true)
    chat.clear()
    setSigned(false)
    setNotFound('on')
    await Promise.race([wait(3600, signal), new Promise<void>((resolve) => (skip.current = resolve))])
    setNotFound('period')
    await Promise.race([wait(2200, signal), new Promise<void>((resolve) => (skip.current = resolve))])
    setNotFound('jk')
    sfx.chirp('j')
    await wait(1400, signal)

    // The fake ending is a hostile signing. Act IV keeps the wreckage.
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
    await bleoodity('i’m TAKING it. for the label.', { tone: 'loud', hold: 1000 })
    sfx.airhorn()
    fm.set('on')
    streamOverlay.set(true)
    await bleoodity('welcome to bleoodity records. everyone is signed. nobody is paid.', { hold: 1700 })
    dispatch({ type: 'SCENE', scene: 'label' })
  }, [])

  return (
    <>
      <AnimatePresence>{signed ? <SignedNews key="signed" /> : null}</AnimatePresence>
      <AnimatePresence>
        {notFound !== 'off' ? (
          <motion.div
            key="404"
            className="ks-twist fixed inset-0 z-[60] overflow-y-auto"
            initial={{ opacity: 1 }}
            exit={{ y: '-100%', transition: { duration: 0.9, ease: EASE.inOutCine } }}
            data-testid="not-found"
          >
            <div className="ks-twist__marquee" aria-hidden="true">
              <span>
                {MARQUEE}
                {MARQUEE}
              </span>
            </div>

            <div className="ks-twist__page relative mx-auto mb-10 mt-5 w-[min(94vw,920px)] sm:mt-8">
              <div className="ks-twist__bar">
                <span>erickaine.archive · underground fan page</span>
                <span className="ks-twist__offline">OFFLINE NOW!</span>
              </div>

              <div className="grid gap-5 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:px-7 sm:py-6">
                <div className="min-w-0">
                  <p className="ks-twist__alert">!! LEAK ALERT · UNDERGROUND NEWS !!</p>
                  <h1 className="ks-twist__title mt-3 text-[clamp(38px,5.6vw,76px)]">404: THIS WEBSITE WAS LEAKED</h1>
                  <p className="ks-twist__copy mt-3 text-[16px] sm:text-[18px]">
                    The fan page <span className="ks-twist__url">/eric-kaine</span> was leaked, bootlegged and deleted by
                    Bleoodity Records.
                  </p>
                  <p className="ks-twist__stats mt-2 text-[13px]">0 plays · 0 followers · 0 snippets left · not trying to be famous</p>

                  <p className="ks-twist__label mt-5">Top snippets (all removed):</p>
                  <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {REMOVED.map((r, i) => (
                      <li key={r.title} className="ks-twist__track" style={{ rotate: `${i % 2 ? 2 : -2}deg` }}>
                        <img src={r.photo.src} alt="" className="ks-twist__track-photo" width={160} height={96} draggable={false} />
                        <span className="ks-twist__track-title">{r.title}</span>
                        <span className="ks-twist__download" aria-hidden="true">
                          DOWNLOAD (0 KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <aside className="relative hidden flex-col items-center gap-3 sm:flex" aria-hidden="true">
                  <span className="ks-twist__sticker ks-twist__sticker--red">NOT FOUND</span>
                  <figure className="ks-twist__polaroid">
                    <img src={objectMedia.seal.src} alt="" width={150} height={120} draggable={false} />
                    <figcaption>the seal ate the server</figcaption>
                  </figure>
                  <span className="ks-twist__sticker ks-twist__sticker--green">DO NOT REPOST</span>
                  <p className="ks-twist__counter-label">
                    you are visitor
                    <span className="ks-twist__counter">000404</span>
                  </p>
                </aside>
              </div>

              <hr className="ks-twist__rule" />
              <p className="ks-twist__server px-4 pb-4 sm:px-7">
                UndergroundServer/2.0.08 (Plugg) Server at erickaine.archive Port 808
                {notFound !== 'on' ? (
                  <motion.button
                    type="button"
                    aria-label="A yellow period"
                    onClick={() => skip.current?.()}
                    className="period ml-1 !h-[11px] !w-[11px] cursor-default align-baseline"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE.snap }}
                    data-testid="not-found-period"
                  />
                ) : null}
              </p>

              {notFound === 'jk' ? (
                <motion.div
                  className="ks-twist__jk"
                  initial={{ opacity: 0, scale: 0.6, rotate: -14 }}
                  animate={{ opacity: 1, scale: 1, rotate: -6 }}
                  transition={{ duration: 0.45, ease: EASE.snap }}
                >
                  <img src={characterMedia.bleoodity.src} alt={characterMedia.bleoodity.alt} width={72} height={72} draggable={false} />
                  <span>
                    &lt;bleoodity&gt; jk.
                    <small>signed to bleoodity records</small>
                  </span>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

/** Underground news flash: the guide changes labels, live, under the orb. */
function SignedNews() {
  const top = Math.min(window.innerHeight * 0.4, 340) + 84
  return (
    <motion.aside
      className="ks-news pointer-events-none fixed left-1/2 z-[47] w-[min(92vw,560px)] -translate-x-1/2"
      style={{ top }}
      initial={{ opacity: 0, y: 24, rotate: -4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: EASE.snap }}
      aria-label="Underground news"
    >
      <div className="ks-news__bar">
        <span>UNDERGROUND NEWS</span>
        <span className="ks-news__live">LEAK ALERT</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
        <img src={characterMedia.kaineity.src} alt={characterMedia.kaineity.alt} className="ks-news__pfp" width={64} height={64} draggable={false} />
        <span className="ks-news__arrow" aria-hidden="true">
          &gt;&gt;
        </span>
        <img src={characterMedia.bleoodity.src} alt={characterMedia.bleoodity.alt} className="ks-news__pfp ks-news__pfp--new" width={64} height={64} draggable={false} />
        <p className="ks-news__copy min-w-0">
          <strong>Eric Kaineity has been signed to Bleoodity Records.</strong>
          <span>terms: unpaid. contract: forever. new name: Bleoodity.</span>
        </p>
      </div>
      <span className="ks-news__stamp" aria-hidden="true">
        SIGNED
      </span>
    </motion.aside>
  )
}
