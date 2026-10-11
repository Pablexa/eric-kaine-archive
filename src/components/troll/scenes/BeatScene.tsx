import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { shake } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import {
  BAR_S,
  BEAT_S,
  COUNTDOWN,
  DROP_BAR,
  DROP_BARS,
  ROWS,
  ROW_LABEL,
  SECTION_AT,
  Sequencer,
  SongClock,
  TRACK,
  previewPad,
  startingPattern,
  type Pattern,
  type Row,
  type Section,
} from '../../../lib/audio/beat'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { EASE, TIME, pick, prefersReducedMotion, rand } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import { announce, TRACKS } from '../../../lib/audio/nowPlaying'
import { guardMusic } from '../../../lib/audio/musicGuard'
import './BeatScene.css'

/**
 * Protocol 07 — "making a beat but the website chooses the sounds", cracked
 * 2008 studio edition. The song is the owner's real cursed underground beat
 * (/media/beat-scene.mp3) and its audio clock drives everything: Eric
 * Kaineity "improves" it section by section (cowbell, airhorns), the 3 · 2 · 1
 * lands exactly on the drop, and the drop shakes the whole archive. The pads
 * are artist photos that light up, pulse and preview, but never replace the song.
 */

const ROW_COLOR: Record<Row, string> = {
  kick: '#ff00cc',
  clap: '#39ff14',
  hat: '#00e5ff',
  bass: '#ff1a1a',
  cowbell: '#ffe600',
  horn: '#ff8a00',
}

const ROW_PHOTO: Record<Row, RealMedia> = {
  kick: artistMedia.bleood,
  clap: artistMedia.slimey,
  hat: artistMedia.slayr,
  bass: artistMedia.osamason,
  cowbell: artistMedia.jaydes,
  horn: artistMedia.carti,
}

/** Photos that fly across the screen during the drop. */
const BURST_PHOTOS: RealMedia[] = [
  artistMedia.bleood,
  artistMedia.slayr,
  artistMedia.osamason,
  artistMedia.carti,
  artistMedia.jaydes,
  artistMedia.slimey,
  objectMedia.cheese,
  objectMedia.seal,
  objectMedia.burger,
  objectMedia.slime,
  characterMedia.ericPfp,
]
const BURST_TAGS = ['LEAKED', 'FREE DL', 'UNRELEASED', 'SLATT', 'HQ!!', 'PLUGG', 'RAGE', 'CURSED']

const DROP_LINES = [
  'THIS SNIPPET IS GOING TO LEAK',
  'TWO PLAYS ON SOUNDCLOUD. ONE OF THEM IS ME.',
  'BLEOOD WOULD SIGN THIS',
  'CHEESE ON THE HI HATS',
  'GATEKEEP THIS BEAT FOREVER',
  'SLATT SLATT SLATT',
  'THE SEAL APPROVES',
  'NOT TRYING TO BE FAMOUS',
  'WAIT. DO NOT LEAK IT.',
  'TOO LATE. IT LEAKED.',
]

const MARQUEE =
  '*** NOW PLAYING: kaineity x bleood - cursed bootleg (prod. the website) *** 154 BPM *** 100% UNRELEASED *** DO NOT LEAK *** sign the guestbook *** join the gatekept discord ***'

