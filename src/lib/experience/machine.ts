/**
 * The experience is one state machine.
 *
 *   professional ──(quote in view)──▶ foreshadow
 *        │                               │
 *        └──────(orb · share · ·)────────┴──▶ reveal ──▶ troll ──▶ finale
 *                                                   ▲        │
 *                         RESET from any phase ◀────┴────────┘
 *
 * `scene` narrows what is happening inside reveal / troll / finale.
 */

export type Phase = 'professional' | 'foreshadow' | 'reveal' | 'troll' | 'finale'

export type Scene =
  | 'intro' // Verity explains herself, asks for help
  | 'redact' // cooperative path: help Verity gatekeep the page
  | 'collapse' // the page falls apart
  | 'pile' // protocol 01 — the wreckage is physical
  | 'lights' // protocol 02 — the flashlight game
  | 'button' // protocol 03 — the button Verity cannot allow
  | 'meltdown' // the emergency broadcast
  | 'uglify' // protocol 04 — the site is redesigned into a 2003 homepage
  | 'popups' // protocol 05 — popup hell
  | 'clones' // protocol 06 — the clone army
  | 'beat' // protocol 07 — the beat (and the drop)
  | 'twist' // bleoodity, and the website gets "deleted"
  | 'label' // protocol 08 — bleoodity signs the underground
  | 'foodfight' // protocol 09 — everything goes flying
  | 'brainrot' // protocol 10 — split-screen brainrot
  | 'mosh' // protocol 11 — the website moshes
  | 'legend' // 1.5 billion subscribers, and then the bio
  | 'ending' // ending card

export type Mood = 'calm' | 'annoyed' | 'angry' | 'meltdown' | 'tiny' | 'unhinged'

export type EndingId = 'gatekeeper' | 'obscure' | 'subscriber'

export type RevealSource = 'orb' | 'share' | 'period' | 'replay'

/** Which side the visitor picked in the intro. */
export type Route = 'help' | 'refuse'

export interface ExperienceState {
  phase: Phase
  scene: Scene | null
  mood: Mood
  /** Extra hypothetical subscribers. Only ever 0 or 1. That is the joke. */
  plusSubs: number
  /** Total channel views at capture time plus videos found in the dark. */
  views: number
  ending: EndingId | null
  revealSource: RevealSource | null
  route: Route | null
  /** Increments each time the reveal starts; used to key-reset scenes. */
  run: number
  /** Set once any ending is reached. The periods keep watching after this. */
  witnessed: boolean
}

export type Action =
  | { type: 'FORESHADOW' }
  | { type: 'REVEAL'; source: RevealSource }
  | { type: 'SCENE'; scene: Scene }
  | { type: 'MOOD'; mood: Mood }
  | { type: 'ROUTE'; route: Route }
  | { type: 'VIEW' }
  | { type: 'SUBSCRIBE' }
  | { type: 'END'; ending: EndingId }
  | { type: 'RESET'; keepForeshadow?: boolean; hard?: boolean }

export const BASE_VIEWS = 70077

export const initialState: ExperienceState = {
  phase: 'professional',
  scene: null,
  mood: 'calm',
  plusSubs: 0,
  views: BASE_VIEWS,
  ending: null,
  revealSource: null,
  route: null,
  run: 0,
  witnessed: false,
}

const sceneToPhase = (scene: Scene): Phase => {
  switch (scene) {
    case 'intro':
      return 'reveal'
    case 'meltdown':
    case 'ending':
      return 'finale'
    default:
      return 'troll'
  }
}

export function reducer(state: ExperienceState, action: Action): ExperienceState {
  switch (action.type) {
    case 'FORESHADOW':
      return state.phase === 'professional' ? { ...state, phase: 'foreshadow' } : state

    case 'REVEAL':
      if (state.phase !== 'professional' && state.phase !== 'foreshadow') return state
      return {
        ...state,
        phase: 'reveal',
        scene: 'intro',
        mood: 'calm',
        plusSubs: 0,
        views: BASE_VIEWS,
        ending: null,
        revealSource: action.source,
        route: null,
        run: state.run + 1,
      }

    case 'SCENE':
      if (state.phase === 'professional' || state.phase === 'foreshadow') return state
      return { ...state, scene: action.scene, phase: sceneToPhase(action.scene) }

    case 'MOOD':
      return { ...state, mood: action.mood }

    case 'ROUTE':
      return { ...state, route: action.route }

    case 'VIEW':
      return { ...state, views: state.views + 1 }

    case 'SUBSCRIBE':
      return { ...state, plusSubs: 1 }

    case 'END':
      return { ...state, phase: 'finale', scene: 'ending', ending: action.ending, witnessed: true }

    case 'RESET':
      if (action.hard) return { ...initialState, run: state.run }
      return {
        ...initialState,
        phase: action.keepForeshadow || state.witnessed ? 'foreshadow' : 'professional',
        run: state.run,
        witnessed: state.witnessed,
      }
  }
}

export const isTrollActive = (s: ExperienceState) =>
  s.phase === 'reveal' || s.phase === 'troll' || s.phase === 'finale'

export const PROTOCOLS: { scene: Scene; index: string; label: string }[] = [
  { scene: 'pile', index: '01', label: 'The pile' },
  { scene: 'lights', index: '02', label: 'Leak hunt' },
  { scene: 'button', index: '03', label: 'The follow button' },
  { scene: 'uglify', index: '04', label: 'MySpace era' },
  { scene: 'popups', index: '05', label: 'Free leaks' },
  { scene: 'clones', index: '06', label: 'Industry plants' },
  { scene: 'beat', index: '07', label: 'The cursed beat' },
  { scene: 'label', index: '08', label: 'The label' },
  { scene: 'foodfight', index: '09', label: 'Cheese fight' },
  { scene: 'brainrot', index: '10', label: 'Snippet brainrot' },
  { scene: 'mosh', index: '11', label: 'Rage mosh pit' },
]

/** Song 1, "Reasons I Should Stay": from its cue in the intro until the meltdown's "1.5K" line. */
export const SONG_ONE_SCENES: Scene[] = ['intro', 'redact', 'collapse', 'pile', 'lights', 'button', 'meltdown']

/** Song 2, "bloody": from Protocol 04 (where the old chiptune used to start) until the beat. */
export const SONG_TWO_SCENES: Scene[] = ['uglify', 'popups', 'clones']

/** Scenes during which the archive is in its "uglified" state. */
export const CHAOS_SCENES: Scene[] = ['uglify', 'popups', 'clones', 'beat', 'twist', 'label', 'foodfight', 'brainrot', 'mosh', 'legend']

/** Act IV: Bleoodity's takeover (stream chat + BLEOODITY FM run throughout). */
export const UNDERGROUND_SCENES: Scene[] = ['label', 'foodfight', 'brainrot', 'mosh', 'legend']

export const ENDINGS: Record<EndingId, { title: string; line: string }> = {
  gatekeeper: {
    title: 'Certified Gatekeeper',
    line: 'You helped. You redacted, uglified, popped, dropped, signed the underground, fed Bleoodity, survived the brainrot and moshed. Then you read the bio again. Nobody will ever find him.',
  },
  obscure: {
    title: 'Safely Obscure',
    line: 'The battery died, the lights stayed off, and Eric remains comfortably unknown.',
  },
  subscriber: {
    title: 'One More Subscriber',
    line: '1.5K + 1. You survived the collapse, the dark, the button, the redesign, the popups, the clones, the drop, the label, the food fight, the brainrot and the mosh pit. For a moment he had 1.5 billion. Then everyone read the bio.',
  },
}
