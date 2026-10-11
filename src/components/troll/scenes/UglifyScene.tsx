import { useExperience } from '../../../lib/experience/ExperienceContext'
import { chat } from '../../../lib/experience/chat'
import { chaos } from '../../../lib/experience/chaos'
import { verity } from '../../../lib/experience/verity'
import { ask, objective } from '../../../lib/experience/store'
import { backdrop } from '../../../lib/experience/stage'
import { sfx } from '../../../lib/audio/sfx'
import { scrollToY } from '../../../lib/interactions/scroll'
import { prefersReducedMotion, wait } from '../../../lib/animation/timeline'
import { useScript } from '../useScript'

/**
 * Protocol 04. "If it looks bad, nobody will share it." Verity redesigns the
 * real archive, step by step, into the worst homepage of 2003 — with a guided
 * tour, a hit counter, and music nobody asked for.
 */
export function UglifyScene() {
  const { dispatch } = useExperience()

  useScript(async (signal) => {
    const reduce = prefersReducedMotion()
    const say = (t: string, o: Parameters<typeof chat.say>[1] = {}) => chat.say(t, { signal, ...o })
    const step = async (fn: () => void, line: string, sound: () => void = () => sfx.glitch()) => {
      fn()
      sound()
      await say(line, { hold: 1300 })
    }

    backdrop.set('none')
    objective.set(null)
    dispatch({ type: 'MOOD', mood: 'unhinged' })
    const parkX = Math.min(window.innerWidth - 70, window.innerWidth * 0.86)
    void verity.moveTo(parkX, window.innerHeight * 0.66, { size: 72, duration: 0.8, signal }).catch(() => {})
    await scrollToY(0, reduce ? 0 : 600, signal)

    await say('new plan.', { hold: 900 })
    await say('if the website looks bad, nobody will share it.')
    objective.set('Protocol 04 · Make it unshareable')

    await step(() => chaos.add('font'), 'step one: comic sans.')
    await step(() => chaos.add('rainbow'), 'step two: a nice background.', () => sfx.whoosh())
    await step(() => chaos.add('wordart'), 'step three: wordart. very professional.', () => sfx.boing())
    await step(
      () => {
        chaos.widget('marquee')
        chaos.widget('counter')
      },
      'step four: a hit counter. nobody shares a site with a hit counter.',
      () => sfx.errorDing(),
    )
    await step(() => chaos.add('borders'), 'step five: borders. lots of borders.', () => sfx.thud(0.7))

    // the sound joke: "keep it silent" was never really an option
    if (!sfx.enabled) {
      sfx.forced = true
      sfx.enable()
      await say('i turned your sound back on. you’re welcome.', { tone: 'loud' })
    }
    sfx.startMusic()
    await step(() => chaos.widget('construction'), 'step six: music. original composition. ten out of ten.', () => sfx.errorDing(3))
    await step(
      () => {
        chaos.add('wobble')
        chaos.add('cursor')
        chaos.widget('trail')
      },
      'step seven: everything wobbles now.',
      () => sfx.boing(),
    )

    // the guided tour of the damage
    objective.set('Enjoy the tour')
    const max = document.documentElement.scrollHeight - window.innerHeight
    const stops: [string, string][] = [
      ['latest', 'the latest videos: ugly.'],
      ['streams', 'the streams: very ugly.'],
      ['about', 'the about section: a crime.'],
      ['archive', 'the archive: i don’t even know what that is.'],
    ]
    for (const [id, line] of stops) {
      const el = document.getElementById(id)
      if (!el) continue
      const y = Math.min(max, el.getBoundingClientRect().top + window.scrollY - 60)
      void say(line, { hold: 700 }).catch(() => {})
      await scrollToY(y, reduce ? 0 : 1100, signal)
      sfx.squeak()
      await wait(900, signal)
    }
    await scrollToY(0, reduce ? 0 : 900, signal)

    objective.set('Rate the redesign')
    await say('be honest. is it ugly enough?', { hold: 200 })
    const c = await ask(
      [
        { id: 'hideous', label: 'It’s hideous', tone: 'yellow' },
        { id: 'beautiful', label: 'It’s… kind of beautiful' },
      ],
      signal,
    )
    if (c === 'beautiful') {
      await say('BEAUTIFUL??', { tone: 'loud', hold: 700 })
      await say('fine. MORE.', { tone: 'loud' })
    } else {
      await say('hideous isn’t enough. it needs to be illegal.')
    }
    chaos.add('tilt')
    chaos.widget('badge')
    chaos.widget('webring')
    sfx.crash()
    await say('there. it’s leaning now.', { hold: 1400 })
    objective.set(null)
    await say('hm. people might still share it ironically.', { hold: 1200 })
    await say('time for popups.', { tone: 'loud', hold: 600 })
    dispatch({ type: 'SCENE', scene: 'popups' })
  }, [])

  return null
}
