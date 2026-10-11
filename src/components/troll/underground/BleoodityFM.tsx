import { useEffect, useRef, useState } from 'react'
import { cheeseSong } from '../../../lib/content/channel'
import { fm } from '../../../lib/experience/stage'
import { useStore } from '../../../lib/experience/store'
import { TIME } from '../../../lib/animation/timeline'
import { useSfxState } from '../../shared/useSfx'

const ORIGIN = 'https://www.youtube-nocookie.com'

/**
 * BLEOODITY FM: the real "mhm yeah i got the cheese" upload, played by
 * YouTube's own visible privacy-enhanced player. Nothing is downloaded or
 * re-hosted. The HUD mute and volume are forwarded to the player through
 * YouTube's documented iframe postMessage commands (enablejsapi=1).
 * Fast/test mode renders the window without loading the embed.
 */
export function BleoodityFM() {
  const state = useStore(fm)
  const sound = useSfxState()
  const frame = useRef<HTMLIFrameElement>(null)
  // Phones start minimised so the player never covers a scene's controls.
  const [min, setMin] = useState(() => window.innerWidth < 640)
  const fast = TIME.scale < 1
  // Only the initial mute goes in the URL; later changes go through postMessage.
  const [startMuted] = useState(!sound.enabled)

  const command = (func: string, args: unknown[] = []) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN)

  const sync = () => {
    command(sound.enabled ? 'unMute' : 'mute')
    command('setVolume', [Math.round(Math.min(1, sound.volume) * 100)])
    if (sound.enabled) command('playVideo')
  }

  useEffect(() => { sync() }, [sound.enabled, sound.volume])

  if (state !== 'on') return null
  const src = `${ORIGIN}/embed/${cheeseSong.id}?autoplay=1&loop=1&playlist=${cheeseSong.id}&controls=1&playsinline=1&rel=0&enablejsapi=1${startMuted ? '&mute=1' : ''}`

  return (
    <aside
      data-troll-ui
      data-testid="background-music"
      data-video-id={cheeseSong.id}
      data-muted={!sound.enabled}
      aria-label="Bleoodity FM: Bleood's official upload, playing in YouTube's player"
      className="pointer-events-auto fixed bottom-2 right-2 z-[47] w-[min(70vw,260px)] border-[3px] border-[#c0c0c0] bg-[#000080] font-mono text-[10px] text-white shadow-[5px_5px_0_#ff00ff]"
      style={{ borderStyle: 'outset' }}
    >
      <div className="flex items-center justify-between gap-1 bg-gradient-to-r from-[#ff0080] to-[#7a00ff] px-1.5 py-0.5 font-bold">
        <span className="truncate">♫ BLEOODITY FM · LOOP FOREVER</span>
        <button type="button" onClick={() => setMin((v) => !v)} className="shrink-0 border border-white bg-[#c0c0c0] px-1 leading-none text-black" aria-expanded={!min} data-testid="fm-minimise">
          {min ? '□' : '_'}
        </button>
      </div>
      <div className={min ? 'h-0 overflow-hidden' : 'aspect-video w-full bg-black'}>
        {fast ? (
          <div className="flex h-full items-center justify-center text-[#00ff00]" data-testid="fm-test-player">YOUTUBE PLAYER · {cheeseSong.id}</div>
        ) : (
          <iframe
            ref={frame}
            src={src}
            title={`Mhm I Got the Cheese, by ${cheeseSong.artist}, on YouTube`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
            onLoad={sync}
            data-testid="fm-player"
          />
        )}
      </div>
      <a href={cheeseSong.url} target="_blank" rel="noreferrer" className="block truncate px-1.5 py-0.5 text-[#ffff00] underline">
        {cheeseSong.artist} — official upload ↗ {sound.enabled ? '' : '· muted (HUD)'}
      </a>
    </aside>
  )
}
