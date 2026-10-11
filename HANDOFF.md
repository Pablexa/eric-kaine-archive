# Handoff prompt: "Eric Kaine — The Archive" (troll fan website)

Current status (2026-10-10): Act IV was revised to the user's requested ugly 2008 media collage. Six real artist photos and six real object photos replace the rapper/object drawings; real Subway Surfers videos replace the drawn runner. Three.js models float through the takeover, and a downloaded local 18-second meme MP3 loops in the background without an individual close button. HUD mute/Esc remain. The pre-takeover now has 15 popup closures and 20 clones. See README.md, public/media/SOURCES.md and IMPLEMENTATION_REVIEW.md for current implementation/verification; the brief below is historical.

---

## Your role

You are continuing development of an existing, working website project. Read this whole brief before changing anything. Extend the existing architecture; don't rewrite it.

## What the user originally asked for (in order)

1. "Make me a troll website with a Verity game in it for this YouTuber: https://www.youtube.com/@eric2kaine. Something that seems like a fan website but is actually a troll website." ("Verity" is the Minecraft horror mod Eric makes videos about: a friendly yellow orb companion that turns evil, with a flashlight that drains a battery.)
2. A long "master prompt" asking for:
   - an Awwwards-quality professional fan site (Act I) that transforms into an elaborate, original, interactive troll experience
   - verified creator facts only, no fabricated quotes or stats
   - design research, a design system, an asset manifest and a creative brief (all as `.md` files)
   - React + TypeScript + Vite + Tailwind + Motion, Playwright tests, responsive layouts, accessibility, reduced motion, and a sound mute toggle
3. "Make something really weird and twisted happen, really trolly, break the whole website, loud sounds, really chaotic, make it longer so it's an actual experience." This became **Act III** (done).
4. The latest request (in progress, this became **Act IV**): "Bleood-themed things, underground rapper stuff, OsamaSon, make the rapper Slayr have a burger costume, make things go flying, make the background the 'mhm yeah i got the cheese' meme song, make dranks, make dracos, add Playboi Carti, add things themed to his channel, much more chaotic, louder, more wonky, add Jaydes, add tortas, memes about underground rappers, Subway Surfers gameplay, brainrot, add everything, make it waaay longer."
   - Then the user clarified: Eric's channel is **not** PG (mature music and titles), so dranks (purple double cups) and dracos (cartoon guns) are fine as cartoon meme objects.

## The concept: "GATEKEEPER"

Eric's real channel bio is *"please gatekeep me im not trying to be famous"*. The site has a friendly guide orb named **Verity** (the yellow orb from the Verity mod). She reads the bio literally. Because a fan site makes him more famous, she starts gatekeeping Eric *from the visitor* and escalates more and more absurdly. Later she reveals she is **"Bleoodity"**: Eric really did turn Verity into Bleood on stream on 2026-09-21 (stream titled "I turned Verity into Bleood (Bleoodity)").

## Tech stack and commands

- Vite 8 (Rolldown), React 19, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), `motion` (Motion for React), `matter-js` (physics, lazy-loaded), Web Audio (all sound synthesized), Canvas 2D, Playwright.
- The site is fully static. There's no backend and no environment variables.
- Project folder: `C:\Users\Administrator\Downloads\eric kaine`
- Commands:
  - `npm run dev` serves the site at http://localhost:5173
  - `npm run build` outputs to `dist/`
  - `npm run preview` serves the build on :4173
  - `npx playwright test` runs 26 tests against the built site, using the locally installed Chrome (`channel: 'chrome'`)
  - `node scripts/capture.mjs [--only=job]` saves screenshots to `screenshots/` (it drives the real experience in headless Chrome)
  - `node scripts/check-csp.mjs` verifies the production CSP from `public/_headers` (needs `npm run preview` running)
- Test and dev URL flags:
  - `?fast=1` compresses every scripted wait to 8% and exposes `window.__pile`
  - `&drain=1` drains the flashlight battery fast
- Deploy configs exist for Cloudflare Pages/Netlify (`public/_headers`, which includes a CSP) and Vercel (`vercel.json`). The site has not been deployed.

## Architecture (key files)

**Content and data**
- `src/lib/content/channel.ts`: all verified creator data. That's the 23 videos (IDs, titles, dates, lengths, views captured 2026-10-10), the social links, the bio and the avatar URL, plus `cheeseSong` (the Bleood meme song, YouTube ID `mPJhwEcj2g4`, official upload on @bleood). Never add unverified facts. `SOURCES.md` records where every fact came from.

