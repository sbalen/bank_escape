#!/usr/bin/env python3
"""
Build script for Zone 1 (Men's Restroom).

Assembles the single self-contained, dependency-free zone1.html from the
modular source files below. This is a *source-organization* step only —
the shipped game is still one plain HTML file with everything inlined,
openable directly via file:// with no server and no build tooling on the
player's end.

Source files (edit these, not zone1.html):
  template.html   - HTML skeleton with {{STYLES}} / {{SCRIPT}} placeholders
  styles.css      - all CSS, with a {{BG_MAIN}} placeholder for the main
                    background image data URI
  sfx.js          - ChiptuneSFX class (procedural Web Audio API sound effects,
                    no audio assets) - concatenated in ahead of game.js
  texts.js        - all player-facing copy, as a flat TEXTS[id] map -
                    concatenated in ahead of game.js
  game.js         - all game logic (looks text up via TEXTS[id], instantiates
                    ChiptuneSFX), with {{BG_WATCH}} / {{BG_DOOR_CLOSED}} /
                    {{BG_DOOR_OPEN}} placeholders for their background data URIs
  assets/*.png    - the actual background images, as real PNG files

SCRIPT is assembled as sfx.js + texts.js + game.js, in that order (game.js
uses both, so it goes last) and wrapped in a single {{SCRIPT}} placeholder.

Usage:
  python3 build.py            # writes zone1.html
  python3 build.py --check    # builds to a temp path and diffs against
                               # the existing zone1.html without overwriting it
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
ASSETS = ROOT / "assets"

# NOTE on .webp entries below: these were re-encoded from lossless PNG to
# ~q90 WebP on 2026-09-28 to shrink the single-file build (see "File-size
# reduction plan" in zone1-wc.md) - visually verified (pixel-diff + crop
# comparison) as indistinguishable at this quality. The original PNGs are
# untouched in assets/ (and additionally backed up in
# assets/_originals_backup/) - to revert any single asset, just change its
# filename here back to the matching .png.
IMAGES = {
    "{{BG_MAIN}}": "bg_main.webp",
    "{{BG_MAIN_WET}}": "bg_main_wet.webp",
    "{{BG_WATCH}}": "bg_watch.webp",
    "{{BG_DOOR_CLOSED}}": "bg_door_closed.webp",
    "{{BG_DOOR_OPEN}}": "bg_door_open.webp",
    "{{BG_STALL1}}": "bg_stall1.webp",
    "{{BG_STALL2}}": "bg_stall2.webp",
    "{{BG_STALL3}}": "bg_stall3.webp",
    "{{SPRITE_TP_ROLL}}": "sprite_tp_roll.webp",
    "{{BG_VENT_CLOSED}}": "bg_vent_closed.webp",
    "{{BG_VENT_OPEN}}": "bg_vent_open.webp",
    "{{SPRITE_LIGHTER}}": "sprite_lighter.webp",
    "{{BG_CABINET}}": "bg_cabinet.webp",
    "{{SPRITE_SANITIZER}}": "sprite_sanitizer.webp",
    "{{WATCH_PHOTO_1}}": "watch_photo1.webp",
    "{{WATCH_PHOTO_2}}": "watch_photo2.webp",
    "{{WATCH_PHOTO_3}}": "watch_photo3.webp",
    # Inventory icons (256px, cel-shaded, transparent) - shown in the inventory row.
    "{{ICON_COIN}}": "icon_coin.webp",
    "{{ICON_CIGARETTES}}": "icon_cigarettes.webp",
    "{{ICON_LIGHTER}}": "icon_lighter.webp",
    "{{ICON_TOILET_PAPER}}": "icon_toilet_paper.webp",
    "{{ICON_HAND_SANITIZER}}": "icon_hand_sanitizer.webp",
    "{{ICON_SOAKED_PAPER}}": "icon_soaked_paper.webp",
    "{{ICON_SPRINT_FRAGMENT}}": "icon_sprint_fragment.webp",
    "{{ICON_LIPSTICK}}": "icon_lipstick.webp",
}


def data_uri(img_path):
    mime = "image/webp" if img_path.suffix.lower() == ".webp" else "image/png"
    data = base64.b64encode(img_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def build():
    template = (ROOT / "template.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    sfx_js = (ROOT / "sfx.js").read_text(encoding="utf-8")
    texts_js = (ROOT / "texts.js").read_text(encoding="utf-8")
    game_js = (ROOT / "game.js").read_text(encoding="utf-8")
    js = sfx_js + "\n" + texts_js + "\n" + game_js

    # Inline the background/sprite images into whichever source file references them.
    for token, filename in IMAGES.items():
        uri = data_uri(ASSETS / filename)
        if token in template:
            template = template.replace(token, uri)
        if token in css:
            css = css.replace(token, uri)
        if token in js:
            js = js.replace(token, uri)

    missing = [t for t in IMAGES if t in template or t in css or t in js]
    if missing:
        raise SystemExit(f"Unresolved placeholders left after inlining: {missing}")

    html = template.replace("{{STYLES}}", css).replace("{{SCRIPT}}", js)
    return html


def main():
    check_only = "--check" in sys.argv
    html = build()

    if check_only:
        tmp = ROOT / "_zone1_build_check.html"
        tmp.write_text(html, encoding="utf-8")
        print(f"Built to {tmp} ({len(html):,} bytes) — not overwriting zone1.html")
        return

    out = ROOT / "zone1.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
