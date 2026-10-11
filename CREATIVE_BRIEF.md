# Creative brief: GATEKEEPER

## The premise in one line

The archive comes with a friendly guide. It's a small yellow orb called **Verity**, and she reads Eric Kaine's real channel description, *"please gatekeep me im not trying to be famous"*. She takes it as a direct order. A fan site exists to make him more famous, so Verity starts gatekeeping Eric from you.

## Why this concept

| Test | Answer |
|---|---|
| **Originality** | It isn't a meme page. The whole site is played straight, then sabotaged from inside by its own UI guide, with a motive the visitor can understand. |
| **Relevance** | Both halves are Eric's own material. The motive is his verbatim bio. The antagonist is Verity: his most recent upload and roughly half his September 2026 streams are Verity-mod content, and his thumbnails show Verity as a yellow smiley. Her dialogue uses the Minecraft-chat format (`<verity> …`) from those thumbnails. The final button calls back to the giant red SUBSCRIBE plate on his channel banner. |
| **Surprise** | Act I has no jokes. The only hint is a yellow period, and it reads as pure typography until it blinks. |
| **Humor** | The escalation logic treats one hypothetical subscriber as a global emergency. The jokes build on each other, then land on a calm anticlimax. |
| **Interaction** | The visitor chooses a side, throws the website at its guide, hunts videos in the dark, and fights a button. Each choice leads to a different ending. |
| **Visual impact** | The hero title is physically knocked apart by an angry orb and then flies back together. |
| **Feasibility** | It uses DOM clones, Matter.js, Canvas 2D and Motion, with no WebGL and no server. |
| **Replayability** | There are three endings, hidden triggers, and a permanent post-game change: every period on the site has eyes afterwards. |
| **Contrast** | Charcoal editorial typography gives way to pixel-chat hazard tape. |

### Rejected directions

- **The website becomes self-aware.** This is a generic premise with no Eric-specific motive.
- **A fictional authority regains control of a broken site.** The joke is the bureaucracy, not the creator.
- **A conspiracy built from his video titles.** Several titles involve real people, so this could drift into fabricated claims. Rejected on taste and safety.
- **Pure Verity horror (jumpscare).** This was in the original "verity game" idea. It was rejected as the main act because jumpscares are hostile to visitors and only work once. The Verity *mechanics* (a friendly orb that turns, a flashlight battery) survive in Protocol 02.

## The experience, phase by phase

