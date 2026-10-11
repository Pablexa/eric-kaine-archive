import { lazy, Suspense, useEffect, useRef } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { useExperience } from '../../lib/experience/ExperienceContext'
import { CHAOS_SCENES, UNDERGROUND_SCENES, isTrollActive } from '../../lib/experience/machine'
import { chat } from '../../lib/experience/chat'
import { objective, useStore } from '../../lib/experience/store'
import { backdrop, introCard, pileDim, shake, streamOverlay } from '../../lib/experience/stage'
import { prefersReducedMotion } from '../../lib/animation/timeline'
import { ChatLog, Objective } from './ChatLog'
import { EndingCard } from './EndingCard'
import { IntroScene } from './scenes/IntroScene'
import { RedactScene } from './scenes/RedactScene'
import { CollapseScene } from './scenes/CollapseScene'
import { PileScene } from './scenes/PileScene'
import { LightsScene } from './scenes/LightsScene'
import { ButtonScene } from './scenes/ButtonScene'
import { MeltdownScene } from './scenes/MeltdownScene'

// Act III is only needed after the button, so it loads lazily (prefetched during Act II)
const loadActThree = () => import('./ActThree')
const UglifyScene = lazy(() => loadActThree().then((m) => ({ default: m.UglifyScene })))
const PopupScene = lazy(() => loadActThree().then((m) => ({ default: m.PopupScene })))
const ClonesScene = lazy(() => loadActThree().then((m) => ({ default: m.ClonesScene })))
const BeatScene = lazy(() => loadActThree().then((m) => ({ default: m.BeatScene })))
const TwistScene = lazy(() => loadActThree().then((m) => ({ default: m.TwistScene })))
const ChaosLayer = lazy(() => loadActThree().then((m) => ({ default: m.ChaosLayer })))
const loadActFour = () => import('./ActFour')
const LabelScene = lazy(() => loadActFour().then((m) => ({ default: m.LabelScene })))
const FoodFightScene = lazy(() => loadActFour().then((m) => ({ default: m.FoodFightScene })))
const BrainrotScene = lazy(() => loadActFour().then((m) => ({ default: m.BrainrotScene })))
const MoshScene = lazy(() => loadActFour().then((m) => ({ default: m.MoshScene })))
const LegendScene = lazy(() => loadActFour().then((m) => ({ default: m.LegendScene })))
const BleoodityFM = lazy(() => loadActFour().then((m) => ({ default: m.BleoodityFM })))
const StreamOverlay = lazy(() => loadActFour().then((m) => ({ default: m.StreamOverlay })))
const Underground3D = lazy(() => import('./Underground3D').then((m) => ({ default: m.Underground3D })))
const UndergroundWallpaper = lazy(() => loadActFour().then((m) => ({ default: m.UndergroundWallpaper })))

/**
 * Everything that happens after the reveal lives in this fixed layer, on top
 * of the real (still mounted) archive. Scenes swap inside it; the physics
 * wreckage persists across scenes in its own sub-layer.
 */
