import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStore } from '../../lib/experience/store'
import { nowPlaying } from '../../lib/audio/nowPlaying'

/** Small "currently playing" card in the top-right corner, for whichever song is actually audible. */
export function NowPlaying() {
  const current = useStore(nowPlaying)
  const reduce = useReducedMotion()
  const [state, setState] = useState({ playing: false, t: 0, d: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = current?.el
    if (!el) return
    const sync = () => setState({ playing: !el.paused && !el.muted && el.volume > 0, t: el.currentTime, d: Number.isFinite(el.duration) ? el.duration : 0 })
    sync()
    const events = ['play', 'pause', 'playing', 'timeupdate', 'durationchange', 'volumechange', 'ended'] as const
    events.forEach((e) => el.addEventListener(e, sync))
    return () => events.forEach((e) => el.removeEventListener(e, sync))
  }, [current])

  // appear at once, disappear only after 1.5 s of silence (the beat has a short muted gap before its drop)
  useEffect(() => {
    if (current && state.playing) {
      setVisible(true)
      return
    }
    const t = window.setTimeout(() => setVisible(false), current ? 1500 : 0)
    return () => window.clearTimeout(t)
  }, [current, state.playing])

  const show = !!current && visible
  const pct = state.d ? Math.min(100, (state.t / state.d) * 100) : 0

  return (
    <AnimatePresence>
      {show && current ? (
        <motion.div
          key={current.track.title}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none fixed right-2 top-[76px] z-[54] w-[min(270px,calc(100vw-16px))] overflow-hidden rounded-[10px] border-2 border-black bg-[#111]/95 text-white shadow-[4px_4px_0_#ffd21f] sm:right-4"
          role="status"
          aria-label={`Currently playing: ${current.track.title} by ${current.track.artist}`}
          data-testid="now-playing"
          data-track={current.track.title}
        >
          <div className="flex items-center gap-2.5 p-2">
            <img src={current.track.cover} alt="" width={44} height={44} draggable={false} className="h-11 w-11 flex-none rounded-[6px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#ffd21f]">
                <span className="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-[2px] bg-[#ffd21f]"
                      style={reduce ? { height: '60%' } : { height: '100%', animation: `np-eq 0.${7 + i}s ease-in-out ${i * 0.15}s infinite alternate`, transformOrigin: 'bottom' }}
                    />
                  ))}
                </span>
                currently playing
              </p>
              <p className="truncate text-[13px] font-bold leading-tight" data-testid="now-playing-title">{current.track.title}</p>
              <p className="truncate text-[12px] leading-tight text-white/70" data-testid="now-playing-artist">{current.track.artist}</p>
            </div>
          </div>
          <div className="h-[3px] bg-white/15" aria-hidden="true">
            <div className="h-full bg-[#ffd21f]" style={{ width: `${pct}%` }} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
