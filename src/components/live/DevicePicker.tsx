import { useEffect } from 'react'
import { useStore } from '../../lib/experience/store'
import { audioDevices, canPickOutput, deviceList, unlockDeviceNames, watchDevices, type AudioDevices } from '../../lib/live/devices'

const TEXT = {
  en: {
    input: 'Microphone',
    output: 'Speaker / headphones',
    system: 'System default',
    names: 'Show device names',
    noOutput: 'This browser plays calls on your system output. Change it in your computer’s sound settings.',
  },
  es: {
    input: 'Micrófono',
    output: 'Salida (parlantes / auriculares)',
    system: 'Predeterminado del sistema',
    names: 'Mostrar nombres de los dispositivos',
    noOutput: 'Este navegador usa la salida del sistema. Cambiala en la configuración de sonido de la compu.',
  },
}

/** Mic and speaker/headphone pickers for the live call (visitor and admin). */
export function DevicePicker({ lang, onChange, testPrefix }: { lang: 'en' | 'es'; onChange: (next: Partial<AudioDevices>) => void; testPrefix: string }) {
  const t = TEXT[lang]
  const chosen = useStore(audioDevices)
  const list = useStore(deviceList)
  const output = canPickOutput()

  useEffect(() => watchDevices(), [])

  const field = 'mt-1 w-full min-w-0 border border-line-2 bg-ink px-2 py-1.5 text-[12px] text-paper outline-none focus:border-verity'
  // a remembered device that is no longer plugged in still shows, so the choice is visible
  const withChosen = (opts: { id: string; label: string }[], id: string) => (id && !opts.some((o) => o.id === id) ? [...opts, { id, label: '…' }] : opts)

  return (
    <div className="space-y-2" data-testid={`${testPrefix}-devices`}>
      <label className="block text-[11px] uppercase tracking-wide text-paper-2">
        {t.input}
        <select className={field} value={chosen.input} onChange={(e) => onChange({ input: e.target.value })} data-testid={`${testPrefix}-input`}>
          <option value="">{t.system}</option>
          {withChosen(list.inputs, chosen.input).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </label>
      {output ? (
        <label className="block text-[11px] uppercase tracking-wide text-paper-2">
          {t.output}
          <select className={field} value={chosen.output} onChange={(e) => onChange({ output: e.target.value })} data-testid={`${testPrefix}-output`}>
            <option value="">{t.system}</option>
            {withChosen(list.outputs, chosen.output).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
      ) : (
        <p className="text-[11px] leading-snug text-paper-2">{t.noOutput}</p>
      )}
      {!list.named ? (
        <button type="button" onClick={() => void unlockDeviceNames()} className="text-[11px] text-verity underline underline-offset-2" data-testid={`${testPrefix}-names`}>
          {t.names}
        </button>
      ) : null}
    </div>
  )
}
