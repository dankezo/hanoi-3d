# Hanoi 3D - Phase 2B manifest (streets + bigger landmarks + proximity info cards)

Fixer build, 2026-11-21. Hanoi mode only (?map=hanoi). Nothing pushed, nothing committed.
Working tree = remote HEAD 4ca9e0b content + steps 5-7 + 2A + this 2B work, all uncommitted.
No 2A files touched. No change to wfc.js, tiles.js, world.js, post.js, core/models.js,
src/game/index.js or src/main.js. No new dependencies. No new storage key.

## Decisions (recorded)

- Pedestrians are STATIC paper figures on tiles. The animals.js wandering-sprite pattern was
  NOT reused: static matches the paper aesthetic, adds no new system and no runtime cost.
- No new atlas sprites. Street models are flat-colour flaps; the 10 landmarks reuse their 11
  step-5 sprites with bigger hero cards (same rects, same aspect). Atlas stays at 200 sprites.
- Info card language order: VI first, EN second (2C language detection lands later).
- Info card reuses the existing hanoi:v1:<seed> visited section; no new storage key.
- loader.js adopt logic NOT changed: only two new shape kinds (figure, glowtop), RECIPES
  entries, and baseTexture ground-print overrides for road/sidewalk.
- Short hyphens only (-) everywhere. Vietnamese UI without diacritics.

## Part 1 - street elements (all Old Quarter, x -8..2, z -9..-3, 30 cells)

Each model is Hanoi-only (src/world/hanoi-models.js) and copies the sockets + tags of the
cell it replaces, so the grid stays socket-consistent by construction. Roads/sidewalks are
ground prints on the base; the rest are small layered flaps. All static, paper aesthetic.

| Model | Design | Cells |
|---|---|---|
| hanoi_road | Junction tile. Base print: kraft path cross + 5 white zebra dashes on each of the N and S arms. 2 ink bollard flaps 0.12 x 0.3 at opposite corners. Sockets = path_cross (all path). | (-6,-6), (-3,-6) - the 2 main-street junctions |
| hanoi_sidewalk | Base print: paperShade pavement wash + terracotta kerb lines on both long edges + joints. 1 kerb-block flap 0.5 x 0.12 paperShade at the south edge. Sockets = meadow (all grass). | 6: north side z=-7 (-7,-5,-2,0), south side z=-5 (-7,-2) |
| hanoi_tree | 2 layered tree flaps: pine 1.15 high + sage 0.85 high. Sockets = meadow. | 4: (-8,-9), (-4,-9), (1,-9), (-8,-4) |
| hanoi_bush | 3 low arch flaps: sage 0.42, olive 0.34, moss 0.28 high. Sockets = meadow. | 5: (-7,-9), (-5,-9), (-2,-9), (0,-9), (2,-9) |
| hanoi_trafficlight | Post rect ink 0.08 x 0.95 + lamp head ink 0.26 x 1.0 + glowtop lantern-gold 0.12 x 1.0 (one lit lamp). Sockets = path_end, rot 2 (socket at N). | 2: (-6,-3), (-3,-3), south ends of the 2 N-S streets |
| hanoi_police | 2 figure flaps: ink uniform silhouette 0.36 x 1.0 + paper shirt front 0.26 x 0.85. Sockets = tubehouse rot 1 (path E-W). Walkable, like tubehouse_green. | 1: (-1,-6), mid main street |
| hanoi_pedestrian | 3 static figure flaps: rose ao dai 0.3 x 0.95, teal shirt 0.3 x 0.9, mustard child 0.2 x 0.6. Sockets = tubehouse rot 1 (path E-W). Walkable on purpose (a paper figure, not a house: tags drop 'house' + 'blocker' from village). | 3: (-7,-6), (-4,-6), (1,-6), on the main street |
| hanoi_vendor | Paper figure 0.3 x 0.9 + 2 ochre basket arches 0.5 x 0.32. Sockets = meadow. | 1: (-8,-5), west end south side |
| hanoi_phostall | House-shape stall terracotta 0.9 x 1.0 (cart + pointed roof in one piece) + paper counter 0.5 x 0.4 + ink pot arch 0.24 x 0.3 + mustard sign 0.34 x 0.18. Sockets = meadow. | 1: (2,-5), east end south side |
| hanoi_pole | Lamp-kind crossarm pole ink 0.55 wide x 1.3 high + paperShade transformer box 0.22 x 0.35. Sockets = meadow. | 2: (-8,-8), (2,-8) |
| hanoi_lamp | Lamp post ink 0.3 x 1.05 + glowtop lantern 0.14 x 1.05. Sockets = meadow. | 3: (-5,-5), (1,-5), (-4,-7) |

