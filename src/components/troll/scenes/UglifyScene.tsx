import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { backdrop, songTwo } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { scrollToY } from '../../../lib/interactions/scroll'
import { pick, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { useScript } from '../useScript'
import './UglifyScene.css'

/**
 * Protocol 04 · MySpace era. "If it looks like a 2008 fan page, nobody will
 * share it." Eric Kaineity redesigns the real archive, step by step, into the
 * worst underground rap fan page on the internet: comic sans, a tiled cheese
 * wallpaper, a visitor counter, photo stickers, a SoundCloud rip player, a
 * Top 8 — and a guided tour of the damage.
 */

interface Stamp {
  id: string
  media: RealMedia
  label: string
  note: string
}

const STAMPS = {
  font: { id: 'font', media: artistMedia.slimey, label: 'COMIC SANS', note: '2slimey approved' },
  wall: { id: 'wall', media: objectMedia.cheese, label: 'CHEESE WALLPAPER', note: 'tiled. obviously.' },
  wordart: { id: 'wordart', media: artistMedia.carti, label: 'WORDART', note: 'mixtape cover energy' },
  counter: { id: 'counter', media: objectMedia.seal, label: 'VISITOR COUNTER', note: 'seal of approval' },
  stickers: { id: 'stickers', media: artistMedia.jaydes, label: 'PHOTO STICKERS', note: 'lots of them' },
  player: { id: 'player', media: artistMedia.bleood, label: 'SOUNDCLOUD PLAYER', note: 'plays snippets only' },
  wobble: { id: 'wobble', media: artistMedia.osamason, label: 'WOBBLE', note: 'rage mode: on' },
  top8: { id: 'top8', media: artistMedia.slayr, label: 'TOP 8', note: 'you are not in it' },
} satisfies Record<string, Stamp>

const LEAKS = [
  { id: 'zip', label: 'DOWNLOAD FREE LEAKS', sub: 'unreleased_snippets.zip · 13.3 MB' },
  { id: 'mp3', label: 'FREE DOWNLOAD', sub: 'cursed_bootleg_v3.mp3' },
  { id: 'snip', label: 'CLICK HERE 4 SNIPPETS', sub: '100% real. not a virus.' },
] as const

const LEAK_LINES = ['nice try. the leaks are gatekept.', 'that button is fake. like every leak.', 'downloading. just kidding.', 'no free leaks. this page is gatekept.']

export function UglifyScene() {
  const { dispatch } = useExperience()
  const [stamp, setStamp] = useState<Stamp | null>(null)
  const [profile, setProfile] = useState(false)
  const [leaks, setLeaks] = useState(false)

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    const step = async (fn: () => void, line: string, sound: () => void = () => sfx.glitch(), card?: Stamp) => {
      fn()
      sound()
      if (card) setStamp(card)
      await say(line, { hold: 1300 })
    }

    backdrop.set('none')
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    const parkX = Math.min(window.innerWidth - 70, window.innerWidth * 0.86)
    void verity.moveTo(parkX, window.innerHeight * 0.66, { size: 72, duration: 0.8, signal }).catch(() => {})
    await scrollToY(0, reduce ? 0 : 600, signal)

    await say('new plan.', { hold: 900 })
    await say('if it looks like a 2008 fan page, nobody will share it.')
    objective.set('Protocol 04 · Make it a 2008 fan page')

    await step(
      () => {
        chaos.add('font')
        setProfile(true)
      },
      'step one: comic sans. like a real underground fan page.',
      undefined,
      STAMPS.font,
    )
    await step(() => chaos.add('rainbow'), 'step two: a tiled wallpaper. real cheese. obviously.', () => sfx.whoosh(), STAMPS.wall)
    await step(() => chaos.add('wordart'), 'step three: wordart. like a mixtape cover from 2008.', () => sfx.boing(), STAMPS.wordart)
    await step(
      () => {
        chaos.widget('marquee')
        chaos.widget('counter')
        setLeaks(true)
      },
      'step four: a visitor counter. nobody shares a page with a visitor counter.',
      () => sfx.errorDing(),
      STAMPS.counter,
    )
    await step(() => chaos.add('borders'), 'step five: borders and photo stickers. lots of stickers.', () => sfx.thud(0.7), STAMPS.stickers)

    // the sound joke: "keep it silent" was never really an option
    if (!sfx.enabled) {
      sfx.forced = true
      sfx.enable()
      await say('i turned your sound back on. you’re welcome.', { tone: 'loud' })
    }
    // song 2, "bloody" by 2Slimey (it replaced the old chiptune here)
    songTwo.set(true)
    await step(() => chaos.widget('construction'), 'step six: a soundcloud player. it only plays snippets.', () => sfx.errorDing(3), STAMPS.player)
    await step(
      () => {
        chaos.add('wobble')
        chaos.add('cursor')
        chaos.widget('trail')
      },
      'step seven: everything wobbles now. rage mode.',
      () => sfx.boing(),
      STAMPS.wobble,
    )
    setStamp(null)

    // the guided tour of the damage
    objective.set('Enjoy the fan page tour')
    const max = document.documentElement.scrollHeight - window.innerHeight
    const stops: [string, string][] = [
      ['latest', 'the newest snippets: ugly.'],
      ['streams', 'the radio sessions: very ugly.'],
      ['about', 'the bio: a crime.'],
      ['archive', 'the leak vault: i don’t even know what that is.'],
    ]
    for (const [id, line] of stops) {
      const el = document.getElementById(id)
      if (!el) continue
      const y = Math.min(max, el.getBoundingClientRect().top + window.scrollY - 60)
      void say(line, { hold: 700 }).catch(() => {})
      await scrollToY(y, reduce ? 0 : 1100, signal)
      sfx.squeak()
      await wait(900, signal)
    }
    await scrollToY(0, reduce ? 0 : 900, signal)

    objective.set('Rate the fan page')
    await say('be honest. is it ugly enough for 2008?', { hold: 200 })
    const c = await ask(
      [
        { id: 'hideous', label: 'It’s hideous', tone: 'yellow' },
        { id: 'beautiful', label: 'Honestly… it goes hard' },
      ],
      signal,
    )
    if (c === 'beautiful') {
      await say('IT GOES HARD??', { tone: 'loud', hold: 700 })
      await say('fine. MORE.', { tone: 'loud' })
    } else {
      await say('hideous isn’t enough. it needs to be more underground.')
    }
    chaos.add('tilt')
    chaos.widget('badge')
    chaos.widget('webring')
    sfx.crash()
    setStamp(STAMPS.top8)
    await say('there. it’s leaning now. and i added my top eight.', { hold: 1400 })
    setStamp(null)
    objective.set(null)
    await say('hm. people might still share it ironically.', { hold: 1200 })
    await say('time for popups. free leaks for everyone.', { tone: 'loud', hold: 600 })
    dispatch({ type: 'SCENE', scene: 'popups' })
  }, [])

  return (
    <div className="ug4-scene pointer-events-none fixed inset-0 z-[45]" data-troll-ui data-testid="uglify-scene">
      {profile || leaks ? (
        <div className="absolute left-4 top-[140px] hidden w-[236px] flex-col gap-4 md:flex lg:left-6 lg:top-[150px]">
          {profile ? <ProfileBox /> : null}
          {leaks ? <FreeLeaks /> : null}
        </div>
      ) : null}
      <AnimatePresence>{stamp ? <StampCard key={stamp.id} stamp={stamp} /> : null}</AnimatePresence>
    </div>
  )
}

