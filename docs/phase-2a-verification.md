# Phase 2A verification - Map basic grand structures (independent verifier)

Date: 2026-11-21. Verifier work only: no source file edited, nothing committed, nothing pushed.
Working tree: local git HEAD 4ec66a3, steps 5-7 content present as uncommitted baseline changes
plus the 2A changes on top. All checks below are fresh scripts written for this verification
in /tmp/2a-verify/ (solver.mjs, glb.py, glb2.py, atlas.py, mirror.py). The fixer's own
tools/check-basic.mjs and tools/step5/verify-basic-glb.mjs were read for format only and were
NOT used as evidence. One correction to my own first atlas run: my initial expected new-key
set omitted the 11 step-5 hanoi_* keys because HEAD is step 3 (183 sprites); the corrected
expectation (183 HEAD + 11 step-5 + 6 2A = 200) passes cleanly. That first-run failure was
my script's expectation, not the atlas.

## Verdicts

### 1. Solver 1:1 replacement, 48 models / 95 options - PASS

- Fresh import of the real registry (/tmp/2a-verify/solver.mjs): MODELS 48, TILES 48,
  OPTIONS 95 (cap 96).
- All 6 model blocks (house, manor, barn_farm, village, village_b, village_green) are
  byte-identical between git HEAD and the live src/core/models.js after whitespace
  normalisation. Full registry key set identical HEAD vs live (48 keys, no add/remove/rename).
- Live values: house S(g,g,p,g) tags path/house/blocker; manor S(g,g,p,g) tags
  path/house/landmark/blocker; barn_farm S(g,g,g,g) tags landmark/blocker; village,
  village_b, village_green S(p,g,p,g) tags path/house/village/blocker,
  path/house/village/blocker, path/village. Biome weights unchanged (in the identical blocks).

### 2. Stock ids kept, basic_* names only in art/tools/manifest - PASS

- grep for `basic_` in src/core/models.js, src/world/tiles.js, src/world/wfc.js,
  src/world/world.js, src/world/hanoi-models.js, src/world/hanoi-map.js, src/world/hanoi.js,
  src/game/landmarks.js: 0 hits.
- `basic_` appears only in atlas sprite keys, tools/step5/build-basic-*.mjs/.py,
  tools/step5/verify-basic-glb.mjs, tools/check-basic.mjs, src/assets/loader.js
  (BASIC_GRAND_IDS + comments), src/core/config/assets.js (basicGrandUrl),
  docs/phase-2a-manifest.md.

### 3. basic-grand.glb contract - PASS

- File: public/models/basic-grand.glb, 704,872 bytes, GLB v2, header total equals file size.
- Fresh pure-Python parse (/tmp/2a-verify/glb.py, glb2.py; no three.js, no fixer script):
  6 scene roots named house, manor, barn_farm, village, village_b, village_green.
- Hinges (extras.hinge true, foldAngle pi/2, delay, layer, size present per flap node):
  house 9, manor 11, barn_farm 10, village 11, village_b 13, village_green 14. Matches claim.
- Triangles recomputed from indices: total 13,476, degenerate 0 (cross-product magnitude
  zero test per triangle). Per node: house 2,172, manor 2,332, barn_farm 2,152,
  village 2,192, village_b 2,264, village_green 2,364 (each includes a 2,048-triangle base).
- Art uv1 exact for all 6 (top-down convention u=[x,x+w]/4096, v=[y,y+h]/4096):
  townhouse u[0.003906,0.075684] v[0.828857,0.910156]; grandmanor u[0.079590,0.173340]
  v[0.828857,0.916260]; greatbarn u[0.177246,0.270996] v[0.828857,0.916260]; marketstreet
  u[0.003906,0.104004] v[0.920166,0.989014]; gardencottage u[0.107910,0.195312]
  v[0.920166,0.982666]; townsquare u[0.199219,0.299316] v[0.920166,0.989014].
  All equal the atlas.json rects divided by 4096 to 6 decimals.
- Art front-face vertex colours: white 6/6 verts, non-white 0, on every art mesh.
- Footprints inside the tile (matrix transforms decoded, column-major): every node
  max |x| = 1.0000 and max |z| = 1.0000, which is the base plane spanning exactly
  [-1, 1]; every flap sits inside. All flap rotations are identity (ry 0).