**Experience engine**
- `src/lib/experience/machine.ts`: one reducer state machine. Phases: `professional → foreshadow → reveal → troll → finale`. Scenes: `intro, redact, collapse, pile, lights, button, meltdown, uglify, popups, clones, beat, twist, label, foodfight, brainrot, mosh, legend, ending`. Also defines `PROTOCOLS` (the HUD steps), `CHAOS_SCENES`, `UNDERGROUND_SCENES`, `ENDINGS` (gatekeeper / obscure / subscriber) and `route` (`help` | `refuse`).
- `src/lib/experience/ExperienceContext.tsx`: the provider, plus `reveal()`, `leave()`, `replay()`, `resetArchive()` and `finishEnding()`. `restore()` undoes everything: reassembles the physics pile, removes redactions, runs `chaos.reset()`, stops music, clears the costume, and reverts a forced sound-on.
- `src/lib/experience/verity.ts`: the imperative controller for the single Verity orb (motion values x/y/size/scale/glow, mode, costume `none | bleoodity`, `onPress`/`onGrab` hooks).
- `src/lib/experience/chat.ts`: the Minecraft-style chat (`<verity> …`, `<bleoodity> …`). `chat.say()` types a line out with chirps and is abortable.
- `src/lib/experience/chaos.ts`: Act III page vandalism via `html.ug-*` classes (font, rainbow, wordart, borders, wobble, cursor, tilt, beat, drop, upside, plus `vamp` and `jelly`, which are added for Act IV but have no CSS yet). It also handles text swaps (every word becomes ERIC/KAINE, restorable), the `--kick` CSS variable, and the widgets store.
- `src/lib/experience/stage.ts`: small stores (backdrop, introCard, pileDim, shake, hudHidden, `subsOverride`, `fm`, `streamOverlay`).
- `src/lib/experience/store.ts`: `createStore`, `useStore`, `objective`, and `ask()` (choice buttons).
- `src/components/troll/useScript.ts`: every scene runs one async script with an AbortController and starts on a microtask (safe under StrictMode).
- `src/lib/animation/timeline.ts`: `wait`, `tween`, `loop`, easing helpers, and `TIME` (fast mode).

**Physics, audio, art**
- `src/lib/interactions/pile.ts`: `PileEngine`. It clones real DOM elements into physics bodies (Matter.js), handles drag/throw, counts hits on Verity (only pieces the visitor actually threw count), and `reassemble()` flies the clones back to their original elements.
- `src/lib/audio/sfx.ts`: every sound is synthesized. The chain is master (default volume 0.9) → compressor → brick-wall limiter. It includes the drum voices, airhorn, boom, record scratch, an original chiptune, and Act IV voices (chomp, stamp, donation, coin, siren, crowd, laser).
- `src/lib/audio/beat.ts`: a 16-step sequencer clocked on `performance.now()`.
- `src/lib/assets/sprites.ts`: original SVG sprites: seal, burger, cheese, torta (the sandwich), soda, drank (purple double cup), draco (cartoon), dragon, poo, slime, fangs, flame, star, coin, cheeseguy (a cheese block holding a burrito), burgerguy (a burger costume with a face visor, for Slayr), lilverity, sealdreads (a seal with rainbow dreads, for Bleood). Use `spriteUrl(id)` or `spriteImage(id)`.

**Components**
- `src/components/professional/*`: Act I sections (Hero, Featured, Streams, About, Archive, Links). Elements carry `data-physics` (for the collapse) and `data-redact` (for the cooperative path).
- `src/components/troll/TrollLayer.tsx`: mounts the scenes by `state.scene`. Act III scenes are lazy-loaded from `ActThree.ts`. `ChaosLayer.tsx` holds the 90s widgets and click-to-squeak.
- `src/components/layout/Header.tsx`: the nav morphs into the Gatekeeper Protocol HUD (protocol steps, SUBS/VIEWS telemetry, sound toggle and volume, LEAVE). In Act III the first press of LEAVE shows a fake "LEAVING… 99%".

## The experience as it works now (Acts I–III, complete and tested)

**Act I: professional fan site.** Dark editorial design (Archivo variable, Instrument Serif, JetBrains Mono, Pixelify Sans), real thumbnails and video links, a click-to-load YouTube embed, a stream gallery, Shorts, an archive filter (23/14/3/6) and social links. Its only oddity is a yellow period after every heading.

