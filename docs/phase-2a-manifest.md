# Phase 2A manifest - Map basic grand structures

Date: 2026-11-21. Fixer work, local clone ~/workspace/hanoi-3d/. NOTHING pushed, NOTHING
committed. All changes are in the working tree only, for the coordinator + independent verifier.

## Baseline note (differs from the task brief)

- Local git HEAD is 4ec66a3, NOT 4ca9e0b. The steps 5-7 content is present in the working
  tree as uncommitted changes (see git status), exactly as the workflow doc describes the
  pre-push state. The task brief's "in sync with remote HEAD 4ca9e0b" claim did not match
  this clone. No commit or push was made by this task; the 2A changes below sit on top of
  that working tree.
- Baseline before 2A edits, verified by this task: npm run build OK (61 modules, bundle
  index-Dzo9sV2p.js), npm run check:hanoi ALL CHECKS PASSED.

## Decision: stock ids KEPT, geometry + art swapped

- Renaming house / manor / barn_farm / village / village_b / village_green to basic_* ids
  is NOT safe. The ids are referenced outside models.js / tiles.js / loader.js in:
  src/world/wfc.js (IS_CLEAR, IS_HAMLET, ORIGIN_FIXED, settlement + weight logic, T.house),
  src/world/world.js (HOUSE_RX, houseS card pivot), src/core/config/wfc.js (weights,
  rotations, hamlet family), src/core/config/animals.js (spawn tables keyed by id),
  src/core/config/life.js (chimney offsets), src/life/animals.js (HOUSE_FRONT_RX),
  tools/check-solver-options.mjs (Hanoi stand-in map), src/world/hanoi-map.js (legend id
  'house'), public/models/assets_meta.json. Renaming would require touching wfc.js and
  world.js solver logic, which the task forbids.
- So: MODELS, tiles.js, wfc.js, world.js, configs are UNTOUCHED. The 6 ids keep their exact
  sockets, tags and biome weights. Only the tile geometry (new GLB + new placeholder
  RECIPES) and the hero art (new atlas sprites) change. The basic_* names live only in
  atlas sprite keys, tool scripts and this manifest. grep for basic_ in models.js,
  tiles.js, wfc.js, hanoi-models.js, hanoi-map.js: 0 hits.

## Per-element design (all 1:1 socket + tag + biome replacements, solver stays 48 / 95)

Heights are the tallest flap top (hero art card height). All footprints stay inside the
2 x 2 tile. Palette from src/core/config/render.js. Layering: taller piece behind
(smaller z) shows above a shorter wider piece in front; every flap starts at ground y 0.

1. house = basic_townhouse, S(g,g,p,g), tags path/house/blocker, height 1.30
   - 3-storey paper townhouse: steep terracotta gable roof (tri 1.2 x 1.3), cream body,
     ink chimney (top 1.15), dormer window with cap, sage shutters, terracotta flower box,
     ink door. 8 recipe flaps + hero art = 9 hinges. Palette: cream, terracotta, sage.
   - Chimney smoke offset in src/core/config/life.js updated to the new chimney top
     [0.4, 1.15, -0.29] (was [0.14, 0.89, -0.01]).
2. manor = basic_grandmanor, S(g,g,p,g), tags path/house/landmark/blocker, height 1.40
   - Manor + side tower (ochre, 1.30 + dusty-rose conical roof to 1.40), main rose roof,
     two arched ink windows, garden wall + ink gate, two dark-pine cypress trees
     (0.90 / 0.85, pulled in to x +-0.72 so the canopy stays inside the tile).
     10 recipe flaps + hero = 11 hinges. Palette: ochre, dusty rose, dark pine.
3. barn_farm = basic_greatbarn, S(g,g,g,g), tags landmark/blocker, height 1.40
   - Great barn (kraft timber, rust roof) + round silo (paperShade body 1.28, rust cone
     to 1.40), brown barn door, two mustard haystacks, brown cart, fence run.
     9 recipe flaps + hero = 10 hinges. Palette: kraft, rust, straw gold.
