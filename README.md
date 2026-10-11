# Eric Kaine: The Archive

An independent fan archive for [@eric2kaine](https://www.youtube.com/@eric2kaine).

It is a polished, editorial fan site, right up until its friendly guide orb, **Verity**, reads Eric's channel description (*"please gatekeep me im not trying to be famous"*) and decides to protect him from you.

That turns into a roughly 6–9 minute experience, depending on how long you play with the wreckage:
- **Act II:** the site physically collapses, a flashlight hunt in the dark, a SUBSCRIBE button that won't be pressed, and an emergency broadcast.
- **Act III:** Verity vandalises the site into a 2003 GeoCities page, then 15 popup closures, a 20-orb clone army, a playable beat with a bass drop that breaks the page, and a twist where Verity turns out to be Bleoodity and "deletes" the website.
- **Act IV:** a deliberately ugly 2008 collage of actual artist photos, local meme audio, flying photographic food and real Three.js props. Sign eight photo contracts, feed Bleoodity, watch real Subway Surfers gameplay in a 62-second video meltdown, and jump in a mosh pit made from the website. The imaginary subscriber count reaches 1.5 billion, then the real bio brings everything back.

It's loud. Original synthesized effects run through a compressor/limiter. "Reasons I Should Stay", the first song, kicks in when Eric Kaineity says "ok. then we do this the hard way." (or when redacting starts on the help route) and stops when tiny Eric Kaineity says "1.5K + 1 is still pretty gatekept." after the meltdown; "bloody" (2Slimey) replaces the old chiptune from step six of Protocol 04 through 06; both follow the HUD sound toggle; Protocol 07 is synced to "bloody" by 2Slimey (drop at 12.55 s); Act IV loops Bleood's "i aint start making money till i started doing drugs" with no standalone player or close button. The guide is Eric Kaineity (Eric's avatar, yellow) until the twist and Bleoodity (Bleood's photo, violet, with violet dreads) after it. Eric Kaineity speaks in a voice cloned, with consent, from the owner's own recording (`scripts/voice/clone_eric.py`); Bleoodity speaks in a voice cloned the same way from a recording the owner supplied with permission (`scripts/voice/clone_bleoodity.py`; real snippets of the Bleood meme clip are only a fallback if her files are missing). While it plays, the HUD hides its mute and volume controls: the loop has no pause, stop or mute button and ignores an earlier "sound off" choice for the whole Bleoodity act. Only the site owner can turn it down, from the live panel (the session's site volume or Música). It starts at full level, settles lower after about 9 s and dips further while a character speaks, so Bleoodity is heard; it stops, with every other song, when Bleoodity reads Eric's bio. The MP3 was tamed from the original bass-boosted file (bass −10 dB, normalised to about −16 LUFS). `Esc` or LEAVE exits and stops it; effects outside Act IV still follow the HUD mute. Playback retries on a tap if the browser requires a new gesture. Videos use visible YouTube embeds and need internet access. A small "currently playing" card in the top-right corner names whichever song is audible: 1 "Reasons I Should Stay" (Jaydes), 2 "bloody" (2Slimey, the beat in Protocol 07), 3 "i aint start making money till i started doing drugs" (Bleood, Act IV) and, at the end, "patience" (revivle). Every ending then stops all other music and opens the **credits page**: "Made by 757valentino" with the developer's card, and a player for "patience" by revivle (play/pause, skip ±10 s, seekable progress, volume and mute; the cover opens the song on SoundCloud). "See your ending" shows the ending card, which can reopen the credits; the song keeps playing until you leave. See [media credits](public/media/SOURCES.md).

