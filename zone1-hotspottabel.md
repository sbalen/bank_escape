# Zone 1 — Hotspot & Object Table

Structure: per hotspot/object, the four verbs (Notice, Take, Fiddle, Use). Where no specific text has been set, the cell refers to the generic fallback below — no need to repeat it per hotspot. Cells marked **[PLACEHOLDER]** were just invented now to make the table complete and deserve a second look.

## Generic fallbacks (base case, reusable everywhere)

| Verb | Fallback text |
|---|---|
| Notice | *"Nothing special. Standard office decor from a life you'll hopefully still have in an hour."* |
| Take | *"That's stuck, or it's just supposed to stay there. Probably both."* |
| Fiddle | *"You fiddle with it a bit. It fiddles back, in the sense that absolutely nothing happens."* |
| Use (no item) | *"You use it as intended. Riveting stuff."* |
| Use (with item, no match) | *"That doesn't go together. Even in an office full of bad decisions, this is one too many."* |

---

## Hotspots in the room

| Object | Condition | Notice | Take | Fiddle | Use | Effect |
|---|---|---|---|---|---|---|
| Stall 1 — wall text | — | "Never push to production without someone reviewing your screen" — scratched in marker, 3-a.m. handwriting | fallback | fallback | fallback | none |
| Stall 2 — wall text (Mark) | — | "Mark, we all know you sneak cigarettes in here." Arrow pointing at stall 3. | fallback | fallback | fallback | `knows_about_tank = true` |
| Stall 3 — toilet tank | before `knows_about_tank` | A toilet tank. As toilet tanks go. | fallback | **[PLACEHOLDER]** *"You poke at the lid. It stays a lid."* | fallback | none |
| Stall 3 — toilet tank | after `knows_about_tank`, before opened | If Mark hides something here, this is the place. | fallback | same as above | Lid off → plastic bag with cigarettes | **item: Cigarettes** |
| Jacket (stall 1) | — | A jacket, left behind. Bad luck for the owner, good luck for you. | Inner pocket: a coin. → **item: Coin** | **[PLACEHOLDER]** *"You check the other pockets. Just lint."* | fallback | none (after Take) |
| Sink / mirror | — | A programmer who's stared at YAML for too long. Fluorescent tube flickers in time with your heartbeat. | fallback (mirror's fixed) | **[PLACEHOLDER]** *"You pick at the edge of the mirror frame. Still just a mirror."* | fallback | none |
| Lipstick (on the counter) | before taken | A tube of lipstick. In the men's room. You raise an eyebrow, decide not to think about it too hard. | You pick it up. → **item: Lipstick** | fallback | fallback | none |
| Toilet paper holder | before `has_toilet_paper` | **[PLACEHOLDER]** *"One roll. Still intact — not for long."* | You pull off the roll. For emergencies — and this is starting to qualify as one. → **item: Toilet paper** | fallback | fallback | none |
| First-aid cabinet | before `has_hand_sanitizer` | **[PLACEHOLDER]** *"Red cross on a white box. Classic."* | fallback | fallback | Bandages, a wrap, bottle of hand sanitizer — 70%, flammable enough to give HR a heart attack. → **item: Hand sanitizer** | none |
| Hand dryer | — | **[PLACEHOLDER]** *"Standard white box on the wall. You don't expect much, correctly."* | fallback | fallback | No paper towels. Of course not. | closes off alt. fuel route |
| Trash can | before searched | **[PLACEHOLDER]** *"A trash can, partly filled with the remnants of other people's evenings."* | Crumpled paper. Office archaeology. Fragment of a sprint planning printout, part of a string half visible. → **item: Sprint planning fragment** | fallback | fallback | none |
| Working urinal (4 of 5) | — | **[PLACEHOLDER]** *"Lined up neatly, except for one. You don't admire the symmetry."* | fallback | fallback | You climb onto the rim. Sensor picks up your weight — flush goes off against your shin. Soaked from the knee down. | comic beat, repeatable, no progress |
| Broken urinal | before `on_urinal` | "Out of order" sign. Marker underneath: "as always" — you're clearly not the first. | fallback | fallback | Detached from its wall mount, wobbles unsettlingly. No sensor, no flush. Stable enough — precisely because it's already broken. | `on_urinal = true` |
| Vent grille | before `on_urinal` | Vent grille, high on the wall — out of reach from the floor. | fallback | fallback | (coin) You reach up. Can't get to it. | none |
| Vent grille | after `on_urinal`, before `vent_open`, 1st time | Up close it flutters with the HVAC draft. Last screw is loose. Muffled sound through the gap — can't make it out. Might help if it were open. | fallback | Nails weren't built for home improvement. Not happening. | (coin) Screw loosens with the edge of the coin. Grille pops open. | `vent_open = true` → **item: Lighter** |
| Vent grille | after `on_urinal`, before `vent_open`, repeated | Still that muffled sound. Still can't make anything out. | fallback | same as above | same as above | — |
| Vent grille | after `vent_open`, 1st time | Behind the grille: an air duct. Voices: *"...and that's why those doors always stay locked, except during an actual emergency — fire alarm. Security protocol, since the audit."* Second voice mutters about overtime. | fallback | Nothing left to fiddle with, it's already open. | fallback | `knows_fire_opens_door = true` |
| Vent grille | after `vent_open`, repeated | Still those two voices — now about the coffee machine on floor 40, broken again. | fallback | same | fallback | — |
| Emergency door | before `emergency_door_open` | **[PLACEHOLDER]** *"Locked. From the inside. Exactly like a door that only opens for an emergency."* | — | **[PLACEHOLDER]** *"You pick at the edge of the lock. It's an electronic lock. Fiddling doesn't work on electronics, not even in movies."* | **[PLACEHOLDER]** *"Locked. As far as you know, there's no emergency."* | none |
| Emergency door | after `emergency_door_open` | **[PLACEHOLDER]** *"Open now — thanks to you, indirectly."* | — | fallback | You push it open. Into the elevator lobby. | go to zone 2 |

