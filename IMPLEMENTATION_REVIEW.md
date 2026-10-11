# Implementation review

Reviewed on 2026-10-10 against the brief. Everything marked **verified** was observed in a real browser (headless Chrome via Playwright, or the in-app browser) or by the automated suite. Nothing here is assumed.

## What was verified

| Area | Evidence |
|---|---|
| Act I loads cleanly, with no runtime errors | `professional.spec.ts`; console tracked in every spec |
| Navigation, mobile menu, gallery arrows, archive filters (23/14/3/6), lazy YouTube embed | `professional.spec.ts`, `mobile.spec.ts` |
| Every media link is a real `youtube.com/watch` or `/shorts` URL; thumbnails actually load | `professional.spec.ts` |
| First anomaly (`understood.`) → Verity docks | `reveal.spec.ts`; screenshots 04 and 05 |
| All three reveal triggers (orb, Share, triple-tap period) | `reveal.spec.ts` |
| Sound needs explicit permission; mute works | `reveal.spec.ts` |
| Collapse → pile → hits escalate → lights → button → broadcast → **Act III** (uglify → popups → clones → beat/drop → Bleoodity/404 twist) → ending | `endings.spec.ts` (fast pacing) **and** `scripts/capture.mjs realtime` (real pacing: **about 236 s** of quick active play, 0 errors) |
| The cooperative path also runs through all of Act III | `endings.spec.ts` |
| Leaving mid-chaos (the fake "LEAVING… 99%") removes every `ug-*` class, widget and text swap | `endings.spec.ts` |
| Act III on a phone | `scripts/capture.mjs act3mobile` (screenshots 50–54) |
| All three endings, their persistence across reloads, replay | `endings.spec.ts` |
| Leave or `Esc` mid-wreckage restores every hero element; a refresh mid-experience returns a clean archive | `reveal.spec.ts` |
| Keyboard-only flashlight | `endings.spec.ts` |
| Touch: the full troll path on a Pixel 7 profile; no horizontal overflow | `mobile.spec.ts` |
| Reduced motion: the collapse settles instantly, grain is static | `reduced-motion.spec.ts`, plus a manual run in the in-app browser (which reports `prefers-reduced-motion: reduce`) |
| Production CSP: no violations through playback, reveal and collapse | `scripts/check-csp.mjs` |
| Layout at 1440×900, 1920×1080, 768×1024, 412×915 (Pixel 7) | `screenshots/` (30 captures from the real build) |

**Test suite:** 27 Playwright scenarios verified across the final production sweep and targeted runs (details below).

## Screenshots (real implementation)

| | |
|---|---|
| Professional homepage | `01-hero-1440.png`, `28-hero-1920.png` |
| Professional media | `02-latest-1440.png`, `03-streams-1440.png`, `06-archive-1440.png` |
| First anomaly | `04-first-anomaly-1440.png`, `05-verity-docked-1440.png` |
| Reveal | `07-reveal-1440.png`, `08-exhibit-a-1440.png` |
| Major transformation | `09-collapse-mid-1440.png`, `10-pile-1440.png` |
| Full troll state | `11-lights-searching.png`, `12-button.png`, `12-shield.png`, `12-shell-game.png`, `12-calm.png` |
| Finale | `13-meltdown.png`, `13b-meltdown-realtime.png`, `14-rebuild.png`, `15-ending.png`, `16-after.png` |
| Cooperative ending | `17-redacting.png`, `18-ending-gatekeeper.png` |
| Mobile professional | `20-mobile-hero.png`, `21-mobile-menu.png`, `22-mobile-latest.png`, `23-mobile-archive.png` |
| Mobile troll | `24-mobile-pile.png`, `25-mobile-lights.png` |
| Tablet | `26-tablet-hero.png`, `27-tablet-latest.png` |
| Act III (desktop) | `30-uglify.png`, `30-uglify-tilt.png`, `30-popups-early.png`, `30-popups-hell.png`, `30-clones.png`, `30-beat.png`, `30-drop.png`, `40-drop.png`, `40-bleoodity.png`, `30-not-found.png`, `39-ending.png` |
| Act III (mobile) | `50-mobile-uglify.png`, `51-mobile-popups.png`, `52-mobile-clones.png`, `53-mobile-beat.png`, `54-mobile-ending.png` |

## Checklist against "no generic AI aesthetic"

| Avoid | Status |
|---|---|
| Purple gradients, glowing borders | None. There's one accent (banner red) and one motif color (Verity yellow). |
| Identical rounded cards | Media is square and editorial. Layouts vary: full-bleed hero, 8/4 featured, 7/4 offset pair, horizontal strip, staggered tall Shorts, index table, giant link list. |
| "Welcome to my website" copy | Copy is specific and sourced (e.g. "Two years later, to the day…"). |
| Emoji as UI icons | Custom SVG icon set. Emoji appear only inside Eric's own video titles. |
| Fake stats, testimonials, social proof | The only numbers are verified channel stats, labelled with their capture date. |
| Empty hero | The hero is built from the real name, avatar and latest upload. |
| Animation without purpose | Motion is tied to reading order, or carries the story in Act II. |

## Performance

