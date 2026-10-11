/**
 * Original cartoon sprites for Act IV. All hand-written SVG (viewBox 100×100),
 * no traced or copied artwork, no real people's likenesses.
 *
 * Usage: `spriteUrl(id)` for <img>, `spriteImage(id)` for canvas drawImage.
 */

export type SpriteId =
  | 'seal'
  | 'burger'
  | 'cheese'
  | 'torta'
  | 'soda'
  | 'drank'
  | 'draco'
  | 'dragon'
  | 'poo'
  | 'slime'
  | 'fangs'
  | 'flame'
  | 'star'
  | 'coin'
  | 'cheeseguy'
  | 'burgerguy'
  | 'lilverity'
  | 'sealdreads'

const EYES = (x1: number, x2: number, y: number, r = 4) =>
  `<circle cx='${x1}' cy='${y}' r='${r + 2}' fill='#fff'/><circle cx='${x2}' cy='${y}' r='${r + 2}' fill='#fff'/><circle cx='${x1 + 1}' cy='${y + 1}' r='${r - 1}' fill='#111'/><circle cx='${x2 + 1}' cy='${y + 1}' r='${r - 1}' fill='#111'/>`

const DREADS = `<g stroke-linecap='round' stroke-width='6' fill='none'>
  <path d='M30 26 C22 16 26 8 18 2' stroke='#ff3fbf'/><path d='M40 20 C36 10 42 4 38 -4' stroke='#26d0ce'/>
  <path d='M50 18 C50 8 56 2 54 -6' stroke='#ffd21f'/><path d='M60 20 C64 10 60 4 66 -4' stroke='#c53cff'/>
  <path d='M70 26 C78 16 74 8 82 2' stroke='#5be36b'/><path d='M22 34 C10 32 8 22 0 18' stroke='#ff7a1f'/>
  <path d='M78 34 C90 32 92 22 100 18' stroke='#ff3fbf'/></g>`

