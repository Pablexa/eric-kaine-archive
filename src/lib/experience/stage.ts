import { createStore } from './store'

/** What sits behind the troll world: nothing, a dim veil, or Verity's grid. */
export type Backdrop = 'none' | 'dim' | 'world'
export const backdrop = createStore<Backdrop>('dim')

/** The card Verity holds up during the intro. */
export const introCard = createStore<null | 'quote' | 'stamped'>(null)

/** Whether the physics wreckage is dimmed into the background. */
export const pileDim = createStore(false)

/** Screen shake impulses (finale). */
export const shake = createStore(0)

/** The fake "website deleted" page hides the HUD for a few seconds. */
export const hudHidden = createStore(false)

/** Overrides the HUD subscriber readout (the 1.5 billion moment). */
export const subsOverride = createStore<string | null>(null)

/** Act IV: BLEOODITY FM (the real song, via YouTube's own player). */
export const fm = createStore<'off' | 'on' | 'closed'>('off')

/** Act IV: the fake stream overlay (chat + donation alerts). */
export const streamOverlay = createStore(false)

/** The end: the credits page (with the patience player) is on top of the ending card. */
export const credits = createStore(false)

/** Song 1 ("Reasons I Should Stay"): waits for "ok. then we do this the hard way.", stops on the meltdown's "1.5K" line. */
export const songOne = createStore<'waiting' | 'playing' | 'stopped'>('waiting')

/** The MySpace-era song (kaineity-loop): starts in Protocol 04, where the old chiptune used to. */
export const songTwo = createStore(false)
