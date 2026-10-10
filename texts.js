// ---------------------------------------------------------------------
// GAME TEXT (all player-facing copy, keyed by dotted id)
//
// Mirrors the id scheme of zone1-texts.csv (the copywriting export) so the
// two stay easy to cross-reference. game.js looks strings up by id via
// TEXTS["some.id"] rather than embedding literal copy inline — logic
// (conditionals, state changes) stays in game.js, only the words live here.
// ---------------------------------------------------------------------
var TEXTS = {

  // --- top-level / UI ---------------------------------------------------
  "output.intro": "You're stuck in the men's restroom on floor 42. 23:51. The door is locked — from the inside. There's no emergency. Yet.",
  "output.zone2_placeholder": "= Zone 2 (elevator lobby) starts here — not built yet. =",
  "ui.using_item_prompt": "Using the {item} on... (pick a target)",
  "ui.never_mind": "Never mind.",
  "ui.door_button.turn_around": "🚪 Turn around",
  "ui.door_button.turn_back": "↩ Turn back",

  // --- fallbacks ----------------------------------------------------------
  "fallback.notice": "Nothing special. Standard office decor from a life you'll hopefully still have in an hour.",
  "fallback.take": "That's stuck, or it's just supposed to stay there. Probably both.",
  "fallback.fiddle": "You fiddle with it a bit. It fiddles back, in the sense that absolutely nothing happens.",
  "fallback.use_bare": "You use it as intended. Riveting stuff.",
  "fallback.use_item": "That doesn't go together. Even in an office full of bad decisions, this is one too many.",

  // --- items ----------------------------------------------------------
  "item.coin.notice": "A coin. Twenty cents, maybe fifty. Enough for a screw, not enough for a solution.",
  "item.cigarettes.notice.no_lighter": "Half a pack left. No lighter in sight. Are you supposed to chew these?",
  "item.cigarettes.notice.has_lighter": "You've got fire now. Ironically, no time left for a leisurely smoke.",
  "item.lighter.notice": "Standard disposable lighter. Half full, or half empty, depending on your night.",
  "item.toilet_paper.notice": "One roll, off its holder. Feels less heroic than it sounds.",
  "item.hand_sanitizer.notice": "70%. Enough to disinfect, enough to ignite.",
  "item.soaked_paper.notice": "Smells strong. Ready to ignite something that shouldn't be ignited.",
  "item.sprint_fragment.notice": "A torn scrap of paper with part of a password or code. The rest is elsewhere.",
  "item.lipstick.notice": "A tube of lipstick. Function unknown. Feels like Chekhov's gun.",

  // --- hotspot: stall doors ----------------------------------------------
  "hotspot.stall1.notice.locked": "Locked. The latch's jammed, not keyed — these things always are. Feels like it just needs a jiggle.",
  "hotspot.stall1.notice.unlocked": "You step inside. A jacket hangs from the hook.",
  "hotspot.stall1.take": "You already have a door at home.",
  "hotspot.stall1.fiddle.locked": "You jiggle the latch. It clicks free.",
  "hotspot.stall1.fiddle.unlocked": "No use fiddling here, the door's unlocked.",
  "hotspot.stall1.use": "You just went.",

  "hotspot.stall2.notice": "You step inside. Someone's covered every inch of this door in commentary.",
  "hotspot.stall2.take": "You already have a door at home.",
  "hotspot.stall2.fiddle": "No use fiddling here, the door's unlocked.",
  "hotspot.stall2.use": "You just went.",

  "hotspot.stall3.notice": "You step inside, past the door left ajar — a \"Back soon! :)\" sign taped to the outside, whoever that's for.",
  "hotspot.stall3.take": "You already have a door at home.",
  "hotspot.stall3.fiddle": "No use fiddling here, the door's unlocked.",
  "hotspot.stall3.use": "You just went.",

  // --- hotspot: stall interiors -------------------------------------------
  "hotspot.jacket.notice": "A jacket, left behind. Bad luck for the owner, good luck for you.",
  "hotspot.jacket.take.first": "Inner pocket: a coin.",
  "hotspot.jacket.fiddle": "You check the other pockets. Just lint.",

  "hotspot.wall_text_1.notice": "\"Never push to production without someone reviewing your screen\" is scrawled on the inside of the door.",

  "hotspot.wall_text_2.notice": "\"Mark, we all know you sneak cigarettes in here.\" Underneath, in a different hand: an arrow pointing at stall 3.",

  "hotspot.tp_roll.notice": "A fresh roll, perched on the cistern lid. The holder on the door has clearly given up.",
  "hotspot.tp_roll.take.first": "You grab the roll off the lid. For emergencies — and this is starting to qualify as one.",

  "hotspot.toilet_tank.notice.knows": "If Mark hides something here, this is the place.",
  "hotspot.toilet_tank.notice.default": "A toilet tank. As toilet tanks go.",
  "hotspot.toilet_tank.use.opened": "Empty now, save for the faint smell of stale cigarettes.",
  "hotspot.toilet_tank.use.first": "Lid off. A knotted plastic bag, kept dry above the waterline. Cigarettes.",

  // --- hotspot: urinals -------------------------------------------------
  "hotspot.urinal_ok.notice": "Lined up neatly, except for one. You don't admire the symmetry.",
  "hotspot.urinal_ok.use": "You climb onto the rim. A sensor picks up your weight — the flush goes off, straight against your shin. You jump down, soaked from the knee down.",
  "hotspot.urinal_broken.notice": "An \"out of order\" sign. Underneath, in marker: \"as always.\" You suspect you're not the first person to try reaching something via this urinal — and probably not the last.",
  "hotspot.urinal_broken.use.already": "You're already up here.",
  "hotspot.urinal_broken.use.first": "Detached from its wall mount, it wobbles unsettlingly. But no sensor, no flush. Stable enough — precisely because it's already broken.",

  // --- hotspot: vent ------------------------------------------------------
  "hotspot.vent.notice.not_on_urinal": "A vent grille, high on the wall — well out of reach from the floor.",
  "hotspot.vent.notice.closed.first": "Up close, the grille flutters slightly with the HVAC draft behind it. The last screw is loose, not tight. Muffled sound comes through the gap — you can't make it out. Might help if the grille were open.",
  "hotspot.vent.notice.closed.repeat": "Still that muffled sound through the gap. Still can't make anything out.",
  "hotspot.vent.notice.open.first": "Behind the grille: an air duct carrying sound from the hallway. Two voices, muffled. \"...and that's why those doors always stay locked, except during an actual emergency — fire alarm, that kind of thing. Security protocol, since the audit.\" A second voice mutters something about overtime. You mostly remember the first part.",
  "hotspot.vent.notice.open.repeat": "Still those two voices in the background — now about the coffee machine on floor 40, broken again. Not relevant. Familiar, though.",
  "hotspot.vent.fiddle.closed": "You try to loosen the screw with your fingernails. Your nails weren't built for home improvement. Not happening.",
  "hotspot.vent.fiddle.open": "Nothing left to fiddle with. It's already open.",
  "hotspot.vent.use.not_on_urinal": "You reach up. You can't get to it. Unless you put something under your feet.",
  "hotspot.vent.use.already_open": "Already open. No more screws left to turn.",
  "hotspot.vent.use.first": "From your elevated position, you loosen the last screw with the edge of the coin. The grille pops open.",

  "hotspot.duct_lighter.notice.default": "Something glints back there — a lighter, wedged just out of easy reach.",
  "hotspot.duct_lighter.notice.taken": "Just an empty duct now.",
  "hotspot.duct_lighter.take.first": "You fish it out. A lighter — sticky, but it should still spark.",

  // --- hotspot: misc restroom objects ------------------------------------
  "hotspot.firstaid.notice.empty": "Just bandages left now.",
  "hotspot.firstaid.notice.first": "Bandages, a wrap, and a bottle of hand sanitizer — 70%, flammable enough to give HR a heart attack.",

  "hotspot.bandages.notice": "Standard-issue bandages and a wrap. Not what you need tonight.",
  "hotspot.cabinet_sanitizer.notice.default": "A half-used bottle of hand sanitizer. 70%. Enough to disinfect, enough to ignite.",
  "hotspot.cabinet_sanitizer.notice.taken": "Empty spot where the bottle was.",
  "hotspot.cabinet_sanitizer.take.first": "You grab the bottle.",

  "hotspot.mirror.notice": "A programmer who's stared at YAML for too long. The fluorescent tube flickers in time with your heartbeat.",

  "hotspot.sink.notice.has_lipstick": "A tube of lipstick sits on the counter. In the men's room. You raise an eyebrow, decide not to think about it too hard.",
  "hotspot.sink.notice.default": "Just a sink now. Someone really needs to fix that mirror.",
  "hotspot.sink.take.first": "You pick it up.",

  "hotspot.papertowel.notice": "\"OUT OF PAPER,\" the sign says. Somehow still worth checking.",
  "hotspot.papertowel.use": "No paper towels. Of course not.",

  "hotspot.trashcan.notice": "A trash can, partly filled with the remnants of other people's evenings.",
  "hotspot.trashcan.take.first": "Crumpled paper. Office archaeology. You unfold it: a fragment of a sprint planning printout, part of a string of characters half visible.",

  "hotspot.sprinkler.notice": "Sprinklers, alright. Good to know you're safe from fire hazards.",
  "hotspot.sprinkler.take": "Bolted to the ceiling. You're not exactly equipped for that.",
  "hotspot.sprinkler.fiddle": "You wave at it. It does not wave back. It's a sprinkler.",
  "hotspot.sprinkler.use.lighter": "You can't light a sprinkler head. That's not how any of this works — you'd need actual smoke or heat.",
  "hotspot.sprinkler.use.default": "Too high to reach from here.",

  // --- hotspot: exit door + keypad -----------------------------------------
  "hotspot.door.notice.locked_first": "Locked. From the inside. There's no emergency. Yet.",
  "hotspot.door.notice.locked_repeat": "Locked. As far as you know, there's no emergency.",
  "hotspot.door.notice.open": "Open now — thanks to you, indirectly.",
  "hotspot.door.fiddle.locked": "You pick at the edge of the lock. It's an electronic lock. Fiddling doesn't work on electronics, not even in movies.",
  "hotspot.door.fiddle.open": "It's open. Fiddling with an open door mostly just closes it, which seems like a bad idea right now.",
  "hotspot.door.use.locked": "You push the bar. Nothing. Locked tight — for now.",
  "hotspot.door.use.already_zone2": "You're already halfway out the door mentally. Physically, still here.",
  "hotspot.door.use.first": "You push through into the hallway.",

  "hotspot.keypad.notice.locked": "An electronic card reader. Small red LED — locked. It wants a badge, and yours is sitting on your desk chair forty floors up.",
  "hotspot.keypad.notice.open": "Same reader. Green LED now. Whatever tripped the fire override, it's happy to let you through.",
  "hotspot.keypad.fiddle.locked": "You tap the edge of the reader. It gives a soft, unbothered beep. Still red. It really does want a badge, not sympathy.",
  "hotspot.keypad.fiddle.open": "Beep. Still green. It already did its job — leave it be.",

  // --- item combinations ---------------------------------------------------
  "combine.paper_sanitizer": "You squeeze the bottle empty over the roll. The smell hits the back of your throat immediately.",
  "combine.soaked_lighter": "Whoosh. Bigger than expected. You flinch back.",
  "combine.lighter_dry_paper": "You light a wad of dry toilet paper. It smolders a bit and goes out. Not dramatic enough for a sprinkler.",
  "combine.sanitizer_lighter": "A short, impressive whoomp. Your eyebrows barely survive. Fun, but there's no flammable material to actually trip the alarm.",

  "output.fire_sequence": "Sprinklers overhead. You're standing soaked next to a smoldering trash can, with a fire alarm blaring through the whole building. Somehow, this is the least absurd thing happening tonight.\n\nSomewhere behind you, the door clicks — unlocked.",

  // --- Charmin watch widgets -----------------------------------------------
  "watch.heart_rate.title": "Heart Rate",
  "watch.heart_rate.console": "Meditation? You consider dropping the watch in the toilet instead.",
  "watch.heart_rate.text": "Current: 192 bpm.\nAverage: 58.\nMaybe try some meditation.",
  "watch.sleep.title": "Sleep Score",
  "watch.sleep.text": "5h12m. Score: 41/100 — \"Poor.\"\n\"Try going to bed earlier tonight.\"\nIt's 23:51.",
  "watch.notifications.title": "Notification Centre",
  "watch.notifications.text": "— Bol.com: wrong number (again)\n— Mom: \"Eating enough?? 🥺\"\n— Unknown: \"Confirm delivery\" link\n— Coworker: \"Don't forget your badge\"",
  "watch.photo1.caption": "A sad desk sandwich",
  "watch.photo2.caption": "Neighbor's dog, \"floor mascot\"",
  "watch.photo3.caption": "Your desk (insurance claim). Background: your badge, on the chair."
};
