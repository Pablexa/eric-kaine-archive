import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { verity } from '../../../lib/experience/verity'
import { objective } from '../../../lib/experience/store'
import { backdrop } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { scrollToY } from '../../../lib/interactions/scroll'
import { easeInOutCubic, prefersReducedMotion, tween, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 01. Verity scrolls the archive back to the top and flies straight
 * through the hero like a wrecking ball. Every element she touches becomes a
 * physical object; everything else follows a beat later.
 */
export function CollapseScene() {
  const { dispatch, ensurePile } = useExperience()

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'annoyed' })

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
      pile.settle(420)
      await chat.say('if the website falls apart, nobody can find him.', { signal })
    } else {
      void chat.say('if the website falls apart, nobody can find him.', { signal }).catch(() => {})
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
      await wait(900, signal)
    }

    pile.hideVerity()
    const top = { x: window.innerWidth / 2, y: Math.max(150, window.innerHeight * 0.26) }
    await verity.moveTo(top.x, top.y, { size: Math.min(110, Math.max(76, window.innerWidth * 0.07)), duration: 0.9, ease: 'spring', signal })
    dispatch({ type: 'MOOD', mood: 'annoyed' })
    await chat.say('there. the archive is closed.', { signal })
    dispatch({ type: 'SCENE', scene: 'pile' })
  }, [])

  return null
}
