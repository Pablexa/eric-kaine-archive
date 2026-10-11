# Source registry

Every creator-specific claim on the site traces back to one of these public sources. All were captured on **2026-10-10**.

| # | Source | What it established |
|---|---|---|
| S1 | Channel header, `youtube.com/@eric2kaine` | Name "eric kaine", handle `@eric2kaine`, **1.5K subscribers**, **23 videos**, bio *"please gatekeep me im not trying to be famous"*, avatar image, red "SUBSCRIBE" banner |
| S2 | Channel "links" panel (About dialog) | Twitch `twitch.tv/eric1kaine`, Discord `discord.gg/jC6TtA8AdH`, Instagram `eric1kaine`, SoundCloud short link, beat channel `@eric1kaine`, X `@erickaine_`, **joined 13 Sep 2024**, **70,077 total views** |
| S3 | Channel RSS feed, `feeds/videos.xml?channel_id=UCTIkib43I4tDNUTIqWMFz7w` | Channel ID, and the 15 most recent entries with IDs and titles |
| S4 | Videos tab | The 6 long-form uploads |
| S5 | Shorts tab | The 3 Shorts |
| S6 | Each watch page's public metadata (`uploadDate`, `lengthSeconds`, `viewCount`, `isLiveContent`) | Exact dates, runtimes and view counts for all 23 videos. 14 of them are live streams. |
| S7 | YouTube image CDN probes (`i.ytimg.com/vi/<id>/{maxres,hq,oar}default.jpg`) | Which thumbnail sizes exist for each video |

## Claims used in copy, and their basis

| Copy | Source |
|---|---|
| "Since Sep 2024", "The channel opened on 13 September 2024." | S2 |
| "Two years later, to the day, a stream title read: IM BOUT TO HIT 1000 SUBS" | S6: stream `KYqn_39S070`, uploaded 2026-09-13 |
| "1.5K subscribers · 23 videos · 70,077 views, as of Oct 10, 2026" | S1, S2 |
| "Fourteen streams and counting" | S6 (`isLiveContent: true` × 14) |
| "The most-watched upload on the channel, by a distance." | S6: `CIhHkePQRsw` has 37,451 views; the next highest is 19,865 |
| "The upload that follows three weeks of Verity-mod streams … properly this time." | S6: Verity streams on Sep 17 ("and broke it"), 20, 21 and 22, then the upload on Oct 5 |
| "Bleood added to the Verity horror mod ('and broke it'), underground-rapper Gartic Phone with viewers, beats built from sounds chat picks, reactions to new drops" | S3/S6 titles |
| "Nineteen seconds is plenty when someone donates at exactly the wrong time." | S6: Short `jMVtNV5zTec` is 19 s, titled "bro donated at the wrong time ☠️" |
| Verity is a yellow orb with a face, and dialogue uses `<name> message` chat lines | S7: thumbnails `m_3agIs-y-U`, `cYBWZyecX_w` and `qv-3Lrujn6k` |
| "making a beat but the website chooses the sounds" (Protocol 07) | A play on stream `bIOpt-lmJrU`, "making a beat but my chat chooses the sounds !discord" (S6) |
| Verity becomes **Bleoodity**; "eric turned me into this on stream. september 21st." | Stream `cYBWZyecX_w`, "I turned Verity into Bleood (Bleoodity)", published 2026-09-21 19:06 PDT (S6); the yellow-orb-with-dreads look comes from its thumbnail (S7) |
| Verity mod background (a friendly companion orb that turns, a flashlight battery) | Public coverage of the Minecraft Verity mod (CurseForge blog, PCGamesN), via web search on 2026-10-10 |

## Deliberate omissions

- Two uploads involve real public figures in their titles (an FL Studio sampling series). They appear in the complete archive list for accuracy, but they are **not featured or curated**, and the troll act never references them.
- Bleood appears only where Eric's own titles name him. The troll act mentions him in one meltdown line ("TELL BLEOOD I'M SORRY"), and the twist uses "Bleoodity", which is Eric's own on-stream creation (the dreads on a yellow orb). Bleood himself is never depicted.
- Nothing about Eric's personal life is used.

## Act IV provenance and fiction

The user-supplied continuation brief identifies the cheese-song official upload, https://www.youtube.com/watch?v=mPJhwEcj2g4, already recorded in `channel.ts`. Existing verified video titles supply the 2Slimey, UK Rap, Bleoodity, beat and donation callbacks. No new creator biography or real milestone is asserted.

The underground artist roster, card stats, signatures, fictional chatters, donation amounts, burger costume and all label dialogue are parody. The 1.5B counter is explicitly imaginary; the actual archive snapshot stays 1.5K. The cards say “parody card · not affiliated.” The earlier omission note that Bleood never appears is superseded by original symbolic parody art; no real portrait is used.

Player control follows Google's official reference: https://developers.google.com/youtube/iframe_api_reference. Autoplay and embed availability depend on the browser and YouTube; the direct song link remains available if playback fails.