| Phase | What happens | Where it lives |
|---|---|---|
| **0: Total professionalism** | A cinematic hero, the latest video with a click-to-load player, an asymmetric pair of supporting cards, a draggable stream gallery, Shorts, an About section, a filterable archive of all 23 videos, and links. The yellow period at the end of every heading is the only odd detail. | `components/professional/*` |
| **1: The first anomaly** | When the visitor reads the bio pull-quote, its yellow period grows eyes, blinks, and types **`understood.`** Then it leaves the paragraph and docks in the corner as "Verity · archive guide". | `About.tsx` |
| **2: The website reacts** | The docked guide quietly comments on what you hover and click ("37K views?? that's basically famous."). Links still work, though: "opening that. i'll allow it. once." | `useGuideRemark.ts`, `VerityOrb.tsx` |
| **3: The reveal** | This can start three ways: clicking the guide, clicking **Share the archive** (intercepted: "whoa whoa whoa. you were about to share him?"), or triple-tapping the hero period. Verity asks for permission to beep, presents **Exhibit A** (the bio), stamps it **UNDERSTOOD**, and asks: help, or be the problem. | `IntroScene.tsx` |
| **3b: Full transformation** | If you refuse, Verity scrolls the archive to the top, the nav morphs into the **Gatekeeper Protocol** HUD, and she flies through the hero title like a wrecking ball. Every element she touches becomes a physical object. The rest follows when she slams the floor. | `CollapseScene.tsx`, `pile.ts`, `Header.tsx` |
| **4a: Protocol 01, Collapse** | "please don't touch anything. it's evidence." Every piece of the old website can be grabbed and thrown, and Verity comments on what you pick up. Hitting her three times escalates her mood from calm to annoyed to angry, and moves on to "lights off." | `PileScene.tsx` |
| **4b: Protocol 02, Lights Out** | This is the Verity game. The room goes dark and your pointer, finger or arrow keys become a flashlight. Its battery drains faster when Verity's light catches you. Pairs of eyes blink in the darkness and watch your beam, vanishing when it touches them. Five of Eric's real videos are hidden in the wreckage, and each one found adds one view to the live counter while Verity panics. | `LightsScene.tsx` |
| **4c: Protocol 03, The Button** | The banner's giant red SUBSCRIBE, rebuilt. The same joke plays four times, escalating: it dodges, Verity shields it ("over my dead orb"), it splits into a shell game, and then Verity just gives up. "…fine. press it. see if i care." | `ButtonScene.tsx` |
| **5: The broadcast** | An emergency broadcast: **1.5K +1**, "Local YouTuber gains one (1) hypothetical subscriber", and a ticker. Verity overloads and pops (boom). After a long silence, a much smaller Verity rolls back in: "1.5K + 1 is still pretty gatekept." The website flies back together… and she notices it's still a really nice website, and people share nice websites. | `MeltdownScene.tsx` |
| **Act III, 04: Uglify** | "If the website looks bad, nobody will share it." Verity redesigns the real archive, step by step and with narration, into the worst homepage of 2003: Comic Sans and Impact, a scrolling rainbow background, WordArt hero letters, ridge borders and blue links, a marquee, a hit counter, an UNDER CONSTRUCTION sign, a webring, a spinning NEW! badge, a cursor trail of tiny Veritys, and an original chiptune. If the visitor chose silence, she turns sound back on ("you're welcome"). Then she gives a guided tour of the damage, asks for a rating, and tilts the whole page either way. Every click on the page squeaks and spins the thing you clicked. | `UglifyScene.tsx`, `ChaosLayer.tsx`, `chaos.ts` |
| **Act III, 05: Popup hell** | In-world "VerityOS" windows: notifications to Allow/Allow, "unsubscribe? No/NO", "installing more verity… 99%", a CLAIM PRIZE that spawns three more, and "now playing" windows with real thumbnails. Closing one spawns two. Every button spawns more. A CLOSE ALL button appears and runs away three times. At 22 closes: "FINE. alt + f4." and every window falls off the screen. | `PopupScene.tsx` |
| **Act III, 06: Clone army** | "if there are more of me, i can gatekeep faster." Verity splits six times, into 64 chirping, bouncing, colliding orbs (some with unhinged faces) whose eyes follow your cursor. You pop them (click, tap or Space), with a combo pitch that climbs. The last eight run away. | `ClonesScene.tsx` |
| **Act III, 07: The beat** | "making a beat but the website chooses the sounds" (a callback to Eric's real stream title). A playable 16-step channel rack. Verity "improves" the beat bar by bar: cowbell on every step, then airhorns. Then a snare-roll build-up, a riser, a giant 3·2·1, a gap of silence, and **the drop**: an 808 boom, airhorns, the archive dancing to the kick, every word on the page replaced with ERIC KAINE, the page spinning, and halfway through it flips upside down. Muting the beat is illegal (Verity un-mutes it once). | `BeatScene.tsx`, `lib/audio/beat.ts` |
| **The twist** | A record scratch, silence, and the rainbow page dims. "do you want to know a secret." Verity grows Bleood's dreads: she was **Bleoodity** all along, because Eric really did turn Verity into Bleood on stream (21 Sep 2026). "i'm deleting the website." The HUD vanishes, and the whole page becomes a plain server **404 Not Found**. A yellow period appears at the end of the server line. *jk.* The fake deletion becomes an underground takeover; the archive is restored in the Act IV finale. | `TwistScene.tsx` |
| **6: Replay** | The ending card has a real **Subscribe for real ↗** link, **Replay** and **Back to the archive**. Afterwards every yellow period on the site has eyes that track the cursor, the tab title changes when you leave, the footer lists found endings, and Share works for real ("Link copied — Verity has been notified"). | `EndingCard.tsx`, `Period.tsx`, `Footer.tsx` |

### Endings

| Ending | How |
|---|---|
| **One More Subscriber** | Refuse → all twelve protocols → the underground finale. (Roughly 6–9 minutes at real pacing, depending on interaction time.) |
| **Safely Obscure** | Let the flashlight battery die → choose "Leave him obscure". |
| **Certified Gatekeeper** | Agree to help → redact eight "fame-adjacent" things on the live page → Verity says "phase two" and the redacted page goes through all of Act III anyway → the twist. |

### Hidden interactions

- Triple-tap the yellow period in the hero for an early reveal.
- Leave the tab during the experience and the title becomes *"come back. he's still not famous."*
- Throw specific pieces for specific lines: the avatar ("you threw his FACE at me."), the period ("that was my cousin."), the CTA ("that button was load-bearing.").
- Wait without pressing the final button and Verity starts to crack ("is this reverse psychology.").
- After any ending, every period on the site watches the cursor.
- During Act III, the first press of LEAVE is "processed" (LEAVING… 12%… 99%… jk… ok bye), then it leaves. `Esc` is always instant.
- Poke the vandalised page six times and Verity comments.
- Click the yellow period on the 404 page to skip straight to "jk." 

## Guard rails

- Every creator fact is verified (see `SOURCES.md`). There are no invented quotes, milestones or accusations. The only Eric quote is his own bio, labelled verbatim.
- The site is clearly labelled as an independent fan project.
- There are no fake security warnings, downloads, redirects, clipboard reads, camera or microphone access. There's also **no strobe**: everything that changes fast changes position, not brightness, and nothing flashes above 3 Hz. The popups are clearly in-world ("VerityOS") and never claim the visitor's device has a problem. The 404 is a one-line server-page parody that resolves itself in about 6 seconds.
- Sound effects are synthesized; BLEOODITY FM embeds the official song through YouTube. Act III is deliberately **loud**, but everything passes a brick-wall limiter so it never clips. There's always a visible mute and a volume slider. The two sound pranks are bounded: Verity turns sound back on **once** in Act III and un-mutes the beat **once**. After that, mute is respected, and leaving restores the visitor's original "keep it silent" choice.
- **Esc** always leaves instantly. **LEAVE** works too (in Act III after a ~2.5 s fake progress bar, once). The page is fully restored on exit, with every class, widget, text swap, redaction and physics clone removed, and a refresh always returns a clean archive.

## Completed Act IV — Bleoodity's Underground

The fake 404 now becomes a hostile acquisition: “jk. i’m not deleting it. i’m TAKING it.” The red/black archive squishes like jelly, a parody stream chat runs, and a draggable BLEOODITY FM window offers the real cheese song through YouTube.

08 The Label signs eight parody cards: Bleood, Slayr in an original burger costume, OsamaSon, Playboi Carti, Jaydes, The Cheese Guy, 2Slimey and Lil Verity. 09 Food Fight throws original cartoon seals, burgers, cheese, tortas, double cups, dracos, dragons, slime and poo around a Matter.js world; feed 18 cheese, explode objects, or take a timed skip. 10 Brainrot is a 50-second original three-lane runner beside a captioned archive; it escalates to four panels. 11 Mosh Pit turns the real page into draggable bodies: 12 jumps launch a stage dive.

The imaginary fame counter reaches 1.5B, then the soundtrack cuts and Eric's real bio reappears. Bleoodity says “my bad,” sheds the dreads, restores the archive, and rolls into its yellow period. Both full routes now finish here. Expected playtime is roughly 6–9 minutes; pacing depends on interactions. All new scenes use abortable scripts and support keyboard/touch; Escape restores them.