- Node heights (max world Y, flap height + 0.004 layer gap): house 1.3368, manor 1.4424,
  barn_farm 1.4384, village 1.1456, village_b 1.0520, village_green 1.1576.
  Matches the fixer's 1.337 / 1.442 / 1.438 / 1.146 / 1.052 / 1.158.

### 4. Atlas 194 -> 200, rects inside, 0 overlaps, old rects untouched - PASS

- Fresh check (/tmp/2a-verify/atlas.py): live sprite count 200; HEAD count 183; new keys are
  exactly the 11 step-5 hanoi_* keys (pre-2A baseline) plus the 6 basic_* keys.
- All 6 new rects inside 4096x4096: townhouse [16,3395,294,333], grandmanor [326,3395,384,358],
  greatbarn [726,3395,384,358], marketstreet [16,3769,410,282], gardencottage [442,3769,358,256],
  townsquare [816,3769,410,282]. Values equal the manifest exactly.
- Pairwise overlap over all 200 rects: NONE. Pre-existing rects changed vs HEAD: NONE.
  Removed keys: NONE.
- atlas.webp: 2,568,020 bytes, decodes with PIL as WEBP 4096x4096 RGBA.
- Pixel sanity (/tmp/2a-verify/mirror.py): all 6 sprites contain drawn pixels
  (26.6% to 59.2% non-transparent coverage); 0 stray non-transparent pixels in the free
  zone y 3395-4051 outside the 6 rects.

### 5. Loader wiring, Hanoi gating, fallbacks - PASS

- Read src/assets/loader.js and src/core/config/assets.js directly. Gate at loader.js:519:
  `!hanoi ? loadGLTF(A.basicGrandUrl) : Promise.resolve(null)` - basic-grand.glb is fetched
  only when NOT in Hanoi mode. src/main.js:46 passes the `hanoi` flag from `?map=hanoi`.
- RECIPES present in loader.js for all 6 ids (lines 127-199). Mirror check
  (/tmp/2a-verify/mirror.py): each recipe is string-identical to the builder
  (tools/step5/build-basic-glb.mjs) after comment stripping and P. prefix normalisation:
  6/6. Entry counts: house 8, manor 10, barn_farm 9, village 10, village_b 12,
  village_green 13; hinge counts are entries + 1 art card in every case.
- Fallback paths traced, all safe, no throw path found:
  - basic-grand.glb fetch fails (loadGLTF returns null): the adopt block is skipped,
    tiles.glb versions stay.
  - a node missing in basic-grand.glb: `if (!node) continue` keeps the tiles.glb version.
  - a node with no base or 0 hinges: warn + `continue`, keeps the tiles.glb version.
  - adopt() throws: try/catch warns, keeps the tiles.glb version.
  - neither GLB has the node: the final loop builds the placeholder tile from RECIPES.
  - shapeFor gains dormer / swag / lamp kinds; swag uses a shape hole, same code path
    serves the GLB builder and the placeholder.
- node --check passes on loader.js, assets.js, life.js, build-basic-glb.mjs,
  verify-basic-glb.mjs, check-basic.mjs; python py_compile passes on build-basic-atlas.py.

### 6. Chimney smoke offset - FAIL (house correct, 3 other house-tagged models stale)

- What the fixer did is correct: src/core/config/life.js house offset is now
  [0.4, 1.15, -0.29]. Recomputed from the GLB: house__flap_2 (chimney) matrix translation
  is (0.400, 0.012, -0.290) with local top y 1.150, so the true chimney top is
  (0.4, 1.162, -0.29). The offset sits 0.012 below the lip, inside the chimney. Fine.
- What the fixer did NOT do: manor, village and village_b offsets are unchanged in the
  git diff, but their new geometry has NO chimney at all (checked against the loader
  RECIPES and the GLB flap lists: no chimney flap in any of the three).
- The emitter fires for all of them: src/life/life.js:321-323 spawns a smoke emitter on
  tile:rise for every cell whose tags include 'house', using
  `L.smoke.offsets[cell.model] || L.smoke.offsets.default`. All three models carry the
  'house' tag (verified in check 1). village_green does not (tags path/village), so it
  is unaffected.
