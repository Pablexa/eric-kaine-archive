# Design system

There are two acts and one token set. Act II is built by **corrupting** Act I's components, not by swapping in a different site. All tokens live in `src/styles/index.css` (`@theme`) and `src/lib/animation/timeline.ts` (`DUR`, `EASE`).

---

## Act I: the archive

### Color

| Token | Value | Use |
|---|---|---|
| `ink` | `#0a0a0b` | Page foundation |
| `ink-2` / `ink-3` / `ink-4` | `#111113` / `#19191c` / `#232327` | Surfaces: card fill, row hover, media placeholders |
| `paper` | `#edebe6` | Primary text (warm white, never pure `#fff`) |
| `paper-2` | `#c9c6bf` | Body copy |
| `muted` / `dim` | `#8e8b84` / `#5e5b56` | Metadata, labels |
| `line` / `line-2` | paper at 9% / 16% | Hairlines, borders |
| `signal` | `#e8302b` | **The only accent.** Sampled from the channel banner's red SUBSCRIBE plate. Used on the YouTube CTA and "Subscribe for real". |
| `verity` | `#ffd21f` | The yellow period. In Act I it is the only yellow on the page. |

There are no gradients except the ambient blur behind the hero, which is sampled from the latest thumbnail.

### Typography

| Role | Family | Settings |
|---|---|---|
| Display | **Archivo Variable** (width axis 62–125%) | 800 weight, `font-stretch: 112%`, tracking −0.045em, leading 0.84 |
| Interface / body | Archivo Variable | 400–600, stretch 100% |
| Editorial voice | **Instrument Serif** (italic) | Pull quotes and asides only |
| Metadata | **JetBrains Mono Variable** | 10–13px, uppercase, tracking 0.12–0.16em |

**Scale:** hero `clamp(76px, 17.2vw, 252px)`, section titles `clamp(56px, 9.4vw, 148px)`, link list `clamp(30px, 4.6vw, 64px)`, card titles 18–34px, body 15–18px, metadata 10–13px.

### Space, grid, breakpoints

- 12-column grid (`grid-12`) with a column gap of `clamp(12px, 1.6vw, 24px)`.
- Content max width 1320px plus gutters of `clamp(16px, 3.2vw, 40px)` (`shell`).
- Section rhythm: `py-24` on mobile, `py-32` on larger screens. Every section opens with a hairline rule and an index (`01 — Latest`).
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Mobile compositions are written separately: the hero drops its full-height layout, the archive switches from a table to thumbnail rows, and the nav becomes a full-screen menu.

### Radii, surfaces, shadow

- Pills (`rounded-full`) are only for interactive controls: nav, CTAs, filters.
- Media is square-cornered and editorial: no rounded cards.
- Header: `ink/55` with `backdrop-blur-xl` and a 1px `line` border. This is the only glass surface.
- Shadow appears only on floating media (archive preview, dialogs): `0 30px 80px -20px rgb(0 0 0 / .8)`.
- Film grain overlay at 7%. Desktop shows column rules at 3.5%.

### Components

| Component | Notes |
|---|---|
| **Header** | Floating pill nav with a `layoutId` sliding active indicator driven by IntersectionObserver. The mobile menu is a portal dialog with a clip-path reveal. |
| **Buttons** | Primary is paper-filled. Secondary is outlined. The external CTA is signal red with an arrow that nudges on hover. |
| **VideoCard** | A masked image drifts against the pointer on a spring; a cursor-following "Watch" tag; mono metadata; title underline sweep. |
| **LiteEmbed** | Real thumbnail poster. Loads `youtube-nocookie` only on click. |
| **Stream gallery** | Native scroll-snap with drag-to-scroll, arrow buttons (disabled at the ends) and keyboard arrows. |
| **Archive index** | Filter chips with a sliding pill; rows with a spring-following preview on desktop and inline thumbnails on mobile. |
| **SectionHeading** | Index, display title with the yellow period, and an aside. The title uses a masked line reveal. |
| **Period** | `0.2em` yellow sphere. Grows eyes after any ending. |

---

## Motion system

| Token | Value | Use |
|---|---|---|
| `hover` | 150–250ms | Color, underline sweep, arrow nudge |
| `state` | 200–350ms | Filter pill, nav pill (spring 420/36), toggles |
| `reveal` | 750–900ms | Section entrances, line masks |
| `cinematic` | 1.0–1.2s | Hero letters, avatar entrance, reassembly |

| Easing | Curve | Character |
|---|---|---|
| `outExpo` | `0.16, 1, 0.3, 1` | Default. Confident and decelerating. |
| `outQuart` | `0.25, 1, 0.5, 1` | Secondary |
| `inOutCine` | `0.65, 0, 0.35, 1` | Programmatic scrolls, reassembly |
| `snap` | `0.34, 1.56, 0.64, 1` | **Act II only** (overshoot) |

