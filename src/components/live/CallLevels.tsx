import { useStore } from '../../lib/experience/store'
import { callGain, type CallGain } from '../../lib/live/devices'

const TEXT = {
  en: { mic: 'My mic volume', peer: 'Developer’s voice volume' },
  es: { mic: 'Volumen de mi micrófono', peer: 'Volumen del visitante (lo que escuchás)' },
}

/** Two sliders, 0–300 %: how loud my mic goes out, and how loud I hear the other person. */
export function CallLevels({ lang, onChange, testPrefix }: { lang: 'en' | 'es'; onChange: (next: Partial<CallGain>) => void; testPrefix: string }) {
  const t = TEXT[lang]
  const gain = useStore(callGain)
  const row = (key: keyof CallGain, label: string) => {
    const pct = Math.round(gain[key] * 100)
    return (
      <label className="block text-[11px] uppercase tracking-wide text-paper-2">
        <span className="flex items-center justify-between">
          <span>{label}</span>
          <span className="font-mono text-[12px] normal-case text-paper" data-testid={`${testPrefix}-${key}-value`}>{pct} %</span>
        </span>
        <input
          type="range"
          min={0}
          max={300}
          step={10}
          value={pct}
          onChange={(e) => onChange({ [key]: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-[var(--color-verity)]"
          data-testid={`${testPrefix}-${key}-gain`}
        />
      </label>
    )
  }
  return (
    <div className="space-y-2" data-testid={`${testPrefix}-levels`}>
      {row('mic', t.mic)}
      {row('peer', t.peer)}
    </div>
  )
}