- Stale emitter positions, all in mid-air against the new geometry:
  - manor [0.14, 0.92, -0.03]: main body front plane is z -0.29, so the point floats
    0.26 in front of the body at roof height, between the tower (x 0.55) and the main roof.
  - village [-0.32, 0.79, -0.23]: the point sits in the open lane gap between the two
    market houses (x -0.62 and +0.62), at y 0.79.
  - village_b [0.20, 0.82, -0.04]: cottage front plane is z -0.32, so the point floats
    0.28 in front of the cottage, just above the 0.80 body top.
- Pre-2A these offsets were real chimney tops (life.js comments: round-3 / gold-pass
  chimney tops), so this is a regression introduced by 2A, not a pre-existing issue.
  Smoke is daytime-only (night: 0), so the visible symptom is daytime puffs from empty
  air when these tiles rise near the traveller.
- Fix note: deleting the three entries is NOT enough on its own - life.js falls back to
  `default` [0.15, 0.8, -0.1], which would also puff from mid-air. The fixer must either
  add a chimney to each of the three designs or make life.js accept an empty offset list
  (no emitters) for chimney-less house-tagged models.

### 7. Build + check:hanoi - PASS

- Ran myself: `npm run build` - 61 modules transformed, dist/assets/index-2wO2CWNc.js,
  1,073.94 kB, gzip 322.10 kB, built in 1.05 s. Bundle hash matches the fixer claim.
- `npm run check:hanoi` - tail shows ALL CHECKS PASSED (solver options 95, MODELS 48,
  0 socket mismatches, 1600 cells resolve). Full output tail recorded in this session.

### 8. No long dashes, no Vietnamese strings - PASS

- Python count over all 10 2A files (loader.js, assets.js, life.js, build-basic-glb.mjs,
  build-basic-atlas.py, verify-basic-glb.mjs, check-basic.mjs, phase-2a-manifest.md,
  basic-grand-design.md, atlas.json): em dash U+2014 total 0, en dash U+2013 total 0,
  Vietnamese diacritic characters total 0.

### 9. Impeccable detect - UNVERIFIED (tool hangs, not a code verdict)

- My run: `timeout 300 npx impeccable detect` in ~/workspace/hanoi-3d, 2026-11-21.
  Result: killed by timeout at 300 s, exit 124, zero stdout/stderr output
  (log /tmp/2a-verify/impeccable.log is 9 bytes: only the `exit=124` line).
- Same outcome as the fixer's run (~8.7 min, killed SIGTERM, zero output). No findings
  were produced by either run, so there is nothing to pass or fail here. This is a tool
  environment failure, not evidence about the 2A code. The pre-existing step-7 findings
  (3 in hanoi-3d/index.html + 1 in the hub) are in files 2A did not touch.
- Recommended follow-up: run Impeccable on a machine with network access to its backend
  or with a longer window, and record whether it ever produces output; do not treat two
  hung runs as a pass.

## Hanoi-mode isolation - PASS

- src/world/hanoi-models.js and src/world/hanoi-map.js are clean in git status (unmodified).
- src/world/hanoi.js is modified in the working tree, but that is the pre-2A steps 5-7
  baseline: `git diff src/world/hanoi.js | grep -i basic` returns nothing, and grep for
  `basic` across hanoi.js, hanoi-map.js, hanoi-models.js and src/game/landmarks.js
  returns 0 hits.
- Loader fetches basic-grand.glb only when `hanoi` is false (check 5); the Hanoi registry
  is untouched; check:hanoi passes (check 7).
- Caveat for the parent: git status mixes pre-2A steps 5-7 changes with 2A changes because
  HEAD is 4ec66a3. The 2A files are exactly the manifest list (loader.js, assets.js,
  life.js, atlas.json, atlas.webp, basic-grand.glb, build-basic-glb.mjs,
  build-basic-atlas.py, verify-basic-glb.mjs, check-basic.mjs, phase-2a-manifest.md).
  The other modified files (README, index.html, hanoi.js, biomes.js, traveller.js, etc.)
  are the steps 5-7 baseline, not 2A.

## Risk review

