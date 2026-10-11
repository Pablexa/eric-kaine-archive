import { useCallback, useEffect, useRef, useState } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { objective } from '../../../lib/experience/store'
import { sfx } from '../../../lib/audio/sfx'
import { channel, cheeseSong, videos } from '../../../lib/content/channel'
import { TIME, prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

interface VideoSource { id: string; title: string; uploader: string; authorUrl: string }
// Verified against public YouTube watch pages and YouTube oEmbed on 2026-10-10.
// Playback stays in the visible YouTube player; no downloaded gameplay assets.
const SUBWAY_VIDEOS: VideoSource[] = [
  { id: 'i0M4ARe9v0Y', title: 'Subway Surfers (2026) - Gameplay [4K 16x9] No Copyright', uploader: 'Subway Surfers', authorUrl: 'https://www.youtube.com/@subwaysurfers' },
  { id: 'ZtHCnXMjIXY', title: 'Subway Surfers Gameplay PC - First play', uploader: 'Cartoons Mee', authorUrl: 'https://www.youtube.com/@CartoonsMee' },
]
const MEDIA: VideoSource[] = [
  ...SUBWAY_VIDEOS,
  { id: 'cYBWZyecX_w', title: videos.find((v) => v.id === 'cYBWZyecX_w')!.title, uploader: channel.name, authorUrl: channel.url },
  { id: cheeseSong.id, title: 'Mhm I Got the Cheese', uploader: cheeseSong.artist, authorUrl: cheeseSong.artistUrl },
]
const WORDS = ['SIGMA', 'RIZZ', 'OHIO', 'FANUM TAX', 'MEWING', '+1000 AURA', 'SKIBIDI', '6 7', "I’M 10.", '!discord', 'SLATT', 'CHEESE ACQUIRED', 'BRO DONATED AT THE WRONG TIME']
const CAPTIONS = ['please gatekeep me im not trying to be famous', 'making a beat but every tab chooses the sounds', 'bro opened subway surfers inside subway surfers', 'the cheese has a commuter pass', 'I found 2slimey in internet explorer', 'your attention span has left the server']
const SPAM = ['YOUR RAM IS NOW CHEESE', 'CLICK HERE TO DOWNLOAD MORE RIZZ', 'CONGRATULATIONS!! YOU ARE VISITOR 6,700,000', 'VIRUS SCAN: FOUND !DISCORD', 'MYSPACE TOP 8: EVERYONE IS BLEOOD', 'FREE IPOD* (*it is a train)', 'THERE ARE 67 BLEOODITYS IN YOUR AREA', 'TURN DOWN FOR WHAT .WMV']

function VideoPane({ source, index, fast }: { source: VideoSource; index: number; fast: boolean }) {
  const [playing, setPlaying] = useState(!fast)
  const [revision, setRevision] = useState(0)
  const poster = `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`
  const url = `https://www.youtube.com/watch?v=${source.id}`
  return (
    <article className="br08-window" data-testid={`brainrot-video-${index}`} data-video-id={source.id} data-uploader={source.uploader} data-poster={poster}>
      <div className="br08-title"><span>▣ {index < 2 ? 'SUBWAY SURFERS' : 'BLEOOD.TV'} - Windows Media Player</span><span aria-hidden="true">_ □ ×</span></div>
      <div className="br08-menubar">File　Edit　View　Favorites　Tools　Help</div>
      <div className="br08-video">
        {!fast ? <img src={poster} alt={`${source.title} video still`} className="br08-poster" /> : <div className="br08-test-poster"><b>REAL YOUTUBE VIDEO</b><span>{source.id}</span><span>{source.uploader}</span></div>}
        {playing && !fast ? <iframe
          key={revision}
          src={`https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&mute=1&controls=1&playsinline=1&loop=1&playlist=${source.id}&rel=0`}
          title={`${source.title} by ${source.uploader}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          data-testid="brainrot-youtube-player"
        /> : <button type="button" className="br08-poster-play" onClick={() => { setPlaying(true); sfx.click() }} aria-label={`Play ${source.title}`}>▶ PLAY THE ACTUAL VIDEO</button>}
      </div>
      <div className="br08-source"><a href={url} target="_blank" rel="noreferrer">{source.title} ↗</a><a href={source.authorUrl} target="_blank" rel="noreferrer">uploaded by {source.uploader}</a></div>
      <div className="br08-transport">
        <button type="button" onClick={() => { setPlaying((v) => !v); sfx.click() }} data-testid={`brainrot-play-${index}`} aria-label={`${playing ? 'Pause' : 'Play'} ${source.title}`}>{playing ? '■ STOP' : '▶ PLAY'}</button>
        <button type="button" onClick={() => { setRevision((v) => v + 1); setPlaying(true); sfx.errorDing() }} aria-label={`Restart ${source.title}`}>↺ REWIND</button>
        <span>{fast ? 'test preview · no media requests' : 'REAL VIDEO / click player for sound'}</span>
      </div>
    </article>
  )
}

/** Protocol 10: real gameplay videos in a deliberately terrible 2008 portal. */
export function BrainrotScene() {
  const { dispatch } = useExperience()
  const [section, setSection] = useState<'split' | 'subtitles' | 'quad'>('split')
  const [elapsed, setElapsed] = useState(0)
  const [extraPanes, setExtraPanes] = useState(0)
  const [spam, setSpam] = useState(0)
  const [skipReady, setSkipReady] = useState(false)
  const ended = useRef(false)
  const reduced = useRef(prefersReducedMotion()).current
  const fast = TIME.scale < 1 && !TIME.media
  const finish = useCallback(() => {
    if (ended.current) return
    ended.current = true
    objective.set(null)
    chat.post('all four tabs are playing. your attention span is cooked. mosh time.', 'bleoodity')
    dispatch({ type: 'SCENE', scene: 'mosh' })
  }, [dispatch])

  useEffect(() => {
    const start = performance.now()
    const timer = window.setInterval(() => setElapsed(Math.max(0, (performance.now() - start) / 1000 / TIME.scale)), Math.max(80, 500 * TIME.scale))
    return () => { window.clearInterval(timer); objective.set(null) }
  }, [])

  useScript(async (signal) => {
    objective.set('Watch the actual videos · add useless tabs · spam the meme button')
    chat.post('fine. ACTUAL subway surfers. two videos. why stop at one.', 'bleoodity')
    // the exit unlocks at 15 s (owner's request; it was 40 s)
    await wait(4500, signal)
    setSection('subtitles')
    chat.post('added subtitles to a video with no dialogue. huge upgrade.', 'bleoodity')
    sfx.errorDing(4)
    await wait(6000, signal)
    setSection('quad')
    setSpam((n) => n + 2)
    chat.post('MAXIMUM BRAINROT. EVERY TAB IS THE MAIN TAB.', 'bleoodity', 'loud')
    sfx.airhorn()
    await wait(4500, signal)
    setSkipReady(true)
    await wait(10000, signal)
    finish()
  }, [])

  const meme = () => {
    setSpam((n) => n + 1)
    sfx.popCombo(spam % 12)
    chat.post(SPAM[spam % SPAM.length].toLowerCase(), 'bleoodity')
  }
  const paneCount = (section === 'quad' ? 4 : 2) + extraPanes
  const captionWords = CAPTIONS[Math.floor(elapsed / 7) % CAPTIONS.length].split(' ')
  const activeWord = Math.floor(elapsed * 2) % captionWords.length

  return (
    <section className={`br08-screen ${reduced ? 'br08-reduced' : ''}`} aria-label="Real Subway Surfers video brainrot portal" data-testid="brainrot" data-section={section} data-pane-count={Math.min(6, paneCount)} data-memes={spam} data-troll-ui>
      <style>{STYLES}</style>
      <div className="br08-site-header"><span>☠ BLEOODITY'S EPIC VIDEOZONE ☠</span><small>BEST VIEWED IN INTERNET EXPLORER 6 · 800×600 · DO NOT FIX THIS WEBSITE</small></div>
      <div className="br08-navigation">[ HOME ] [ LEAKS ] [ FREE RIZZ ] [ GUESTBOOK ] <b>● LIVE</b> <span>{Math.max(0, 62 - Math.floor(elapsed))} sec until brain failure</span></div>
      <div className="br08-ticker" aria-hidden="true"><span>★ REAL SUBWAY SURFERS VIDEOS ★ NO REFUNDS ★ PLEASE RATE MY WEBSITE ★ SLATT ★ MHMM I GOT THE CHEESE ★ !DISCORD ★ 6 7 ★</span></div>
      <div className="br08-collage" data-testid="brainrot-video-collage">
        {Array.from({ length: Math.min(6, paneCount) }, (_, index) => <VideoPane key={index} index={index} source={MEDIA[index % MEDIA.length]} fast={fast} />)}
        {section !== 'split' ? <div className="br08-captions" aria-hidden="true">{captionWords.map((word, index) => <span key={`${index}-${word}`} className={index === activeWord ? 'br08-word-active' : ''}>{word} </span>)}<small>[{WORDS[Math.floor(elapsed) % WORDS.length]} NOISES]</small></div> : null}
        <div className="br08-spam" aria-hidden="true">
          {Array.from({ length: Math.min(7, spam + (section === 'quad' ? 3 : 1)) }, (_, index) => <div key={index} className={`br08-ad br08-ad-${index % 3}`} style={{ left: `${3 + ((index * 29) % 68)}%`, top: `${12 + ((index * 19) % 63)}%`, rotate: `${index % 2 ? -6 : 4}deg`, zIndex: index + 1 }}><b>{SPAM[(index + spam) % SPAM.length]}</b><span>★ {WORDS[(index + Math.floor(elapsed / 3)) % WORDS.length]} ★</span></div>)}
        </div>
      </div>
      <div className="br08-tools" role="group" aria-label="Brainrot collage controls">
        <button type="button" onClick={meme} data-testid="brainrot-meme">☢ PRESS FOR BRAINROT</button>
        <button type="button" onClick={() => { setExtraPanes((n) => Math.min(4, n + 1)); setSpam((n) => n + 1); sfx.errorDing(3) }} data-testid="brainrot-add-pane" disabled={paneCount >= 6}>+ OPEN ANOTHER TAB</button>
        {skipReady ? <button type="button" onClick={finish} data-testid="brainrot-skip">MY BRAIN IS DONE →</button> : <span>Exit to mosh unlocks at 15s</span>}
      </div>
      <div className="br08-status"><span>▓▓▓▓▓▓░░░ DOWNLOADING ATTENTION SPAN.EXE</span><span>{section === 'quad' ? 'MAXIMUM BRAINROT' : section.toUpperCase()} · {Math.min(6, paneCount)} TABS · {spam * 1000} AURA</span></div>
      <span className="sr-only" aria-live="polite">{section === 'quad' ? 'Maximum brainrot: four real video panels. Use the buttons to add tabs or make memes.' : 'Real Subway Surfers gameplay videos. Each player has playback controls and a source link.'}</span>
    </section>
  )
}

const STYLES = `
.br08-screen{position:fixed;z-index:46;inset:102px max(9px,calc((100vw - 1230px)/2)) 124px;display:flex;flex-direction:column;color:#000;font:12px Tahoma,Arial,sans-serif;background:#e6dfba;border:6px ridge #b9b9b9;box-shadow:9px 8px #001941;pointer-events:auto;isolation:isolate}
.br08-site-header{background:repeating-linear-gradient(90deg,#ff00ff 0 35px,#ffde00 35px 70px,#00ffff 70px 105px);padding:5px;text-align:center;border:2px outset white}
.br08-site-header>span{display:block;color:#120056;font:900 clamp(17px,3.3vw,37px)/1.02 Impact,'Arial Black',sans-serif;text-shadow:2px 2px #fff,4px 4px #f30;letter-spacing:-1px}
.br08-site-header small{font-size:8px;color:#000;background:#fff700;line-height:1.1}
.br08-navigation{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px;padding:3px;background:#000078;color:white;font-size:10px;font-family:'Courier New',monospace;border:2px inset white}
.br08-navigation b{color:#ffff00}.br08-navigation span{color:#00ffff}
.br08-ticker{flex:none;height:20px;background:#000;color:#eeff00;font:bold 12px/20px 'Comic Sans MS',cursive;overflow:hidden;white-space:nowrap;border:2px ridge red}
.br08-ticker span{display:inline-block;animation:br08-marquee 17s linear infinite}
.br08-collage{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(185px,1fr);gap:7px;padding:7px;overflow:auto;background-color:#ff00c8;background-image:repeating-linear-gradient(45deg,transparent 0 7px,#11005f 7px 14px);align-content:stretch}
.br08-window{display:flex;flex-direction:column;min-width:0;min-height:0;background:#d4d0c8;border:3px outset #eee;box-shadow:3px 3px #000;border-radius:0;overflow:hidden}
.br08-window:nth-child(2n){border-color:#80ff00}.br08-window:nth-child(3n){border-color:#ff9400}
.br08-title{display:flex;justify-content:space-between;gap:4px;background:linear-gradient(#1496ff,#0050ce 25%,#002fb4 80%,#006de1);color:white;padding:4px 5px;text-shadow:1px 1px #001356;font:bold 10px Tahoma,Arial,sans-serif;flex:none}
.br08-title span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.br08-title span:last-child{white-space:nowrap;color:#fff;background:#f54e2e;padding-inline:3px}
.br08-menubar{flex:none;font:9px/1.2 Tahoma,sans-serif;padding:2px 5px;color:#111;border-bottom:1px solid #999}
.br08-video{position:relative;flex:1;min-height:90px;background:#000;overflow:hidden}
.br08-poster,.br08-video iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}
.br08-poster{filter:saturate(1.5) contrast(1.1);image-rendering:auto}.br08-video iframe{z-index:1}
.br08-poster-play{position:absolute;z-index:2;inset:35% 10%;background:#ffff00;color:#0000bb;border:5px outset #fff;font:bold 16px 'Comic Sans MS',cursive;cursor:pointer}
.br08-test-poster{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#00ff00;background:#030005;font:12px 'Courier New',monospace}
.br08-test-poster b{background:#ff0;color:#000;padding:4px}
.br08-source{display:flex;flex-direction:column;gap:1px;padding:2px 5px;flex:none;background:#fff;font:9px/1.2 Arial,sans-serif;max-height:32px;overflow:auto}
.br08-source a{color:#0000ff;text-decoration:underline;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.br08-transport{flex:none;display:flex;align-items:center;gap:4px;padding:3px;border-top:1px solid #808080;background:#d4d0c8}
.br08-transport button{border:2px outset white;color:black;background:#d4d0c8;font:bold 9px Arial,sans-serif;padding:3px 5px;cursor:pointer}.br08-transport>span{font:8px/1.1 'Courier New',monospace;color:#222}
.br08-captions{position:absolute;left:7%;right:7%;top:60%;z-index:11;text-align:center;font:900 clamp(20px,3.1vw,40px)/1.04 Impact,'Arial Black',sans-serif;color:white;text-shadow:2px 2px #000,-2px -2px #000,2px -2px #000,-2px 2px #000;pointer-events:none}
.br08-word-active{color:#000;background:#00ff00;text-shadow:none}.br08-captions small{display:block;margin:5px auto;padding:4px;color:#ffff00;background:#000;font:bold 11px 'Courier New',monospace;width:fit-content}
.br08-spam{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.br08-ad{position:absolute;max-width:210px;width:28%;padding:7px;background:#ffff00;color:#ff0000;border:5px ridge #ff0900;box-shadow:4px 4px #000;text-align:center;font:bold clamp(10px,1.5vw,17px)/1 'Comic Sans MS',cursive;opacity:.92}
.br08-ad span{display:block;margin-top:5px;color:#0000ff;font-size:11px}.br08-ad-1{background:#00ff00;border-color:#0000ff;color:#a30078}.br08-ad-2{background:#ff28ce;border-color:#faff00;color:#fff}
.br08-tools{display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:center;padding:5px;background:#c0c0c0;border-top:3px ridge white;position:relative;z-index:12;flex:none}
.br08-tools button{min-height:35px;padding:4px 10px;border:3px outset #fff;background:#ffff00;color:#111;font:bold 12px 'Comic Sans MS',cursive;cursor:pointer}.br08-tools button:nth-child(2){background:#00ffff}.br08-tools button:nth-child(3){background:#92ff00}.br08-tools button:disabled{background:#ccc;color:#888;cursor:default}.br08-tools button:active,.br08-transport button:active{border-style:inset}.br08-tools button:focus-visible,.br08-transport button:focus-visible,.br08-poster-play:focus-visible{outline:3px solid #001dff;outline-offset:1px}
.br08-tools>span{font:9px 'Courier New',monospace;color:#333}.br08-status{display:flex;justify-content:space-between;gap:4px;flex:none;background:#d4d0c8;border:2px inset white;padding:3px;font:bold 8px 'Courier New',monospace;color:#111}
@keyframes br08-marquee{from{transform:translateX(20%)}to{transform:translateX(-70%)}}
.br08-reduced .br08-ticker span{animation:none}
@media(max-width:640px){.br08-screen{inset:84px 6px 121px;border-width:3px}.br08-site-header>span{font-size:21px}.br08-site-header small{font-size:6px}.br08-navigation{font-size:8px}.br08-collage{grid-template-columns:1fr;grid-auto-rows:245px;gap:7px;padding:5px}.br08-tools{gap:3px;padding:4px}.br08-tools button{font-size:10px;padding:3px 7px;min-height:34px}.br08-tools>span{font-size:8px}.br08-status{font-size:6px}.br08-ad{max-width:140px;width:38%;padding:4px;border-width:3px;font-size:11px}.br08-ad span{font-size:8px}.br08-captions{top:48%;font-size:26px}.br08-title{font-size:10px}.br08-source{font-size:9px}}
@media(max-height:650px){.br08-screen{top:81px;bottom:109px}.br08-site-header>span{font-size:23px}.br08-site-header small{display:none}.br08-tools button{min-height:28px}.br08-collage{grid-auto-rows:200px}}
@media(prefers-reduced-motion:reduce){.br08-ticker span{animation:none}}
`
