import { channel } from '../../lib/content/channel'
import { ENDINGS, type EndingId } from '../../lib/experience/machine'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { Period } from '../shared/Period'

export function Footer() {
  const { state, endings, replay, resetArchive } = useExperience()
  return (
    <footer className="relative border-t border-line py-10 sm:py-14" data-testid="footer">
      <div className="shell grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="flex items-baseline font-display text-[22px] font-extrabold tracking-[-0.04em] [font-stretch:115%]">
            EK<Period />
          </p>
          <p className="mt-4 max-w-[48ch] text-[13px] leading-relaxed text-muted" data-testid="disclosure">
            An independent fan project. Not affiliated with, endorsed by, or operated by Eric Kaine or YouTube. Video titles, thumbnails and the avatar
            belong to their creator and load directly from YouTube; every video links back to the official channel.
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase leading-[2] tracking-[0.12em] text-muted md:col-span-3 md:col-start-7">
          <p className="text-dim">Official channel</p>
          <a href={channel.url} target="_blank" rel="noreferrer" className="text-paper hover:underline">
            youtube.com/{channel.handle}
          </a>
          <p className="mt-4 text-dim">Data captured</p>
          <p>October 10, 2026</p>
        </div>
        <div className="font-mono text-[11px] uppercase leading-[2] tracking-[0.12em] text-muted md:col-span-3">
          <p className="text-dim">Credits</p>
          <p>Design &amp; build: a fan</p>
          <p>Guide: Verity</p>
          {state.witnessed || endings.length ? (
            <div className="mt-4 space-y-1" data-testid="footer-endings">
              <p className="text-dim">Endings found {endings.length}/3</p>
              {(Object.keys(ENDINGS) as EndingId[]).map((id) => (
                <p key={id} className={endings.includes(id) ? 'text-verity' : 'text-dim'}>
                  {endings.includes(id) ? ENDINGS[id].title : '???'}
                </p>
              ))}
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => void replay()} className="text-paper underline-offset-4 hover:underline" data-testid="footer-replay">
                  Replay
                </button>
                <button type="button" onClick={() => void resetArchive()} className="text-paper underline-offset-4 hover:underline" data-testid="footer-reset">
                  Reset archive
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
