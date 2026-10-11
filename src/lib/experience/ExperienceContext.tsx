import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { stopAll } from '../audio/musicGuard'
import { voice } from '../audio/voice'
import { initialState, isTrollActive, reducer, type Action, type EndingId, type ExperienceState, type RevealSource } from './machine'
import { chat, bubble } from './chat'
import { verity } from './verity'
import { chaos } from './chaos'
import { fm, hudHidden, songOne, songTwo, streamOverlay, subsOverride } from './stage'
import { sfx } from '../audio/sfx'
import type { PileEngine } from '../interactions/pile'
import { lockScroll, unlockScroll } from '../interactions/scroll'
import { clearEndings, readEndings, recordEnding } from '../interactions/storage'
import { TIME, prefersReducedMotion } from '../animation/timeline'

interface ExperienceApi {
  state: ExperienceState
  dispatch: (a: Action) => void
  reveal: (source: RevealSource) => void
  /** Leave the troll experience and restore the archive. */
  leave: (opts?: { quiet?: boolean }) => Promise<void>
  replay: () => Promise<void>
  resetArchive: () => Promise<void>
  finishEnding: (id: EndingId) => void
  endings: EndingId[]
  leaving: boolean
  pileRef: React.MutableRefObject<PileEngine | null>
  pileLayerRef: React.RefObject<HTMLDivElement | null>
  ensurePile: () => Promise<PileEngine | null>
}

const Ctx = createContext<ExperienceApi | null>(null)

export function useExperience() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useExperience outside provider')
  return v
}

const ORIGINAL_TITLE = 'Eric Kaine — The Archive'

const loadPile = () => import('../interactions/pile')

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [endings, setEndings] = useState<EndingId[]>(() => readEndings())
  const [leaving, setLeaving] = useState(false)
  const pileRef = useRef<PileEngine | null>(null)
  const pileLayerRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // Physics is only needed after the reveal, so Matter.js loads lazily.
  const ensurePile = useCallback(async () => {
    const { PileEngine } = await loadPile()
    if (!pileRef.current && pileLayerRef.current) pileRef.current = new PileEngine(pileLayerRef.current)
    // debug/test handle (dev server or ?fast=1 only)
    if (import.meta.env.DEV || TIME.scale < 1) (window as unknown as { __pile?: PileEngine | null }).__pile = pileRef.current
    return pileRef.current
  }, [])

  const reveal = useCallback((source: RevealSource) => {
    const s = stateRef.current
    if (isTrollActive(s)) return
    bubble.hide()
    lockScroll()
    // sound is ON by default; the reveal always comes from a click, so the browser lets it start
    if (!sfx.asked) sfx.enable()
    dispatch({ type: 'REVEAL', source })
  }, [])

  const restore = useCallback(async (quick: boolean) => {
    fm.set('off')
    songOne.set('waiting')
    songTwo.set(false)
    // LEAVE / Esc: every song and every voice stops at once, Bleood's loop included
    stopAll()
    voice.stop()
    sfx.stopMusic()
    streamOverlay.set(false)
    subsOverride.set(null)
    const pile = pileRef.current
    pileRef.current = null
    if (pile) await pile.reassemble(quick || prefersReducedMotion() ? 0 : 950)
    document.querySelectorAll<HTMLElement>('[data-redacted]').forEach((el) => el.removeAttribute('data-redacted'))
    document.documentElement.classList.remove('is-redacting')
    chaos.reset()
    hudHidden.set(false)
    verity.setCostume('none')
    sfx.stopMusic()
    sfx.hum(false)
    // Verity overrode "keep it silent" during Act III; leaving restores the visitor's choice
    if (sfx.forced) {
      sfx.forced = false
      sfx.disable()
    }
    chat.clear()
    chat.mood = 'calm'
    verity.scale.set(1)
    verity.glow.set(0.6)
    unlockScroll(true)
  }, [])

  const leave = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (!isTrollActive(stateRef.current)) return
      setLeaving(true)
      if (!quiet) chat.post('fine. go. he’s safe with me.')
      await restore(false)
      dispatch({ type: 'RESET', keepForeshadow: true })
      setLeaving(false)
      verity.setMode('docked', true)
      void verity.dock({ duration: 0.8 })
    },
    [restore],
  )

  const replay = useCallback(async () => {
    setLeaving(true)
    await restore(true)
    dispatch({ type: 'RESET', keepForeshadow: true })
    setLeaving(false)
    window.scrollTo(0, 0)
    // next frame: start again from the top
    requestAnimationFrame(() => {
      lockScroll()
      dispatch({ type: 'REVEAL', source: 'replay' })
    })
  }, [restore])

  const resetArchive = useCallback(async () => {
    if (isTrollActive(stateRef.current)) await restore(true)
    clearEndings()
    setEndings([])
    dispatch({ type: 'RESET', hard: true })
    verity.setMode('hidden', false)
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [restore])

  const finishEnding = useCallback((id: EndingId) => {
    setEndings(recordEnding(id))
    dispatch({ type: 'END', ending: id })
  }, [])

  // Esc always leaves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTrollActive(stateRef.current)) void leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  // The tab title notices when you leave.
  useEffect(() => {
    const onVis = () => {
      const s = stateRef.current
      if (document.hidden && isTrollActive(s)) document.title = 'come back. he’s still not famous.'
      else if (document.hidden && s.witnessed) document.title = 'verity is watching the archive'
      else document.title = ORIGINAL_TITLE
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    chat.mood = state.mood
  }, [state.mood])

  // Verity has appeared: warm up the physics chunk before anyone needs it.
  useEffect(() => {
    if (state.phase !== 'professional') void loadPile()
  }, [state.phase])

  // Witnessed visitors get watched by every period on the page.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-witnessed', state.witnessed)
  }, [state.witnessed])

  const api = useMemo<ExperienceApi>(
    () => ({ state, dispatch, reveal, leave, replay, resetArchive, finishEnding, endings, leaving, pileRef, pileLayerRef, ensurePile }),
    [state, reveal, leave, replay, resetArchive, finishEnding, endings, leaving, ensurePile],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
