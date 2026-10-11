import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../lib/experience/store'
import { ID_RE, MAX_TEXT, MAX_VOICE, type VisitorInfo } from '../lib/live/protocol'
import { call, chooseCallDevices, clearScreens, conn, hangup, levels, log, login, logout, mixDefault, reloadVisitor, savedKey, sendMessage, setCallGain, setMix, setMuted, setVisitorVolume, startCall, visitors } from './hub'
import { CallLevels } from '../components/live/CallLevels'
import { DevicePicker } from '../components/live/DevicePicker'

const SCENES: Record<string, string> = {
  intro: 'Intro (la guía se presenta)',
  redact: 'Redactando (ruta "Help")',
  collapse: 'Colapso de la web',
  pile: '01 · The pile',
  lights: '02 · Leak hunt (linterna)',
  button: '03 · Follow button',
  meltdown: 'Broadcast',
  uglify: '04 · MySpace era',
  popups: '05 · Free leaks (popups)',
  clones: '06 · Industry plants',
  beat: '07 · Cursed beat',
  twist: 'Twist (Bleoodity / 404)',
  label: '08 · The label',
  foodfight: '09 · Cheese fight',
  brainrot: '10 · Snippet brainrot',
  mosh: '11 · Mosh pit',
  legend: 'Final (1.5B subs)',
  ending: 'Pantalla de final',
}

function where(v: VisitorInfo) {
  if (v.s.scene) return SCENES[v.s.scene] ?? v.s.scene
  if (v.s.phase === 'foreshadow') return 'Web normal (guía acoplada)'
  return 'Web normal (todavía no empezó)'
}

/** The visitor number of the site open in this same browser (if any). */
function ownVisitorId(): string | null {
  try {
    const id = (JSON.parse(localStorage.getItem('ek-archive:live') ?? 'null') as { id?: string } | null)?.id
    return id && ID_RE.test(id) ? id : null
  } catch {
    return null
  }
}

/** A tab opened before the latest deploy (it reports another build, or none). */
const outdated = (v: VisitorInfo) => (v.s.build ?? '') !== __BUILD__

const QUICK = [
  'Click the yellow orb in the corner 👀',
  'Look at the top-left corner of your screen',
  'Say hi to chat for me',
  'Don’t leave yet. It gets worse.',
  'Answer the call 📞',
]

const TTLS = [
  { v: 6, label: '6 s' },
  { v: 10, label: '10 s' },
  { v: 20, label: '20 s' },
  { v: 45, label: '45 s' },
  { v: 0, label: 'Hasta que lo cierre' },
]

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Meter({ label, which }: { label: string; which: 'me' | 'them' }) {
  const [v, setV] = useState(0)
  const [frames, setFrames] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const l = levels()
      setV(l[which])
      setFrames(l.frames)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [which])
  return (
    <div className="flex items-center gap-3 text-[12px] text-paper-2" data-testid={`meter-${which}`} data-frames={which === 'them' ? frames : undefined} data-level={v.toFixed(3)}>
      <span className="w-28 shrink-0">{label}</span>
      <span className="h-2 flex-1 bg-ink-4">
        <span className="block h-full bg-verity transition-[width] duration-75" style={{ width: `${Math.min(100, v * 160)}%` }} />
      </span>
    </div>
  )
}

function Login() {
  const state = useStore(conn)
  const [key, setKey] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (key.trim()) login(key.trim())
  }
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <form onSubmit={submit} className="w-[min(420px,100%)] border border-line-2 bg-ink-2 p-6">
        <p className="pixel text-[18px] text-verity">LÍNEA DEV</p>
        <h1 className="mt-1 font-display text-[28px] font-extrabold">Panel de admin</h1>
        <label className="mt-6 block text-[13px] text-paper-2" htmlFor="admin-key">
          Clave de admin
        </label>
        <input
          id="admin-key"
          type="password"
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-2 w-full border border-line-2 bg-ink px-3 py-2 font-mono text-[15px] outline-none focus:border-verity"
          data-testid="admin-key"
        />
        {state === 'denied' && <p className="mt-3 text-[13px] text-signal-2">Clave incorrecta.</p>}
        <button type="submit" className="mt-5 w-full bg-verity px-4 py-2.5 font-display font-extrabold text-ink hover:brightness-105" data-testid="admin-login">
          Entrar
        </button>
        <p className="mt-5 text-[12px] leading-relaxed text-muted">
          La clave se define en Cloudflare con <code className="font-mono text-paper-2">npx wrangler secret put ADMIN_KEY</code>.
        </p>
      </form>
    </main>
  )
}