4. village = basic_marketstreet, S(p,g,p,g), tags path/house/village/blocker, height 1.10
   - Market street: house each side (cream + paperShade, terracotta / rust roofs), teal
     + terracotta striped awnings, two kraft stalls with mustard fruit, rose bunting band
     (custom swag shape: side posts + top band, open middle). 10 recipe flaps + hero
     = 11 hinges. Palette: terracotta, teal, lantern gold (lanterns in the art card).
5. village_b = basic_gardencottage, S(p,g,p,g), tags path/house/village/blocker, height 1.00
   - Large cottage (blossom-pink roof, cream body, ink door, sage shutters) + walled
     flower garden, teal pond with moss/olive reeds, ink + paperShade stone lantern,
     mustard flower. 12 recipe flaps + hero = 13 hinges. Palette: blossom pink, sage, cream.
6. village_green = basic_townsquare, S(p,g,p,g), tags path/village, height 1.10
   - Town square: teal fountain (column 0.80, water arch plume to 1.10, tealDeep basin),
     four ink lamp posts (custom lamp shape: post + head box), two brown benches, two
     large trees (1.00 / 0.95), two ink pigeons. 13 recipe flaps + hero = 14 hinges.
     Palette: stone grey-cream, teal water, lantern gold (lamp heads in the art card).

Kept as-is: windmill, watchtower, church, market_square, desert/snow/blossom buildings.
Multi-tile monuments (2x2 castle, 3-tile market hall) NOT built: they need a WFC
extension (fixed multi-cell placement), explicitly out of scope. Follow-up for the parent.

## Files changed / added

Changed:
- src/assets/loader.js - shapeFor gains 3 new kinds (dormer, swag, lamp, same math as the
  build script); RECIPES for house + village replaced, manor / barn_farm / village_b /
  village_green added (grand recipes, mirror of the GLB script, no hero card); loadAssets
  loads basic-grand.glb only when NOT Hanoi mode and adopts its 6 nodes over the tiles.glb
  versions (missing/invalid node keeps the tiles.glb version, warns); BASIC_GRAND_IDS list.
- src/core/config/assets.js - basicGrandUrl './models/basic-grand.glb' (one line + comment).
- src/core/config/life.js - house chimney smoke offset to [0.4, 1.15, -0.29] (one line).
- public/textures/art/atlas.json - 194 -> 200 sprites, 6 new basic_* entries, no existing
  rect touched (script asserts overlap; values of existing sprites unchanged).
- public/textures/art/atlas.webp - 2,629,244 -> 2,568,020 bytes (re-encoded at quality 90
  on save, same as the step-5 script did; 6 new sprites pasted in the free zone).

Added:
- public/models/basic-grand.glb - 704,872 bytes, 6 nodes, 13,476 triangles.
- tools/step5/build-basic-glb.mjs - scripted GLB builder (three.js, no Blender), mirrors
  tools/step5/build-hanoi-glb.mjs.
- tools/step5/build-basic-atlas.py - draws the 6 hero sprites procedurally with PIL
  (flat cut-paper style, transparent background) and pastes them into the atlas free zone
  y 3395-4051 (256 px per world unit, 16 px gutters). NOTE: not idempotent, same as the
  step-5 script - a re-run exits with an overlap error against its own sprites, before
  writing anything. Single-use per atlas state.
- tools/step5/verify-basic-glb.mjs - GLB contract verifier (mirrors verify-glb.mjs, plus
  node-height, footprint and degenerate-triangle checks).
- tools/check-basic.mjs - solver count + frozen registry + loader wiring + atlas rect
  checks (60 checks).
- docs/phase-2a-manifest.md - this file.

NOT changed: src/core/models.js, src/world/tiles.js, src/world/wfc.js, src/world/world.js,
src/world/hanoi.js, src/world/hanoi-map.js, src/world/hanoi-models.js, src/game/landmarks.js,
src/render/post.js, package.json, index.html, public/models/tiles.glb,
public/models/hanoi-tiles.glb. No new dependencies. No Vietnamese strings. No long dashes
in any changed file (grep: 0).