New shape kinds (loader.js shapeFor + build-hanoi-glb.mjs shapeFor, same math both places):
figure = straight body + round head, one piece (rect 0..0.7h + half-ellipse cap, same arc
pattern as the existing arch kind). glowtop = thin stem (0.015) + small lit box at the top
(same pattern as the existing lamp kind, smaller box). Both proven by vertex counts in the
built GLB: lamp/glowtop flaps 84 verts vs a plain rect 36; figure flaps 264 verts.

Map legend chars (all previously free, verified before use): X road, k sidewalk, T tree,
q bush, D traffic light (rot 2), Q police (rot 1), i pedestrian (rot 1), Y vendor,
Z pho stall, l pole, j lamp.

## Part 2 - bigger landmarks (same anchors, ids, discovery radius)

Every landmark recipe grew (loader RECIPES + GLB build RECIPES, mirrored). Hero cards reuse
the same atlas sprites with the same aspect ratio, grown to match. Tallest flap 1.49
(cathedral hero, under the 1.5 cap). tubehouse_green and badinh have no art card, as in
step 5 - extra flat flaps only.

| Landmark | Flaps step 3 -> 2B | Hero card step 5 -> 2B | Added pieces |
|---|---|---|---|
| turtletower | 4 -> 6 (+hero = 7) | 0.62x1.05 -> 0.72x1.22 | plinth 0.8x0.18, side wing 0.3x0.5 |
| ngocson | 6 -> 8 (+hero = 9) | 1.15x0.95 -> 1.30x1.08 | side pavilion (house 0.42x0.62), flag pole 0.06x0.8 |
| thehuc | 3 -> 5 (+hero = 6) | 1.50x0.55 -> 1.60x0.585 | 2 end posts 0.08x0.5 |
| tranquoc | 7 -> 9 (+hero = 10) | 0.70x1.30 -> 0.78x1.44 | terrace 0.9x0.25, side hall (house 0.45x0.7) |
| tubehouse | 5 -> 7 (+hero = 8) | 0.60x1.00 -> 0.68x1.13 | chimney 0.1x0.55, awning 0.4x0.12 |
| tubehouse_b | 4 -> 6 (+hero = 7) | 0.66x1.05 -> 0.68x1.13 | awning 0.4x0.12, chimney 0.1x0.5 |
| tubehouse_green | 5 -> 7 (no hero) | - | second lamp post + lantern head |
| mausoleum | 7 -> 9 (+hero = 10) | 1.05x1.00 -> 1.20x1.14 | 2 side wings 0.4x0.6 |
| badinh | 5 -> 7 (no hero) | - | flag pole 0.06x1.3, flower bed arch 0.5x0.25 |
| vanmieu | 6 -> 8 (+hero = 9) | 1.15x1.05 -> 1.30x1.19 | 2 stelae 0.2x0.4 |
| onepillar | 4 -> 6 (+hero = 7) | 0.72x1.15 -> 0.80x1.28 | lotus pond arch teal 0.9x0.3, base stone 0.7x0.2 |
| cathedral | 5 -> 7 (+hero = 8) | 1.25x1.35 -> 1.38x1.49 | 2 buttress tris 0.25x0.8 |
| opera | 6 -> 9 (+hero = 10) | 1.25x0.90 -> 1.42x1.02 | 2 side wings 0.35x0.55, steps 1.2x0.14 |
| longbien | 4 -> 6 (+hero = 7) | 1.50x0.70 -> 1.60x0.75 | 2 truss posts 0.08x0.6 |

