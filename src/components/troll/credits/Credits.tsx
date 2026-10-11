import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { useStore } from '../../../lib/experience/store'
import { credits, fm } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { voice } from '../../../lib/audio/voice'
import { EASE } from '../../../lib/animation/timeline'
import { endMusic, PATIENCE, seek, setEndVolume, skip, startEndMusic, stopEndMusic, toggleEndMute, togglePlay } from '../../../lib/audio/endMusic'
import './Credits.css'

/** The developer's signature, from their own Discord profile (shared by them for this). */
const DEV = {
  name: 'V',
  handle: '757valentino',
  aka: 'kai',
  tag: 'xes',
  avatar: '/media/dev-avatar.png',
  link: 'https://e-z.bio/ar',
} as const

/**
 * The very end: every other song stops, "patience" by revivle plays, and the
 * credits page opens on top of the ending card.
 */
export function EndMusic() {
  useEffect(() => {
    fm.set('off')
    sfx.stopMusic()
    sfx.hum(false)
    voice.stop()
    startEndMusic()
    credits.set(true)
    return () => {
      stopEndMusic()
      credits.set(false)
    }
  }, [])
  return null
}

const clock = (s: number) => {
  const t = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function Glyph({ name }: { name: 'play' | 'pause' | 'back' | 'forward' | 'vol' | 'mute' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': true as const }
  switch (name) {
    case 'play':
      return <svg {...common} fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
    case 'pause':
      return <svg {...common} fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.2" /></svg>
    case 'back':
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v5h5" /><text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none">10</text></svg>
    case 'forward':
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5h-5" /><text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none">10</text></svg>
    case 'vol':
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
    case 'mute':
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d="m17 9 5 6M22 9l-5 6" /></svg>
  }
}

function Player() {
  const s = useStore(endMusic)
  const pct = s.duration ? (s.time / s.duration) * 100 : 0
  const vol = s.muted ? 0 : s.volume

  return (
    <div className="cr-player" data-testid="music-player" data-playing={s.playing} data-src={PATIENCE.src}>
      <div className="flex items-center gap-3">
        <a
          href={PATIENCE.link}
          target="_blank"
          rel="noopener noreferrer"
          className="cr-cover"
          aria-label={`Listen to ${PATIENCE.title} by ${PATIENCE.artist} on SoundCloud (opens in a new tab)`}
          title="Open on SoundCloud"
          data-testid="player-cover"
        >
          <img src={PATIENCE.cover} alt="" width={157} height={157} draggable={false} />
          <span className="cr-cover__badge" aria-hidden="true">↗</span>
        </a>
        <div className="min-w-0 flex-1 text-left">
          <p className="cr-eyebrow">{s.playing ? 'now playing' : 'paused'}</p>
          <p className="cr-track" data-testid="player-title">
            {PATIENCE.title} <span>by</span> {PATIENCE.artist}
          </p>
        </div>
      </div>

      <div className="mt-3" data-player-controls>
        <input
          type="range"
          min={0}
          max={s.duration || 0}
          step={0.1}
          value={Math.min(s.time, s.duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          className="cr-range w-full"
          style={{ '--fill': `${pct}%` } as React.CSSProperties}
          aria-label="Song progress"
          aria-valuetext={`${clock(s.time)} of ${clock(s.duration)}`}
          disabled={!s.duration}
          data-testid="player-progress"
        />
        <div className="flex justify-between font-mono text-[11px] tabular-nums opacity-70">
          <span data-testid="player-time">{clock(s.time)}</span>
          <span data-testid="player-duration">{clock(s.duration)}</span>
        </div>

        <div className="mt-1 flex items-center justify-center gap-3">
          <button type="button" className="cr-btn" onClick={() => skip(-10)} aria-label="Back 10 seconds" data-testid="player-back">
            <Glyph name="back" />
          </button>
          <button type="button" className="cr-btn cr-btn--main" onClick={togglePlay} aria-label={s.playing ? 'Pause' : 'Play'} data-testid="player-toggle">
            <Glyph name={s.playing ? 'pause' : 'play'} />
          </button>
          <button type="button" className="cr-btn" onClick={() => skip(10)} aria-label="Skip 10 seconds" data-testid="player-skip">
            <Glyph name="forward" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          <button type="button" className="cr-btn cr-btn--small" onClick={toggleEndMute} aria-label={s.muted ? 'Unmute' : 'Mute'} aria-pressed={s.muted} data-testid="player-mute">
            <Glyph name={s.muted || s.volume === 0 ? 'mute' : 'vol'} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => setEndVolume(Number(e.target.value))}
            className="cr-range w-40"
            style={{ '--fill': `${vol * 100}%` } as React.CSSProperties}
            aria-label="Volume"
            aria-valuetext={`${Math.round(vol * 100)} %`}
            data-testid="player-volume"
          />
        </div>
      </div>
    </div>
  )
}

/** The end credits as a link-in-bio page: one card in the middle, the developer's profile and the song. */
export function Credits() {
  const open = useStore(credits)
  const { leave } = useExperience()
  const reduce = useReducedMotion()
  const toEnding = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) toEnding.current?.focus({ preventScroll: true })
  }, [open])

  if (!open) return null

  return (
    <div className="cr-page fixed inset-0 z-[55] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="credits-title" data-testid="credits">
      <div className="cr-bg" aria-hidden="true" style={{ backgroundImage: `url(${PATIENCE.cover})` }} />
      <div className="relative flex min-h-full flex-col items-center justify-center gap-5 px-4 py-8">
        <motion.section
          className="cr-bio"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE.outExpo }}
          data-testid="dev-card"
        >
          <span className="cr-bio__avatar">
            <img src={DEV.avatar} alt={`${DEV.handle}'s avatar`} width={240} height={240} draggable={false} />
            <span className="cr-bio__status" aria-label="online" role="img" />
          </span>

          <h2 id="credits-title" className="cr-bio__made">
            <span>Made by</span>
            <span className="cr-bio__handle" data-testid="credits-author">{DEV.handle}</span>
          </h2>
          <p className="cr-bio__meta">
            <span className="font-bold">{DEV.name}</span>
            <span aria-hidden="true">•</span>
            <span>{DEV.aka}</span>
            <span className="cr-bio__tag">{DEV.tag}</span>
          </p>
          <p className="cr-bio__about">
            developer of this website<span className="cr-caret" aria-hidden="true" />
          </p>

          <div className="cr-bio__links">
            <a href={DEV.link} target="_blank" rel="noopener noreferrer" className="cr-link" data-testid="dev-link">
              {DEV.link.replace('https://', '')}
              <span aria-hidden="true">↗</span>
            </a>
            <a href={PATIENCE.link} target="_blank" rel="noopener noreferrer" className="cr-link">
              {PATIENCE.title} on SoundCloud
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <Player />

          <p className="cr-bio__fine">An unofficial fan project for Eric Kaine (@eric2kaine). Not affiliated with him or YouTube.</p>
        </motion.section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button ref={toEnding} type="button" className="cr-cta" onClick={() => credits.set(false)} data-testid="credits-to-ending">
            See your ending
          </button>
          <button type="button" className="cr-cta cr-cta--ghost" onClick={() => void leave({ quiet: true })} data-testid="credits-back-to-archive">
            Back to the archive
          </button>
        </div>
      </div>
    </div>
  )
}
