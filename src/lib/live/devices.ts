import { createStore } from '../experience/store'

/**
 * Microphone and speaker/headphone choice for the live call, shared by the
 * visitor and the admin panel. '' means the system default. Remembered per
 * browser, so each person's choice sticks for the next call.
 */
export interface AudioDevices {
  input: string
  output: string
}

export interface DeviceOption {
  id: string
  label: string
}

export interface DeviceList {
  inputs: DeviceOption[]
  outputs: DeviceOption[]
  /** False until the page may use the mic: browsers hide device names before that. */
  named: boolean
}

const KEY = 'ek-archive:live-devices'

function read(): AudioDevices {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AudioDevices>
    return { input: typeof v.input === 'string' ? v.input : '', output: typeof v.output === 'string' ? v.output : '' }
  } catch {
    return { input: '', output: '' }
  }
}

export const audioDevices = createStore<AudioDevices>(read())
export const deviceList = createStore<DeviceList>({ inputs: [], outputs: [], named: false })

export function chooseDevices(next: Partial<AudioDevices>) {
  const v = { ...audioDevices.get(), ...next }
  audioDevices.set(v)
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* private mode: the choice still applies to this call */
  }
}

/** Switching the output needs AudioContext.setSinkId (Chrome and Edge; not Safari). */
export const canPickOutput = () => typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype

export async function refreshDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return
  const all = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[])
  // Chrome lists "default" and "communications" as aliases of real devices; the picker has its own default entry.
  const pick = (kind: MediaDeviceKind, fallback: string) =>
    all
      .filter((d) => d.kind === kind && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
      .map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
  deviceList.set({ inputs: pick('audioinput', 'Microphone'), outputs: pick('audiooutput', 'Speaker'), named: all.some((d) => d.label) })
}

/** Asks for the mic once (and releases it right away) so the lists show real names. */
export async function unlockDeviceNames() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true })
    s.getTracks().forEach((t) => t.stop())
  } catch {
    /* denied: the generic names stay */
  }
  await refreshDevices()
}

let watching = false
export function watchDevices() {
  if (watching || !navigator.mediaDevices) return
  watching = true
  navigator.mediaDevices.addEventListener?.('devicechange', () => void refreshDevices())
  void refreshDevices()
}
