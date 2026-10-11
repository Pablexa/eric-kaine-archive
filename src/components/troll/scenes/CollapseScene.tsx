import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { scrollToY } from '../../../lib/interactions/scroll'
import type { PileEngine } from '../../../lib/interactions/pile'
import { artistMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { EASE, easeInOutCubic, prefersReducedMotion, tween, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'
import './CollapseScene.css'

/**
 * Real photos that fall into the wreckage once the page has collapsed. Their
 * pile labels (`photo:<id>`) drive Eric Kaineity's grab and hit lines.
 */
const DROPS: { id: string; media: RealMedia; caption: string }[] = [
  { id: 'cheese', media: objectMedia.cheese, caption: 'CHEESE.JPG' },
  { id: 'seal', media: objectMedia.seal, caption: 'SEAL (REAL).JPG' },
  { id: 'bleood', media: artistMedia.bleood, caption: 'BLEOOD.JPG' },
  { id: 'drink', media: objectMedia.drink, caption: 'DOUBLE CUP.JPG' },
  { id: 'burger', media: objectMedia.burger, caption: 'BURGER_LEAK.JPG' },
  { id: 'slimey', media: artistMedia.slimey, caption: '2SLIMEY.JPG' },
  { id: 'slime', media: objectMedia.slime, caption: 'SLIME.JPG' },
  { id: 'slayr', media: artistMedia.slayr, caption: 'SLAYR.JPG' },
  { id: 'osamason', media: artistMedia.osamason, caption: 'OSAMASON.JPG' },
  { id: 'jaydes', media: artistMedia.jaydes, caption: 'JAYDES.JPG' },
  { id: 'carti', media: artistMedia.carti, caption: 'CARTI.JPG' },
]

function photoNode(drop: (typeof DROPS)[number], i: number) {
  const node = document.createElement('div')
  node.className = 'ks-pile-photo'
  node.dataset.tone = String(i % 5)
  const img = document.createElement('img')
  img.src = drop.media.src
  img.alt = ''
  img.draggable = false
  img.decoding = 'async'
  const caption = document.createElement('span')
  caption.textContent = drop.caption
  node.append(img, caption)
  return node
}

/** The underground falls in: photo stickers join the pile as real bodies. */
function dropPhotos(pile: PileEngine, fromAbove: boolean) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const list = vw < 640 ? DROPS.slice(0, 6) : DROPS
  const w = Math.round(Math.max(74, Math.min(128, vw * 0.085)))
  const h = Math.round(w * 1.22)
  list.forEach((d, i) => {
    const x = vw * (0.08 + (0.84 * (i + 0.5)) / list.length) + (Math.random() - 0.5) * 24
    const y = fromAbove ? -h - i * 46 - Math.random() * 30 : vh * 0.28 + (i % 3) * h * 0.45
    pile.addLoose(photoNode(d, i), {
      x,
      y,
      w,
      h,
      label: `photo:${d.id}`,
      vx: (Math.random() - 0.5) * 3,
      vy: fromAbove ? 2 + Math.random() * 3 : 0,
      spin: (Math.random() - 0.5) * 0.14,
    })
  })
}

/**
 * Protocol 01. Eric Kaineity scrolls the archive back to the top and flies
 * straight through the hero like a wrecking ball. Every element it touches
 * becomes a physical object; everything else follows a beat later, and then
 * the underground (real photos) falls in on top.
 */
export function CollapseScene() {
  const { dispatch, ensurePile } = useExperience()
  const [alert, setAlert] = useState(false)

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'annoyed' })
    for (const d of DROPS) {
      const img = new Image()
      img.src = d.media.src
    }

    // back to the top, so the wreck happens to the most important composition
    const c = verity.centerPosition()
    void verity.moveTo(c.x, Math.max(120, window.innerHeight * 0.2), { size: c.size * 0.7, duration: 0.7, signal }).catch(() => {})
    await scrollToY(0, reduce ? 0 : 800, signal)
    await wait(150, signal)

    sfx.alarm(2)
    const pile = await ensurePile()
    if (!pile || signal.aborted) return
    pile.capture([...document.querySelectorAll<HTMLElement>('[data-physics]')])
    backdrop.set('world')
    pile.start()

    if (reduce) {
      pile.releaseAll(0.4)
      dropPhotos(pile, false)
      pile.settle(420)
      setAlert(true)
      await chat.say('if the fan page falls apart, nobody can find him. underground forever.', { signal })
    } else {
      void chat.say('if the fan page falls apart, nobody can find him. underground forever.', { signal }).catch(() => {})
      await wait(500, signal)

      // build a path through the two title lines
      const lineY = (n: number) => {
        const ys = pile.pieces.filter((p) => p.el.dataset.line === String(n)).map((p) => p.body.position.y)
        return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : window.innerHeight * (n === 1 ? 0.3 : 0.5)
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const y1 = lineY(1)
      const y2 = lineY(2)
      const r = Math.max(34, Math.min(64, vw * 0.045))
      const pts = [
        { x: -r * 2, y: y1 },
        { x: vw + r * 2, y: y1 + 10 },
        { x: vw + r * 2, y: y2 },
        { x: -r * 2, y: y2 + 10 },
        { x: vw * 0.5, y: vh - r * 1.2 },
      ]
      verity.jump(pts[0].x, pts[0].y, r * 2)
      dispatch({ type: 'MOOD', mood: 'angry' })
      sfx.whoosh()

      let lastThud = 0
      const leg = async (a: (typeof pts)[number], b: (typeof pts)[number], ms: number) => {
        const dir = { x: Math.sign(b.x - a.x) || 0, y: Math.sign(b.y - a.y) || 0 }
        await tween(
          ms,
          (t) => {
            const x = a.x + (b.x - a.x) * t
            const y = a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * (b.y === a.y ? -18 : 0)
            verity.jump(x, y)
            pile.setVerity(x, y, r)
            const hits = pile.piecesNear(x, y, r + 6)
            for (const p of hits) {
              pile.release(p, dir.x * (6 + Math.random() * 6), -4 - Math.random() * 5 + dir.y * 6, (Math.random() - 0.5) * 0.35)
            }
            if (hits.length && performance.now() - lastThud > 70) {
              lastThud = performance.now()
              sfx.thud(0.5 + Math.random() * 0.4)
            }
          },
          { ease: (t) => t, signal },
        )
      }
      await leg(pts[0], pts[1], 1050)
      verity.jump(pts[2].x, pts[2].y)
      await leg(pts[2], pts[3], 1150)
      // dive and slam the floor
      await tween(
        650,
        (t) => {
          const e = easeInOutCubic(t)
          const x = pts[3].x + (pts[4].x - pts[3].x) * e
          const y = pts[3].y + (pts[4].y - pts[3].y) * e * e
          verity.jump(x, y)
          pile.setVerity(x, y, r)
        },
        { signal },
      )
      sfx.boom()
      sfx.thud(1)
      pile.releaseAll(1.4)
      pile.quake(9)
      dropPhotos(pile, true)
      setAlert(true)
      await wait(900, signal)
    }

    pile.hideVerity()
    const top = { x: window.innerWidth / 2, y: Math.max(150, window.innerHeight * 0.26) }
    await verity.moveTo(top.x, top.y, { size: Math.min(110, Math.max(76, window.innerWidth * 0.07)), duration: 0.9, ease: 'spring', signal })
    dispatch({ type: 'MOOD', mood: 'annoyed' })
    await chat.say('there. the archive is gatekept. strictly underground now.', { signal })
    dispatch({ type: 'SCENE', scene: 'pile' })
  }, [])

  return (
    <AnimatePresence>
      {alert ? (
        <motion.div
          key="leak-alert"
          className="pointer-events-none fixed inset-x-0 top-[96px] z-[44] flex justify-center px-4 sm:top-[104px]"
          initial={prefersReducedMotion() ? false : { opacity: 0, scale: 1.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE.snap }}
        >
          <p className="ks-leak-alert max-w-[min(92vw,640px)] px-4 py-2 text-center text-[clamp(22px,3.4vw,40px)] leading-none">
            <span className="ks-blink">!!!</span> UNDERGROUND NEWS <span className="ks-blink">!!!</span>
            <small className="mt-1.5 text-[clamp(12px,1.4vw,16px)]">eric kaine fan page collapses. nobody is surprised. more leaks at 11.</small>
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
