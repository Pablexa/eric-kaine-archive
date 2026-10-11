import { useRef, useState, type CSSProperties } from 'react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { objective } from '../../../lib/experience/store'
import { verity } from '../../../lib/experience/verity'
import { artistArt, objectArt } from '../../../lib/assets/cast'
import { sfx } from '../../../lib/audio/sfx'
import { wait, waitFor } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

const ROSTER = [
  { name: 'BLEOOD', key: 'bleood', color: '#ff00ff', title: 'CEO OF CHEESE', line: 'mhm. yeah. the cheese department is fully staffed.' },
  { name: 'SLAYR', key: 'slayr', color: '#ff9900', title: 'BURGER DIVISION', line: 'slayr signed. the burger costume is mandatory.' },
  { name: 'OSAMASON', key: 'osamason', color: '#ff2200', title: 'AUX CORD EXPLODED', line: 'the aux cord is now a fire hazard.' },
  { name: 'PLAYBOI CARTI', key: 'carti', color: '#ff0033', title: 'VAMP.EXE HAS STOPPED', line: 'slatt. the website has fangs now.' },
  { name: 'JAYDES', key: 'jaydes', color: '#b600ff', title: 'TOP 8 FRIENDS', line: 'jaydes gets the purple card. label policy.' },
  { name: 'THE CHEESE GUY', key: 'cheese', color: '#ffff00', title: 'HIRED A BLOCK OF CHEESE', line: 'hired a block of cheese. excellent credentials.' },
  { name: '2SLIMEY', key: 'slimey', color: '#00ff00', title: 'SIGNED FROM THE SWAMP', line: 'the swamp has an A&R department now.' },
  { name: 'LIL VERITY', key: 'verity', color: '#00ffff', title: 'NEPOTISM DOT COM', line: 'my son. nepotism is real.' },
] as const

const STYLES = `
.label-trash { font-family:'Comic Sans MS', 'Times New Roman', cursive; background:#000080; color:#ffff00; border:7px ridge #c0c0c0; box-shadow:12px 9px 0 #ff00ff; }
.label-trash h2 { font-family:Impact,serif; color:#ff0000; text-shadow:3px 3px #00ff00,-2px -2px #ffff00; letter-spacing:-1px; }
.label-spam { overflow:hidden; background:#00ff00; color:#0000ff; border:4px dotted red; font-weight:bold; white-space:nowrap; }
.label-spam span { display:inline-block; animation:label-scroll 11s linear infinite; }
.label-photos { background-color:#300010; background-image:repeating-conic-gradient(#ff00ff44 0% 25%,#00008855 0% 50%); background-size:27px 27px; }
.label-photo { background:#ffff00; color:blue; border:6px outset #c0c0c0; box-shadow:6px 7px 0 #000; transform:rotate(var(--tilt)); cursor:pointer; min-width:0; }
.label-photo:nth-child(3n) { margin-top:18px; border-style:ridge; background:#00ff00; }
.label-photo:nth-child(4n) { border-style:dashed; }
.label-photo:hover { z-index:2; filter:hue-rotate(25deg); transform:rotate(calc(var(--tilt) * -1)) scale(1.08); }
.label-photo:focus-visible { outline:5px solid white; outline-offset:-5px; z-index:3; }
.label-photo:disabled { cursor:default; }
.label-photo img { image-rendering:auto; }
.label-photo strong { font-family:Impact,serif; text-shadow:2px 2px #000; -webkit-text-stroke:.5px #000; }
.label-contract { position:absolute; right:0; top:0; font:10px Tahoma,sans-serif; background:#000080; color:white; border:2px outset white; padding:2px 5px; }
.label-stamp { position:absolute; left:4%; top:40%; transform:rotate(-19deg); border:5px double red; background:#ffffffda; color:red; font:900 29px Impact,sans-serif; padding:2px 6px; }
.label-trash footer { background:#c0c0c0; border:4px outset white; color:#000080; }
.label-trash footer img { border:2px ridge white; }
@keyframes label-scroll { to { transform:translateX(-50%); } }
@media(prefers-reduced-motion:reduce) { .label-spam span { animation:none; } .label-photo:hover { transform:none; } }
`

