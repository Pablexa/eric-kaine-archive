# Asset manifest

The project ships **no copied media files**. Creator media loads directly from YouTube's public CDNs at runtime and always links back to the official channel. Everything else is original code-drawn artwork.

## Authentic creator media (hotlinked, not redistributed)

| Asset | Source URL pattern | Used in | Access notes |
|---|---|---|---|
| Video thumbnails (1280×720) | `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` | Featured, cards, gallery, archive preview, hero ambient light, broadcast-era wreckage | Used only for the 15 videos where a probe confirmed maxres exists (`maxres: true` in `channel.ts`) |
| Video thumbnails (480×360, letterboxed) | `…/hqdefault.jpg` | Fallback for the 8 videos without maxres; hidden tiles in Lights Out | The 4:3 letterbox is cropped with `scale(1.34)` (`.is-letterboxed`). `Thumb` falls back to hq automatically if maxres errors. |
| Video thumbnails (320×180) | `…/mqdefault.jpg` | Mobile archive rows, found-tray | Always exists |
| Shorts vertical frames (1080×1920) | `…/oardefault.jpg` | Shorts strip | Probed for all 3 Shorts |
| Channel avatar (800×800) | `https://yt3.googleusercontent.com/UuOVTBq…=s800-c-k-c0x00ffffff-no-rj` | Hero cut-out, About figure, physics body | Public profile image, size parameter `s800` |
| Embedded player | `https://www.youtube-nocookie.com/embed/m_3agIs-y-U` | Featured section, on click only | YouTube's privacy-enhanced embed |
| Titles, dates, runtimes, view counts | YouTube public metadata | All media copy | Captured 2026-10-10 (see `SOURCES.md`) |

All images are requested with `referrerpolicy="no-referrer"` and `loading="lazy"`, except the hero and featured poster. Thumbnails, titles and the avatar remain the creator's property; the footer says so.

## Original project artwork

| Asset | File | Made with | Notes |
|---|---|---|---|
| Verity (all moods) | `components/troll/VerityOrb.tsx` | Inline SVG radial gradient + paths | Original drawing inspired by the yellow-orb motif in Eric's Verity thumbnails; not traced |
| Yellow period / watching eyes | `components/shared/Period.tsx`, `.period` | CSS gradient | Recurring motif |
| SUBSCRIBE plate | `components/troll/scenes/ButtonScene.tsx` | CSS + custom bell icon | An original recreation of the banner idea; the banner image is not used |
| Icon set (12 icons) | `components/shared/Icon.tsx` | Hand-written SVG paths | 1.5px stroke |
| Favicon | `public/favicon.svg` | SVG | Verity orb on ink |
| Hazard stripes, Act II grid, chat lines, pixel buttons | `styles/index.css` | CSS | |
| Film grain | `styles/index.css` | Inline SVG `feTurbulence` data URI | |
| Darkness / flashlight | `scenes/LightsScene.tsx` | Canvas 2D compositing | |
| Battery pickup | `scenes/LightsScene.tsx` | Inline SVG | |
| Emergency broadcast | `scenes/MeltdownScene.tsx` | DOM + type | |
| Pixel burst | `scenes/MeltdownScene.tsx` | Motion-animated squares | |
| All sound effects | `lib/audio/sfx.ts` | Web Audio synthesis | No samples |
| Chiptune loop | `lib/audio/sfx.ts` (`LEAD`/`BASS`) | Note lists written for this project | Original composition |
| Drum machine and beat | `lib/audio/beat.ts`, `scenes/BeatScene.tsx` | Synthesized voices + step sequencer | Original pattern |
| Bleoodity dreads | `components/troll/VerityOrb.tsx` | SVG paths | Original drawing; refers to Eric's own "Bleoodity" stream concept |
| VerityOS popup windows | `scenes/PopupScene.tsx` | CSS bevels | Original generic 90s-style chrome, labelled in-world |
| 90s widgets (marquee, hit counter, under-construction sign, NEW! badge, webring, cursor trail) | `components/troll/ChaosLayer.tsx` | DOM/SVG/CSS | Original |
| Clone sprites | `scenes/ClonesScene.tsx` | Canvas (pre-rendered gradient sprite) | Original |
| Fake 404 page | `scenes/TwistScene.tsx` | Plain HTML | A parody of a generic server error page |
| System fonts in Act III | Comic Sans MS, Impact, Times New Roman, Tahoma | The visitor's own OS fonts | Not bundled; falls back gracefully if absent |

## Fonts (self-hosted via Fontsource, all SIL Open Font License 1.1)

| Family | Package |
|---|---|
| Archivo (variable, wdth + wght) | `@fontsource-variable/archivo` |
| Instrument Serif | `@fontsource/instrument-serif` |
| JetBrains Mono (variable) | `@fontsource-variable/jetbrains-mono` |
| Pixelify Sans (variable) | `@fontsource-variable/pixelify-sans` |

## Libraries

| Package | License | Why |
|---|---|---|
| react, react-dom | MIT | UI |
| motion | MIT | Layout animations, springs, motion values |
| matter-js | MIT | Rigid-body physics for the collapse (lazy-loaded) |
| tailwindcss + @tailwindcss/vite | MIT | Styling |
| @playwright/test (dev) | Apache-2.0 | Tests and QA captures |

GSAP was considered and not installed. Motion's imperative `animate()` plus the small cancelable `tween/wait` helpers in `timeline.ts` covered every timeline.

## Act IV assets

The current underground section uses six verified artist photos and six real object photos under `public/media/`, mapped in `src/lib/assets/realMedia.ts`. Wikimedia assets retain credits and licenses in `public/media/SOURCES.md`; artist thumbnails credit their verified music-video uploads. The fictional Verity character remains original. Actual Three.js meshes provide the burger, cheese wedge, double cup and rotating photo boards. Subway Surfers uses two real public YouTube gameplay videos in visible embedded players; the old drawn runner has been removed.

`public/media/bleood-cheese.mp3` is the public 18.064-second meme recording from Boop Deck sound 2451, stored locally and looped as background audio. This is a short meme clip, not a full album track. The original YouTube song also appears as a visible video in the collage. Fast tests omit external video requests but load and validate the local MP3 and photos. Chomp, stamp, donation, crowd and laser cues remain synthesized.
