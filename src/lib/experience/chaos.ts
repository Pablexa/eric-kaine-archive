import { createStore } from './store'

/**
 * Act III vandalises the real archive. Everything it does goes through here,
 * so `chaos.reset()` can always put the page back exactly as it was:
 *
 * - `html.ug-*` classes switch on page-wide CSS crimes (see index.css)
 * - text nodes can be swapped (and are restored from a saved map)
 * - `--kick` carries the drum machine's kick envelope to CSS
 */

export type UglyStep =
  | 'font' // comic sans + impact
  | 'rainbow' // tiled rainbow background
  | 'wordart' // gradient, outlined hero letters
  | 'borders' // 90s ridge borders, blue links
  | 'wobble' // everything sways
  | 'cursor' // verity cursor
  | 'tilt' // the whole page leans
  | 'beat' // sections bounce on the kick
  | 'drop' // the drop: spin, shake
  | 'upside' // the page is upside down
  | 'vamp' // act IV: red/black underground palette
  | 'jelly' // act IV: everything skews like jelly

const ALL: UglyStep[] = ['font', 'rainbow', 'wordart', 'borders', 'wobble', 'cursor', 'tilt', 'beat', 'drop', 'upside', 'vamp', 'jelly']

export type Widget = 'marquee' | 'counter' | 'construction' | 'trail' | 'badge' | 'webring'
export const widgets = createStore<Widget[]>([])

const swapped = new Map<Text, string>()

export const chaos = {
  add(step: UglyStep) {
    document.documentElement.classList.add(`ug-${step}`)
  },
  remove(step: UglyStep) {
    document.documentElement.classList.remove(`ug-${step}`)
  },
  has(step: UglyStep) {
    return document.documentElement.classList.contains(`ug-${step}`)
  },
  widget(w: Widget) {
    if (!widgets.get().includes(w)) widgets.set([...widgets.get(), w])
  },
  setKick(v: number) {
    document.documentElement.style.setProperty('--kick', v.toFixed(3))
  },
  /** Replace every word on the page with ERIC / KAINE. */
  swapText() {
    const roots = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean) as HTMLElement[]
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let n: Node | null
      let i = 0
      while ((n = walker.nextNode())) {
        const t = n as Text
        if (!t.nodeValue || !t.nodeValue.trim() || swapped.has(t)) continue
        swapped.set(t, t.nodeValue)
        t.nodeValue = t.nodeValue.replace(/\S+/g, () => (i++ % 2 ? 'KAINE' : 'ERIC'))
      }
    }
  },
  restoreText() {
    swapped.forEach((v, t) => {
      t.nodeValue = v
    })
    swapped.clear()
  },
  reset() {
    ALL.forEach((s) => document.documentElement.classList.remove(`ug-${s}`))
    document.documentElement.style.removeProperty('--kick')
    this.restoreText()
    widgets.set([])
  },
}
