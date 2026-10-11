import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { useStore } from '../../lib/experience/store'
import { useSfxState } from '../shared/useSfx'
import {
  answer,
  callLevel,
  chooseCallDevices,
  decline,
  devMessages,
  dismissMessage,
  hangUp,
  liveCall,
  liveId,
  liveOnline,
  reportState,
  setCallGain,
  setCallMuted,
  startLive,
  toggleMic,
  type DevMessage,
} from '../../lib/live/client'
import { CallLevels } from './CallLevels'
import { DevicePicker } from './DevicePicker'

/**
 * The live developer line, on top of everything (including the takeover):
 * the visitor number in the top-left corner, developer messages that appear
 * on their own, and incoming calls from the site owner.
 */

const TOP = 'z-[2147483000]'

function PhoneGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
    </svg>
  )
}

function useClock(since: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (since === null) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [since])
  if (since === null) return '00:00'
  const s = Math.max(0, Math.floor((now - since) / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function MessageCard({ m }: { m: DevMessage }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!m.ttl) return
    const t = window.setTimeout(() => dismissMessage(m.mid), m.ttl * 1000)
    return () => window.clearTimeout(t)
  }, [m.mid, m.ttl])

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.92, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      className="pointer-events-auto w-full overflow-hidden border-[3px] border-verity bg-ink text-paper shadow-[0_18px_60px_rgb(0_0_0/0.65),6px_6px_0_var(--color-verity)]"
      data-testid="dev-message"
    >
      <div className="flex items-center gap-3 border-b-[3px] border-verity bg-black pr-2">
        <span className="hazard h-8 w-8 shrink-0" aria-hidden="true" />
        <span className="pixel text-[15px] tracking-wide text-verity">DEVELOPER MESSAGE</span>
        <span className="font-mono text-[11px] uppercase text-muted">{m.all ? 'to everyone here' : 'to you'}</span>
        <button
          type="button"
          onClick={() => dismissMessage(m.mid)}
          className="ml-auto grid h-7 w-7 place-items-center font-mono text-[15px] text-paper-2 hover:bg-verity hover:text-ink focus-visible:bg-verity focus-visible:text-ink"
          aria-label="Close developer message"
        >
          ✕
        </button>
      </div>
      <p className="whitespace-pre-wrap break-words px-5 py-4 font-display text-[clamp(20px,2.4vw,30px)] font-extrabold leading-[1.15]">{m.text}</p>
      {m.ttl > 0 && (
        <motion.div
          className="h-1 origin-left bg-verity"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: m.ttl, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  )
}

function Bars({ active }: { active: boolean }) {
  const [level, setLevel] = useState(0)
  const [frames, setFrames] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      const l = callLevel()
      setLevel(l.level)
      setFrames(l.frames)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  const v = Math.min(1, level * 3)
  return (
    <span className="flex h-4 items-end gap-[2px]" aria-hidden="true" data-testid="call-bars" data-frames={frames} data-level={level.toFixed(3)}>
      {[0.25, 0.5, 0.75, 1, 0.6].map((k, i) => (
        <span key={i} className="w-[3px] bg-verity transition-[height] duration-75" style={{ height: `${Math.max(15, Math.min(100, v * 100 * k + 15))}%` }} />
      ))}
    </span>
  )
}

