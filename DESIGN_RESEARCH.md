# Design research

Research ran on 2026-10-10. This file records what was **actually** inspected and how. Where a source was unavailable or only partly readable, that is stated rather than filled in.

## Access log

| Reference | Method | Result |
|---|---|---|
| `youtube.com/@eric2kaine` (all tabs) | In-app browser, DOM reads, watch-page metadata | Full. See `SOURCES.md`. |
| fromanother.love | WebFetch (markup) and browser | Markup read. The browser pane showed only the WebGL preloader (a walking figure and "0%") and never got past it, so it was judged from structure, not visuals. |
| Jason Bergh (csswinner #19051 → jasonbergh.com) | WebFetch and browser | The listing gave credits, tags and scores. The live site rendered as pure black with dotted vertical column rules; its video layer didn't load in the pane. |
| Plutarch Films (Awwwards Market) | WebFetch | Listing only: a Framer template with a CMS-driven Works/Artists structure. No visual inspection. |
| 21st.dev Hyper Text (Magic UI) | WebFetch | MIT license, depends on framer-motion. The source wasn't fetched because installing needs an API key. |
| 21st.dev Spotlight | WebFetch | **404.** Not inspected. |
| Pointer Pointer | WebFetch | Only the title came back. The mechanic is described below from prior knowledge. |
| Mobbin, Refero, UX Archive, Collect UI, VP0, SaaSFrame | Not accessed | These are account-gated or weren't reached in this session. **No analysis is claimed.** |
| Windows93, Cat Bounce, The Useless Web, Neal.fun, Internet Artifacts | Not re-inspected | Notes below come from prior familiarity, not this session. |
| VibeDoctor MCP | Not available | No such integration is connected in this environment. The "generic AI aesthetic" review was done by hand against the checklist in §20 of the brief (see `IMPLEMENTATION_REVIEW.md`). |

## Professional references: what was taken, and what was left

| Reference | Demonstrates | Adopted | Rejected |
|---|---|---|---|
| **fromanother** | Numbered sections ("1 About", "2 What we do"), one-line statements before visuals, a minimal "Menu / Let's chat" header, a progress-counter preloader | Numbered section index (`01 — Latest`), short editorial statements, a minimal floating header | The preloader. A fan archive shouldn't make people wait, and it would also spoil the reveal's pacing. |
| **Jason Bergh** | A dark, video-forward portfolio, visible column rules, minimal chrome | Near-black foundation and hairline 12-column rules on desktop (`ColumnRules` in `App.tsx`) | Autoplaying background video. YouTube media is click-to-load for privacy and performance. |
| **Plutarch Films** | Large artwork per project and compositional variety between list and detail | A large featured player, an asymmetric 7/4 supporting pair (one 16:9, one 4:5 offset down), a horizontal gallery, a dense archive index | Multi-page CMS routing. One scrolling page keeps the transformation continuous. |
| **21st.dev Hyper Text** | Glyph-scramble text transitions | Re-implemented as `effects/Scramble.tsx` (no dependency) and used only when the HUD changes labels | Using it as a hover toy on the professional side, where it would read as a template effect |
| **21st.dev image trail / galleries** | Cursor-attached media | Archive rows show a single spring-following preview thumbnail | A multi-image trail, which is too busy for an index |

## Troll references (prior knowledge)

| Reference | Mechanic it teaches | How it shaped this project |
|---|---|---|
| **Pointer Pointer** | A single absurd mechanic answered with unnervingly specific content | Verity's eyes track the pointer everywhere, and her lines respond to the exact piece you grab ("that's the letter K. there are only nine of them.") |
| **Cat Bounce** | Direct manipulation plus physics makes its own fun | Protocol 01: the website itself becomes throwable rigid bodies |
| **Windows93** | A fictional system taking over familiar UI | The nav doesn't vanish; it *becomes* the Gatekeeper Protocol HUD, with steps, telemetry and a LEAVE button |
| **Neal.fun** | Minimal instructions and progression that unlocks | One objective line at a time. Each protocol is introduced by Verity, not by a tutorial. |
| **The Useless Web** | Committing fully to an absurd premise | Verity's logic stays consistent: she always acts to keep Eric unfamous |
| **Internet Artifacts** | Old web culture as a storytelling medium | The emergency broadcast lower-third and ticker borrow the grammar of TV news |

**Deliberately not copied:** random external redirects (Useless Web), fake OS crash dialogs and security warnings (Windows93-style), and photo-database mechanics (Pointer Pointer).

## Creator visual research

- **Thumbnails:** saturated Minecraft scenes, Bleood's rainbow dreads, and Verity drawn as a **yellow smiley orb**. There's also an in-game chat overlay in Minecraft's font, `<Bleood> I LOVE SEALS!`. Act II's chat lines reuse this format (`<verity> …`) in Pixelify Sans.
- **Banner:** a giant red rounded **SUBSCRIBE** plate with a bell. Its red becomes Act I's only accent color, and the plate itself is rebuilt as Protocol 03's button.
- **Avatar:** a hand-drawn cartoon portrait with curly hair, round glasses and a grey hoodie. It's used as the hero's editorial cut-out and as a physics body.
- **Bio:** lowercase and self-deprecating. Verity speaks entirely in lowercase to match.

## How the result stays original

There's no template layout, no copied component code, and no stock or AI imagery. The only third-party UI idea (a glyph scramble) was re-implemented in about 40 lines. Every Act II visual (Verity, the HUD, the hazard world, the broadcast, the SUBSCRIBE plate) is original CSS, SVG or Canvas built from the creator's own motifs.
