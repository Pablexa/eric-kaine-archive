import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { ROWS, ROW_LABEL, Sequencer, startingPattern, type Pattern, type Row } from '../../../lib/audio/beat'
import { EASE, TIME, prefersReducedMotion } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 07 — "making a beat but the website chooses the sounds".
 * A playable 16-step channel rack. Verity "improves" the beat bar by bar
 * (cowbell, airhorns), then a build-up, a countdown, and the drop — where
 * the archive itself starts dancing, spinning, and saying ERIC KAINE.
 */

const ROW_COLOR: Record<Row, string> = {
  kick: '#ff8a1f',
  clap: '#ffd21f',
  hat: '#5be36b',
  bass: '#ff4fd8',
  cowbell: '#26d0ce',
  horn: '#ff4128',
}

const DROP_LINES = ['ERIC KAINE IS FAMOUS NOW', 'THIS IS A HIT', '1.5K + 1 ON THE CHARTS', 'TELL EVERYONE', 'WAIT NO', 'DON’T TELL ANYONE']

export function BeatScene() {
  const { dispatch } = useExperience()
  const [pattern, setPattern] = useState<Pattern>(startingPattern)
  const [playhead, setPlayhead] = useState(-1)
  const [count, setCount] = useState<string | null>(null)
  const [section, setSection] = useState<'intro' | 'cowbell' | 'horns' | 'build' | 'drop'>('intro')
  const seq = useRef<Sequencer | null>(null)
  const barWaiters = useRef<{ bar: number; resolve: () => void }[]>([])
  const overrode = useRef(false)

  const fast = TIME.scale < 1
  const LEN = { intro: fast ? 1 : 2, cowbell: fast ? 1 : 2, horns: fast ? 1 : 2, build: fast ? 1 : 2, drop: fast ? 2 : 8 }
  const at = {
    cowbell: LEN.intro,
    horns: LEN.intro + LEN.cowbell,
    build: LEN.intro + LEN.cowbell + LEN.horns,
    drop: LEN.intro + LEN.cowbell + LEN.horns + LEN.build,
  }
  const end = at.drop + LEN.drop

  // the sequencer + the drop's audio extras
  useEffect(() => {
    const s = new Sequencer(startingPattern(), 140)
    seq.current = s
    s.extra = (info, audioAt) => {
      const { bar, step } = info
      // build: an accelerating clap roll and a riser
      if (bar >= at.build && bar < at.drop) {
        const lastBar = bar === at.drop - 1
        if (bar === at.build && step === 0) sfx.riser((s.stepMs * 16 * LEN.build) / 1000)
        if (step < 12 || !lastBar) {
          if (lastBar || step % 2 === 0) sfx.snare(audioAt, 0.15 + (step / 16) * 0.3 + (lastBar ? 0.15 : 0))
        }
        // the gap right before the drop
        s.muted = lastBar && step >= 12
      }
      if (bar === at.drop && step === 0) {
        s.muted = false
        sfx.boom(audioAt)
        sfx.airhorn(audioAt)
        s.pulse(info.at)
      }
      if (bar > at.drop && bar < end && step === 0) sfx.airhorn(audioAt)
      if (bar >= at.drop && step === 8 && Math.random() < 0.5) sfx.airhorn(audioAt)
    }
    s.onStep = (info) => {
      setPlayhead(info.step)
      if (info.step === 0) {
        barWaiters.current = barWaiters.current.filter((w) => {
          if (info.bar >= w.bar) {
            w.resolve()
            return false
          }
          return true
        })
      }
      // countdown on the last bar of the build
      if (info.bar === at.drop - 1) {
        if (info.step === 0) setCount('3')
        if (info.step === 4) setCount('2')
        if (info.step === 8) setCount('1')
        if (info.step === 12) setCount('…')
      }
      if (info.bar === at.drop && info.step === 0) setCount(null)
    }
    s.start()

    // kick → visuals
    const reduce = prefersReducedMotion()
    let raf = 0
    const tick = () => {
      const env = s.kickEnvelope()
      if (!reduce) {
        chaos.setKick(env)
        verity.scale.set(1 + env * 0.3)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // muting the beat is illegal (once)
    const unsub = sfx.subscribe(() => {
      if (!sfx.enabled && !overrode.current) {
        overrode.current = true
        chat.post('muting the beat is illegal.', 'verity', 'loud')
        window.setTimeout(() => sfx.enable(), 900)
      }
    })

    return () => {
      s.stop()
      cancelAnimationFrame(raf)
      unsub()
      chaos.setKick(0)
      verity.scale.set(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waitBar = (bar: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      barWaiters.current.push({ bar, resolve })
      signal.addEventListener('abort', () => reject(new DOMException('a', 'AbortError')), { once: true })
    })

  const setRow = (row: Row, on: number[]) => {
    setPattern((p) => {
      const next = { ...p, [row]: p[row].map((_, i) => on.includes(i) || (on.length === 16 ? true : p[row][i])) }
      if (seq.current) seq.current.pattern = next
      return next
    })
  }

  const toggle = (row: Row, i: number) => {
    setPattern((p) => {
      const next = { ...p, [row]: p[row].map((v, j) => (j === i ? !v : v)) }
      if (seq.current) seq.current.pattern = next
      return next
    })
    sfx.tick()
  }

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    sfx.stopMusic()
    if (!sfx.enabled) sfx.enable()
    chaos.add('beat')
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    void verity.moveTo(window.innerWidth / 2, Math.max(150, window.innerHeight * 0.2), { size: 70, duration: 0.6, signal }).catch(() => {})
    objective.set('Make the beat · click the pads')
    void say('making a beat but the website chooses the sounds.', { hold: 500 }).catch(() => {})

    await waitBar(at.cowbell, signal)
    setSection('cowbell')
    setRow('cowbell', Array.from({ length: 16 }, (_, i) => i))
    void say('added cowbell. you’re welcome.').catch(() => {})

    await waitBar(at.horns, signal)
    setSection('horns')
    setRow('horn', [0, 6, 12])
    void say('added airhorns. that’s how you know it’s a hit.').catch(() => {})

    await waitBar(at.build, signal)
    setSection('build')
    objective.set('Brace yourself')
    void say('here it comes.', { tone: 'loud' }).catch(() => {})

    await waitBar(at.drop, signal)
    setSection('drop')
    objective.set(null)
    chaos.swapText()
    if (!prefersReducedMotion()) chaos.add('drop')
    for (let b = 0; b < LEN.drop; b++) {
      chat.post(DROP_LINES[b % DROP_LINES.length], 'verity', 'loud')
      if (b === Math.floor(LEN.drop / 2)) {
        chaos.add('upside')
        chat.post('UPSIDE DOWN FOR SOME REASON', 'verity', 'loud')
      }
      await waitBar(at.drop + b + 1, signal)
    }
    dispatch({ type: 'SCENE', scene: 'twist' })
  }, [])

  return (
    <>
      <motion.div
        role="group"
        aria-label="Verity Studio step sequencer"
        className="pointer-events-auto fixed left-1/2 top-[54%] z-[45] w-[min(760px,96vw)] -translate-x-1/2 -translate-y-1/2 border-2 border-black bg-[#2b2f33] text-[#d7dde3] shadow-[0_0_0_4px_#14171a,0_30px_80px_-10px_rgba(0,0,0,0.9)]"
        initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: section === 'drop' ? [0, -2, 2, 0] : 0 }}
        transition={section === 'drop' ? { rotate: { duration: 0.43, repeat: Infinity } } : { duration: 0.6, ease: EASE.snap }}
        data-testid="beat-scene"
        data-section={section}
      >
        <div className="flex items-center justify-between gap-2 bg-[#3c4248] px-3 py-1.5">
          <span className="pixel truncate text-[14px] text-[#ffb347] sm:text-[16px]">VERITY STUDIO · channel rack</span>
          <span className="pixel shrink-0 text-[13px] text-[#9fb0bf]">
            140 BPM · <span className={section === 'drop' ? 'text-alarm' : 'text-[#5be36b]'}>{section.toUpperCase()}</span>
          </span>
        </div>
        <div className="space-y-1.5 p-2 sm:p-3">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center gap-1.5 sm:gap-2">
              <span className="pixel w-[54px] shrink-0 truncate text-[11px] sm:w-[78px] sm:text-[13px]" style={{ color: ROW_COLOR[row] }}>
                {ROW_LABEL[row]}
              </span>
              <div className="grid flex-1 grid-cols-16 gap-[3px] sm:gap-1">
                {pattern[row].map((on, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${ROW_LABEL[row]} step ${i + 1}`}
                    aria-pressed={on}
                    onClick={() => toggle(row, i)}
                    className={`h-6 border border-black/60 transition-[filter] duration-75 sm:h-7 ${Math.floor(i / 4) % 2 ? 'bg-[#4a5157]' : 'bg-[#3a4046]'} ${
                      playhead === i ? 'brightness-150' : ''
                    }`}
                    style={on ? { background: ROW_COLOR[row], boxShadow: playhead === i ? `0 0 12px ${ROW_COLOR[row]}` : undefined } : undefined}
                    data-testid={`pad-${row}-${i}`}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-1 sm:gap-2">
            <span className="w-[54px] shrink-0 sm:w-[78px]" />
            <div className="grid flex-1 grid-cols-16 gap-[3px] sm:gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className={`h-1.5 ${playhead === i ? 'bg-[#ffb347]' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {count ? (
          <motion.p
            key={count}
            aria-live="assertive"
            className="pointer-events-none fixed inset-x-0 top-[20%] z-[47] text-center text-[clamp(120px,26vw,320px)] leading-none text-[#ffd21f]"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif', WebkitTextStroke: '6px #000', textShadow: '10px 10px 0 #ff00cc' }}
            initial={{ scale: 2.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE.snap }}
          >
            {count}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </>
  )
}