## Part 3 - proximity info cards

- Trigger: radius 1 cell (Chebyshev), the SAME radius as discovery in landmarks.js. Reuses
  the discovery system: discover() opens the card for the new landmark; the card also opens
  when the user taps a DISCOVERED checklist item (undiscovered items do nothing on tap).
- Content source: src/game/landmark-history.js, text copied EXACTLY from
  docs/landmark-history.md (10 landmarks, full EN + VI names, 3 history lines each language,
  1 fun fact each language, 1 source URL each). No history rewritten, no years invented.
  tools/check-2b.mjs re-parses the doc independently and compares every string exactly.
- Card content order: name VI (big) + name EN (italic), Lich su (VI, 3 lines), History (EN,
  3 lines), Dieu thu vi (VI), Fun fact (EN), source link labelled "Nguon: <hostname>".
- Design: #lm-info in index.html, same paper as the checklist/toast (cream #efe0c2, ink
  #5a3a28, terracotta #b9603f headers, Georgia serif). Centered, bottom 21vh (above the
  toast at 11vh), width calc(100vw - 24px), max-width 360px, max-height 52vh, body scrolls
  inside itself, page never scrolls. Header click collapses/expands the body (one toggle);
  X button closes (stopPropagation, so it does not toggle). z-index 7, above toast (6).
- Does not block walking: keyboard walking works while it is open, taps outside the card
  still walk (the card only covers its own rect), and it closes itself when the traveller
  walks out of radius 1 (same nearLandmark predicate as discovery, checked every tick).
  settle() hides it along with the toast. game.modal() NOT extended on purpose.
- Storage: reuses hanoi:v1:<seed> visited section. No new key. openInfo() is a no-op for
  undiscovered landmarks; the card only ever shows visited ones.

## Files changed / added (2B only)

- src/world/hanoi-models.js - 11 street models added to the Hanoi-only registry (25 total).
- src/world/hanoi-map.js - 11 legend chars + 30 cells changed in the Old Quarter.
- src/assets/loader.js - figure + glowtop shape kinds; baseTexture zebra/pavement overrides;
  11 street RECIPES; 14 landmark RECIPES enlarged (+2 or +3 flaps each).
- tools/step5/build-hanoi-glb.mjs - same shape kinds, SOCKETS, RECIPES and bigger HERO cards
  as the loader mirror; base vertex-colour zebra/pavement overrides.
- tools/step5/verify-glb.mjs - EXPECTED updated to 25 nodes + new flap counts; added
  degenerate-triangle check and flap footprint/height check (footprint inside tile, height
  extent under 1.5; the layer-gap offset is excluded from the height measure).
- tools/check-solver-options.mjs - STAND_IN + 11 street models, EXPECTED_TAGS for the
  intentional tag differences, tubehouse cells 19 -> 15, models 14 -> 25, 30 street cells.
- tools/check-2b.mjs (new) - the 2B node test (see verification).
- src/game/landmark-history.js (new) - info-card content, exact copy of the researched doc.
- src/game/landmarks.js - info card show/hide, checklist tap re-open, walk-away close,
  nearLandmark predicate, openInfo/closeInfo/infoOpen API.
- index.html - #lm-info dialog + CSS (Hanoi mode only, body.hanoi-gated like the rest).
- public/models/hanoi-tiles.glb - regenerated by build-hanoi-glb.mjs: 1,362,924 -> 2,496,552
  bytes, 14 -> 25 nodes, 30,324 -> 54,632 triangles. Hanoi mode only (lazy-loaded).

## Verification evidence (all run, exact counts)

- node --check: 10/10 changed .js/.mjs files pass (index.html is HTML, validated by the
  build instead).