**Stagger:** hero letters 55ms each per line, with line 2 offset by 170ms. Gallery cards 60ms, capped at 4. Reassembly 25ms per piece.

**Reveal behavior:** `Reveal` does a blur(8px) + 28px rise. `LineReveal` observes the mask and slides the line up from 105%. Both fire once.

**Scroll effects:** the hero title parallaxes −90px, the ambient light +160px, and the hero fades to 25% as you leave. That's the only parallax on the page.

### Reduced motion

- `MotionConfig reducedMotion="user"`, plus a global CSS rule that collapses durations.
- Hero letters, lines and sections fade instead of moving.
- The collapse is **simulated offscreen** (`PileEngine.settle`) and appears already at rest, without the wrecking-ball pass.
- Verity moves instantly, chat lines appear without typing, and screen shake and pixel bursts are skipped.
- Grain and marquees don't animate.

---

## Act II: the troll design system

### How Act I becomes corrupted

| Act I property | Becomes | Mechanism |
|---|---|---|
| Rounded glass nav | Square hazard-bordered HUD with protocol steps, telemetry, sound and LEAVE | Same `motion.div` with `layout` animation and border/radius/bg transitions in `Header.tsx` |
| The yellow period | Verity, a 3D orb with a mood face | `About.tsx` hands the quote period's exact screen rect to `verity.jump()` |
| Hero DOM | Rigid bodies | `PileEngine.capture` clones each `[data-physics]` element at its exact rect and hides the original (layout preserved) |
| Editorial serif quote | "Exhibit A" with an **UNDERSTOOD** stamp | Same content, now evidence |
| Paper/ink palette | Verity yellow on hazard black | Backdrop store crossfades `dim → world` |
| Archivo 112% display | Archivo **125%** in the broadcast; pixel type for system text | Same variable font pushed to its axis extreme |
| Pill buttons | Pixel-bevel `pixel-btn` blocks | Minecraft-menu grammar, from Eric's Minecraft-heavy content |
| Signal red CTA | The SUBSCRIBE plate (from the banner) | Same red, now the antagonist's forbidden object |

### Act II tokens

| Token | Value | Use |
|---|---|---|
| `verity` / `verity-hi` / `verity-lo` | `#ffd21f` / `#fff3a6` / `#d99a00` | Orb gradient, HUD labels, active step |
| `hazard` | `#0b0a07` | Backgrounds, HUD |
| `alarm` | `#ff4128` | Loud chat, "+1", BREAKING, LIVE |
| `chat` | black at 55% | Minecraft chat line background |
| `pixel` | `#f4f1e6` | Pixel text |
| `font-pixel` | Pixelify Sans Variable | Verity's voice, HUD, objectives, buttons |

**Surfaces:** radius 0 everywhere, 2px borders, a 32px yellow grid at 5%, outlined marquee words at 9% ("GATEKEPT · DO NOT SHARE"), and `hazard` stripes (yellow/black 45°) as structural accents only.

### Verity's moods (state → appearance)

| Mood | Skin | Face | Voice (chirp) |
|---|---|---|---|
| `calm` | Yellow | Round eyes, small smile | Square wave ~760 Hz |
| `annoyed` | Warmer yellow | Flat lids, straight mouth | ~640 Hz |
| `angry` | Orange | Slanted brows, frown | Sawtooth ~520 Hz |
| `meltdown` | Red-orange, shaking | Pinprick eyes, open mouth | ~420 Hz |
| `tiny` | Yellow, 22px | Smile | ~1.3 kHz |

### How the chaos stays coherent

1. **One antagonist with one motive.** Every disruption is Verity trying to keep Eric unfamous.
2. **One palette, one type system, one chat format.** Act II never borrows from outside its grammar.
3. **Real physics.** Thrown pieces behave consistently, never as random keyframes.
4. **One objective at a time**, always shown under the HUD.
5. **Always reversible.** Every scene unmounts through `useScript`'s AbortController, and `restore()` reassembles the pile, removes redactions, stops the hum, clears chat and unlocks scroll.

### Returning to Act I

`leave()` / `replay()` / `resetArchive()` in `ExperienceContext.tsx` animate every clone back to its original rect (950ms, eased, 25ms stagger), restore the originals' visibility, and reset the state machine. After any ending the archive keeps one souvenir: watching periods.

---

## Act III: the uglification (a third, deliberately terrible design system)

Act III doesn't add a new world. It **vandalises the real archive in place**, through `html.ug-*` classes (`src/lib/experience/chaos.ts` and the "Act III" block in `index.css`). Every rule is unlayered with `!important`: its whole job is to defeat the design system above.