function CallCard({ target, setTarget }: { target: string; setTarget: (v: string) => void }) {
  const c = useStore(call)
  const now = useNow()
  const active = c.phase === 'mic' || c.phase === 'ringing' || c.phase === 'connected'
  const status: Record<string, string> = {
    idle: 'Escribí el número que ves arriba a la izquierda en su pantalla.',
    mic: 'Abriendo tu micrófono…',
    'mic-blocked': 'Tu micrófono está bloqueado. Habilitalo en el candado de la barra de direcciones.',
    ringing: `Sonando en #${c.id}…`,
    connected: `En llamada con #${c.id} · ${c.since ? mmss(now - c.since) : '00:00'}`,
    ended: 'Llamada terminada.',
    declined: `#${c.id} rechazó la llamada.`,
    'no-answer': `#${c.id} no contestó.`,
    offline: `#${c.id} no está conectado ahora.`,
    busy: `#${c.id} ya está en otra llamada.`,
  }

  return (
    <section className="border border-line-2 bg-ink-2 p-5" aria-labelledby="call-h">
      <h2 id="call-h" className="pixel text-[16px] text-verity">LLAMAR</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (ID_RE.test(target)) void startCall(target)
        }}
      >
        <span className="grid place-items-center border border-line-2 bg-ink px-3 font-mono text-muted">#</span>
        <input
          inputMode="numeric"
          maxLength={5}
          placeholder="48213"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="w-full min-w-0 border border-line-2 bg-ink px-3 py-2 font-mono text-[20px] tracking-[0.2em] outline-none focus:border-verity"
          aria-label="Número del visitante"
          data-testid="call-target"
        />
        <button
          type="submit"
          disabled={!ID_RE.test(target) || active}
          className="shrink-0 bg-[#1fbf4a] px-5 font-display font-extrabold text-black disabled:opacity-40"
          data-testid="admin-call"
        >
          Llamar
        </button>
      </form>
      <details className="mt-3 border border-line-2 bg-ink px-3 py-2" open>
        <summary className="cursor-pointer text-[12px] text-paper-2">Audio de la llamada</summary>
        <div className="mt-2 space-y-3">
          <CallLevels lang="es" onChange={setCallGain} testPrefix="admin" />
          <DevicePicker lang="es" onChange={(next) => void chooseCallDevices(next)} testPrefix="admin" />
        </div>
      </details>
      <p className={`mt-3 text-[14px] ${c.phase === 'connected' ? 'text-[#4be37a]' : 'text-paper-2'}`} data-testid="admin-call-status" data-phase={c.phase}>
        {status[c.phase]}
      </p>
      {active && (
        <div className="mt-4 space-y-2">
          <Meter label="Tu micrófono" which="me" />
          <Meter label={c.visitorMic ? 'Visitante (mic on)' : 'Visitante (mic off)'} which="them" />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMuted(!c.muted)}
              disabled={c.phase !== 'connected'}
              className={`flex-1 px-3 py-2 font-display text-[14px] font-bold disabled:opacity-40 ${c.muted ? 'bg-verity text-ink' : 'border border-line-2 bg-ink-3'}`}
              aria-pressed={c.muted}
              data-testid="admin-mute"
            >
              {c.muted ? 'Mic silenciado' : 'Silenciar mi mic'}
            </button>
            <button type="button" onClick={hangup} className="flex-1 bg-signal px-3 py-2 font-display text-[14px] font-bold text-white" data-testid="admin-hangup">
              {c.phase === 'connected' ? 'Colgar' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/** Everything for the chosen session in one place: where they are, their volume, call and message. */
function SessionCard({ target, setTarget }: { target: string; setTarget: (v: string) => void }) {
  const map = useStore(visitors)
  const c = useStore(call)
  const v = ID_RE.test(target) ? map.get(target) : undefined
  const reported = Math.round((v?.s.volume ?? 0.9) * 100)
  const [draft, setDraft] = useState<number | null>(null)
  const shown = draft ?? reported
  const busy = c.phase === 'mic' || c.phase === 'ringing' || c.phase === 'connected'

  const push = (pct: number) => {
    const next = Math.max(0, Math.min(100, Math.round(pct)))
    setDraft(next)
    setVisitorVolume(target, next / 100)
  }
  // once the visitor reports the new volume back, the slider follows them again
  useEffect(() => {
    if (draft !== null && reported === draft) setDraft(null)
  }, [reported, draft])

  return (
    <section className="border-2 border-verity bg-ink-2 p-5" aria-labelledby="ses-h" data-testid="session-card">
      <h2 id="ses-h" className="pixel text-[16px] text-verity">SESIÓN ELEGIDA</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <span className="grid place-items-center border border-line-2 bg-ink px-3 font-mono text-muted">#</span>
        <input
          inputMode="numeric"
          maxLength={5}
          placeholder="el número que ve arriba a la izquierda"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="w-full min-w-0 border border-line-2 bg-ink px-3 py-2 font-mono text-[20px] tracking-[0.2em] outline-none placeholder:text-[12px] placeholder:tracking-normal focus:border-verity"
          aria-label="Número de la sesión"
          data-testid="session-target"
        />
      </form>
      {!v ? (
        <p className="mt-3 text-[14px] text-paper-2" data-testid="session-empty">
          {ID_RE.test(target) ? `#${target} no está conectado ahora.` : 'Tocá "Elegir" en la lista, o escribí el número que la persona ve arriba a la izquierda de su pantalla.'}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-[14px] text-paper-2">
            <span className="font-mono text-paper">#{v.id}</span> · {where(v)} · {v.s.sound ? '🔊 sonido on' : '🔇 sonido off'} · {v.s.visible ? 'mirando' : 'en otra pestaña'}
            {v.tabs > 1 ? <> · <span className="text-verity">{v.tabs} pestañas abiertas</span></> : null}
          </p>
          {outdated(v) || v.tabs > 1 ? (
            <div className="flex flex-wrap items-center gap-2 border border-signal/60 bg-signal/10 p-2 text-[13px]" data-testid="session-warning">
              <span className="flex-1">
                {outdated(v) ? 'Tiene una versión vieja de la web abierta: no responde a todos los controles. Recargala (si no reacciona, cerrá esa pestaña a mano).' : 'Tiene la web abierta en varias pestañas: solo suena la que está mirando.'}
              </span>
              <button type="button" onClick={() => reloadVisitor(v.id)} className="bg-paper px-2 py-1 font-bold text-ink" data-testid="session-reload">
                Recargar su página
              </button>
            </div>
          ) : null}
          <div>
            <div className="flex items-center justify-between text-[12px] uppercase tracking-wide text-paper-2">
              <span>Volumen de su web (música, efectos y voces)</span>
              <span className="font-mono text-[14px] text-paper" data-testid="session-volume">{shown} %</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={shown}
              onChange={(e) => push(Number(e.target.value))}
              className="mt-1 w-full accent-[var(--color-verity)]"
              aria-label={`Volumen de #${v.id}`}
              data-testid="session-volume-slider"
            />
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-[13px]">
              <button type="button" onClick={() => push(shown - 10)} className="border border-line-2 bg-ink-3 py-1.5 font-bold" data-testid="session-vol-down">−10</button>
              <button type="button" onClick={() => push(shown + 10)} className="border border-line-2 bg-ink-3 py-1.5 font-bold" data-testid="session-vol-up">+10</button>
              <button type="button" onClick={() => push(0)} className="border border-line-2 bg-ink-3 py-1.5" data-testid="session-vol-zero">Silencio</button>
              <button type="button" onClick={() => push(90)} className="border border-line-2 bg-ink-3 py-1.5">Normal</button>
            </div>
          </div>
          <div className="border-t border-line pt-3">
            <MixControls to={v.id} reported={{ music: v.s.music ?? 1, voice: v.s.voice ?? 1 }} testid="session-mix" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void startCall(v.id)}
              disabled={busy || v.call !== 'idle'}
              className="bg-[#1fbf4a] px-3 py-2 font-display font-extrabold text-black disabled:opacity-40"
              data-testid="session-call"
            >
              Llamar a #{v.id}
            </button>
            <button
              type="button"
              onClick={() => {
                const box = document.getElementById('msg-text')
                box?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                box?.focus()
              }}
              className="bg-verity px-3 py-2 font-display font-extrabold text-ink"
              data-testid="session-message"
            >
              Escribirle
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function MixSlider({ label, hint, value, max, step, onChange, testid }: { label: string; hint: string; value: number; max: number; step: number; onChange: (pct: number) => void; testid: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] uppercase tracking-wide text-paper-2">
        <span>{label}</span>
        <span className={`font-mono text-[14px] ${value > 100 ? 'text-verity' : 'text-paper'}`} data-testid={`${testid}-value`}>{value} %</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--color-verity)]"
        aria-label={label}
        data-testid={`${testid}-slider`}
      />
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  )
}

/** Music (every song, including Bleood's act) and the characters' voices, for everyone or one session. */
/** Music (every song, Bleood's act included) and the characters' voices, for one session or everyone. */
function MixControls({ to, reported, testid }: { to: 'all' | string; reported: { music: number; voice: number }; testid: string }) {
  const [draft, setDraft] = useState<{ music?: number; voice?: number }>({})
  const music = draft.music ?? Math.round(reported.music * 100)
  const voice = draft.voice ?? Math.round(reported.voice * 100)

  // follow what the visitors report once they have applied a change
  useEffect(() => setDraft({}), [to])
  useEffect(() => {
    setDraft((d) => ({
      ...(d.music !== undefined && d.music !== Math.round(reported.music * 100) ? { music: d.music } : {}),
      ...(d.voice !== undefined && d.voice !== Math.round(reported.voice * 100) ? { voice: d.voice } : {}),
    }))
  }, [reported.music, reported.voice])

  const push = (part: { music?: number; voice?: number }) => {
    setDraft((d) => ({ ...d, ...part }))
    setMix(to, { music: part.music === undefined ? undefined : part.music / 100, voice: part.voice === undefined ? undefined : part.voice / 100 })
  }

  return (
    <div className="space-y-4">
      <MixSlider
        label="Música (todas las canciones)"
        hint="Incluye la música del acto de Bleood: el visitante no puede bajarla, solo vos."
        value={music}
        max={100}
        step={5}
        onChange={(pct) => push({ music: pct })}
        testid={`${testid}-music`}
      />
      <MixSlider
        label="Voz de los personajes"
        hint="100 % es lo normal; podés subirla hasta 300 %."
        value={voice}
        max={MAX_VOICE * 100}
        step={10}
        onChange={(pct) => push({ voice: pct })}
        testid={`${testid}-voice`}
      />
      <div className="grid grid-cols-3 gap-1.5 text-[13px]">
        <button type="button" onClick={() => push({ music: 30 })} className="border border-line-2 bg-ink-3 py-1.5" data-testid={`${testid}-music-low`}>Música baja</button>
        <button type="button" onClick={() => push({ voice: 200 })} className="border border-line-2 bg-ink-3 py-1.5" data-testid={`${testid}-voice-up`}>Voz ×2</button>
        <button type="button" onClick={() => push({ music: 100, voice: 100 })} className="border border-line-2 bg-ink-3 py-1.5" data-testid={`${testid}-reset`}>Normal</button>
      </div>
    </div>
  )
}

/** The same mix for everyone on the site, including visitors who arrive later. */
function MixCard() {
  const def = useStore(mixDefault)
  return (
    <section className="border border-line-2 bg-ink-2 p-5" aria-labelledby="mix-h" data-testid="mix-card">
      <h2 id="mix-h" className="pixel text-[16px] text-verity">MÚSICA Y VOCES · TODOS</h2>
      <p className="mt-1 text-[12px] text-muted">Para todos los que están en la web y los que entren después. Para una sola persona, usá la sesión elegida.</p>
      <div className="mt-4">
        <MixControls to="all" reported={def} testid="mix" />
      </div>
    </section>
  )
}

function MessageCard({ target }: { target: string }) {
  const [text, setText] = useState('')
  const [to, setTo] = useState<'all' | 'one'>('all')
  const [ttl, setTtl] = useState(10)
  // picking a session points the message at that number
  useEffect(() => {
    if (ID_RE.test(target)) setTo('one')
  }, [target])
  const dest = to === 'all' ? 'all' : target
  const ok = text.trim().length > 0 && (to === 'all' || ID_RE.test(target))

  const submit = () => {
    if (ok && sendMessage(dest, text, ttl)) setText('')
  }

  return (
    <section className="border border-line-2 bg-ink-2 p-5" aria-labelledby="msg-h">
      <h2 id="msg-h" className="pixel text-[16px] text-verity">MENSAJE EN PANTALLA</h2>
      <div className="mt-3 grid grid-cols-2 gap-1 border border-line-2 p-1 text-[13px]" role="radiogroup" aria-label="Destino">
        {(['all', 'one'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={to === k}
            onClick={() => setTo(k)}
            className={`px-2 py-1.5 font-bold ${to === k ? 'bg-paper text-ink' : 'text-paper-2 hover:bg-ink-3'}`}
            data-testid={`msg-to-${k}`}
          >
            {k === 'all' ? 'Toda la página' : `Solo #${ID_RE.test(target) ? target : '_____'}`}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        maxLength={MAX_TEXT}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={3}
        placeholder="Escribí el mensaje (Enter envía, Shift+Enter nueva línea)"
        className="mt-3 w-full resize-y border border-line-2 bg-ink px-3 py-2 text-[16px] outline-none focus:border-verity"
        id="msg-text"
        data-testid="msg-text"
      />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => setText(q)} className="border border-line-2 px-2 py-1 text-[12px] text-paper-2 hover:border-verity hover:text-paper">
            {q}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-[13px] text-paper-2" htmlFor="ttl">
          Duración
        </label>
        <select id="ttl" value={ttl} onChange={(e) => setTtl(Number(e.target.value))} className="border border-line-2 bg-ink px-2 py-1.5 text-[13px]">
          {TTLS.map((t) => (
            <option key={t.v} value={t.v}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[11px] text-muted">
          {text.length}/{MAX_TEXT}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={submit} disabled={!ok} className="flex-1 bg-verity px-4 py-2.5 font-display font-extrabold text-ink disabled:opacity-40" data-testid="msg-send">
          Enviar
        </button>
        <button
          type="button"
          onClick={() => clearScreens(dest)}
          disabled={to === 'one' && !ID_RE.test(target)}
          className="border border-line-2 px-3 py-2.5 text-[13px] text-paper-2 hover:bg-ink-3 disabled:opacity-40"
        >
          Borrar pantalla
        </button>
      </div>
    </section>
  )
}

function Visitors({ onPick, selected }: { onPick: (id: string) => void; selected: string }) {
  const map = useStore(visitors)
  const mine = useMemo(() => ownVisitorId(), [map])
  const c = useStore(call)
  const now = useNow()
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const rank = (v: VisitorInfo) => (v.call !== 'idle' ? 0 : v.s.visible ? 1 : 2)
    return [...map.values()]
      .filter((v) => !q || v.id.includes(q))
      .sort((a, b) => rank(a) - rank(b) || b.since - a.since)
      .slice(0, 200)
  }, [map, q])

  return (
    <section className="border border-line-2 bg-ink-2" aria-labelledby="vis-h">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-2 p-4">
        <h2 id="vis-h" className="pixel text-[16px] text-verity">
          EN LA WEB AHORA · <span data-testid="visitor-count">{map.size}</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value.replace(/\D/g, ''))}
          placeholder="Buscar #"
          inputMode="numeric"
          className="ml-auto w-32 border border-line-2 bg-ink px-2 py-1 font-mono text-[13px] outline-none focus:border-verity"
          aria-label="Buscar visitante"
        />
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-[14px] text-muted">Nadie conectado todavía. Cuando alguien abra la web, aparece acá al instante.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">Dónde está</th>
                <th className="px-2 py-2 font-medium">Sonido</th>
                <th className="px-2 py-2 font-medium">Volumen</th>
                <th className="px-2 py-2 font-medium">Pestaña</th>
                <th className="px-2 py-2 font-medium">Tiempo</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className={`border-t border-line ${c.id === v.id && c.phase === 'connected' ? 'bg-[#1fbf4a]/10' : selected === v.id ? 'bg-verity/10' : ''}`} data-testid="visitor-row" data-id={v.id} data-selected={selected === v.id}>
                  <td className="px-4 py-2 font-mono text-[15px] text-paper">
                    {v.id}
                    {v.tabs > 1 && <span className="ml-1 text-[11px] text-muted">×{v.tabs}</span>}
                    {v.id === mine && <span className="ml-1.5 bg-paper px-1 font-sans text-[10px] font-bold text-ink" data-testid="visitor-mine">este navegador</span>}
                    {outdated(v) && <span className="ml-1.5 bg-signal px-1 font-sans text-[10px] font-bold text-white" data-testid="visitor-outdated">versión vieja</span>}
                  </td>
                  <td className="px-2 py-2">
                    {where(v)}
                    {v.s.route && <span className="ml-1 text-[11px] text-muted">({v.s.route})</span>}
                    {v.call !== 'idle' && <span className="ml-2 bg-[#1fbf4a] px-1 text-[11px] font-bold text-black">{v.call === 'ringing' ? 'SONANDO' : 'EN LLAMADA'}</span>}
                  </td>
                  <td className="px-2 py-2">{v.s.sound ? '🔊' : '🔇'}</td>
                  <td className="px-2 py-2 font-mono text-paper-2" data-testid="visitor-volume">{Math.round((v.s.volume ?? 0.9) * 100)} %</td>
                  <td className="px-2 py-2 text-paper-2">{v.s.visible ? 'mirando' : 'en otra pestaña'}</td>
                  <td className="px-2 py-2 font-mono text-paper-2">{mmss(now - v.since)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onPick(v.id)}
                      aria-pressed={selected === v.id}
                      className={`px-2 py-1 text-[12px] ${selected === v.id ? 'bg-verity font-bold text-ink' : 'border border-line-2 hover:border-verity'}`}
                      data-testid="visitor-pick"
                    >
                      {selected === v.id ? 'Elegido' : 'Elegir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Log() {
  const entries = useStore(log)
  return (
    <section className="border border-line-2 bg-ink-2 p-5" aria-labelledby="log-h">
      <h2 id="log-h" className="pixel text-[14px] text-muted">ACTIVIDAD</h2>
      <ol className="mt-3 max-h-64 space-y-1 overflow-y-auto font-mono text-[12px]" data-testid="admin-log">
        {entries.map((e, i) => (
          <li key={e.at + ':' + i} className={e.tone === 'ok' ? 'text-[#4be37a]' : e.tone === 'warn' ? 'text-signal-2' : 'text-paper-2'}>
            <span className="text-dim">{new Date(e.at).toLocaleTimeString()}</span> {e.text}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function AdminApp() {
  const state = useStore(conn)
  const [target, setTarget] = useState('')
  const map = useStore(visitors)

  // if the site is open in this same browser, start with that session chosen
  useEffect(() => {
    if (target) return
    const mine = ownVisitorId()
    if (mine && map.has(mine)) setTarget(mine)
  }, [map, target])

  useEffect(() => {
    const k = savedKey()
    if (k) login(k)
  }, [])

  if (state === 'login' || state === 'denied') return <Login />

  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-3 border-b border-line-2 px-4 py-3 sm:px-6">
        <span className="hazard h-6 w-6" aria-hidden="true" />
        <p className="font-display text-[18px] font-extrabold">
          Línea DEV <span className="font-normal text-muted">· {location.host}</span>
        </p>
        <span
          className={`ml-2 px-2 py-0.5 font-mono text-[11px] uppercase ${state === 'online' ? 'bg-[#1fbf4a] text-black' : 'bg-ink-4 text-paper-2'}`}
          data-testid="admin-conn"
        >
          {state === 'online' ? 'conectado' : state === 'connecting' ? 'conectando…' : 'reconectando…'}
        </span>
        <button type="button" onClick={logout} className="ml-auto text-[13px] text-muted underline-offset-4 hover:text-paper hover:underline">
          Salir
        </button>
      </header>
      <main className="grid gap-4 p-4 sm:p-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Visitors onPick={setTarget} selected={target} />
          <Log />
        </div>
        <div className="space-y-4 lg:col-span-5">
          <SessionCard target={target} setTarget={setTarget} />
          <MixCard />
          <CallCard target={target} setTarget={setTarget} />
          <MessageCard target={target} />
        </div>
      </main>
    </div>
  )
}
