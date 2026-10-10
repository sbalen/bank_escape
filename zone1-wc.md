# Zone 1 — Men's Restroom

## Setting
23:51. You're stuck in the men's restroom on floor 42. Three stalls with doors, five urinals (one broken), sinks, a first-aid cabinet, a paper towel dispenser (out of paper), three ceiling sprinklers. Outside this room: the hallway, the elevator lobby, the coffee corner — all potentially reachable once the emergency door opens.

**Goal of this zone:** start a fire to trigger the fire alarm, so the emergency door (which normally only releases during an actual emergency — confirmed by an overheard conversation) unlocks.

**Implementation:** `zone1.html` — a single self-contained file (background art, all logic, and the Charmin watch soundtrack are inlined; no server needed, just open it).

**Source layout (build step, not a runtime dependency):** `zone1.html` is now *generated*, not hand-edited directly. The actual source lives in:
- `template.html` — HTML skeleton with `{{STYLES}}` / `{{SCRIPT}}` placeholders
- `styles.css` — all CSS, with a `{{BG_MAIN}}` placeholder for the main background
- `sfx.js` — the `ChiptuneSFX` class only (procedural Web Audio API sound effects, no audio assets)
- `texts.js` — every piece of player-facing copy, as a flat `TEXTS["dotted.id"]` map
- `game.js` — all game logic: state, hotspots, verb handling, subzones. Looks copy up via `TEXTS[id]` and instantiates `ChiptuneSFX` from `sfx.js`; has the `{{BG_WATCH}}` / `{{BG_DOOR_CLOSED}}` / `{{BG_DOOR_OPEN}}` / `{{BG_STALL2}}` / `{{SPRITE_TP_ROLL}}` placeholders
- `assets/*.png` — the real background image + sprite files
- `build.py` — pure Python (no npm, no install step): concatenates `sfx.js` + `texts.js` + `game.js` (in that order — game.js depends on both) into the `{{SCRIPT}}` slot, inlines the PNGs as base64 into the placeholders, and writes `zone1.html`

Run `python3 build.py` after any change to the source files to regenerate `zone1.html`. The shipped result is unchanged for the player: one plain HTML file, no server, double-click to play. This split exists purely so the logic, styling and copy stay readable and diffable instead of drowning in megabytes of inlined image data and hundreds of inline string literals — done before the stall/cabinet/vent subzones below add several more background images and their copy.

**Why copy is split out into `texts.js`:** every returned string that's just words (not logic) lives in `TEXTS`, keyed with the same dotted-id convention as `zone1-texts.csv` (the copywriting export — e.g. `hotspot.stall1.notice.locked`, `item.coin.notice`, `combine.soaked_lighter`) so the two are easy to cross-reference. `game.js` keeps 100% of the conditionals and state changes; it just does `TEXTS["some.id"]` instead of a literal string. `zone1-texts.csv` itself is a point-in-time export for offline copywriting, not read by the game or by `build.py` — if/when an edited CSV comes back, re-importing it means updating the corresponding lines in `texts.js` by hand (or via a small script matching on `id`), not swapping in the CSV directly.

## Verb system
Four fixed verbs, always available: **Notice** (look + listen combined), **Take**, **Fiddle**, **Use** (with or without an item).

**Split between Take and Use** (assumption, adjustable): Take is for simply picking up a loose, directly reachable object (coin from a jacket pocket, toilet paper off the roll, paper from the trash can). Use is for anything requiring an action/mechanism — opening a cabinet, prying a lid off, applying an item to something else, or a physical action without an item (like climbing onto a urinal).

