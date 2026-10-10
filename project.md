# PROJECT.md — Bank Escape Room

## Concept
Point-and-click escaperoom in browser, stijl Monkey Island / Leisure Suit Larry / Under a Killing Moon. Speler zit vast op kantoor na werktijd, moet een fatale betaalbug stoppen voor een pipeline live gaat, via een rode noodknop die alleen bereikbaar is buiten de afgesloten verdieping.

## Tech-beslissing (vastgesteld eerder in dit gesprek)
**JS/HTML5 Canvas.** Geen Python/Pyodide/Flask — voor een puur client-side puzzelspel met simpele state (inventory-array, booleans, scene-graph) levert een Python-laag alleen overhead op zonder functioneel voordeel. Dit is een bewuste afwijking van de "code in Python"-voorkeur; als je daar toch op wilt oefenen, zetten we de spellogica (state machine, puzzel-validatie) apart in een module die in principe 1-op-1 naar Python te porten is, mocht je later een Flask-versie willen.

**Architectuur-richting:**
- Vanilla JS, geen framework nodig voor deze scope (5-8 puzzels, 3 zones)
- Canvas voor rendering, DOM-laag eroverheen voor UI (inventory-balk, dialoog-tekst, Garmin-overlay)
- Scene/hotspot-systeem: elke zone = JSON/JS-object met hotspots, elk hotspot = `{x, y, w, h, onLook, onUse, onTake, condities}`
- State machine: platte object met flags + inventory-array, geen aparte library nodig op deze schaal
- Save/load niet nodig (sessie-only spel)

## Art-stijl: pixel-art / retro sprites

**Resolutie:** 320×180 canvas-resolutie, opgeschaald met `image-rendering: pixelated` naar bijv. 960×540 of 1280×720. Dit is de klassieke lage-resolutie-met-scherpe-upscale-aanpak (vergelijkbaar met SCUMM-games maar iets lager dan hun 320×200 om productie te versimpelen).

**Palet:** Vaste, beperkte kleurenset (16-32 kleuren totaal) om visuele consistentie te forceren en tekentijd te beperken. Voorstel: warm kunstlicht-palet voor binnenkantoor (tl-groen/wit, houtbruin bureaus, blauwgrijs tapijt) met één felle accentkleur (rood) gereserveerd voor de noodknop/brandalarm — zodat die kleur betekenis draagt in plaats van decoratief te zijn.

**Sprite-specs:**
- Achtergronden (kamer-scenes): één statische pixel-art illustratie per zone, 320×180, geen tiles nodig gezien de kleine scope
- Interactieve objecten: kunnen los sprite-laagje zijn boven de achtergrond als ze staat moeten wisselen (bijv. rooster dicht/open, prullenbak wel/niet in brand) — 16×16 tot 32×32 per object naargelang grootte
- Personage: gezien het spelperspectief eerste-persoon-achtig is (zoals Killing Moon, geen zichtbare hoofdpersoon) is een spelersprite waarschijnlijk niet nodig — alleen handen/cursor-icoon voor interactie, in de stijl van klassieke SCUMM-verb-cursors

**Aanbevolen tool:** Aseprite (betaald, ~20 dollar, de facto standaard voor pixel-art met ingebouwde animatie-timeline) of Piskel (gratis, browser-based, minder features maar voldoende voor statische scenes).

## Wat ik (Claude) wel/niet kan leveren
- Ik kan geen pixel-art sprites genereren — dat vereist een losse workflow (Aseprite, of een AI-beeldgenerator als losse stap, wat een aparte discussie is over stijl-consistentie tussen losse generaties)
- Ik kan wel: placeholder-rechthoeken/kleurvlakken coderen zodat de puzzellogica en interactie speelbaar is vóórdat de art af is, plus de code-architectuur zo opzetten dat een sprite later 1-op-1 een placeholder vervangt
- Voorstel: eerst zone 1 volledig speelbaar maken met kleurvlakken + tekst-hotspots (functioneel prototype), daarna pas art-laag toevoegen — zo valideren we puzzellogica voordat we tijd in sprites steken

## Scope-overzicht
- **Zone 1 — Herentoilet:** volledig uitgeschreven, zie `zone1-wc.md`
- **Zone 2 — Liftlobby:** nog te ontwerpen
- **Zone 3 — Koffiehal:** nog te ontwerpen
- **Puzzel-totaal doel:** 5-8 over alle zones samen

## Werkvolgorde (herzien — per zone, niet alles vooraf)
Bewuste keuze: **niet** alle zones volledig uitschrijven voordat er iets gebouwd wordt. Dat risico op overdesign van puzzels die nog niet op speelgevoel getest zijn (hitbox-grootte, pacing, moeilijkheidsgraad) is te groot. In plaats daarvan, per zone:

1. Scenario volledig uitschrijven (tekst, hotspots, state-flags) — **zone 1: klaar**
2. Snelle, ruwe concept-sketch — sfeer/palet-check, nadrukkelijk niet definitief
3. Speelbaar prototype met placeholder-blokken + tekst — test puzzelgevoel, hitboxes, pacing
4. Pas na validatie: echte sprites voor die zone
5. Volgende zone-scenario pas schrijven ná stap 4 van de vorige zone, zodat lessen uit het prototype meegenomen worden

Basis JS-architectuur (scene-loader, hotspot-systeem, inventory-UI, dialoog-box) wordt opgezet zodra we bij stap 3 van zone 1 zijn — niet eerder, om te voorkomen dat de architectuur wordt afgestemd op ongeteste aannames.
