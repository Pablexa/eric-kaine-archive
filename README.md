# Eric Kaine: The Archive

An independent fan archive for [@eric2kaine](https://www.youtube.com/@eric2kaine).

It is a polished, editorial fan site, right up until its friendly guide orb, **Verity**, reads Eric's channel description (*"please gatekeep me im not trying to be famous"*) and decides to protect him from you.

That turns into a roughly 6–9 minute experience, depending on how long you play with the wreckage:
- **Act II:** the site physically collapses, a flashlight hunt in the dark, a SUBSCRIBE button that won't be pressed, and an emergency broadcast.
- **Act III:** Verity vandalises the site into a 2003 GeoCities page, then 15 popup closures, a 20-orb clone army, a playable beat with a bass drop that breaks the page, and a twist where Verity turns out to be Bleoodity and "deletes" the website.
- **Act IV:** a deliberately ugly 2008 collage of actual artist photos, local meme audio, flying photographic food and real Three.js props. Sign eight photo contracts, feed Bleoodity, watch real Subway Surfers gameplay in a 62-second video meltdown, and jump in a mosh pit made from the website. The imaginary subscriber count reaches 1.5 billion, then the real bio brings everything back.

It's loud. Original synthesized effects run through a compressor/limiter. A downloaded 18.064-second Bleood meme MP3 loops locally in the background, with no standalone player or close button. The HUD mute and volume control audio and effects, and `Esc` leaves. Playback retries on a tap if the browser requires a new gesture. Videos use visible YouTube embeds and need internet access. See [media credits](public/media/SOURCES.md).

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

## Deploy

The site is a static `dist/` folder. Any static host works.

**Cloudflare Pages**
1. Create a new project from the Git repository, or drag `dist/` into Direct Upload.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. `public/_headers` is copied into `dist/` and applied automatically (CSP, caching, permissions policy).
4. To add a custom domain, open Pages → your project → Custom domains.

**Vercel**
1. Import the repository. `vercel.json` already sets the framework, the build command, the output directory and the same headers.
2. To add a custom domain, open Project → Settings → Domains.

**Netlify / any static host:** publish `dist/`. Netlify reads `_headers` too.

**After deploying, check that:**
- Thumbnails (`i.ytimg.com`) and the avatar (`yt3.googleusercontent.com`) load.
- The featured player opens (`youtube-nocookie.com`).
- The browser console shows no CSP errors.

The CSP was verified locally with `scripts/check-csp.mjs`. It has **not** been verified on a live host, because this project hasn't been deployed.

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