## Verification evidence (all run in ~/workspace/hanoi-3d)

- node --check: OK on all 6 changed/added .js/.mjs files (loader.js, assets.js, life.js,
  build-basic-glb.mjs, verify-basic-glb.mjs, check-basic.mjs); python3 -m py_compile OK
  on build-basic-atlas.py.
- npm run build: PASS, 61 modules, NEW bundle dist/assets/index-2wO2CWNc.js (was
  index-Dzo9sV2p.js), 1,073.94 kB, gzip 322.10 kB.
- npm run check:hanoi: ALL CHECKS PASSED (solver options 95, MODELS 48, 0 socket
  mismatches, 1600 cells resolve).
- node tools/check-basic.mjs: ALL BASIC CHECKS PASSED, 60/60 - MODELS 48, OPTIONS 95
  (cap 96), all 6 ids sockets/tags/biomes byte-identical to the frozen expectation,
  RECIPES present for all 6, loader references basicGrandUrl and loads it only when NOT
  Hanoi mode, GLB exists (704,872 bytes), all 6 atlas rects inside 4096x4096 with 0
  overlaps, atlas total 200 sprites.
- node tools/step5/verify-basic-glb.mjs: ALL GLB CHECKS PASSED - 6 top-level nodes,
  hinges house 9 / manor 11 / barn_farm 10 / village 11 / village_b 13 / village_green 14,
  art uv1 ranges match the atlas rects exactly for all 6, art front-face vertex colours
  white, bases span [-1, 1] at y 0, node heights 1.337 / 1.442 / 1.438 / 1.146 / 1.052 /
  1.158 (hero height + 0.004 layer gap per flap), footprints inside the tile,
  total triangles 13,476, degenerate triangles 0.
- RECIPES mirror check (python, whitespace-normalised): GLB script vs loader.js match
  6/6 (house, manor, barn_farm, village, village_b, village_green).
- Atlas rects: townhouse [16,3395,294,333], grandmanor [326,3395,384,358], greatbarn
  [726,3395,384,358], marketstreet [16,3769,410,282], gardencottage [442,3769,358,256],
  townsquare [816,3769,410,282]. All inside the atlas, 0 overlaps (asserted by the build
  script against all 194 prior sprites, re-checked by check-basic.mjs against all 200).
- grep long dash (em/en) in all changed files: 0. grep basic_ in models.js / tiles.js /
  wfc.js / hanoi-models.js / hanoi-map.js: 0.
- npx impeccable detect: DID NOT COMPLETE. Ran 2026-11-21 ~09:15-09:24 (about 8.7 minutes),
  produced zero stdout/stderr output and never exited; killed with SIGTERM (exit signal 15).
  No findings, no error message - the run simply hung, likely downloading or scanning.
  NOT a pass and NOT a fail: the parent / verifier should re-run it. Pre-existing step-7
  findings (3 in hanoi-3d/index.html + 1 in the hub) are unrelated to 2A files; none of
  the 2A-touched files were among them.

## What was NOT verified live (no headless browser in this sandbox)

- No render or screenshot: the new buildings have never been seen on screen. The art
  cards are procedurally drawn PIL illustrations, not AI art (no AI art source is
  available in the sandbox) - their real look, the die-cut silhouette against the flap
  stack, and the fold animation are UNPROVEN until the parent's fresh-browser check and
  the user's device check.
- The loader adopt path for basic-grand.glb was verified statically (node --check, build,
  check-basic wiring checks, GLB contract checks) but never executed in a browser: the
  actual fetch + adopt + render of the 6 nodes in default mode, and the confirmed
  non-fetch in ?map=hanoi mode, still need a live check.
- Chimney smoke position (new house offset) not seen live.

## Remaining risks / notes for the verifier