/** Eric Kaineity's MySpace profile box. Pure decoration. */
function ProfileBox() {
  return (
    <div className="ug4-profile" aria-hidden="true">
      <p className="ug4-profile-name">Eric Kaineity</p>
      <div className="ug4-profile-body">
        <img src={characterMedia.kaineity.src} alt="" draggable={false} />
        <div>
          <p className="ug4-quote">&quot;not trying to be famous&quot;</p>
          <p>Mood: gatekeeping</p>
          <p>Listening to: unreleased</p>
          <p className="ug4-online">● Online Now!</p>
        </div>
      </div>
      <div className="ug4-contact">
        <p className="ug4-contact-head">Contacting Eric Kaineity</p>
        <div className="ug4-contact-grid">
          <span>Add to Friends</span>
          <span>Send Message</span>
          <span>Rank User</span>
          <span>Block User</span>
        </div>
      </div>
    </div>
  )
}

/** Fake download buttons. They download nothing; they only annoy the guide. */
function FreeLeaks() {
  const reduce = useReducedMotion()
  const [busy, setBusy] = useState<string | null>(null)
  const lastLine = useRef(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const press = (id: string) => {
    sfx.errorDing()
    setBusy(id)
    timers.current.push(window.setTimeout(() => setBusy((b) => (b === id ? null : b)), 1300))
    const now = Date.now()
    if (now - lastLine.current > 2200) {
      lastLine.current = now
      chat.post(pick(LEAK_LINES))
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={reduce ? { opacity: 0 } : { x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 13 }}
      role="group"
      aria-label="Free leaks"
    >
      {LEAKS.map((l) => (
        <button key={l.id} type="button" className="ug4-leak" onClick={() => press(l.id)} data-busy={busy === l.id ? '' : undefined} data-testid={`free-leak-${l.id}`}>
          <span className="ug4-leak-label">{busy === l.id ? 'DOWNLOADING… 99%' : `▼ ${l.label}`}</span>
          <span className="ug4-leak-sub">{l.sub}</span>
        </button>
      ))}
    </motion.div>
  )
}

/** The "step complete" photo sticker that slaps onto the screen. */
function StampCard({ stamp }: { stamp: Stamp }) {
  const reduce = useReducedMotion()
  return (
    <div className="absolute inset-x-0 top-[26%] flex justify-center px-4 sm:top-[30%]" aria-hidden="true">
      <motion.div
        className="ug4-stamp"
        initial={reduce ? { opacity: 0 } : { scale: 2.2, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: -5, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { scale: 0.7, rotate: 8, opacity: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 18 }}
      >
        <img src={stamp.media.src} alt="" draggable={false} />
        <div className="min-w-0">
          <p className="ug4-stamp-label">
            {stamp.label} <span className="ug4-stamp-check">✓</span>
          </p>
          <p className="ug4-stamp-note">{stamp.note}</p>
        </div>
      </motion.div>
    </div>
  )
}
