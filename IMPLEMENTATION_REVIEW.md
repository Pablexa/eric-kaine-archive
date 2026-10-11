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

## Act IV media revision — verification 2026-10-11

This replaces the 2026-10-10 notes above for the media rewrite (real photos, real Subway Surfers videos, Three.js models, looping MP3, 20 clones, 15 popup closures). Run against a fresh production build (`vite preview`) in Playwright's Chromium.

| Check | Result |
|---|---|
| `npm run build` (typecheck + Vite) | Pass |
| `main path: all eleven protocols → the takeover → One More Subscriber` (desktop) | Pass. 20 clones, label → foodfight → brainrot → mosh → legend → ending; the run uses `?fast=1&media=1`, so the two real YouTube players render and their `src` is checked (`youtube-nocookie.com/embed/i0M4ARe9v0Y` and `ZtHCnXMjIXY`, `autoplay=1&mute=1…loop=1`) |
| `leaving the takeover stops FM and restores every page change` (desktop) | Pass. The MP3 is `loop`, unmuted, not paused, has no controls, and `currentTime` advances even though the visitor chose "sound off". No `sound-toggle`/`volume` exists during the act. LEAVE removes the audio element, every `ug-*` class, the widgets and the chat, and brings the HUD mute back |
| `the underground takeover is playable on a phone` (Pixel 7) | **Failed first** (17/18 cheese: one rapid tap was eaten as a double-tap zoom). Fixed with `touch-action: manipulation` on every takeover button; the test now feeds until the counter really reads 18. Pass after the fix |
| Full suite regression run (27 scenarios) | 25 pass. **All desktop takeover, ending, reveal, Esc and reduced-motion tests pass.** Two failures: `thumbnails come from YouTube and actually load` (this sandbox blocks `i.ytimg.com`; environmental, not a code fault) and the phone takeover, which failed in the mosh pit this run (a forced tap landed on wreckage over JUMP). The owner said phones are out of scope, so the phone flake was left as is |

**Screenshots inspected:** `screenshots/60-*` (desktop) and `61-mobile-*` (phone). All artist and object photos load (the test asserts `naturalWidth > 0` for every label image). The Three.js burger, cheese and double cup are visible over the checkerboard/spam collage. Primary controls (sign cards, FEED CHEESE, AURA BLAST, meme/tab buttons, JUMP, LEAVE) stay on screen and clickable at 1440×900 and 412×915.

**What changed in this pass:**
- The Bleoodity loop can no longer be muted from the page: the HUD hides mute and volume while it plays, and the audio ignores the sound toggle. Esc and LEAVE still exit and stop it, and the legend finale still cuts it.
- `touch-action: manipulation` on all `[data-troll-ui]` buttons (rapid tapping on phones).
- Test hook `?fast=1&media=1` keeps the real YouTube players in fast runs.

**Not verified here (honest limits):**
- Actual video playback. This sandbox's network policy blocks YouTube, so the players render as blocked frames in `60-real-videos.png`/`60-maximum-brainrot.png`. Embed URLs and CSP `frame-src https://www.youtube-nocookie.com` were checked; whether YouTube allows embedding of both videos must be confirmed in a normal browser with internet access.
- Audible sound. Playback state (`playing`, advancing time, not muted) is verified, but nobody listened. Browsers can still block autoplay until a tap; the component retries on the next tap or keypress.
- The MP3 is an 18.064-second fragment of the meme, not the full song.

## Full underground pass — verification 2026-10-11