- npm run build: PASS. Bundle dist/assets/index-DjTv2yFV.js, 1,095.99 kB (gzip 331.03 kB).
  Baseline before 2B was index-Bcjevd1Y.js, 1,073.90 kB.
- npm run check:hanoi: 161 PASS, ALL CHECKS PASSED. Solver options 95 (cap 96), MODELS 48,
  0 socket mismatches, all 1600 cells resolve, 30 street cells at their planned coords,
  tubehouse cells 15, Hanoi-only models 25.
- node tools/step5/verify-glb.mjs: 200 PASS, ALL GLB CHECKS PASSED. 25 top-level nodes,
  total triangles 54,632, total degenerate triangles 0, all flap footprints inside their
  tile, tallest flap extent 1.49.
- node tools/check-basic.mjs (2A): ALL BASIC CHECKS PASSED (atlas still 200 sprites).
- node tools/check-2b.mjs: 334 PASS, ALL 2B CHECKS PASSED. Covers: solver 95 / MODELS 48 /
  registry 25; 0 mismatches; 1600 cells resolve; all 30 street cells + inside Old Quarter
  rect; all 10 anchors unchanged; info content exact-match vs docs/landmark-history.md
  (names, 3+3 history lines, both fun facts, source URLs, https check, pure ASCII);
  loader RECIPES mirror GLB build RECIPES flap-for-flap for all 25 models; every landmark
  recipe grew vs step 3; atlas 200 sprites, 0 overlaps; headless radius-1 discovery: no
  discovery before arming, all 10 landmarks discover from an adjacent walkable cell,
  nearLandmark false far away, store key still hanoi:v1:1.
- Shape sanity (GLB inspection): trafficlight lamp/glowtop flaps 84 verts vs plain rect 36;
  pedestrian figure flaps 264 verts (ellipse head built, not a rect); road base zebra 70
  near-white verts in 5 columns x 2 bands; sidewalk base 957 paperShade verts + 132
  terracotta kerb verts (2 rows x 33 x 2 edges, exact).
- Long dashes: 0 in all 2B files (grep U+2013/U+2014 over the 10 source files + this manifest).
- Non-ASCII: 0 in all 2B source files, except ONE pre-existing line in index.html (the
  upstream hint div with middle-dot entities), which 2B did not touch.
- npx impeccable detect: HUNG. No output within 120 s, killed by timeout. This is a tool
  failure, not a pass - same hang both 2A agents reported. Not re-run.
- Hallmark sloplint: not runnable (no such package on npm, 404) - known, per WORKFLOW doc.

## What I could NOT verify live (no headless browser in this sandbox)

- No browser render at all: the look of the 11 street tiles, the bigger landmark heroes, the
  zebra/pavement prints, and the info card layout were verified by code, scripts and build
  only. Parent does fresh-browser checks; the user device is the decider.
- Checklist tap re-open, X close, header collapse toggle, walk-away auto-close timing, and
  toast + info card overlap on a real 390px phone: logic is in place and headless-tested
  where possible (discovery predicate, store key, content), but the DOM behaviour needs a
  live check.
- FPS impact of +24,308 triangles and 11 more tile nodes on the user device (phase 2E owns FPS).
- Whether the taller cathedral hero (1.49) visually crowds its neighbours at some camera angles.

## Remaining risks

- Radius-1 co-discovery is unchanged: standing at (6,-1) discovers Ngoc Son + Cathedral at
  once, and the info card shows the last discovered one. Same behaviour as step 4.
- Police/pedestrian tiles are walkable: the traveller walks through the paper figures (same
  as tubehouse_green). Fine for paper style, but the user may notice on close look.
- GLB grew 1.36 MB -> 2.50 MB. Hanoi mode only (lazy-loaded, default WFC path unaffected),
  but a slower first load of ?map=hanoi.
- Info card + toast can sit close together on short screens (card bottom 21vh, toast 11vh);
  the card is scrollable inside itself if it gets tall.
- tools/check-solver-options.mjs now hardcodes EXPECTED_TAGS for the street models and the
  15 tubehouse cells; future street changes must update those numbers with the map.