---

## Items (inventory — examined via Notice, combined via Use)

| Item | Notice (1st time) | Notice (later / state-dependent) | Combination |
|---|---|---|---|
| Coin | **[PLACEHOLDER]** *"A coin. Twenty cents, maybe fifty. Enough for a screw, not enough for a solution."* | — | Use on vent grille (see above) |
| Cigarettes | Half a pack left. No lighter in sight. Are you supposed to chew these? | After `has_lighter`: You've got fire now. Ironically, no time left for a leisurely smoke. | no known combination — possibly a red herring |
| Lighter | **[PLACEHOLDER]** *"Standard disposable lighter. Half full, or half empty, depending on your night."* | — | Use on soaked toilet paper → fire starts |
| Toilet paper | **[PLACEHOLDER]** *"One roll, off its holder. Feels less heroic than it sounds."* | After combining with sanitizer: becomes "Soaked toilet paper" | Use with Hand sanitizer → **Soaked toilet paper**, `paper_soaked = true` |
| Hand sanitizer | **[PLACEHOLDER]** *"70%. Enough to disinfect, enough to ignite."* | disappears after combining | Use with Toilet paper → see above (bottle fully used up) |
| Soaked toilet paper | **[PLACEHOLDER]** *"Smells strong. Ready to ignite something that shouldn't be ignited."* | — | Use with Lighter → fire cutscene, `fire_started = true`, `emergency_door_open = true` |
| Sprint planning fragment | **[PLACEHOLDER]** *"A torn scrap of paper with part of a password or code. The rest is elsewhere."* | — | held for a later zone (password puzzle) |
| Lipstick | **[PLACEHOLDER]** *"A tube of lipstick. Function unknown. Feels like Chekhov's gun."* | — | function not yet decided |

---

## Open design questions (not resolved by this table, just surfaced)
- Cigarettes: stays a red herring, or does it get a combination eventually?
- Lipstick: function still completely open
- Sprint planning fragment: password puzzle lives in a later zone, so only the find happens here
- Combination order symmetry (toilet paper on sanitizer = sanitizer on toilet paper) — set as a rule in `zone1-wc.md`, applied consistently here