Every phase after the reveal is now underground-themed with real photos: leak hunt, follow button, leak-alert broadcast, MySpace-era uglify, leak popups, industry-plant clones, a cracked-FL-Studio beat synced to the owner's track, the "leaked website" twist, and Act IV. Eric Kaineity (Eric's avatar, yellow) replaces the drawn orb until the twist; Bleoodity (Bleood's photo, yellow) after it. No drawn sprites remain in the takeover.

| Check | Result |
|---|---|
| `tsc` + `vite build` | Pass |
| Desktop suite (23 scenarios) | 21 pass on the full run; the two failures were investigated: `thumbnails come from YouTube` (sandbox blocks `i.ytimg.com`) and an intermittent `leaving the takeover` failure, fixed below |
| Act II–IV routes after fixes: main path, cooperative reduced-motion path, leaving the takeover | Pass, twice in a row each (`--repeat-each 2`) |
| Music | All four MP3s play in Chromium (time advances). In Act IV the loop is unmuted, looping, not paused, and its time advances |
| Eric Kaineity voice | 135 lines + 10 filler barks rendered, 0 skipped, 2.3 MB total, loaded one line at a time. Pitch check: owner recording median ≈147 Hz, stock TTS ≈170 Hz, clone ≈127 Hz (moved into the owner's range) |
| Screenshots | `screenshots/70-*` (each Act II–III phase, desktop) inspected: photos load, the yellow guides render, primary controls are visible |

Fixes found while verifying:
- The Act IV music's `data-playing` flag could stay `false` while audio played, and a volume change restarted playback. Volume now has its own effect, and the flag also follows `timeupdate`.
- Test helper: the popup close `dispatchEvent` could wait forever when the last popup vanished between count and click; it is now bounded to 2 s.
- Removed an assertion I had added earlier that expected the HUD sound button after leaving; the archive navigation never had one.

Not verified: nobody listened to the voices or music, and voices are skipped in `?fast=1` test runs, so in-page voice playback is only checked by code path and file serving. Phones were out of scope for this pass.

## Live developer line — verification 2026-10-11

The owner can message and call visitors live from `/admin` (see README → Live developer line). It runs on a Cloudflare Worker with one Durable Object (`worker/index.ts`). Static files are still served as plain assets.

| Check | Result |
|---|---|
| `tsc -b` (site + panel), `tsc -p worker`, `vite build` | Pass. The panel is its own entry (`admin.html`, ~6 KB gzipped plus shared chunks); the site's first-load JS grew by ~3 KB gzipped |
| `node scripts/check-live.mjs` against `wrangler dev` (local Durable Object, Chrome fake microphone) | Pass: visitor number shown; wrong key refused; panel lists the visitor; broadcast and targeted messages pop up without any visitor action; decline reaches the panel; answer connects both sides; **owner → visitor audio at 25 frames/s** (40 ms frames, real time); visitor "Talk back" audio reaches the panel; owner hang-up shows "The developer hung up"; same number after reload; calling an absent number reports offline; no console errors on either page |
| Screenshots | `screenshots/81-live-message.png`, `82-live-ringing.png`, `83-live-oncall.png`, `84-admin-panel.png` inspected: the corner number, message card, incoming-call card and call widget sit above the page; the panel shows the visitor's scene and call state |

Design notes:
- **No WebRTC.** Audio is 16 kHz PCM relayed through the hub, so neither person learns the other's IP address and no TURN service or extra secret is needed. Bandwidth is about 256 kbit/s each way during a call.
- **Hibernation-safe.** Every per-socket fact (visitor number, scene, call state) lives in the WebSocket attachment, so the hub can hibernate between messages.
- **Consent and control.** The visitor must press Answer; their microphone stays off unless they press Talk back (and the browser asks); either side can hang up. Messages have a close button. `Permissions-Policy` now allows the microphone for this origin only.
- **Off in tests.** The client never connects on `localhost` or with `?fast=1` unless `?live=1` is passed, so the existing suite is unaffected.

Not verified: real microphones and speakers (only Chrome's fake device), echo when a visitor talks back without headphones (browser echo cancellation may not cover Web Audio playback), Safari/Firefox, and behaviour with hundreds of simultaneous visitors.

## Bleood act loudness and owner mix — verification 2026-10-11

At the owner's request: the Act IV loop is no longer extremely bass boosted and loud, only the owner can turn it down, and the owner can set every song's level and raise the characters' voices above normal from the live panel.

| Check | Result |
|---|---|
| `bleoodity-loop.mp3` before → after (ffmpeg `loudnorm`/`volumedetect`) | −4.6 LUFS, +9.0 dBTP, bass ≈ all of the energy → **−16.5 LUFS, −2.0 dBTP**, bass 5–6 dB under the full mix; same 107.28 s length |
| `tsc -b`, `tsc -p worker`, `vite build` | Pass |
| `node scripts/check-live.mjs` (wrangler dev) | Pass, including the new checks: one session's music 30 % and voice 200 % → 250 %; "everyone" music 50 % reaches current visitors and a visitor who connects later; "Normal" resets both. The first run failed an existing check (mic at 0 % still read 0.057) because it sampled 300 ms after the change while ~0.6 s of audio was still queued; the check now waits 900 ms and passed |
| Voice boost, measured end to end (panel → visitor, real intro lines, tap after the per-voice gain) | Same three lines: average peak 0.796 at 100 % → 1.991 at 250 % (ratio 2.50). Voices go through their own bus with only a −1.5 dB limiter, so at 100 % they sound as before and above 100 % they get louder without clipping |
| Act IV HUD | No mute and no volume slider for the visitor; the loop plays at 0.7 × the owner's music level (test updated in `endings.spec.ts`) |

Not verified by ear: how the tamed loop and boosted voices sound. Loudness and gain were measured, not listened to.

## Songs, "currently playing" card and end credits — verification 2026-10-11

At the owner's request: song 1 is now "Reasons I Should Stay" (Jaydes); the songs are named as 1 Reasons (Acts II–III), 2 "bloody" by 2Slimey (the Protocol 07 beat), 3 "i aint start making money till i started doing drugs" by Bleood (Act IV); a small "currently playing" card sits top right; every ending stops all music and opens a link-in-bio style credits page ("Made by 757valentino", the developer's Discord avatar and links, and a player for "patience" by revivle).

| Check | Result |
|---|---|
| `reasons-i-should-stay.mp3` | Supplied at −4.3 LUFS with +4 dBTP clipping; loudness-normalised only (no EQ) to −16.5 LUFS / −8.5 dBTP, same 83.8 s length. Plays at 0.5 × the site volume × the owner's music level |
| `tsc -b`, `vite build` | Pass |
| Full suite on the bio-style build | 28/29 on the first run; the failure was the cooperative path timing out while the 1.5B counter was still at 1.5M (a scene before the ending, unchanged this round). Re-run twice with `--repeat-each 2`: both pass. The previous build (same logic, first credits layout) passed 29/29 |
| New assertions | Corner card shows "Reasons I Should Stay" / "Jaydes" once sound is on and disappears when muted; shows song 3 in Act IV and "patience" at the end. The credits show "Made by" / "757valentino", the developer card and link, "patience by revivle", the SoundCloud cover link (new tab), playing state, 1:58 duration, skip +10 s, pause/play, volume; the ending card can reopen them; no other music element remains |
| Screenshots | `86-credits.png` (desktop), `88-credits-mobile.png` (Pixel 7, no horizontal overflow), `89-now-playing.png`, `90-ending-now-playing.png`; no console errors |

Notes: the three song covers the owner sent were not available as files, so the corner card uses the artists' existing photos for now. The developer avatar is cropped from a profile screenshot (about 120 px source); the banner photo and the names in the profile bio were left out on purpose. Nobody listened to the normalised song.

## Bleoodity's cloned voice — verification 2026-10-11

The owner supplied `bleoodity voice.mp3` (8.8 s), said it is their own voice or used with permission, and asked for it to be Bleoodity's voice. `scripts/voice/clone_bleoodity.py` (new; it reuses `render_voice()` now factored out of `clone_eric.py`, with a `--resume` option) extracted 54 Bleoodity lines (Twist, Act IV, the legend and her poke lines; template lines with live numbers fall back to barks) and rendered them plus 10 barks with Piper "ryan" + kNN-VC on CPU. `voice.ts` now loads a manifest per character; the old Bleood meme snippets are only a fallback.

| Check | Result |
|---|---|
| Render | 54 lines + 10 barks, 0 skipped, 63 files (one line is also a bark), 1.1 MB |
| Pitch (median F0, torchaudio) | Reference 107 Hz; base TTS 134 Hz; cloned lines 108–113 Hz (moved into the reference's range) |
| `tests/voices.spec.ts` (new, `?fast=1&voice=1`, sound on, through to the label) | Pass: Eric Kaineity's clips come from `voice/eric/`, Bleoodity's from `voice/bleoodity/`, no `bleood-N` fallback played, every clip returns 200 |
| Full suite | 30/30 pass |

Not verified: how it sounds. The reference is only 8.8 s, so artefacts are likely; a 30 s–2 min recording would give a cleaner clone (re-run the script with `--ref`).