1. Tallest flap 1.40 vs the 1.35 step-3 precedent - LOW, no fold-system clip.
   Concretely: the fold spring is angle-based, not height-based (src/world/fold.js:
   quaternion = rest * RotX(foldAngle * (1 - p))); flap height never enters the spring
   math, so a 1.40 flap folds exactly like a 1.35 one. makeRoom (the lean-aside system)
   is disabled in config (src/core/config/world.js: makeRoom enabled false, user
   2026-11-17: nothing bends aside), so nothing tips. The camera sight assist
   (src/world/world.js sightBlocked) caps its ray at height 3.2 ("nothing stands taller
   than this"), far above 1.40. Wind sway amplitude scales with height/slenderness
   (fold.js:190), so the 1.40 flaps sway about 4% more than the 1.35 precedent -
   negligible. What remains unproven is only the visual: whether the taller towers read
   well against the camera pitch on a live screen.
2. New flaps skip the 1.3x house growth - MEDIUM, live-look question.
   Concretely: world.js HOUSE_RX (line 733) matches only flap names like
   house_front / manor_back / cottage_roof_b. The new GLB flaps are named flap_N / art,
   so they do NOT match; cardSpecs never assigns the houseS scale (cards.house 1.3,
   houseRow 1.34 in src/core/config/world.js:17), and world.standPoint is a no-op for
   these models (no pivots, houseS 1). Net effect: new buildings render at authored
   size (house 1.30 tall) while neighbouring old tiles.glb houses are drawn 1.3x their
   authored size. The step-5 Hanoi tiles work the same way, so this is precedent, not
   a bug - but whether the grand buildings look big enough next to old houses is
   unproven until seen live. No walkability gap follows: the SDF collision field is
   built from the pieces as drawn.
3. Atlas re-encode shrank 2,629,244 -> 2,568,020 bytes - LIMITATION, cannot fully clear.
   Rects unchanged is necessary but not sufficient: pixel equality of the 194 existing
   sprites cannot be proven from this repo, because no pre-2A atlas.webp snapshot
   exists (HEAD webp is 2,915,206 bytes, the older pre-step-5 state; the claimed pre-2A
   size 2,629,244 is not recoverable from git). What I did verify: the current webp
   decodes cleanly, all 200 rects are intact with 0 overlaps, the 6 new sprites are
   drawn, and there are 0 stray pixels in the free zone. Any drift in existing sprites
   is bounded by a quality-90 re-encode; only a visual diff against the live pre-2A
   site could settle it.
4. build-basic-atlas.py is single-use - CONFIRMED, minor tooling debt.
   The script asserts each planned rect against every existing sprite rect and raises
   SystemExit('overlap: ...') before writing anything, so a re-run fails on its own
   6 sprites. Redrawing needs the 6 basic_* entries removed from atlas.json first,
   or an overwrite flag added.
5. Stale smoke for manor / village / village_b - the check-6 FAIL above. Small fixer
   round, not a solver/GLB/atlas problem.
6. Never seen on screen - UNVERIFIED, same as the manifest states. The art cards are
   procedural PIL drawings, not AI art; their real look, the die-cut silhouette against
   the flap stack, the fold animation, the swag/lamp/dormer shapes, the house-scale
   question (risk 2) and the smoke positions all need the parent fresh-browser check
   plus the user device check. The loader adopt path for basic-grand.glb was verified
   statically only; the actual fetch + adopt + render in default mode, and the
   confirmed non-fetch in ?map=hanoi mode, need a live check.

## Recommendation

Fixer round first, then push. The round is small and scoped to one issue: the stale
chimney smoke offsets for manor, village and village_b (check 6). Everything else
passes with independent recomputation: solver 48/95 with byte-identical registry blocks,
GLB contract exact (13,476 tris, 0 degenerate, uv1 exact, footprints inside), atlas
200 sprites with 0 overlaps and 0 pre-existing rects changed, loader gating and
fallbacks traced safe, build + check:hanoi green, 0 long dashes, Hanoi mode isolated.
After the smoke fix, re-run only `npm run build` + `npm run check:hanoi` (no GLB/atlas
re-verification needed if the fix touches life.js only); the live browser + user device
checks remain the decider for look, scale and smoke placement.