const SVG: Record<SpriteId, string> = {
  seal: `<ellipse cx='54' cy='64' rx='36' ry='22' fill='#8a96a3'/><ellipse cx='60' cy='72' rx='24' ry='12' fill='#b8c2cc'/>
    <circle cx='30' cy='44' r='20' fill='#9aa6b2'/><path d='M86 68 Q99 58 97 80 Q91 77 85 76Z' fill='#6f7b87'/>
    <path d='M44 80 Q40 95 55 92 Q53 84 51 78Z' fill='#6f7b87'/>${EYES(23, 37, 40, 3)}
    <ellipse cx='30' cy='50' rx='4' ry='3' fill='#222'/><path d='M20 52 L6 50 M20 55 L7 58 M40 52 L54 50 M40 55 L53 58' stroke='#2b2b2b' stroke-width='1.5'/>`,
  burger: `<path d='M12 46 Q12 14 50 14 Q88 14 88 46Z' fill='#e9a23b'/>
    <g fill='#fff6d5'><ellipse cx='34' cy='26' rx='3' ry='1.6'/><ellipse cx='52' cy='22' rx='3' ry='1.6'/><ellipse cx='66' cy='30' rx='3' ry='1.6'/><ellipse cx='44' cy='34' rx='3' ry='1.6'/></g>
    <path d='M8 50 Q18 42 28 50 T48 50 T68 50 T92 50 L92 56 L8 56Z' fill='#5cb85c'/>
    <path d='M12 56 L88 56 L88 61 L60 61 L54 68 L48 61 L12 61Z' fill='#f7c531'/>
    <rect x='9' y='61' width='82' height='13' rx='6' fill='#6b3a1f'/><path d='M12 76 L88 76 Q88 90 50 90 Q12 90 12 76Z' fill='#e0952f'/>`,
  cheese: `<path d='M8 72 L92 40 L92 84 L8 84Z' fill='#ffc61a'/><path d='M8 72 L92 40 L80 28 L8 62Z' fill='#ffe066'/>
    <g fill='#e6a100'><circle cx='38' cy='72' r='6'/><circle cx='66' cy='66' r='8'/><circle cx='82' cy='77' r='4'/><circle cx='24' cy='79' r='3'/><ellipse cx='56' cy='44' rx='5' ry='2.4'/></g>`,
  torta: `<ellipse cx='50' cy='36' rx='42' ry='19' fill='#d9893b'/><path d='M26 28 Q34 22 42 28 M48 24 Q56 18 64 24 M64 32 Q72 26 80 32' stroke='#b06a24' stroke-width='2.5' fill='none'/>
    <path d='M9 46 Q50 60 91 46 L91 52 Q50 67 9 52Z' fill='#5cb85c'/><path d='M11 52 Q50 64 89 52 L89 58 Q50 71 11 58Z' fill='#e74c3c'/>
    <path d='M12 58 Q50 70 88 58 L88 62 Q50 75 12 62Z' fill='#9acd32'/><ellipse cx='50' cy='70' rx='42' ry='14' fill='#c97a2e'/>`,
  soda: `<path d='M23 30 L77 30 L68 93 L32 93Z' fill='#8e44ad'/><path d='M23 30 L77 30 L76 38 L24 38Z' fill='#7d3c98'/>
    <rect x='19' y='23' width='62' height='8' rx='3' fill='#ecf0f1'/><rect x='55' y='2' width='6' height='26' rx='2' fill='#e74c3c' transform='rotate(14 58 15)'/>
    <text x='50' y='62' font-size='13' text-anchor='middle' fill='#fff' font-family='Impact,Arial Black,sans-serif'>GRAPE</text>
    <text x='50' y='78' font-size='13' text-anchor='middle' fill='#fff' font-family='Impact,Arial Black,sans-serif'>SODA</text>`,
  drank: `<path d='M24 22 L76 22 L70 94 L30 94Z' fill='#f4f4f0' stroke='#cfcfc6' stroke-width='2'/>
    <path d='M27 16 L73 16 L70 52 L30 52Z' fill='#ffffff' stroke='#d8d8d0' stroke-width='2'/>
    <ellipse cx='50' cy='17' rx='23' ry='5' fill='#9b4dff'/><ellipse cx='50' cy='17' rx='18' ry='3' fill='#c58cff'/>
    <path d='M30 56 Q50 60 70 56' stroke='#dcdcd4' stroke-width='2' fill='none'/>
    <rect x='56' y='-4' width='5' height='26' rx='2' fill='#ff3fbf' transform='rotate(18 58 9)'/>
    <g fill='#9b4dff' opacity='.85'><circle cx='40' cy='34' r='2.5'/><circle cx='58' cy='40' r='2'/></g>`,
  draco: `<g transform='rotate(-8 50 50)'>
    <path d='M8 40 L64 40 L66 34 L74 34 L74 40 L94 40 L94 50 L74 50 L72 56 L8 56Z' fill='#2b2b2b'/>
    <path d='M40 40 L62 40 L62 36 L40 36Z' fill='#444'/><path d='M94 43 L100 43 L100 47 L94 47Z' fill='#555'/>
    <path d='M44 56 Q40 80 54 94 L66 90 Q56 76 58 56Z' fill='#3a3a3a'/>
    <path d='M22 56 L34 56 L30 82 L14 82Z' fill='#9a5b2a'/><path d='M66 50 L84 50 L82 58 L68 58Z' fill='#9a5b2a'/>
    <path d='M34 58 Q40 70 46 58' stroke='#2b2b2b' stroke-width='3' fill='none'/></g>
    <g font-family='Impact,sans-serif' font-size='12' fill='#ffd21f'><text x='4' y='24'>✦</text><text x='86' y='86'>✦</text></g>`,
  dragon: `<path d='M22 66 Q4 70 6 88 Q14 78 26 76Z' fill='#27ae60'/><ellipse cx='48' cy='62' rx='28' ry='19' fill='#2ecc71'/>
    <path d='M36 48 L18 18 L48 44Z' fill='#1e9e55'/><path d='M50 44 L46 14 L66 42Z' fill='#27ae60'/>
    <path d='M30 46 l4 -8 l4 8 M42 43 l4 -8 l4 8' fill='#f1c40f'/><circle cx='74' cy='42' r='17' fill='#2ecc71'/>
    <ellipse cx='60' cy='70' rx='16' ry='9' fill='#a9f5c4'/>${EYES(72, 82, 37, 3)}
    <path d='M87 50 Q99 46 98 54 Q93 52 88 54Z' fill='#ff7f00'/><path d='M92 50 Q100 52 99 57' stroke='#ffd21f' stroke-width='2' fill='none'/>`,
  poo: `<path d='M18 84 Q6 84 11 72 Q4 62 19 57 Q16 44 32 42 Q31 28 47 28 Q48 16 60 11 Q58 25 67 31 Q80 33 76 46 Q89 48 86 59 Q97 64 90 74 Q94 84 81 84Z' fill='#7b4a24'/>
    <path d='M30 50 Q50 46 70 50 M22 64 Q50 60 80 64' stroke='#5e3518' stroke-width='3' fill='none'/>${EYES(40, 60, 58, 4)}
    <path d='M38 72 Q50 80 62 72' stroke='#fff' stroke-width='3.5' fill='none' stroke-linecap='round'/>`,
  slime: `<path d='M10 84 Q4 48 30 32 Q50 18 70 32 Q96 48 90 84Z' fill='#7bed3f'/><path d='M22 84 Q22 92 28 92 Q32 92 32 84 M60 84 Q60 96 66 96 Q70 96 70 84' fill='#7bed3f'/>
    <ellipse cx='34' cy='40' rx='9' ry='5' fill='#c8ff9e'/>${EYES(40, 62, 56, 4)}<path d='M42 70 Q51 76 60 70' stroke='#1d5c0c' stroke-width='3' fill='none' stroke-linecap='round'/>`,
  fangs: `<path d='M10 40 Q50 6 90 40 Q50 98 10 40Z' fill='#b3001b'/><path d='M18 42 Q50 22 82 42 Q50 70 18 42Z' fill='#2b0008'/>
    <path d='M22 42 Q50 30 78 42 L74 47 Q50 38 26 47Z' fill='#fff'/><path d='M30 44 L35 62 L40 46Z M60 46 L65 62 L70 44Z' fill='#fff'/>
    <g fill='#ff1f3d' font-family='Impact,sans-serif' font-size='18'><text x='4' y='18'>+</text><text x='84' y='20'>+</text><text x='46' y='96'>+</text></g>`,
  flame: `<path d='M50 96 Q16 92 18 62 Q20 40 38 26 Q36 44 48 48 Q44 20 62 4 Q62 30 76 42 Q90 56 84 74 Q78 94 50 96Z' fill='#ff4128'/>
    <path d='M50 92 Q30 88 32 70 Q34 56 46 48 Q46 62 56 64 Q56 50 64 40 Q76 56 72 72 Q68 90 50 92Z' fill='#ffb000'/>
    <path d='M50 88 Q40 86 42 76 Q44 68 50 64 Q54 74 60 76 Q60 86 50 88Z' fill='#fff3a6'/>`,
  star: `<path d='M50 4 L61 37 L96 38 L68 59 L78 94 L50 73 L22 94 L32 59 L4 38 L39 37Z' fill='#b46cff' stroke='#ffd6ff' stroke-width='3'/>${EYES(42, 58, 48, 3)}`,
  coin: `<circle cx='50' cy='50' r='44' fill='#f5b301'/><circle cx='50' cy='50' r='34' fill='#ffd84d' stroke='#c98a00' stroke-width='4'/>
    <text x='50' y='64' font-size='40' text-anchor='middle' fill='#c98a00' font-family='Impact,Arial Black,sans-serif'>V</text>`,
  cheeseguy: `<path d='M18 82 L18 96 M34 82 L34 96' stroke='#c98a00' stroke-width='6' stroke-linecap='round'/>
    <rect x='10' y='22' width='54' height='62' rx='6' fill='#ffc61a'/><g fill='#e6a100'><circle cx='20' cy='34' r='4'/><circle cx='54' cy='70' r='6'/><circle cx='22' cy='72' r='3'/><circle cx='56' cy='30' r='3'/></g>
    ${EYES(29, 45, 44, 4)}<path d='M27 58 Q37 66 47 58' stroke='#7a4a00' stroke-width='3' fill='none' stroke-linecap='round'/>
    <path d='M62 54 L74 50' stroke='#ffc61a' stroke-width='7' stroke-linecap='round'/>
    <g transform='rotate(-25 82 48)'><rect x='70' y='38' width='26' height='20' rx='9' fill='#f3d9a4'/><path d='M74 40 Q78 34 82 40 Q86 34 90 40' fill='#5cb85c'/><path d='M76 42 L92 42' stroke='#c0392b' stroke-width='3'/></g>`,
  burgerguy: `<path d='M34 82 L30 97 M66 82 L70 97' stroke='#3b2a1a' stroke-width='7' stroke-linecap='round'/>
    <path d='M12 50 L2 66 M88 50 L98 66' stroke='#3b2a1a' stroke-width='7' stroke-linecap='round'/>
    <path d='M10 44 Q10 6 50 6 Q90 6 90 44Z' fill='#e9a23b'/><g fill='#fff6d5'><ellipse cx='30' cy='16' rx='3.4' ry='1.8'/><ellipse cx='50' cy='12' rx='3.4' ry='1.8'/><ellipse cx='70' cy='18' rx='3.4' ry='1.8'/></g>
    <path d='M6 48 Q16 40 26 48 T46 48 T66 48 T94 48 L94 54 L6 54Z' fill='#5cb85c'/><path d='M10 54 L90 54 L90 59 L64 59 L58 67 L52 59 L10 59Z' fill='#f7c531'/>
    <rect x='7' y='59' width='86' height='15' rx='7' fill='#6b3a1f'/><path d='M10 76 L90 76 Q90 90 50 90 Q10 90 10 76Z' fill='#e0952f'/>
    <ellipse cx='50' cy='31' rx='19' ry='12' fill='#1c1c1c'/><rect x='35' y='26' width='13' height='7' rx='3' fill='#2d2d2d' stroke='#7fd4ff' stroke-width='1.5'/><rect x='52' y='26' width='13' height='7' rx='3' fill='#2d2d2d' stroke='#7fd4ff' stroke-width='1.5'/>
    <path d='M44 37 Q50 41 56 37' stroke='#fff' stroke-width='2' fill='none'/>`,
  lilverity: `<circle cx='50' cy='46' r='38' fill='#ffd21f'/><ellipse cx='36' cy='28' rx='10' ry='6' fill='#fff6c2'/>
    <ellipse cx='38' cy='44' rx='5' ry='8' fill='#1a1400'/><ellipse cx='62' cy='44' rx='5' ry='8' fill='#1a1400'/><path d='M40 60 Q50 66 60 60' stroke='#1a1400' stroke-width='3' fill='none'/>
    <path d='M18 70 Q50 98 82 70' stroke='#f5b301' stroke-width='6' fill='none' stroke-dasharray='6 3'/><circle cx='50' cy='88' r='8' fill='#f5b301'/><text x='50' y='92' font-size='10' text-anchor='middle' fill='#7a5200' font-family='Impact'>V</text>`,
  sealdreads: `${DREADS}<ellipse cx='54' cy='68' rx='34' ry='20' fill='#8a96a3'/><ellipse cx='60' cy='76' rx='22' ry='10' fill='#b8c2cc'/>
    <circle cx='50' cy='44' r='24' fill='#9aa6b2'/>${EYES(42, 58, 40, 3.5)}<ellipse cx='50' cy='50' rx='4' ry='3' fill='#222'/>
    <path d='M40 52 L26 50 M40 55 L27 58 M60 52 L74 50 M60 55 L73 58' stroke='#2b2b2b' stroke-width='1.5'/><path d='M86 72 Q98 64 96 82 Q90 80 85 79Z' fill='#6f7b87'/>`,
}

const cacheUrl = new Map<SpriteId, string>()
export function spriteUrl(id: SpriteId) {
  let u = cacheUrl.get(id)
  if (!u) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -8 100 108' width='200' height='216'>${SVG[id]}</svg>`
    u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    cacheUrl.set(id, u)
  }
  return u
}

const cacheImg = new Map<SpriteId, HTMLImageElement>()
export function spriteImage(id: SpriteId) {
  let img = cacheImg.get(id)
  if (!img) {
    img = new Image()
    img.src = spriteUrl(id)
    cacheImg.set(id, img)
  }
  return img
}

export const preloadSprites = (ids: SpriteId[]) => ids.forEach(spriteImage)