**Inventory combinations:** combining two items (e.g. toilet paper + hand sanitizer) happens independent of your location in the room, is always symmetrical (click order doesn't matter), and the part that "merges into" the other item disappears from inventory unless stated otherwise.

**Cursor:** the mouse cursor changes with the active verb — Notice → zoom-in, Take → grab, Fiddle → crosshair, Use → pointer. Small readability aid so the player always knows which verb is armed without checking the status line.

**Sound effects:** a `ChiptuneSFX` class (procedural Web Audio API, no audio files — same "no external assets" approach as the intro's `DreadSoundtrack`) lives in its own `sfx.js` (concatenated ahead of `game.js` by `build.py`). Two effects, both wired in centrally rather than per-hotspot:
- **Pickup** — a short ascending arpeggio, fired from inside `addItem()`, so it plays automatically for every item the player ever picks up (coin, lighter, toilet paper, hand sanitizer, cigarettes, and any future ones) without needing to remember it per hotspot.
- **Explosion** — layered noise/thump/crackle, fired at the top of `triggerFireSequence()`, alongside the existing screen shake and flash. Played through a `GainNode` at `0.4` (60% softer than the raw normalized mix) — `_play(buffer, gain)` takes an optional gain, defaulting to `1` so pickup is unaffected.

Browsers block audio before a user gesture; a one-time `click` listener on `document` calls `sfx.unlock()` the first time the player clicks anything, so this doesn't need its own "press to start" screen the way `intro.html` does.

---

## Opening text (trigger: zone loads)

> 23:47. Floor 42. You're staring at a terminal that's starting to stare back. Fourteen coffees brought you to the two words that end careers: `git push origin main`.
>
> The pipeline thinks it over. Green. Yellow. Green, if the gods are feeling generous. Fourteen minutes, and Pay-Zilla breathes again.
>
> Or not.
>
> A retina scan. Your password. A call to your ex. And thirteen more factors you don't remember agreeing to.
>
> Only then can you put the phone down. Time to egress all that coffee downstream — you're seconds away from bursting.
>
> Ahhhh. Touch down. The first whole thirty seconds to yourself.
>
> Then your Charmin Watch buzzes. The pipeline's still running tests — and it just matched a payment. To a "Testie Testguy." In Nigeria. For nine hundred eighty-seven trillion euros.
>
> This is bad.
>
> This is very, very bad.
>
> You push the restroom door open. Locked. From the inside. There's no emergency. Yet.

*(This copy currently lives in `intro.html` as three typewriter screens over three illustrated panels — terminal/pipeline, phone-on-desk, watch close-up. The last line above is the hook into this zone.)*

---

## Charmin watch — subzone (built)

Not a room hotspot — a permanent **"⌚ Check watch"** button in the UI status row, usable from anywhere in the zone. Opening it swaps the main background to a watch-face close-up, hides the verb bar and inventory row (nothing useful to do with them here), and shows a paginated widget screen with prev/next arrows and dot indicators. A **"✕ Close"** button returns to the room exactly as left.

Six widgets total, cycled with ‹ › (dots show position):

1. **Heart Rate** *(titled, left-aligned)* — "Current: 192 bpm. / Average: 58. / Maybe try some meditation." Also pushes a line to the main output console: *"Meditation? You consider dropping the watch in the toilet instead."* — the joke lives in the console, not on the watch screen itself.
2. **Sleep Score** *(titled, left-aligned)* — "5h12m. Score: 41/100 — 'Poor.' / 'Try going to bed earlier tonight.' / It's 23:51."
3. **Notification Centre** *(titled, left-aligned)* — Bol.com (wrong number), Mom, an unknown phishing-flavored delivery link, a coworker reminder about the badge.
4–6. **Photos** *(no title, no on-screen caption — round photo only)* — a sad desk sandwich; the neighboring startup's dog ("floor mascot"); the desk photo with the badge lanyard visible in the background — this last one is the plant that pays off later (player sees the lanyard's location before the character does).

Photo widgets have no visible title or caption on the watch face itself — the watch screen shows only the round photo, centered, inside `.watch-photo-box` (`width:66%`, `aspect-ratio:1/1`, `border-radius:50%; overflow:hidden`, matching the watch's own round bezel). The caption text (`w.caption`, from `watch.photo1/2/3.caption` in `texts.js`) instead prints to the main output console via `setOutput(w.caption)` when the widget renders — same mechanism the Heart Rate text widget already used for its console-only punchline (`w.console`). This freed up the vertical space the caption used to occupy, so the photo itself is bigger than before.

Photo source images are supplied as pre-cropped circles on a transparent background (the AI-gen prompt asks for a hard circular alpha mask, full canvas, no feathered vignette) — `object-fit:cover` inside the round `.watch-photo-box` displays them as-is; the box's own `border-radius:50%` mask is a belt-and-braces backup in case a source photo isn't a clean circle, not the thing doing the real work. `watch_photo1.webp` (the sad-desk-sandwich photo) is the first one integrated this way, at 450×450 and WebP (not PNG) specifically to keep the whole build under the 30MB single-file delivery ceiling — see "Asset size budget" below. Remaining photo slots stay as `img: null` dashed-border placeholders (`.watch-photo-placeholder`, "[photo pending]") until supplied.

Text widgets (1–3) are titled and left-aligned, notification-style. Photo widgets stay centered, since a centered photo reads better than a left-justified one.

**Nav sizing:** `#watch-nav` prev/next buttons are 36×36px round buttons (down slightly from their original size, per feedback that they read too large next to the watch bezel).

---

## Subzones — general pattern

A subzone is a full swap of the main background image plus its own overlay controls, used where a single wide establishing shot can't show enough detail (small objects, container interiors, things you'd only see up close). Pattern, established by the watch:

- A dedicated button (persistent, or contextual) opens it.
- Background image swaps; the original is restored on close without re-encoding it (captured once from the live DOM at load time).
- Whether the verb bar/inventory stay visible depends on the subzone: **hidden** for the watch (pure information display, nothing to verb at), **kept active** for subzones where the player still interacts with objects (stalls, the door).
- Own hitboxes, own back/close control.

Two parallel implementations of the "close-up, verb bar stays active" flavor exist side by side in `game.js`, deliberately kept separate rather than unified into one generic system (lower risk of regressions, and they genuinely differ in one respect — see below):
All subzones are now on real art — no more placeholder-tint/dashed-box subzones anywhere in the game:
- **Stall interiors** (`activeStall`, `stall-mode`, `STALL_BG`) — sprite-overlay pattern (toilet-paper roll over a real, otherwise-static photo).
- **Cabinet close-up** (`activeZoom === "cabinet"`, `zoom-mode`, `CABINET_BG`) — same sprite-overlay pattern as the stalls (sanitizer bottle over a real photo with the shelf already drawn empty).
- **Vent close-up** (`activeZoom === "vent"`, `zoom-mode`, `VENT_BG`) — a *third* pattern: two full background photos swapped wholesale (closed/open), not a sprite overlay, because the two AI-generated shots weren't pixel-aligned. See "Vent close-up subzone" below.

The **"← Back" button** (`#subzone-back-btn`) is now shared by both systems — its click handler checks `activeStall` then `activeZoom` and closes whichever is open. All four subzone-opening functions (`openWatch`, `openDoorView`, `openStallSubzone`, `openZoomSubzone`) guard against the other three being open first, so only one of watch/door/stall/zoom is ever active at a time.

### Stall interiors (stall 1 / 2 / 3) — built, all three on real art
Each stall is now two layers: the **door**, a hotspot on the main-room background, and the **interior**, its own subzone entered via Notice on that door. Verb bar and inventory stay active throughout (real objects to interact with inside).

**Door hotspots** (`data-id="stall1"/"stall2"/"stall3"` on the main background) share the same joke responses for the verbs that don't open anything:
- **Take:** "You already have a door at home."
- **Use:** "You just went."
- **Notice:** opens the interior subzone (see below) and prints a one-line entry beat. Stall 2: "You step inside. Someone's covered every inch of this door in commentary." Stall 3: "You step inside, past the door left ajar — a 'Back soon! :)' sign taped to the outside, whoever that's for." Stall 1 (only once unlocked): "You step inside. A jacket hangs from the hook."
- **Fiddle (stall 2 & 3, always unlocked):** "No use fiddling here, the door's unlocked."

**Stall 1 is locked** — deliberately the one gatekeeping progress (the coin inside is needed to reach the vent → lighter → fire), not the one with the cigarettes, which are only a clue. Also matches the art better: stall 3's door already sits ajar in the background image, so it couldn't plausibly be "locked" anyway.
- **Notice while locked:** "Locked. The latch's jammed, not keyed — these things always are. Feels like it just needs a jiggle." (does *not* open the subzone)
- **Fiddle while locked:** "You jiggle the latch. It clicks free." → sets `stall1_unlocked = true`
- **Fiddle once unlocked:** same generic "no use fiddling" line as the other two
- Notice only opens the subzone once `stall1_unlocked` is true

**Interiors** (entered via Notice, left via a generic **"← Back"** button — `#subzone-back-btn`, shown whenever any stall subzone is active). All three now use real, pixel-calibrated background art (`assets/bg_stall1.png` / `bg_stall2.png` / `bg_stall3.png`, all 1672×940) — the old solid-tint placeholder + dashed-border caption mechanism (`STALL_PLACEHOLDER`, `#subzone-placeholder-label`) has been removed from `game.js`/`template.html`/`styles.css` entirely, since nothing uses it anymore.

- **Stall 1 — real art:** jacket on a hook (left wall) and the "never push to production" graffiti (right, on the inside of the door). `wall_text_1` and `jacket` hitboxes both recalibrated to the real art. `jacket` (Notice/Take/Fiddle — Take gives the **Coin**, same text as before).
- **Stall 2 — real art:** background is the open-doorway/toilet/cistern photo. `wall_text_2` (the Mark graffiti + arrow, sets `knows_about_tank`) hitbox on the real graffiti position (top-right wall). The wall-mounted holder is baked into the plate already showing a bare, spent cardboard tube — the fresh roll is a separate object sitting on the cistern lid: see "Toilet-paper roll sprite" below for how it's built. `tp_roll` (Notice/Take — Take gives **Toilet paper** and hides the sprite).
- **Stall 3 — real art:** door hangs ajar with a handwritten "Back soon! :)" sign taped to it (matches the door hotspot's entry text), plain toilet + cistern with no graffiti (this stall has no wall-text hotspot). `toilet_tank` hitbox recalibrated to the real toilet position (Notice reflects `knows_about_tank`; Use lifts the lid for the **Cigarettes**, same text as before).

**Toilet-paper roll sprite (stall 2)** — first real use of the sprite-overlay pattern (base plate = final/absent state, item = separate transparent PNG on top, toggled via `display:none`):
- `assets/sprite_tp_roll.png` — standalone roll, transparent background, alpha-cropped to its content bounding box (635×924).
- Positioned as an `<img id="tp-roll-sprite" data-subzone="stall2">` in `template.html`, absolutely placed on the cistern lid (`left:41.8%; top:34.2%; width:3.85%; height:9.8%` — 30% smaller than the first pixel-measured pass, base kept anchored to the lid surface) with `pointer-events:none` so clicks fall through to the `tp_roll` hitbox underneath.
- Visibility is driven by `updateTpRollSprite()` in `game.js`: shown only while `activeStall === "stall2"` and `!state.has_toilet_paper`; called on opening/closing the stall2 subzone and right after the roll is taken. The `[data-subzone]` CSS rule that shows/hides the stall hitboxes was widened from `.hitbox[data-subzone]` to plain `[data-subzone]` so it also governs this `<img>`.
- `build.py`'s `IMAGES` map gained `{{BG_STALL2}}` → `bg_stall2.png` and `{{SPRITE_TP_ROLL}}` → `sprite_tp_roll.png`; the inlining loop now also substitutes into `template.html` (previously only `styles.css`/`game.js`), since the sprite is referenced directly as an `<img src>` there.

Opening any stall subzone closes the watch or door subzone if either was open (and vice versa) — only one of watch/door/stall-interior can be active at a time, all sharing the single `#scene-frame` background.

### Exit door ("🚪 Turn around") — built
Second persistent button, next to "Check watch" (`#door-open-btn`, toggles label to "↩ Turn back"). Mutually exclusive with the watch — opening either one closes the other. Verb bar and inventory stay active (the door itself is a real hotspot: Notice/Fiddle/Use).

Two hitboxes, both calibrated by pixel measurement on the 1672×940 art:
- `data-id="door"` — the door leaf itself: `left:35.9% top:19.7% width:28.7% height:70.2%`.
- `data-id="keypad"` — the electronic card reader beside it: `left:67.46% top:43.19% width:4.31% height:11.6%`. Own Notice/Fiddle text (references the red/green LED and the badge-on-the-chair detail, distinct from the door's own lines); no Use handler (falls through to the generic fallback).

Two images, pixel-verified to share identical camera/geometry (sign, frame, tiles, access-panel position all overlay exactly; only the door leaf itself, its LED color, and the wet floor differ, which is expected and desired):
- **Closed / dry** (`emergency_door_open` false): red access-panel LED, dry checkered floor.
- **Open / wet** (`emergency_door_open` true): green LED, door ajar revealing a dark hallway, water pooling on the floor from the sprinklers.

Hotspot text (implemented verbatim):
- **Notice** (before, 1st time): "Locked. From the inside. There's no emergency. Yet."
- **Notice** (before, repeated): "Locked. As far as you know, there's no emergency."
- **Fiddle** (before): "You pick at the edge of the lock. It's an electronic lock. Fiddling doesn't work on electronics, not even in movies."
- **Use** (before): "You push the bar. Nothing. Locked tight — for now."
- **Notice** (after): "Open now — thanks to you, indirectly."
- **Fiddle** (after): "It's open. Fiddling with an open door mostly just closes it, which seems like a bad idea right now."
- **Use** (after): "You push through into the hallway." → after a short beat, prints the Zone 2 placeholder. This **replaces** the old standalone "Continue" button, which has been removed from the UI panel entirely.

**Transition sequence** plays live, in whatever view is on screen at the instant of ignition — see "Screen shake & explosion" below.

---

## Screen shake & explosion transition

On ignition (see the core puzzle below), the sequence plays identically regardless of which view the player currently has open (main room or door subzone) — nothing is deferred or replayed later:

1. `state.emergency_door_open` flips to `true` immediately.
2. The current scene shakes (~0.6s CSS keyframe jitter) **and** a quick white `#flash-overlay` blinks over it (two short pulses within the same 0.6s), suggesting the bang without showing it directly.
3. The sprinkler/transition text prints in the console (unchanged content, see below).
4. Once the shake finishes: if the door subzone happens to be open, its background swaps instantly from the closed/dry image to the open/wet one; if the main room is what's currently on screen (not the door, not a stall/zoom subzone, not the watch), it swaps instantly too, from `bg_main.png` to a matching sprinkler-soaked plate (`bg_main_wet.png`, `MAIN_BG_WET`, via `currentMainBg()`). Either way, a `#rain-overlay` of a dozen-odd falling droplet streaks fades in over whatever is currently showing, for ~2.4s, then fades out again.
5. If the player was looking at a stall or the vent/cabinet zoom when it happened, nothing changes immediately (the subzone's own background stays as-is) — but the moment they back out, `closeStallSubzone()`/`closeZoomSubzone()`/`closeWatch()`/`closeDoorView()` all now resolve the main-room background through `currentMainBg()` rather than a fixed constant, so they land on the correct (wet, post-`fire_started`) plate automatically. No animation replays when they later back out or "Turn around" — they just see the settled result, same as the door.

`currentMainBg()` is the one function every "return to the main room" code path calls; it returns `MAIN_BG_WET` once `state.fire_started` is true (set at the moment the soaked paper + lighter combo fires, before the 1.4s fuse even finishes), otherwise the original dry background. This mirrors `currentDoorBg()`'s closed/open logic exactly, just gated on a different flag.

The screen shake and flash also double as cover for any small visual inconsistency between the two paired photos in each swap (door closed/open, main room dry/wet) — verified pixel-diff on the door pair shows the static elements (sign, frame, tiles, panel) line up exactly, so in practice there's nothing to hide.

---

## Hotspots

### Stall doors + interiors
See "Stall interiors" under Subzones above for the full door/interior split, the stall-1 lock mechanic, and the real art for all three. Quick reference for what lives where:

- **Stall 1 door** (locked until fiddled open) → interior (real art): `wall_text_1` (graffiti, flavor only), `jacket` (Take → **Coin**, Fiddle → lint joke).
- **Stall 2 door** → interior (real art): `wall_text_2` (Mark graffiti, sets `knows_about_tank`), `tp_roll` (Take → **Toilet paper**, hides the cistern-lid sprite).
- **Stall 3 door** → interior (real art): `toilet_tank` (Notice reflects `knows_about_tank`; Use → **Cigarettes**).

### Cigarettes (item, examined in inventory)
> Half a pack left. No lighter in sight. Are you supposed to chew these?

*(after `has_lighter`):*
> You've got fire now. Ironically, you no longer have time for a leisurely smoke.

### Vent grille next to the stalls (reachable from `on_urinal`)

**Notice (before `on_urinal`):**
> A vent grille, high on the wall — well out of reach from the floor.

**Notice (after `on_urinal`, before `vent_open`, 1st time):**
> Up close, the grille flutters slightly with the HVAC draft behind it. The last screw is loose, not tight. Muffled sound comes through the gap — you can't make it out. Might help if the grille were open.

**Notice (after `on_urinal`, before `vent_open`, repeated):**
> Still that muffled sound through the gap. Still can't make anything out.

**Fiddle (before `vent_open`, without coin):**
> You try to loosen the screw with your fingernails. Your nails weren't built for home improvement. Not happening.

**Use with Coin, without `on_urinal`:**
> You reach up. You can't get to it. Unless you put something under your feet.

**Use with Coin (requires `on_urinal` and `has_coin`):**
> From your elevated position, you loosen the last screw with the edge of the coin. The grille pops open.
→ Sets flag `vent_open = true`
→ *(no longer grants the lighter directly — see the vent close-up subzone below)*

**Notice (after `vent_open`, 1st time):**
> Behind the grille: an air duct carrying sound from the hallway. Two voices, muffled. *"...and that's why those doors always stay locked, except during an actual emergency — fire alarm, that kind of thing. Security protocol, since the audit."* A second voice mutters something about overtime. You mostly remember the first part.
→ Sets flag `knows_fire_opens_door = true`

**Notice (after `vent_open`, repeated):**
> Still those two voices in the background — now about the coffee machine on floor 40, broken again. Not relevant. Familiar, though.

**Fiddle (after `vent_open`):**
> Nothing left to fiddle with. It's already open.

**Vent close-up subzone — built, real art:** the close-up subzone (`openZoomSubzone("vent")`, `data-subzone="vent"`) opens automatically the moment you climb onto the broken urinal (see above), not on a separate Notice — same mutual-exclusion/back-button mechanism as the stall interiors.

Real art, but a *third* integration pattern (distinct from both the stall sprite-overlay and the cabinet placeholder-item): the closed-grille and open-grille photos are two full separate background plates (`VENT_BG.closed` / `VENT_BG.open`, swapped wholesale via `updateVentBackground()`), the same technique as the exit door's `DOOR_BG_CLOSED`/`DOOR_BG_OPEN` — **not** a sprite composited over one shared base. Reason: the two AI-generated photos, despite being prompted for the same camera angle, came back with visibly different framing/zoom (measured: the closed plate's grille frame spans 15%–84.5% × 29%–58.5% of the canvas, the open plate's spans 14%–86% × 26%–68% — a real, not rounding-error, mismatch), so a transparent overlay sprite would visibly jump between states. A full background swap sidesteps the alignment problem entirely.

Two invisible grille hitboxes live inside the subzone, both `data-id="vent"` (same `HOTSPOTS.vent` logic as the main-scene hitbox, reachable there too before zooming in): `#vent-grille-closed-hitbox` positioned to match the closed plate's frame, `#vent-grille-open-hitbox` positioned to match the open plate's frame. `updateVentGrilleVisibility()` toggles which one is inline-`display:block` based on `vent_open`, called alongside every place the background swap happens. Using the coin on the grille (`vent_open` still false) pops it open — and immediately calls `updateVentBackground()` + `updateVentGrilleVisibility()` + `refreshZoomLabel()` + `updateDuctLighterVisibility()`, so the whole subzone updates live without a back-out/re-enter round trip.

Once `vent_open` is true, the **`duct_lighter`** hitbox + `#lighter-sprite` `<img>` (a real cropped lighter photo, positioned on the visible duct floor) appear together — Notice describes it, **Take** is the actual moment the player picks up the **Lighter** (deliberately split from popping the grille open with the coin, so "the screw comes loose" and "there's a lighter in there" are two separate beats rather than one). Both disappear together once taken, via `updateDuctLighterVisibility()` — same inline-style-toggle discipline as the stall 2 toilet-paper sprite (called on both open *and* close, so nothing bleeds into a different context).

The persistent placeholder caption (`#zoom-placeholder-label`, "VENT GRILLE — CLOSE-UP" / "OPEN VENT — AIR DUCT") is now hidden for the vent — real art speaks for itself — but stays in use for the still-placeholder cabinet. `refreshZoomLabel()` branches on `activeZoom` to decide whether to show it.

### Working urinals (4 of 5)
**Notice:**
> Lined up neatly, except for one. You don't admire the symmetry.

**Use (climb on it):**
> You climb onto the rim. A sensor picks up your weight — the flush goes off, straight against your shin. You jump down, soaked from the knee down.

*Comic beat, repeatable, no progress. Nudges the player toward the broken urinal.*

### Broken urinal (1 of 5)
**Notice:**
> An "out of order" sign. Underneath, in marker: "as always." You suspect you're not the first person to try reaching something via this urinal — and probably not the last.

**Use (climb on it):**
> Detached from its wall mount, it wobbles unsettlingly. But no sensor, no flush. Stable enough — precisely because it's already broken.
→ Sets flag `on_urinal = true` and immediately opens the vent close-up subzone (`openZoomSubzone("vent")`) — stepping onto the urinal puts you eye-level with the grille, so the zoom-in happens right there rather than requiring a separate Notice on the vent afterward.

**`on_urinal` reset:** unlike `vent_open`/`has_lighter`/the conversation-overheard flags, `on_urinal` is a "current pose" flag, not permanent progress — it's reset to `false` inside `closeZoomSubzone()` whenever the vent zoom is closed (specifically only when `activeZoom === "vent"`). Without this, leaving the vent view and standing on the urinal again would always hit the dead-end "you're already up there" line instead of letting the player re-climb; the wide shot visually shows the player back on the ground after backing out, so the state needs to match.

**Step-up animation:** climbing on also plays a short `.step-up` CSS animation on `#scene-frame` (`playStepUpAnimation()`, 0.6s) — the view drops in from above and settles with a light wobble/rotate, selling the "you just climbed up to this vantage point" beat rather than cutting straight to the vent close-up. Tuned to be noticeably more dramatic than the first pass (bigger initial drop/scale/rotation in the `stepUpOntoUrinal` keyframes), per feedback that the original was too subtle. Plays on every climb (including re-climbing after backing out — see the `on_urinal` reset note above), not just the first.

### Sink
**Notice (before `has_lipstick`):**
> A tube of lipstick sits on the counter. In the men's room. You raise an eyebrow, decide not to think about it too hard.

**Take (lipstick):**
> You pick it up.
→ **Item: Lipstick** *(function not yet decided — hold for a later zone)*

### Mirror
**Notice:**
> A programmer who's stared at YAML for too long. The fluorescent tube flickers in time with your heartbeat.

### First-aid cabinet
**Notice — built, real art:** opens a cabinet close-up subzone (`openZoomSubzone("cabinet")`, `data-subzone="cabinet"`) directly, same mechanism as the vent. (Moved from Use to Notice — noticing the cabinet is what makes you actually look inside it; Use no longer has a handler here and falls through to the generic fallback text if tried on the outer hitbox.) Response text:
> Bandages, a wrap, and a bottle of hand sanitizer — 70%, flammable enough to give HR a heart attack.

*(First look, before the sanitizer is taken. After it's gone: "Just bandages left now.")*

Real art, single shared background (`CABINET_BG`) with the lower shelf already drawn empty — same sprite-overlay pattern as the stall 2 toilet-paper roll (not the vent's two-plate background-swap, since here the "full" and "empty" states are one photo plus a sprite, not two separately-generated photos). Inside the subzone: a **`bandages`** hitbox over the top-shelf items (Notice-only flavor — "Standard-issue bandages and a wrap. Not what you need tonight.") and the **`cabinet_sanitizer`** hitbox + `#sanitizer-sprite` `<img>` (a real cropped bottle photo, standing on the lower shelf). **Take** on the sanitizer is what actually grants the **Hand sanitizer** item and hides the sprite + hitbox together via `updateCabinetSanitizerVisibility()`.

### Paper towel dispenser
*(Originally scripted as a "hand dryer" — the actual art shows a wall-mounted paper towel dispenser with an "OUT OF PAPER" sign, which is the better, more literal version of the same joke.)*

**Notice:**
> "OUT OF PAPER," the sign says. Somehow still worth checking.

**Use:**
> No paper towels. Of course not.

*Comic beat. Closes off an alternative fuel source.*

### Trash can
**Notice:**
> A trash can, partly filled with the remnants of other people's evenings.

**Take (search it):**
> Crumpled paper. Office archaeology. You unfold it: a fragment of a sprint planning printout, part of a string of characters half visible.
→ **Clue item: Sprint planning fragment** *(not fuel — hold for a password puzzle in a later zone)*

### Sprinklers (×3, ceiling)
Added once the background art was updated to include them. Purely a Notice gag plus a guardrail against the obvious player move of trying to trigger them directly.

**Notice:**
> Sprinklers, alright. Good to know you're safe from fire hazards.

**Take:**
> Bolted to the ceiling. You're not exactly equipped for that.

**Fiddle:**
> You wave at it. It does not wave back. It's a sprinkler.

**Use (any item):**
> Too high to reach from here.

**Use (lighter specifically):**
> You can't light a sprinkler head. That's not how any of this works — you'd need actual smoke or heat.

---

## Core puzzle: starting a fire

**Requirements:** `has_toilet_paper`, `has_hand_sanitizer`, `has_lighter`

**Use: Hand sanitizer on toilet paper**
> You squeeze the bottle empty over the roll. The smell hits the back of your throat immediately.
→ Sets flag `paper_soaked = true`

**Use: Lighter on soaked paper**
> Whoosh. Bigger than expected. You flinch back.
→ Sets flag `fire_started = true`
→ Screen shake plays (~0.6s)
→ Sets flag `emergency_door_open = true`
→ Sprinkler/transition text prints (see below)

**Failure: Using lighter without soaked paper**
> You light a wad of dry toilet paper. It smolders a bit and goes out. Not dramatic enough for a sprinkler.

**Failure: Igniting hand sanitizer directly (no paper)**
> A short, impressive whoomp. Your eyebrows barely survive. Fun, but there's no flammable material to actually trip the alarm.

**After `emergency_door_open` — transition text:**
> Sprinklers overhead. You're standing soaked next to a smoldering trash can, with a fire alarm blaring through the whole building. Somehow, this is the least absurd thing happening tonight.
>
> Somewhere behind you, the door clicks — unlocked.

*(No more standalone "Continue" button. Progressing to Zone 2 now requires turning around and using the door — see Exit door subzone above.)*

---

## Item overview (carried into the next zone)
- Coin (used, can stay in inventory or vanish — decide at implementation)
- Lighter (used, may become relevant again later)
- Cigarettes (unused — possibly a red herring, or relevant later)
- Sprint planning fragment (clue, password piece)
- Lipstick (function TBD)
- Toilet paper / hand sanitizer (consumed in the puzzle)

## State flags (for implementation)
```
knows_about_tank: bool
has_cigarettes: bool
has_coin: bool
on_urinal: bool
vent_open: bool
has_lighter: bool
knows_fire_opens_door: bool
has_toilet_paper: bool
has_hand_sanitizer: bool
paper_soaked: bool
fire_started: bool
emergency_door_open: bool
has_lipstick: bool
has_sprint_planning_fragment: bool
door_noticed_once: bool
zone2_started: bool
stall1_unlocked: bool
```

---

## Open TODOs
- ~~**Charmin watch photos**~~ **— done:** all 3 of 3 integrated — "a sad desk sandwich" (`watch_photo1.webp`), "neighbor's dog, floor mascot" (`watch_photo2.webp`), and "your desk (insurance claim), badge on the chair in the background" (`watch_photo3.webp`), all matching the game's cel-shaded illustration look with a soft feathered circular alpha edge. The badge photo (photo 3) is the plant that pays off later — the player has now seen exactly where the badge ends up before the character does.
- **Photo art style:** the background art is a cel-shaded anime/graphic-novel illustration style — flat blocky color areas with soft airbrushed shading, crisp dark outlines, a subtle grain/paper texture, and a muted desaturated palette (cool teals/grays, warm muted browns), lit like flat office fluorescents. No photographic camera artifacts (no lens blur, bokeh, film grain). Watch photos need to match this, not be photorealistic — restyle in ChatGPT/Nano Banana before handing a photo over if it comes back looking like a real photograph.
- **Transparency gotcha:** at least one photo generation (the dog) came back as a fully opaque RGB image with a fake checkerboard/white-fade baked into the pixels instead of real alpha — looks like transparency in a chat preview but isn't. Always verify with a real alpha check (`img.mode`/`getchannel("A")`, not just eyeballing it) before trusting a "transparent" AI-generated image; if it's baked-in, apply a radial alpha mask locally (opaque to ~90% of the radius, feathered to 0 by the edge) rather than re-prompting.
- **Asset size budget:** the built `zone1.html` (all art inlined as base64) is right up against the 30MB ceiling for sending it as a single file. `build.py`'s `data_uri()` now picks the MIME type from the file extension, so any asset can be saved as WebP instead of PNG when it needs the extra headroom (photos/sprites compress well this way; already-shipped full-frame backgrounds still safe as PNG for now but are the next lever to pull if we run out of room again).
- ~~**File-size reduction plan**~~ **— done (2026-09-28):** every full-frame background plate and sprite (`bg_main`/`bg_main_wet`, all 3 stalls, both door plates, both vent plates, `bg_cabinet`, `bg_watch`, `sprite_tp_roll`/`sprite_lighter`/`sprite_sanitizer`) was re-encoded from lossless PNG to ~q90 WebP. Build went from ~31.4MB to ~3MB. Verified with pixel-diff (mean channel diff ~1.3–1.7/255, well under visible threshold) and a full visual sweep (main scene, all 3 stalls, door, watch text + photo widgets) plus the Playwright regression — no visible banding or artifacts anywhere. **Fully reversible:** the original PNGs are untouched in `assets/` and additionally backed up in `assets/_originals_backup/`; `build.py`'s `IMAGES` map is the only thing that changed (each entry points at the `.webp` now), so reverting any single asset is a one-line filename change back to `.png`.
- **Soundtrack:** revisit the game's music/audio pass in general — worth a fresh listen end-to-end, not just the two `ChiptuneSFX` effects.
- **Pickup/fail sound finetuning:** `playPickup()` (ascending arpeggio, fires from `addItem()`) needs another finetuning pass. There's currently no dedicated "failed action" sound at all — invalid Use/Take/Fiddle attempts are silent — worth adding one and tuning it alongside pickup rather than in isolation.
- **`zone1-texts.csv` re-import:** the CSV is a point-in-time copywriting export, not read by the game — texts.js is the live source now. If/when an edited CSV comes back from a copywriting pass, it needs to be manually reconciled into `texts.js` (the CSV predates several changes already — the stall lock mechanic, stall 2/3 real art, the vent/cabinet split — so treat it as a starting point, not a diff to apply blindly).
- **Lipstick:** function still undecided — currently just a pickup with flavor text, "Chekhov's gun" per its own description. Hold for a later zone.
- **Lipstick sprite:** needs actual art (currently no sprite at all — it's inventory-only, same as every other carried item right now, see inventory sprites TODO below).
- **Inventory sprite icons:** `renderInventory()` in `game.js` currently renders each held item as a plain text chip (`chip.textContent = ITEMS[id].name`, `.item-chip` class in `styles.css`) — no artwork at all in the inventory row. Want real sprite thumbnails per item (coin, lighter, toilet paper, cigarettes, lipstick, hand sanitizer, jacket) instead of/alongside the text label. Needs a small cropped icon-style image per item, plus a `background-image`/`<img>` treatment on `.item-chip`.
- **Cigarettes:** still unclear whether they're a pure red herring or become relevant later.
- **Coin:** undecided whether it stays in inventory after use on the vent screw or should vanish.
- **Zone 2 (elevator lobby) and Zone 3 (coffee area):** entirely unbuilt — only a placeholder string fires when the door is used after the fire sequence.
- **Outro animation:** need a closing animation for the end of the game (mirrors the fire-sequence shake/flash/rain treatment and `intro.html`'s opening — not yet scoped: what triggers it, what it shows, how long it plays).