export function TrollLayer() {
  const { state, leaving, pileLayerRef } = useExperience()
  const bd = useStore(backdrop)
  const dim = useStore(pileDim)
  const shakeN = useStore(shake)
  const showStream = useStore(streamOverlay)
  const stageRef = useRef<HTMLDivElement>(null)
  const sx = useMotionValue(0)
  const active = isTrollActive(state)

  // fresh stage for every run
  useEffect(() => {
    if (state.phase !== 'reveal') return
    backdrop.set('dim')
    pileDim.set(false)
    introCard.set(null)
    objective.set(null)
  }, [state.run, state.phase])

  useEffect(() => {
    if (!shakeN || prefersReducedMotion()) return
    void animate(sx, [0, -12, 10, -8, 6, -3, 0], { duration: 0.45 })
  }, [shakeN, sx])

  useEffect(() => {
    if (state.scene === 'pile' || state.scene === 'lights' || state.scene === 'button' || state.scene === 'redact') void loadActThree()
    if (state.scene === 'uglify') void loadActFour()
  }, [state.scene])

  useEffect(() => {
    if (!active) {
      objective.set(null)
      introCard.set(null)
    }
  }, [active])

  if (!active) return null
  const scene = leaving ? null : state.scene

  return (
    <>
      <motion.div
        ref={stageRef}
        className="fixed inset-0 z-[42] overflow-hidden"
        style={{ x: sx, pointerEvents: bd === 'none' && scene !== 'pile' ? 'none' : 'auto', touchAction: scene === 'pile' || scene === 'lights' || scene === 'button' ? 'none' : undefined }}
        onClick={() => chat.skip()}
        data-troll-ui
        data-testid="troll-stage"
        data-scene={state.scene ?? ''}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-ink/65 backdrop-blur-[3px]"
          animate={{ opacity: bd === 'dim' ? 1 : 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          aria-hidden="true"
          className="troll-backdrop absolute inset-0 overflow-hidden"
          animate={{ opacity: bd === 'world' ? 1 : 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <WorldType />
        </motion.div>
        <div ref={pileLayerRef} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: dim ? 0.13 : 1 }} data-testid="pile-layer" />

        {scene === 'intro' ? <IntroScene key={`intro-${state.run}`} /> : null}
        {scene === 'redact' ? <RedactScene key={`redact-${state.run}`} /> : null}
        {scene === 'collapse' ? <CollapseScene key={`collapse-${state.run}`} /> : null}
        {scene === 'pile' ? <PileScene key={`pile-${state.run}`} stage={stageRef} /> : null}
        {scene === 'lights' ? <LightsScene key={`lights-${state.run}`} /> : null}
        {scene === 'button' ? <ButtonScene key={`button-${state.run}`} /> : null}
        {scene === 'meltdown' ? <MeltdownScene key={`meltdown-${state.run}`} /> : null}
      </motion.div>

      {/* Act III renders above the page (not inside the stage) so the page stays visible and pokeable */}
      <Suspense fallback={null}>
        {scene && CHAOS_SCENES.includes(scene) ? <ChaosLayer key={`chaos-${state.run}`} /> : null}
        {scene === 'uglify' ? <UglifyScene key={`uglify-${state.run}`} /> : null}
        {scene === 'popups' ? <PopupScene key={`popups-${state.run}`} /> : null}
        {scene === 'clones' ? <ClonesScene key={`clones-${state.run}`} /> : null}
        {scene === 'beat' ? <BeatScene key={`beat-${state.run}`} /> : null}
        {scene === 'twist' ? <TwistScene key={`twist-${state.run}`} /> : null}
        {scene && UNDERGROUND_SCENES.includes(scene) ? <BleoodityFM key={`fm-${state.run}`} /> : null}
        {scene && UNDERGROUND_SCENES.includes(scene) ? <UndergroundWallpaper key={`wallpaper-${state.run}`} /> : null}
        {scene && UNDERGROUND_SCENES.includes(scene) && showStream ? <Underground3D key={`3d-${state.run}`} /> : null}
        {scene && UNDERGROUND_SCENES.includes(scene) && showStream ? <StreamOverlay key={`stream-${state.run}`} /> : null}
        {scene === 'label' ? <LabelScene key={`label-${state.run}`} /> : null}
        {scene === 'foodfight' ? <FoodFightScene key={`food-${state.run}`} /> : null}
        {scene === 'brainrot' ? <BrainrotScene key={`brain-${state.run}`} /> : null}
        {scene === 'mosh' ? <MoshScene key={`mosh-${state.run}`} /> : null}
        {scene === 'legend' ? <LegendScene key={`legend-${state.run}`} /> : null}
      </Suspense>

      <div data-troll-ui>
        <Objective />
        <ChatLog />
        {state.scene === 'ending' && !leaving ? <EndingCard /> : null}
      </div>
    </>
  )
}

function WorldType() {
  const rows = ['GATEKEPT · DO NOT SHARE · ', 'NOT FAMOUS · NOT FAMOUS · ', 'CONTAINED · 1.5K · CONTAINED · ']
  return (
    <div className="absolute inset-0 flex flex-col justify-around opacity-100">
      {rows.map((r, i) => (
        <div key={i} className="overflow-hidden whitespace-nowrap">
          <div
            className="display inline-block text-[clamp(80px,14vw,220px)] text-transparent [font-stretch:125%] [-webkit-text-stroke:1px_rgba(255,210,31,0.09)]"
            style={{ animation: `marquee ${70 + i * 18}s linear infinite`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
          >
            {r.repeat(6)}
          </div>
        </div>
      ))}
    </div>
  )
}