- **Concept, phases, endings and hidden interactions:** [`CREATIVE_BRIEF.md`](CREATIVE_BRIEF.md)
- **Research log:** [`DESIGN_RESEARCH.md`](DESIGN_RESEARCH.md)
- **Tokens, motion and the troll design system:** [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- **Every asset and its source:** [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md)
- **Provenance of every creator fact:** [`SOURCES.md`](SOURCES.md)
- **Final review and known limitations:** [`IMPLEMENTATION_REVIEW.md`](IMPLEMENTATION_REVIEW.md)
- **Real screenshots from the build:** [`screenshots/`](screenshots)

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Matter.js (lazy-loaded) · Canvas 2D · Web Audio · Playwright.

The site is fully static: no backend and no environment variables.

## Run it

```bash
npm install
```

```bash
npm run dev
```

The dev server runs at http://localhost:5173.

### Useful URL flags (for development and tests only)

| Flag | Effect |
|---|---|
| `?fast=1` | Compresses every scripted beat (dialogue, waits, moves) to about 8%, and shortens the beat to 6 bars, so you can reach later scenes quickly. It also exposes `window.__pile`. |
| `?fast=1&drain=1` | Also drains the flashlight battery about 14× faster (used to test the "Safely Obscure" ending). |

### Reaching the reveal

There are three ways in:
1. Read the bio quote in **About**, then click the yellow orb that docks in the corner.
2. Click **Share the archive** at the bottom.
3. Triple-tap the yellow period in the hero.

Inside the experience, **LEAVE** or `Esc` always returns to the archive. A refresh also returns a clean archive.

## Test it

```bash
npx playwright test
```

This builds the site, serves `vite preview` on port 4173, and runs the end-to-end suite in the locally installed **Chrome**, so no browser download is needed. To use another browser, set `PW_CHANNEL=msedge`, or set `PW_CHANNEL=` (empty) for Playwright's bundled Chromium after running `npx playwright install chromium`.

| Spec | Covers |
|---|---|
| `professional.spec.ts` | Load without errors, disclosure, navigation, real YouTube links and thumbnails, lazy embed, archive filters (23 / 14 / 3 / 6), gallery arrows, social links |
| `reveal.spec.ts` | The quote wakes Verity, all three triggers, sound permission and mute, `Esc` mid-wreckage with full reassembly, refresh recovery |
| `endings.spec.ts` | All three endings end to end (the main and cooperative paths run through Acts III and IV), persistence across reloads, replay, keyboard-only flashlight, leaving mid-chaos restores everything |
| `mobile.spec.ts` | Menu, no horizontal overflow, initial scenes and the complete underground takeover with touch |
| `reduced-motion.spec.ts` | Instant settled collapse, static grain |

QA screenshots can be regenerated against a running dev server:

```bash
node scripts/capture.mjs
```

To check the production CSP, run `npm run preview` and then:

```bash
node scripts/check-csp.mjs
```

## Build

```bash
npm run build
```

The output goes to `dist/` and is about 160 KB of gzipped JS on first load. Physics, Act III, Act IV and Three.js load lazily; local photos and the meme MP3 add roughly 840 KB of media.

## Live developer line

The owner can reach whoever is on the site, in real time, from a private panel at **`/admin`**:

- **Visitor number.** Every visitor sees a small `#12345` in the top-left corner. It is stored in the browser, so it survives reloads.
- **Developer messages.** Text typed in the panel pops up on screen by itself, either for everyone on the site or for one number. Each message has a duration (6–45 s, or until closed). "Borrar pantalla" removes them.
- **Calls.** Type the number you see on the stream and press **Llamar**. The visitor gets an "INCOMING CALL" card with a ring. Once they answer, they hear the owner's microphone live (about 0.2 s of delay), and the site's music and effects drop to 20%. The visitor can press **Talk back** to turn their own mic on (the browser asks for permission), and either side can hang up.
- **During a call.** Both sides can pick their microphone and speaker/headphones (switches mid-call; output choice needs Chrome or Edge), mute their mic, and set two levels from 0 to 300 %: how loud their own mic goes out, and how loud they hear the other person. The ringtone is `public/media/ringtone.mp3`; it stops on answer.
- **Chosen session.** Press **Elegir** on a row (or type the number the visitor sees top-left) to open **SESIÓN ELEGIDA**: where they are, their site volume (slider, −10/+10, Silencio, Normal — music, effects and voices), and quick **Llamar** / **Escribirle** buttons; the message box switches to that number.
- **Music and voices.** The chosen session's card sets that visitor's site volume, music (every song, 0–100 %, including the Bleood act, which visitors cannot turn down) and the characters' voices (0–300 %; voices above 100 % go through their own limiter so they get louder without clipping). The "MÚSICA Y VOCES · TODOS" card does the same for everyone; it is stored on the server, so visitors who arrive later get it too.
- **Who is where.** The panel lists every visitor live: which protocol/scene they're on, whether site sound is on, and whether the tab is in front.

How it works: `worker/index.ts` is a Cloudflare Worker with one Durable Object (`Hub`). Each page holds a WebSocket to it at `/api/live`. Call audio is raw 16 kHz PCM relayed through the hub (`src/lib/live/audio.ts`, `public/live/capture-worklet.js`), so there is no WebRTC: neither side ever sees the other's IP address, and no TURN server is needed. Static files never touch the script (`run_worker_first: ["/api/*"]`).

The admin key is a Worker secret. Until it is set, the panel refuses everyone:

```bash
npx wrangler secret put ADMIN_KEY
```

The visitor side is visitor-facing English; the panel is in Spanish. The line is off on `localhost` (so the Playwright suite never depends on it) and in `?fast=1`; force it with `?live=1`.

**Test it locally.** Put a test key in `.dev.vars` (gitignored) as `ADMIN_KEY=...`, then:

```bash
npm run dev:live
```

```bash
node scripts/check-live.mjs
```

The check drives a visitor and the panel with Chrome's fake microphone. It covers the visitor number, broadcast and targeted messages, decline, answer, audio in both directions, hang-up, number persistence, an offline number and a wrong key.

## Deploy

Production is a Cloudflare Worker named `erickaine` (static assets plus the live line), configured in `wrangler.jsonc`:

```bash
npm run deploy
```

This builds, typechecks the Worker and runs `wrangler deploy`. `public/_headers` is copied into `dist/` and applied to static files (CSP, caching, permissions policy; `/admin` is `noindex` and `no-store`). The microphone is allowed for this origin only (`microphone=(self)`), because calls need it. The CSP also allows Cloudflare Web Analytics (`static.cloudflareinsights.com` script, `cloudflareinsights.com` beacon), which Cloudflare injects automatically on the zone.

Custom domains need the domain's DNS on Cloudflare. Add it as a zone in the same account and point the registrar's nameservers at Cloudflare. Then add it to the Worker under Settings → Domains & Routes, or with a `routes` entry `{ "pattern": "example.com", "custom_domain": true }`.

**Other static hosts** (Vercel, Netlify) can still serve `dist/`, but without the Worker the live line stays offline. `vercel.json` keeps the same headers.

**After deploying, check that:**
- Thumbnails (`i.ytimg.com`) and the avatar (`yt3.googleusercontent.com`) load.
- The featured player opens (`youtube-nocookie.com`).
- The browser console shows no CSP errors.
- `/admin` logs in, and a second browser shows a number that appears in the panel.

## Content updates

All creator data lives in `src/lib/content/channel.ts` (captured 2026-10-10). To refresh it, update titles, dates, views and the `maxres` flags, then change the "As of" line in `Hero.tsx`.

## Disclosure

This is an unofficial fan project, not affiliated with or endorsed by Eric Kaine or YouTube. Thumbnails, titles and the avatar belong to their creator and load directly from YouTube.

If port 4173 already hosts an older preview, run tests on a fresh port in PowerShell:

```powershell
$env:PW_PORT = '4174'
npx playwright test
```

The production build must finish before starting tests. Keep `dist/` unchanged while tests run so lazy-loaded chunk URLs remain valid.
