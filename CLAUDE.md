# CLAUDE.md — Bank Escape Room

Browser-based point-and-click escape room (Monkey Island / Larry style). Zone 1 of 3 (men's restroom of a bank office) is ~90% done and playable. Repo: github.com/sbalen/bank_escape.

## Working with the user (Stijn)
- Conversation in **Dutch**; all **in-game text is English**. Stijn is creative director/writer: he gives exact copy and design decisions, you implement, verify and report honestly.
- He explicitly wants to be **challenged** (push back, say when something won't work or clashes), not validated.
- Verify visually and numerically before saying something is done (screenshots, pixel checks). Report what you could not achieve instead of silently under-delivering.
- Fine pixel nudges: **1 "tikje" = 8px**.
- Detailed design, hotspot/puzzle reference, state flags and the **open TODO list** live in `zone1-wc.md` — read it first. `zone1-texts.csv` / `zone1-hotspottabel.md` are supporting tables.
- `project.md` is **outdated** (talks about 320x180 pixel-art canvas). Ignore its tech and art sections; this file and `zone1-wc.md` are the truth.

## Architecture
- Output is ONE self-contained, dependency-free `zone1.html` (all images base64-inlined), openable via file://.
- **Never edit `zone1.html` by hand.** Edit the sources and run `python3 build.py` (`--check` = dry run to a temp file):
  - `template.html` (skeleton), `styles.css`, `sfx.js` (procedural Web Audio, no audio files), `texts.js` (all player copy as `TEXTS[id]`), `game.js` (logic).
  - Image tokens like `{{BG_MAIN}}`, `{{ICON_COIN}}` are replaced by `build.py`'s `IMAGES` dict from `assets/`. A new image = file in `assets/` + entry in `IMAGES` + token in css/js.
- UI is a DOM layer over a background image; hotspots are absolutely positioned `.hitbox` divs in **percentages of the 1672x940 background**, calibrated per plate. The "show hitboxes" checkbox in the game shows them.
- Interaction: four verbs (Notice, Take, Fiddle, Use) via `HOTSPOTS[id]`; items in `ITEMS`; combos in `combineItems()`; state flags in `state`.
- Subzones (watch, door, stalls, vent, cabinet) swap the background and toggle `[data-subzone]` hitboxes via body classes.
- `game.js` is one IIFE. To test internals, append `window.__t={addItem:addItem};` before the closing `})();` in a **temporary copy** of the build (not in the repo).

## Art
- Style: **cel-shaded anime/graphic-novel illustration** — flat color blocks, soft airbrush shading, crisp dark outlines, grain, muted desaturated palette (cool teals/grays, warm muted browns), flat fluorescent lighting. NOT photoreal, no glow/vignette, no lens effects.
- Art is generated externally (ChatGPT); the user supplies PNGs. **Always verify real alpha**: `img.mode == "RGBA"` and alpha actually varies (composite on a checkerboard). Previews can fake transparency. Fix fake alpha locally with a radial/feather mask instead of re-prompting.
- Images ship as WebP (q~85-90). Originals of backgrounds are kept in `assets/_originals_backup/` (revert by pointing `IMAGES` back at the `.png`).
- Inventory icons: `assets/icon_<item>.webp`, 256px, tight crop, transparent. Their source PNGs are NOT in the repo.
- Older **scene overlay sprites** (`sprite_tp_roll`, `sprite_lighter`, `sprite_sanitizer`) are still the photoreal style and may clash in-scene; restyle is an open item.
- Watch photos are circular, feathered-edge WebP (`watch_photo1-3`); watch bezel `bg_watch` was geometrically fixed to be round.

## Testing
- Playwright with local Chromium (`/opt/pw-browsers/chromium` in the cloud container; locally just use your own). Click through real hotspots (stall1 must be unlocked before its interior is clickable) or use the temp test hook above.
- Always check: desktop (1440x900) and mobile (390x844) screenshots, no console errors, full puzzle chain still completes (jacket → coin → vent → lighter; tp + sanitizer → soaked paper + lighter → fire → door).
- Keep total build size small (~3 MB now).

## Git
- Commit sources + assets + rebuilt `zone1.html`. Scratch/debug screenshots go in `.scratch_debug_screens/` (gitignored). `_zone1_build_check.html` is gitignored.