function CallUi({ id }: { id: string | null }) {
  const call = useStore(liveCall)
  const reduce = useReducedMotion()
  const clock = useClock(call.phase === 'connected' ? call.since : null)
  const [settings, setSettings] = useState(false)

  return (
    <AnimatePresence>
      {call.phase === 'ringing' && (
        <motion.div
          key="ringing"
          className={`pointer-events-none fixed inset-0 ${TOP} grid place-items-center p-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="alertdialog"
            aria-labelledby="live-ring-title"
            aria-describedby="live-ring-desc"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="pointer-events-auto w-[min(420px,100%)] border-[3px] border-verity bg-ink p-5 text-paper shadow-[0_24px_80px_rgb(0_0_0/0.75),8px_8px_0_var(--color-verity)]"
            data-testid="incoming-call"
          >
            <div className="flex items-center gap-4">
              <motion.span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-verity text-ink"
                animate={reduce ? undefined : { rotate: [0, -14, 14, -10, 10, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.9 }}
              >
                <PhoneGlyph size={28} />
              </motion.span>
              <div>
                <p id="live-ring-title" className="pixel text-[20px] leading-none text-verity">INCOMING CALL</p>
                <p id="live-ring-desc" className="mt-2 text-[15px] leading-snug text-paper-2">
                  The developer of this site is calling you{id ? <> (visitor <span className="font-mono text-paper">#{id}</span>)</> : null}.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={answer}
                className="flex items-center justify-center gap-2 bg-[#1fbf4a] px-4 py-3 font-display text-[16px] font-extrabold text-black hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                data-testid="call-answer"
              >
                <PhoneGlyph /> Answer
              </button>
              <button
                type="button"
                onClick={decline}
                className="flex items-center justify-center gap-2 bg-signal px-4 py-3 font-display text-[16px] font-extrabold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                data-testid="call-decline"
              >
                <span className="inline-block rotate-[135deg]"><PhoneGlyph /></span> Decline
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {call.phase === 'connected' && (
        <motion.div
          key="connected"
          role="region"
          aria-label="Call with the developer"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className={`fixed left-2 top-[84px] ${TOP} w-[min(280px,calc(100vw-16px))] border-2 border-verity bg-ink/95 p-3 text-paper shadow-[4px_4px_0_var(--color-verity)]`}
          data-testid="call-widget"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1fbf4a]" aria-hidden="true" />
            <span className="pixel text-[13px] text-verity">ON CALL · DEVELOPER</span>
            <span className="ml-auto font-mono text-[12px] tabular-nums text-paper-2" data-testid="call-clock">{clock}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-paper-2">
            <Bars active />
            <span>you can hear the developer</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void toggleMic()}
              disabled={call.mic === 'starting'}
              aria-pressed={call.mic === 'on'}
              className={`px-2 py-2 font-display text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-paper ${call.mic === 'on' ? 'bg-verity text-ink' : 'border border-line-2 bg-ink-3 text-paper hover:bg-ink-4'}`}
              data-testid="call-mic"
            >
              {call.mic === 'on' ? '🎤 Mic on' : call.mic === 'starting' ? 'Starting…' : call.mic === 'blocked' ? 'Mic blocked' : '🎤 Talk back'}
            </button>
            <button
              type="button"
              onClick={hangUp}
              className="bg-signal px-2 py-2 font-display text-[13px] font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-paper"
              data-testid="call-hangup"
            >
              Hang up
            </button>
            <button
              type="button"
              onClick={() => setCallMuted(!call.muted)}
              disabled={call.mic !== 'on'}
              aria-pressed={call.muted}
              className={`px-2 py-2 font-display text-[13px] font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-paper ${call.muted ? 'bg-signal text-white' : 'border border-line-2 bg-ink-3 text-paper hover:bg-ink-4'}`}
              data-testid="call-mute"
            >
              {call.muted ? '🔇 Muted' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={() => setSettings((v) => !v)}
              aria-expanded={settings}
              className="border border-line-2 bg-ink-3 px-2 py-2 font-display text-[13px] font-bold text-paper hover:bg-ink-4 focus-visible:outline-2 focus-visible:outline-paper"
              data-testid="call-audio"
            >
              ⚙ Audio
            </button>
          </div>
          {settings ? (
            <div className="mt-3 space-y-3 border-t border-line-2 pt-3">
              <CallLevels lang="en" onChange={setCallGain} testPrefix="call" />
              <DevicePicker lang="en" onChange={(next) => void chooseCallDevices(next)} testPrefix="call" />
            </div>
          ) : null}
        </motion.div>
      )}

      {call.phase === 'ended' && (
        <motion.div
          key="ended"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed left-2 top-[84px] ${TOP} border-2 border-line-2 bg-ink px-3 py-2 font-mono text-[12px] text-paper-2`}
          data-testid="call-ended"
        >
          {call.reason}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function LiveLayer() {
  const { state } = useExperience()
  const sound = useSfxState()
  const online = useStore(liveOnline)
  const id = useStore(liveId)
  const messages = useStore(devMessages)
  const [visible, setVisible] = useState(() => !document.hidden)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    startLive()
  }, [])

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    reportState({ phase: state.phase, scene: state.scene, route: state.route, sound: sound.enabled, visible, volume: sound.volume, music: sound.music, voice: sound.voice })
  }, [state.phase, state.scene, state.route, sound.enabled, visible, sound.volume, sound.music, sound.voice])

  return (
    <>
      {id && (
        <div
          className={`pointer-events-none fixed left-1 top-1 ${TOP} flex items-center gap-1 bg-black/70 px-1.5 py-[1px] font-mono text-[11px] leading-4 tracking-wide text-paper-2`}
          title="Your visitor number"
          data-testid="live-id"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-[#1fbf4a]' : 'bg-dim'}`} aria-hidden="true" />
          <span>#{id}</span>
        </div>
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 top-[76px] ${TOP} mx-auto flex w-[min(620px,calc(100vw-24px))] flex-col gap-3`}
        role="alert"
        aria-live="assertive"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageCard key={m.mid} m={m} />
          ))}
        </AnimatePresence>
      </div>

      <CallUi id={id} />
    </>
  )
}