1. House-pivot card scaling: upstream tiles.glb flaps are named house_front / house_back
   etc. and match world.js HOUSE_RX, so the gold pass scales them about one footprint
   pivot (cards.house 1.3). The new GLB flaps are named flap_N / art like the step-5
   Hanoi tiles, so they do NOT match HOUSE_RX and render at scale 1. Same precedent as
   step 5 (Hanoi tiles work this way); sizes in the recipes are world-unit true sizes.
   Flagging so the verifier can confirm the buildings do not look undersized next to
   neighbouring tiles.glb houses.
2. Flap height vs fold: tallest flap is 1.40 (manor tower roof, barn silo cone) vs the
   step-3 precedent max 1.35 (cathedral). Fold spring + camera sight-assist were tuned
   for <= 1.35; 1.40 is a small step past it. Watch for clipping or sight-line tipping
   in the live check.
3. Atlas re-encode: saving atlas.webp re-encoded all existing sprites at quality 90
   (same as step 5). File shrank 2,629,244 -> 2,568,020 bytes. Existing sprite pixels
   may differ slightly from the pre-2A file; the rects and atlas.json values are unchanged.
4. build-basic-atlas.py is single-use (re-run fails on its own sprites before writing).
   To redraw, remove the 6 basic_* entries from atlas.json first, or extend the script
   with an overwrite flag.
5. Swag (bunting) and lamp/dormer shapes are new custom ExtrudeGeometry/ShapeGeometry
   paths (swag uses a shape hole). verify-basic-glb reports 0 degenerate triangles and
   the placeholder path uses the same shapeFor code, but the flat placeholder rendering
   of the holed swag shape was not rendered live either.
6. The 6 new atlas sprites are procedural PIL drawings. If the user wants AI art like
   step 5, the sprites can be regenerated with real art and the GLB rebuilt - the rects
   and flap sizes are the contract, the pixels are replaceable.
7. Hanoi mode is untouched in behaviour by construction (basic-grand loads only when
   NOT Hanoi; hanoi.js / hanoi-map.js / hanoi-models.js / landmarks.js not modified;
   check:hanoi passes). The live plain-URL vs ?map=hanoi check should still confirm
   the Hanoi checklist/minimap are unchanged.

## Fixer round - smoke (2026-11-21, verifier check 6 FAIL)

- What changed: one line only, src/core/config/life.js:43 (`smoke.offsets`). Three
  stale chimney offsets set to empty arrays: `manor: []`, `village: []`,
  `village_b: []`. The old mid-air points are gone: manor [0.14, 0.92, -0.03],
  village [-0.32, 0.79, -0.23], village_b [0.20, 0.82, -0.04]. Short comments on
  the line say why each list is empty (no chimney on the new geometry).
  Unchanged on purpose: `house: [[0.4, 1.15, -0.29]]` (verifier recomputed true
  chimney top 1.162), `desert_camp`, `snow_cabin`, `snow_hamlet`, `default`.
  No other file changed: src/life/life.js logic, the GLB, the atlas and every
  other file untouched; git status file list identical before and after this round.
- Why empty-array works: src/life/life.js:323 reads
  `L.smoke.offsets[cell.model] || L.smoke.offsets.default`. In JS an empty array
  is truthy, so `[]` wins over `default` and the `for (k < offs.length)` loop at
  line 326 runs zero times - zero emitters. Deleting the entries would NOT work:
  it would fall back to `default` [0.15, 0.8, -0.1], which would also puff from
  mid-air. The entries are kept, empty, on purpose.
- Verification: `node --check src/core/config/life.js` passes. `npm run build`
  passes - 61 modules, dist/assets/index-Bcjevd1Y.js, 1,073.90 kB, gzip 322.08 kB,
  built in 1.12 s. Bundle hash changed from the verifier's index-2wO2CWNc.js
  because the config is bundled - expected, value + comment changed.
  `npm run check:hanoi` passes - ALL CHECKS PASSED (1600 cells resolve, 0
  unresolved). Grep confirms `manor: []`, `village: []`, `village_b: []` and the
  house / desert / snow offsets byte-identical to before. 0 long dashes in the file.
- Not verified live: daytime smoke absence on these three tiles still needs the
  parent fresh-browser check and the user device check, like the rest of 2A.