/** Fast (test) mode runs a 4× virtual clock: quick, but the drop still lasts long enough to see. */
const FAST_RATE = 4

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lcd = (t: number) => {
  const s = Math.max(0, t)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(2).padStart(5, '0')}`
}

interface Burst {
  id: number
  photo: RealMedia
  tag: string
  x: number
  y: number
  rot: number
  size: number
}

export function BeatScene() {
  const { dispatch } = useExperience()
  const [pattern, setPattern] = useState<Pattern>(startingPattern)
  const [playhead, setPlayhead] = useState(-1)
  const [count, setCount] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('intro')
  const [plays, setPlays] = useState(47)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [flash, setFlash] = useState<{ id: number; row: Row } | null>(null)
  const seq = useRef<Sequencer | null>(null)
  const songT = useRef(0)
  const waiters = useRef<{ t: number; resolve: () => void }[]>([])
  const overrode = useRef(false)
  const lcdRef = useRef<HTMLSpanElement>(null)
  const posRef = useRef<HTMLSpanElement>(null)
  const flashTimer = useRef(0)
  const flashId = useRef(0)

  const fast = TIME.scale < 1

  // the song, its clock, the rack that follows it, and the drop's extras
  useEffect(() => {
    const reduce = prefersReducedMotion()
    const timers: number[] = []

    // the MP3 is the music (fast/test mode never depends on it: a virtual clock runs instead)
    let audio: HTMLAudioElement | null = fast ? null : new Audio(TRACK.src)
    // song 2: "bloody" by 2Slimey (the card in the corner shows it while it is audible)
    const unannounce = audio ? announce(TRACKS.bloody, audio) : null
    const unguard = audio ? guardMusic(audio) : null
    const clock = new SongClock(audio, fast ? FAST_RATE : 1)
    let blocked = false
    const syncAudio = () => {
      if (!audio) return
      audio.volume = clamp01(sfx.volume * sfx.duck * sfx.musicMix)
      audio.muted = blocked || !sfx.enabled
    }
    // any tap: unmute a muted autoplay, or restart a track the browser paused (where the scene is now)
    const unlock = () => {
      if (!audio) return
      blocked = false
      syncAudio()
      if (audio.paused && !audio.ended) {
        if (clock.time > audio.currentTime + 0.3 && clock.time < TRACK.length) audio.currentTime = clock.time
        void audio.play().catch(() => {})
      }
    }
    if (audio) {
      const el = audio
      el.preload = 'auto'
      syncAudio()
      void el.play().catch(() => {
        if (audio !== el) return
        // no fresh gesture: play muted (always allowed) so the clock still follows the song; unmute on the next tap
        blocked = true
        syncAudio()
        void el.play().catch(() => {})
      })
      window.addEventListener('pointerdown', unlock, { passive: true })
      window.addEventListener('keydown', unlock)
    }

    const s = new Sequencer(startingPattern())
    seq.current = s

    let burstId = 0
    const spawnBurst = () => {
      if (reduce) return
      const id = ++burstId
      setBursts((b) => [
        ...b.slice(-7),
        { id, photo: pick(BURST_PHOTOS), tag: pick(BURST_TAGS), x: rand(2, 84), y: rand(6, 74), rot: rand(-24, 24), size: rand(110, 180) },
      ])
    }

    s.extra = (info) => {
      const { bar, step } = info
      if (bar < DROP_BAR || bar >= DROP_BAR + DROP_BARS) return
      // the drop: every beat hits, airhorns on the bars, photos everywhere
      if (step % 4 === 0) {
        s.pulse(info.at)
        spawnBurst()
        setPlays((p) => p + Math.floor(rand(120, 980)))
      }
      if (step === 0) {
        if (bar === DROP_BAR) sfx.boom()
        sfx.airhorn()
        if (!reduce) shake.set(shake.get() + 1)
      }
      if (step === 8 && Math.random() < 0.35) sfx.airhorn()
    }
    s.onStep = (info) => {
      setPlayhead(info.step)
      if (info.step === 0 && info.bar < DROP_BAR) setPlays((p) => p + 1)
    }

    const tick = () => {
      const now = performance.now()
      const t = clock.now(now)
      songT.current = t
      // the gap right before the drop: the rack holds its breath with the song
      s.muted = t >= TRACK.gap && t < TRACK.drop
      s.advance(t, now)
      if (waiters.current.length) {
        waiters.current = waiters.current.filter((w) => {
          if (t >= w.t) {
            w.resolve()
            return false
          }
          return true
        })
      }
      if (lcdRef.current) lcdRef.current.textContent = lcd(t)
      if (posRef.current) posRef.current.style.width = `${clamp01(t / TRACK.length) * 100}%`
      if (!reduce) {
        const env = s.kickEnvelope(now)
        chaos.setKick(env)
        verity.scale.set(1 + env * 0.3)
      }
    }
    let raf = 0
    const frame = () => {
      tick()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    // keeps the scene moving in a background tab (no animation frames there)
    const bg = window.setInterval(tick, 250)

    // muting the beat is illegal (once)
    const unsub = sfx.subscribe(() => {
      syncAudio()
      if (!sfx.enabled && !overrode.current) {
        overrode.current = true
        chat.post('muting an unreleased snippet is illegal.', 'verity', 'loud')
        timers.push(window.setTimeout(() => sfx.enable(), 900))
      }
    })

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(bg)
      timers.forEach((t) => window.clearTimeout(t))
      window.clearTimeout(flashTimer.current)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      unsub()
      s.extra = null
      s.onStep = null
      unannounce?.()
      unguard?.()
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        audio = null
      }
      chaos.setKick(0)
      verity.scale.set(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Resolve once the song reaches `t` seconds. */
  const waitSong = (t: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException('a', 'AbortError'))
      if (songT.current >= t) return resolve()
      const w = { t, resolve }
      waiters.current.push(w)
      signal.addEventListener(
        'abort',
        () => {
          waiters.current = waiters.current.filter((x) => x !== w)
          reject(new DOMException('a', 'AbortError'))
        },
        { once: true },
      )
    })

  const setRow = (row: Row, on: number[]) => {
    setPattern((p) => {
      const next = { ...p, [row]: p[row].map((_, i) => on.includes(i) || (on.length === 16 ? true : p[row][i])) }
      if (seq.current) seq.current.pattern = next
      return next
    })
  }

  const showFlash = (row: Row) => {
    window.clearTimeout(flashTimer.current)
    setFlash({ id: ++flashId.current, row })
    flashTimer.current = window.setTimeout(() => setFlash(null), 650)
  }

  const toggle = (row: Row, i: number) => {
    const turningOn = !pattern[row][i]
    setPattern((p) => {
      const next = { ...p, [row]: p[row].map((v, j) => (j === i ? !v : v)) }
      if (seq.current) seq.current.pattern = next
      return next
    })
    if (turningOn) {
      previewPad(row)
      showFlash(row)
    } else sfx.tick()
  }

  useScript(async (signal) => {
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    sfx.stopMusic()
    if (!sfx.enabled) sfx.enable()
    chaos.add('beat')
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    void verity.moveTo(window.innerWidth / 2, Math.max(150, window.innerHeight * 0.2), { size: 70, duration: 0.6, signal }).catch(() => {})
    objective.set('Cook the beat · click the pads')
    void say('cooking an underground beat. the website picks the sounds.', { hold: 500 }).catch(() => {})

    await waitSong(SECTION_AT.cowbell, signal)
    setSection('cowbell')
    setRow('cowbell', Array.from({ length: 16 }, (_, i) => i))
    sfx.cowbell()
    showFlash('cowbell')
    void say('added cowbell. very underground. you are welcome.').catch(() => {})

    await waitSong(SECTION_AT.horns, signal)
    setSection('horns')
    setRow('horn', [0, 6, 12])
    sfx.airhorn()
    showFlash('horn')
    void say('added airhorns. that is how you know it is a leak.').catch(() => {})

    await waitSong(SECTION_AT.build, signal)
    setSection('build')
    objective.set('Brace for the drop')
    void say('here it comes. hold on to your speakers.', { tone: 'loud' }).catch(() => {})

    // 3 · 2 · 1 in the gap, then the drop lands on the song's drop
    for (const c of COUNTDOWN) {
      await waitSong(c.at, signal)
      setCount(c.label)
    }
    await waitSong(SECTION_AT.drop, signal)
    setCount('DROP!!')
    setSection('drop')
    objective.set(null)
    chaos.swapText()
    if (!prefersReducedMotion()) chaos.add('drop')
    for (let b = 0; b < DROP_BARS; b++) {
      chat.post(DROP_LINES[b % DROP_LINES.length], 'verity', 'loud')
      if (b === Math.floor(DROP_BARS / 2)) {
        chaos.add('upside')
        chat.post('UPSIDE DOWN FOR SOME REASON', 'verity', 'loud')
      }
      await waitSong(SECTION_AT.drop + (b + 1) * BAR_S, signal)
      if (b === 0) setCount(null)
    }
    dispatch({ type: 'SCENE', scene: 'twist' })
  }, [])

  const drop = section === 'drop'

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[44] overflow-hidden">
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.figure
              key={b.id}
              className="kb-burst"
              style={{ left: `${b.x}vw`, top: `${b.y}vh`, width: b.size }}
              initial={{ scale: 0.2, opacity: 0, rotate: b.rot - 30 }}
              animate={{ scale: 1, opacity: 1, rotate: b.rot }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE.snap }}
            >
              <img src={b.photo.src} alt="" draggable={false} />
              <figcaption>{b.tag}</figcaption>
            </motion.figure>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        role="group"
        aria-label="FL Studio 2008 cracked step sequencer"
        className="kb-rack pointer-events-auto fixed left-1/2 top-[50%] z-[45] w-[min(820px,96vw)] -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: drop ? [0, -2, 2, 0] : -0.6 }}
        transition={drop ? { rotate: { duration: BEAT_S * 2, repeat: Infinity } } : { duration: 0.6, ease: EASE.snap }}
        data-testid="beat-scene"
        data-section={section}
      >
        <Stickers />

        <div className="kb-shake">
          <div className="kb-titlebar">
            <span className="kb-titlebar__icon" aria-hidden="true">
              <img src={objectMedia.cheese.src} alt="" draggable={false} />
            </span>
            <span className="kb-titlebar__text truncate">FL STUDIO 2008 CRACKED</span>
            <span className="kb-titlebar__file hidden truncate md:inline">kaineity_x_bleood_cursed_bootleg_FINAL(3).flp</span>
            <span className="kb-winbtns" aria-hidden="true">
              <span>_</span>
              <span>□</span>
              <span className="kb-winbtns__x">X</span>
            </span>
          </div>

          <div className="kb-menu" aria-hidden="true">
            <span className="hidden sm:inline">FILE</span>
            <span className="hidden sm:inline">EDIT</span>
            <span className="hidden sm:inline">CHANNELS</span>
            <span className="hidden sm:inline">LEAKS</span>
            <span className="hidden sm:inline">HELP</span>
            <span className="kb-menu__unreg">UNREGISTERED VERSION · keygen by xX_sl4tt_Xx</span>
          </div>

          <div className="kb-transport">
            <span className="kb-transport__play" aria-hidden="true">
              ▶
            </span>
            <span className="kb-lcd" aria-hidden="true">
              <span ref={lcdRef}>00:00.00</span>
            </span>
            <span className="kb-bpm">154 BPM</span>
            <span className={`kb-led ${drop ? 'kb-led--drop' : ''}`}>{section.toUpperCase()}</span>
            <span className="kb-plays ml-auto hidden sm:inline" aria-hidden="true">
              plays <b>{String(plays).padStart(7, '0')}</b>
            </span>
          </div>

          <div className="kb-marquee" aria-hidden="true">
            <span>{MARQUEE}</span>
          </div>

          <div className="space-y-1.5 p-2 sm:p-3">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center gap-1.5 sm:gap-2">
                <span className="kb-rowlabel w-[34px] shrink-0 sm:w-[118px]" style={{ color: ROW_COLOR[row] }}>
                  <img className="kb-rowlabel__photo" src={ROW_PHOTO[row].src} alt="" draggable={false} style={{ borderColor: ROW_COLOR[row] }} />
                  <span className="hidden truncate sm:inline">{ROW_LABEL[row]}</span>
                </span>
                <div className="grid flex-1 grid-cols-16 gap-[3px] sm:gap-1">
                  {pattern[row].map((on, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${ROW_LABEL[row]} step ${i + 1}`}
                      aria-pressed={on}
                      onClick={() => toggle(row, i)}
                      className={`kb-pad h-6 sm:h-7 ${Math.floor(i / 4) % 2 ? 'kb-pad--alt' : ''} ${playhead === i ? 'kb-pad--head' : ''}`}
                      style={on ? { borderColor: ROW_COLOR[row], boxShadow: playhead === i ? `0 0 14px ${ROW_COLOR[row]}` : undefined } : undefined}
                      data-testid={`pad-${row}-${i}`}
                    >
                      {on ? <img src={ROW_PHOTO[row].src} alt="" draggable={false} /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1 sm:gap-2" aria-hidden="true">
              <span className="w-[34px] shrink-0 sm:w-[118px]" />
              <div className="grid flex-1 grid-cols-16 gap-[3px] sm:gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className={`h-1.5 ${playhead === i ? 'bg-[#ffe600]' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="kb-song" aria-hidden="true">
            <span className="kb-song__name truncate">♫ kaineity_x_bleood_cursed_bootleg_FINAL(3).mp3</span>
            <span className="kb-song__bar">
              <span ref={posRef} className="kb-song__pos" />
              <span className="kb-song__drop" style={{ left: `${(TRACK.drop / TRACK.length) * 100}%` }}>
                DROP
              </span>
            </span>
            <span className="kb-song__dl hidden sm:inline">FREE DOWNLOAD</span>
          </div>
        </div>

        <AnimatePresence>
          {flash ? (
            <motion.figure
              key={flash.id}
              aria-hidden="true"
              className="kb-flash hidden xl:block"
              initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: 7 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE.snap }}
            >
              <img src={ROW_PHOTO[flash.row].src} alt="" draggable={false} />
              <figcaption style={{ background: ROW_COLOR[flash.row] }}>{ROW_LABEL[flash.row]}!!</figcaption>
            </motion.figure>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {count ? (
          <motion.p
            key={count}
            aria-live="assertive"
            className={`kb-count pointer-events-none fixed inset-x-0 top-[20%] z-[47] text-center leading-none ${
              count.length > 1 ? 'text-[clamp(84px,17vw,230px)]' : 'text-[clamp(120px,26vw,320px)]'
            }`}
            initial={{ scale: 2.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE.snap }}
          >
            {count}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </>
  )
}

/** Tilted 2008 stickers slapped on the studio window. Pure decoration. */
function Stickers() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] hidden lg:block">
      <span className="kb-sticker kb-sticker--cracked" style={{ right: -26, top: -22, rotate: '9deg' }}>
        CRACKED!!
      </span>
      <span className="kb-sticker kb-sticker--unreleased" style={{ left: -30, bottom: -18, rotate: '-7deg' }}>
        100% UNRELEASED
      </span>
      <span className="kb-sticker kb-sticker--famous" style={{ right: 26, bottom: -20, rotate: '4deg' }}>
        not trying to be famous
      </span>
      <figure className="kb-stamp" style={{ left: -54, top: -40, rotate: '-12deg' }}>
        <img src={objectMedia.seal.src} alt="" draggable={false} />
        <figcaption>seal approved</figcaption>
      </figure>
    </div>
  )
}