**Foreshadowing.** When the visitor reads the bio pull-quote, its period grows eyes, types "understood.", and docks in the corner as the "archive guide". It makes hover remarks.

**The reveal.** There are three triggers: clicking the guide orb, clicking "Share the archive", or triple-tapping the hero period. Verity asks permission to beep, shows the bio as "Exhibit A" stamped UNDERSTOOD, then asks the visitor to "Help" (cooperative route) or "Absolutely not".

**Refuse route:**
- **01 Collapse:** Verity flies through the hero title. The real DOM elements become Matter.js bodies; you can throw them, and three hits on Verity advance.
- **02 Lights Out (the Verity game):** dark canvas, pointer flashlight, draining battery, eyes in the dark, five real videos to find. If the battery dies, you get the "obscure" ending.
- **03 The Button:** a giant SUBSCRIBE button (a callback to his banner) that dodges, gets shielded by Verity, plays a shell game, then gives up.
- **Broadcast:** "1.5K +1", Verity pops, the site reassembles, and she notices "it's still a really nice website."
- **04 Uglify:** the site turns into a 2003 GeoCities page (Comic Sans, rainbow, WordArt, marquee, hit counter, under-construction sign, chiptune). Sound is forced on once.
- **05 Popup hell:** VerityOS windows; closing one spawns two; a fleeing CLOSE ALL button.
- **06 Clone army:** 64 orbs to pop (Space works too).
- **07 The Beat:** a playable 16-step channel rack ("making a beat but the website chooses the sounds"), a build-up, then a drop where the page spins and every word becomes ERIC KAINE.
- **Twist:** a record scratch, Verity becomes **Bleoodity** (rainbow dreads), "deletes the website" (a fake Apache 404), then "jk". The site is restored pristine and the ending card shows.

**Help route.** Redact 8 things on the live page, then "phase two", and the same Act III plays out.

**Endings.** One More Subscriber (refuse), Certified Gatekeeper (help), Safely Obscure (battery). Endings persist in localStorage. After any ending, every period on the site gets eyes that track the cursor. Replay and Reset live in the footer.

At real pacing, played quickly, Acts I–III take about 4 minutes. A person reading along takes 5–6.

## Act IV: "Bleoodity's Underground" (in progress)

**Already done:**
- `machine.ts` has the Act IV scenes, `PROTOCOLS` 08–11 and `UNDERGROUND_SCENES`. Note that the `ENDINGS` lines already mention Act IV scenes that don't exist yet. The HUD currently shows step counts out of 11.
- `sprites.ts`: all Act IV art, including drank and draco.
- `sfx.ts`: Act IV sounds, and the default volume is now 0.9.
- `channel.ts`: `cheeseSong`.
- `stage.ts`: the `subsOverride`, `fm` and `streamOverlay` stores.
- `src/components/troll/underground/BleoodityFM.tsx`: a draggable "BLEOODITY FM" window that plays the real cheese song through YouTube's own visible `youtube-nocookie` player (no copying or re-hosting). It's minimisable and closable, and doesn't load in `?fast=1`. **Not mounted yet.**
- `src/components/troll/underground/StreamOverlay.tsx`: a fake live-chat column with channel in-jokes and brainrot (desktop only), plus donation alerts with sprites and a chime. **Not mounted yet.**

