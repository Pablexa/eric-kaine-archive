import { artistMedia, objectMedia } from '../../lib/assets/realMedia'
import { fm } from '../../lib/experience/stage'
import { useStore } from '../../lib/experience/store'
import { useExperience } from '../../lib/experience/ExperienceContext'

const PHOTOS = [artistMedia.carti, artistMedia.bleood, objectMedia.cheese, artistMedia.osamason, objectMedia.burger, objectMedia.seal]
const STYLES = `
.underground-wallpaper { background:#400000; background-image:repeating-conic-gradient(#000 0% 25%,#770014 0% 50%); background-size:48px 48px; font-family:'Comic Sans MS',cursive; }
.trash-tile { position:absolute; width:19vw; height:25vh; min-width:110px; object-fit:cover; border:7px ridge #ffff00; opacity:.55; filter:saturate(2.5) contrast(1.4); animation:trash-photo 7s ease-in-out infinite alternate; }
.trash-banner { position:absolute; color:#00ff00; background:#000; border:5px dashed #ff00ff; font-weight:900; font-size:clamp(20px,4vw,65px); text-shadow:3px 3px red; white-space:nowrap; }
.trash-badge { position:absolute; color:yellow; background:blue; border:5px outset silver; font:900 18px 'Times New Roman',serif; padding:8px; }
@keyframes trash-photo { to { transform:rotate(15deg) scale(1.16); filter:saturate(3) hue-rotate(18deg); } }
@media(prefers-reduced-motion:reduce) { .trash-tile { animation:none; } }
`

export function UndergroundWallpaper() {
  const mode = useStore(fm)
  const { state } = useExperience()
  if (mode !== 'on') return null
  return <div aria-hidden="true" data-troll-ui className="underground-wallpaper pointer-events-none fixed inset-0 z-[43] overflow-hidden" style={{ opacity: state.scene === 'mosh' ? 0.3 : 1 }}>
    <style>{STYLES}</style>
    {Array.from({ length: 14 }, (_, i) => <img key={i} src={PHOTOS[i % PHOTOS.length].src} alt="" className="trash-tile" style={{ left:`${(i * 29) % 105 - 10}%`, top:`${(i * 37) % 100 - 12}%`, transform:`rotate(${i % 2 ? -13 : 8}deg)`, animationDelay:`-${i}s` }} />)}
    <div className="trash-banner" style={{ top:'16%', left:'-5%', transform:'rotate(-8deg)' }}>MHM I GOT THE CHEEEEESE</div>
    <div className="trash-banner" style={{ bottom:'13%', right:'-5%', transform:'rotate(6deg)', color:'#ff00ff', background:'#ffff00' }}>SLATT SLATT SLATT SLATT SLATT</div>
    <span className="trash-badge" style={{ left:3, top:'45%', transform:'rotate(-18deg)' }}>YOU WOULDN'T<br />DOWNLOAD A<br />CHEESE</span>
    <span className="trash-badge" style={{ right:3, top:'55%', transform:'rotate(12deg)', background:'#ff0000' }}>HOT SINGLES<br />IN YOUR<br />TASK MANAGER</span>
    <div className="absolute inset-x-0 bottom-0 border-t-[4px] border-white bg-[#c0c0c0] px-1 text-[13px] font-bold text-black">▣ Start │ Bleoodity.exe │ 14 viruses found │ Best viewed at 800×600 │ ☺ 4:20 PM</div>
  </div>
}