| Step class | Crime |
|---|---|
| `ug-font` | Comic Sans for body, Impact for headings, lime-green paragraphs with magenta drop shadows |
| `ug-rainbow` | Fixed, slowly scrolling 45° rainbow stripes with starfield dots; the hero vignette and film grain are removed so nothing looks expensive any more |
| `ug-wordart` | Hero letters in a vertical rainbow gradient with a 4px black outline and hard drop shadow; section titles in cyan-magenta-yellow |
| `ug-borders` | 7px `ridge` borders on all media, `#4d6bff` underlined links, `outset` grey buttons |
| `ug-wobble` | Alternating ±2.5° sway on blocks and list items |
| `ug-cursor` | A Verity cursor (inline SVG), plus a trail of 8 tiny Veritys |
| `ug-tilt` | `main` and `footer` lean −3° and drop 40px |
| `ug-beat` | Sections scale with `--kick` (+3.5%); hero letters jump 26px; periods pulse |
| `ug-drop` | `main` spins (7 s per turn) and shakes with the kick; odd letters rotate with it |
| `ug-upside` | `main` is rotated 180° |

**Widgets** (`ChaosLayer.tsx`): marquee banner, LCD hit counter (it ticks upward), UNDER CONSTRUCTION sign on a spring, webring box, spinning NEW! starburst, cursor trail. In-page widgets are portalled into `<main>` so they scroll, tilt and spin with the page.

**Popup windows** use an original grey-bevel, navy-title-bar style labelled "VerityOS". They're clearly in-world and carry a Verity icon. The sequencer uses a dark channel-rack style with one color per row (kick orange, clap yellow, hat green, 808 magenta, cowbell teal, airhorn red).

**Text swap:** at the drop, every word in `main`/`footer` becomes ERIC or KAINE. The original text nodes are saved in a `Map` and written back on restore.

**One structural rule:** never transform `body`. A transformed body becomes the containing block for every `position: fixed` layer (HUD, chat, sequencer) and pushes them off-screen. Shake and spin go on `main`/`footer` only.

### New Verity states

| State | Look |
|---|---|
| Mood `unhinged` | Huge white eyes with pinprick pupils, a wide open grin with teeth. Chirps at random pitches. |
| Costume `bleoodity` | Eleven magenta, pink, purple and teal dreads that draw themselves in and sway. Chat name becomes `<bleoodity>` in pink. |

---

## Sound

All sound effects are synthesized with Web Audio (`lib/audio/sfx.ts`), with no bundled samples or music files. The chain is voices → master (default 90%) → glue compressor → **brick-wall limiter (−3 dB, 20:1)**, so Act III can be loud without clipping. Nothing plays until "Allow beeps", except Verity's single, announced override in Act III. Mute and volume live in the HUD.

| Cue | Moment |
|---|---|
| Chirps | Verity typing, pitch by mood |
| Two-tone alarm (soft) | The collapse and the broadcast |
| Thud / bonk | Pieces released, Verity hit |
| Light switch + 55 Hz hum | Lights out |
| Arpeggio | A video found |
| Boing / nope | Button dodge, wrong decoy |
| Bell | Real button found, subscribe |
| Pop + fanfare | Verity pops; the archive rebuilds |
| Boom (sub drop) | UNDERSTOOD stamp, the floor slam, Verity's pop, the drop |
| Chiptune (original 4-bar loop, 152 BPM) | Uglify and popups |
| Error two-tone, squeak, crash | Every popup spawn, every poke, ALT+F4 |
| Mitosis bloop, combo pops | Clone splitting and popping |
| Drum machine: kick, clap, hat, distorted 808, cowbell, airhorn, snare roll, riser | The beat (140 BPM, lookahead-scheduled) |
| Record scratch | The twist |

## Act IV additions

The underground section deliberately abandons the polished archive: clashing primary colors, checkerboard photo wallpaper, ridge/outset borders, badly rotated real JPEG posters, Comic Sans, WordArt, fake spam and Windows XP video chrome. Actual Three.js food/cup meshes and photo boards float at the edges. `ug-vamp` and `ug-jelly` apply only to the archive and are removed by `chaos.reset()`. No body transform captures fixed UI. Decorative animation and 3D movement stop under reduced motion.

The default effects volume is 90%. Effects use the existing compressor/limiter. A local 18.064-second meme MP3 loops as background music for the whole act, unmuted, with no player, close, pause, stop or mute control (the HUD hides mute/volume while it plays; `Esc`/LEAVE still exit). Subway Surfers uses real muted visible YouTube video embeds; visitors may enable video sound in those players. The final bio cuts the background song and effects and clears the collage/3D layer. Native buttons provide photo signing, feeding, explosions, video/tab controls and mosh jumps. Before the takeover there are 15 popup closures and exactly 20 clones.
