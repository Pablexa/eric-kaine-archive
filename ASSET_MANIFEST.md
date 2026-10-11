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

No photographs, no re-hosted thumbnails and no downloaded audio. (An earlier revision added rapper photos, real object photos and a ripped meme MP3 under `public/media/`. These were removed on 2026-10-11 because they broke the project rules: no real likenesses, no copied audio or assets.)

- **Cast art:** `src/lib/assets/cast.ts` maps each parody mascot to an original SVG sprite from `sprites.ts`: Bleood → seal with rainbow dreads, Slayr → burger costume, OsamaSon → flame, Playboi Carti → fangs, Jaydes → purple star, 2Slimey → slime, The Cheese Guy → cheese block with a burrito, Lil Verity → orb. Each label card says "PARODY MASCOT".
- **Flying objects:** cheese, burgers, seals, tortas (the sandwich), dranks (a purple double cup), dracos (cartoon), dragons, poo, slime, grape soda and coins, all original sprites.
- **3D:** the Three.js burger, cheese wedge and double cup are procedural meshes. The rotating boards show sprites.
- **Music:** Bleood's official "mhm i got the cheese" upload (`cheeseSong` in `channel.ts`) plays only inside YouTube's own visible `youtube-nocookie` player (BLEOODITY FM). HUD mute and volume are forwarded to the player with YouTube's iframe `postMessage` commands. Fast/test mode never loads the embed.
- **Subway Surfers:** two public gameplay videos in visible YouTube embeds (brainrot portal). The playable runner, **Subway Verity** (protocol 11), is an original canvas game with no Subway Surfers art.
- **Sound effects:** chomp, stamp, donation, crowd, laser, siren and coin are all synthesized in `sfx.ts`.