- First-load JS is about 160 KB gzipped (React 66, Motion 53, app 41). Matter.js (about 29 KB gzipped) is a separate chunk, prefetched when Verity docks. Act III (about 12 KB gzipped) is another lazy chunk, prefetched during Act II.
- The clone army simulates and draws 64 bodies on one canvas, using a pre-rendered sprite and O(n²) collisions (about 2,000 pair checks per frame). The beat scheduler runs on a 25 ms timer with 120 ms lookahead.
- Fonts are self-hosted, subset by unicode-range, with `font-display: swap`.
- Media is lazy: thumbnails use `loading="lazy"` except above the fold, and the YouTube player loads only on click.
- Physics runs at a fixed 60 Hz step with sleeping enabled. It has about 18 bodies, renders by transform only, and stops on teardown.
- The darkness is one full-screen canvas at DPR ≤ 2, drawn only during Protocol 02.
- **Not measured:** Lighthouse and Core Web Vitals on a deployed URL (it isn't deployed).

## Accessibility

- Semantic landmarks, a skip link, and `aria-current` on nav and protocol steps. Chat is `aria-live="polite"`; the battery is a `role="meter"`; the ending is a dialog with initial focus.
- Every Act II and III action has a non-pointer path: arrow keys for the flashlight, Enter on Verity to move her, real buttons for decoys, choices, popup close boxes and sequencer pads, Space to pop clones, a "Skip to protocol 02" choice for anyone who can't throw things, and Leave or `Esc` everywhere.
- There's no flashing above 3 Hz. The low-battery flicker cycles at about 0.6 Hz with 10% amplitude. The meltdown shake is a positional jitter of a few pixels on the orb only, with no luminance change. The LIVE dot pulses at 0.5 Hz. All of it is disabled under reduced motion.

## Known limitations and honest notes

1. **Research coverage.** Mobbin, Refero, UX Archive, Collect UI, VP0 and SaaSFrame were not accessed. fromanother and jasonbergh rendered only partially in the preview pane, and 21st.dev Spotlight returned 404. VibeDoctor isn't connected. See `DESIGN_RESEARCH.md`.
2. **Snapshot data.** Subscriber and view counts and the video list are a snapshot from 2026-10-10 and will drift. The copy says "as of Oct 10, 2026".
3. **Hotlinked media.** If Eric deletes or privates a video, its thumbnail falls back to YouTube's grey placeholder. Its link will 404 on YouTube's side.
4. **Tablet portrait hero** (768×1024) keeps a tall band of negative space between the title and the copy. It's intentional, but it's the least resolved composition.
5. **The physics pile is chaotic by design.** Large pieces can settle partly behind the chat log on small screens. Everything stays draggable, and the scene can be skipped.
6. **Audio** was verified to initialize, toggle and mute without errors. Headless testing can't judge how it sounds.
7. **Test-only hooks** (`?fast=1`, `&drain=1`, `window.__pile`, `data-lx/ly` on the canvas) ship in the bundle. They change nothing for normal visitors.
8. **Not deployed.** Deployment config for Cloudflare Pages, Vercel and Netlify is included and the CSP was checked locally, but no live deploy was done.
9. **Act III is loud and chaotic on purpose.** Verity overrides "keep it silent" once (announced in chat) and un-mutes the beat once. Mute works after that, and leaving restores the original choice. A brick-wall limiter prevents clipping, but "loud" is still loud: the visitor's system volume is the real ceiling.
10. **No strobing, but heavy motion.** Spinning, tilting, wobbling and shaking are motion, not luminance flashes. Under `prefers-reduced-motion` the CSS animations stop and the kick-driven bounce, shake and spin are skipped (the text swap and upside-down flip still happen).
11. **System fonts.** Comic Sans, Impact and Tahoma exist on Windows and macOS. On Android and Linux the cursive or sans fallbacks are uglier in different ways.
12. **During the fake 404** the HUD is hidden for about 6 seconds. `Esc` still leaves, and the 404 resolves on its own (or by clicking its yellow period).
13. **The VerityOS popups** use a generic grey-bevel 90s style. They're labelled in-world and never claim a problem with the visitor's device.

## Historical Act III validation

On 2026-10-10, after adding Act III, against the production build (`vite preview`) in local Chrome: **26 passed (4.4 min)**, with 23 desktop tests and 3 mobile (Pixel 7) tests. After a final touch-only tweak (no cursor trail on coarse pointers), the mobile spec was re-run (**3 passed**) and the CSP check passed again.

## Act IV completion review — 2026-10-10

The continuation now implements all five missing scenes and wires an independently lazy-loaded ActFour chunk, prefetched during Uglify. Twist hands off to the label; the finale restores physics originals, redactions, fonts, text, stores, FM, stream overlay and the hypothetical counter. Exit/replay reset the extra stores before reassembly. Zero-duration reduced-motion reassembly destroys clones immediately rather than dividing by zero.

New controls have native keyboard paths and stable test IDs. Foodfight also provides a keyboard aura-explosion action; runner collisions are forgiving so visitors can finish the experience. Foodfight and mosh offer timed skips. The YouTube player shares HUD mute/volume through its official API, while fast-mode tests avoid third-party playback. Effects and player audio use separate signal paths; the existing effects limiter does not process YouTube audio.

TypeScript and production build pass. All 27 distinct test scenarios passed across the final production sweep (25 cases) and the corrected targeted exit and phone runs (one case each). The new tests now wait for redaction to activate and target visible elements on phones. No hosting deployment was requested or performed; the local project and deployable dist output are the deliverables. Audio quality and real YouTube playback still require listening in a normal browser; autoplay can be blocked.

Final checks: the full eleven-protocol main route and reduced-motion cooperative route passed; the complete phone takeover passed with actual taps, including lane changes, aura blast, 18 feeds and 12 jumps. Closing FM, muting, and leaving mid-takeover restores the page without runtime errors. The first-frame runner clock is clamped to prevent a negative caption index on mobile. Production CSP passed through reveal and collapse. New desktop and phone captures were visually inspected (`60-*.png`, `61-mobile-*.png`); the runner canvas and primary controls remain visible and usable. The actual embedded song is omitted from fast-mode automation, so audible playback/autoplay is not claimed as verified.