**Still to build:**
1. **Twist hand-off.** In `TwistScene.tsx`, after "jk": `<bleoodity> jk. i'm not deleting it.` / `i'm TAKING it.` Then the 404 page flies apart, the `vamp` + `jelly` classes are applied (they need CSS: a red/black underground palette and jelly skew), `fm.set('on')` and `streamOverlay.set(true)`, keep `verity.setCostume('bleoodity')`, and `dispatch SCENE 'label'`. Move the "restore pristine + `finishEnding`" logic into the new finale.
2. **08 The Label (`LabelScene`).** Parody trading cards (150×210, holographic border, sprite, three silly stats, a "parody card — not affiliated" footer) bounce around the screen. Click a card to SIGN it (stamp + airhorn, then it flies into a roster bar). Cards dodge sometimes. The roster: BLEOOD (sealdreads), SLAYR (burgerguy, the burger costume), OSAMASON (flame), PLAYBOI CARTI (fangs, "SLATT +∞", vamp), JAYDES (star), THE CHEESE GUY (cheeseguy), 2SLIMEY (slime; Eric "found 2slimey in minecraft"), LIL VERITY (lilverity). Sign all 8, then go to the food fight.
3. **09 Food Fight (`FoodFightScene`).** A Matter.js canvas storm of seals, burgers, cheese, tortas, dranks, dracos, dragons, poo ("UK Rap is Straight POO") and slime, all flying, bouncing and draggable/flingable. Bleoodity sits at the bottom with an open mouth: fling cheese in (chomp; feed 15–25). Clicking an item explodes it with "+1000 AURA". Space feeds a cheese (keyboard and test path). Offer a skip choice after about 60 seconds.
4. **10 Brainrot (`BrainrotScene`).** Split-screen. One half is the vandalised page auto-scrolling with TikTok-style word-by-word captions. The other half is an original 3-lane endless runner, "Subway Verity" (not Subway Surfers assets): trains, coins, arrows/swipe/tap to move and jump. Brainrot words fly across (SIGMA, RIZZ, OHIO, FANUM TAX, MEWING, +1000 AURA, SKIBIDI, 6 7, I'M 10., !discord, SLATT). Later it becomes a quad split ("maximum brainrot"). Run it for about 40 seconds.
5. **11 Mosh Pit (`MoshScene`).** Use `PileEngine` to capture about 25–30 visible page elements. Everything falls, and a JUMP control (button / Space / tap) calls `pile.quake()` with a boom. After about 12 jumps, a stage dive flings everything away.
6. **Legend finale (`LegendScene`).** The HUD subscriber count spins (via `subsOverride`) from 1.5K → 15K → 1.5M → 1.5B with airhorns and confetti made of sprites. Then a hard cut to silence: FM off and the overlay off. Eric's real bio fades in, in the professional serif style. Bleoodity reads it: "…oh." / "right." / "my bad." The dreads come off, the pile reassembles, `chaos.reset()` runs, tiny Verity rolls into the hero period, and then `finishEnding(route === 'help' ? 'gatekeeper' : 'subscriber')`.
7. **Wiring and tests.** Lazy-load an `ActFour.ts` chunk from `TrollLayer` (prefetch during Act III), and mount `BleoodityFM` and `StreamOverlay` when the scene is in `UNDERGROUND_SCENES`. Make sure `restore()` also resets `fm`, `streamOverlay` and `subsOverride`. Extend `tests/helpers.ts` with a `playActFour()` and update the endings tests and `scripts/capture.mjs`. Every new interaction needs a keyboard path and a `data-testid`.

## Rules and constraints to keep

- **Verified creator facts only.** Don't invent quotes, milestones or accusations about Eric or any real person. The rapper cards are clearly labelled parody, with silly made-up stats. Don't put fake quotes in real artists' mouths. Don't use real people's photos or likenesses; use the original SVG sprites.
- **Copyright.** Don't copy song audio or lyrics, and don't use Subway Surfers or Skibidi assets. Real music only plays through YouTube's official embed (`BleoodityFM`).
- **Tortas are the sandwich.** The user also asked for "tortas (mexican fat ladies)". That part was declined as ethnic and body-shaming content; use sandwiches.
- **Safety.** No strobe or flashing above 3 Hz: chaos should be motion, not brightness flicker. `Esc` must always leave instantly. Sound always goes through the limiter, and there's always a visible mute. Verity's sound overrides happen only once each, and leaving restores the visitor's choice. No fake device or security warnings, no downloads, no redirects.
- **Gotchas:**
  - Never apply a transform to `<body>`; it breaks every `position: fixed` layer. Shake or spin `main`/`footer` instead.
  - Vite 8 needs `manualChunks` written as a function.
  - Custom CSS classes live in `@layer components`. The Act III `ug-*` rules are intentionally unlayered and use `!important`.
  - Use `useScript` for scene scripts and `wait()` from `timeline.ts` (it respects fast mode).
  - The in-app preview pane in the original environment reported `prefers-reduced-motion` and throttled `requestAnimationFrame` while hidden, so verify motion in headless Chrome via `scripts/capture.mjs`.
- Before finishing, run `npx tsc -b`, `npm run build` and `npx playwright test` (26 tests currently pass for Acts I–III), take screenshots, and update `CREATIVE_BRIEF.md`, `DESIGN_SYSTEM.md`, `ASSET_MANIFEST.md`, `SOURCES.md`, `IMPLEMENTATION_REVIEW.md` and `README.md`.