export function LabelScene() {
  const { dispatch } = useExperience()
  const [signed, setSigned] = useState<number[]>([])
  const signedRef = useRef(new Set<number>())
  const finished = useRef<(() => void) | null>(null)
  const sign = (i: number) => {
    if (signedRef.current.has(i)) return
    signedRef.current.add(i)
    setSigned([...signedRef.current])
    sfx.stamp()
    if (signedRef.current.size % 2 === 0) sfx.airhorn()
    chat.post(ROSTER[i].line, 'bleoodity')
    objective.set(`SIGN EVERYONE!!! ${signedRef.current.size} / 8`)
    if (signedRef.current.size === 8) finished.current?.()
  }

  useScript(async (signal) => {
    verity.setCostume('bleoodity')
    verity.setMode('free', false)
    void verity.moveTo(window.innerWidth - 52, 190, { size: 64, duration: 0.5, signal }).catch(() => {})
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    objective.set('SIGN EVERYONE!!! 0 / 8')
    chat.post('welcome to my record label. best viewed in internet explorer 6. sign everyone.', 'bleoodity')
    await waitFor<void>((done) => {
      finished.current = () => done()
      if (signedRef.current.size === 8) done()
      return () => { finished.current = null }
    }, signal)
    await chat.say('eight artists. zero budget. catering is about to get violent.', { signal, author: 'bleoodity', hold: 1000 })
    sfx.crash()
    await wait(300, signal)
    dispatch({ type: 'SCENE', scene: 'foodfight' })
  }, [])

  return <section data-troll-ui data-testid="label" data-signed={signed.length} aria-label="Bleoodity's parody record label" className="label-trash pointer-events-auto fixed inset-x-3 top-[126px] bottom-[132px] z-[46] mx-auto flex max-w-[1040px] flex-col sm:inset-x-14 sm:top-[140px] sm:bottom-[126px]">
    <style>{STYLES}</style>
    <header className="relative shrink-0 bg-[#ffff00] px-2 pt-1 text-center">
      <div className="absolute right-0 top-0 bg-red-600 px-1 font-mono text-[9px] text-white">NOT AFFILIATED / FAN NONSENSE</div>
      <p className="text-[11px] font-black text-blue-800">☆ xX BLEOODITY'S UNDERGROUND HOME PAGE Xx ☆ EST. 2008 ☆</p>
      <h2 className="text-[clamp(25px,5vw,55px)] font-black leading-none">BLEOODITY RECORDS!!!!</h2>
      <div className="flex items-center justify-center gap-2 text-[12px] text-black">
        <img src={objectArt.cheese.src} alt="" className="h-7 w-10 object-contain" />
        <b>CLICK A MASCOT TO SIGN IT</b>
        <span className="bg-black px-1 font-mono text-[#00ff00]" aria-live="polite">{signed.length}/8</span>
      </div>
    </header>
    <div className="label-spam shrink-0 text-[14px]" aria-hidden="true"><span>{'FREE CHEESE ★ CLICK HERE ★ SLATT ★ UNDER CONSTRUCTION ★ TORTAS ARE SANDWICHES ★ '.repeat(4)}</span></div>
    <div className="label-photos grid min-h-0 flex-1 grid-cols-2 items-start gap-2 overflow-y-auto p-3 sm:grid-cols-4 sm:gap-4 sm:p-5">
      {ROSTER.map((card, i) => {
        const isSigned = signed.includes(i)
        const photo = artistArt[card.key]
        return <button key={card.name} type="button" data-testid={`label-card-${i}`} data-signed={isSigned} aria-label={isSigned ? `${card.name}, signed` : `Sign ${card.name}`} aria-pressed={isSigned} disabled={isSigned} onClick={() => sign(i)} className="label-photo relative block w-full p-1 text-center" style={{ '--tilt': `${[ -5, 4, -3, 6, 3, -6, 5, -4 ][i]}deg` } as CSSProperties}>
          <span className="label-contract">{isSigned ? 'CONTRACT SAVED' : 'SIGN.exe [X]'}</span>
          <img src={photo.src} alt={photo.alt} draggable={false} className="h-[134px] w-full bg-black/30 object-contain sm:h-[184px]" />
          <span className="pointer-events-none absolute left-1 top-1 bg-red-600 px-1 font-mono text-[8px] text-white">PARODY MASCOT</span>
          <strong className="block break-words text-[20px] leading-none sm:text-[26px]" style={{ color: card.color }}>{card.name}</strong>
          <span className="block bg-white text-[10px] font-bold text-blue-800 underline">{card.title}</span>
          {isSigned && <span className="label-stamp">SIGNED!!!</span>}
        </button>
      })}
    </div>
    <footer className="flex min-h-[35px] shrink-0 items-center gap-1 px-1 py-0.5 text-[11px] font-bold">
      <span>TOP 8:</span>{signed.map((i) => <img key={i} src={artistArt[ROSTER[i].key].src} alt={ROSTER[i].name} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />)}
      {!signed.length && <span>0 friends. 0 dollars. 100000 cheeses.</span>}
      <span className="ml-auto hidden text-right text-[9px] sm:block">VISITORS: 000001501<br />© 2008 my dad owns the internet</span>
    </footer>
  </section>
}
