# Phase 2B verification - Hanoi streets + bigger landmarks + proximity info cards (independent verifier)

Date: 2026-11-21. Verifier work only: no source file edited, nothing committed, nothing pushed.
Working tree: local git HEAD 4ec66a3, steps 5-7 + 2A + 2B content all uncommitted on top.
All checks below are fresh scripts written for this verification in /tmp/2b-verify/
(solver.mjs, reach-step3.mjs, glb.py, atlas_mirror.py, content.mjs, info-card.mjs,
discover-all.mjs). The fixer's own tools/check-2b.mjs, tools/check-solver-options.mjs and
tools/step5/verify-glb.mjs were read for format and run only as cross-checks at the end;
no verdict below rests on them. One correction to my own first runs: my atlas-mirror
regex swallowed the single-line `bridge` recipe block and missed `hanoi_turtletower`,
and my info-card walk-away test first used (0,0), which is inside Hoan Kiem discovery
range - both were script errors, fixed, and the corrected runs pass cleanly. Both are
recorded here so the parent can see the first-run failures were mine, not the code's.

## Verdicts (one line each, detail below)

- 1. Registry / solver 48 / 95 / 25 - PASS
- 2. Map: 1600 cells, 0 mismatches, 30 street cells, anchors unchanged, reachability up - PASS
- 3. GLB: 25 nodes, 54,632 tris, 0 degenerate, tallest 1.49, art uv1 exact - PASS
- 4. Landmark growth +2/+3, loader/builder mirror 25/25, hero sizes match - PASS
- 5. Atlas: 200 sprites, 0 overlaps, rects match records, 0 HEAD rects changed - PASS
- 6. Info-card content: exact match vs doc on all 10 landmarks - PASS
- 7. Info-card logic: open / re-open / close / walk-away, no new key, no modal gate - PASS
- 8. Loader: figure + glowtop, gating intact, no-throw paths - PASS
- 9. 2A regression: check-basic passes, basic-grand size matches, smoke fix intact - PASS
- 10. Build + checks: bundle hash matches claim, check:hanoi 161, node --check 9/9 - PASS
- 11. Long dashes / diacritics: 0 in all 2B files - PASS
- 12. Impeccable detect - UNVERIFIED (tool hangs, third consecutive time)
- 13. Live browser render + real-DOM behaviour + FPS - UNVERIFIED (no browser in sandbox)

## 1. Registry / solver - PASS

- Fresh import of the real registry (/tmp/2b-verify/solver.mjs): MODELS 48, TILES 48,
  OPTIONS 95 (cap 96), no hanoi_ id in MODELS, Hanoi registry 25.
- Hanoi ids (25): hanoi_turtletower, hanoi_ngocson, hanoi_thehuc, hanoi_tranquoc,
  hanoi_tubehouse, hanoi_tubehouse_b, hanoi_tubehouse_green, hanoi_mausoleum,
  hanoi_badinh, hanoi_vanmieu, hanoi_onepillar, hanoi_cathedral, hanoi_opera,
  hanoi_longbien, hanoi_road, hanoi_sidewalk, hanoi_tree, hanoi_bush,
  hanoi_trafficlight, hanoi_police, hanoi_pedestrian, hanoi_vendor, hanoi_phostall,
  hanoi_pole, hanoi_lamp.

## 2. Map - PASS

- Fresh import of the real provider (solver.mjs): size 1600, all cells resolve in MODELS
  or HANOI_MODELS (unresolved 0), socket mismatches 0 over the full grid.
- All 30 street cells resolve to the claimed model at the claimed coords, all inside the
  Old Quarter rect (x -8..2, z -9..-3); a full-grid scan finds 0 street-model cells
  outside the claimed list. Counts per model: road 2, sidewalk 6, tree 4, bush 5,
  trafficlight 2, police 1, pedestrian 3, vendor 1, phostall 1, pole 2, lamp 3.
- All 10 anchors unchanged vs the documented values: hoankiem (-1,-2), ngocson (5,-2),
  westlake (-9,-11), oldquarter (-6,-6), mausoleum (-12,3), vanmieu (-8,11),
  onepillar (-8,4), cathedral (7,-1), opera (9,7), longbien (17,-6). Anchor cells carry
  the right landmarkId and (except oldquarter) the right anchor model. Note: the
  oldquarter anchor cell (-6,-6) is now hanoi_road (was path_cross); its landmarkId is
  still oldquarter and it is walkable, so discovery still works (see check 7).
- Tubehouse cells in the Old Quarter rect: 15 (19 minus 4 replaced by police/pedestrian
  on the z = -6 main street). Stock village ids in the rect: 0.
- Reachability BFS from spawn (0,0), recomputed both on the current map and on the
  step-3 (git HEAD) map with the same code (/tmp/2b-verify/reach-step3.mjs):
  step-3 !blocker 1070, !blocker+!water 995; current !blocker 1073,
  !blocker+!water 998. Reachability went UP by 3, not down: the 3 blocker tubehouse
  cells at (-7,-6), (-4,-6), (1,-6) became walkable pedestrians. Lost cells: none.
  Gained: (-4,-6), (1,-6), (-7,-6). All 10 landmarks are reachable-adjacent from spawn.
  The step-2 baseline 999 was counted on the v0 map, not the step-3 map (995), so 998
  vs 999 is not a 2B drop - the correct 2B comparison is step-3 995 -> current 998.
- Changed cells vs HEAD: exactly 30, all inside the Old Quarter rect (git diff of
  hanoi-map.js shows only the 6 Old Quarter rows changed).

## 3. GLB - PASS

- Fresh pure-Python parse (/tmp/2b-verify/glb.py, no three.js, no fixer script):
  file 2,496,552 bytes, GLB v2, header total equals file size, 25 top-level nodes with
  exactly the claimed names (all 14 pre-2B nodes present, same names, plus the 11 new
  street nodes).
- Triangles recomputed from indices: total 54,632, degenerate 0 (cross-product magnitude
  test per triangle). Per node: turtletower 2128, ngocson 2220, thehuc 2256, tranquoc
  2160, tubehouse 2144, tubehouse_b 2144, tubehouse_green 2156, mausoleum 2168,
  badinh 2192, vanmieu 2216, onepillar 2196, cathedral 2192, opera 2368, longbien 2268,
  road 2072, sidewalk 2060, tree 2096, bush 2288, trafficlight 2116, police 2224,
  pedestrian 2312, vendor 2296, phostall 2168, pole 2088, lamp 2104.
- Hinges: 139 total (112 landmark incl. 12 hero cards + 27 street), every hinge node
  carries extras.hinge with foldAngle (+/- pi/2), delay 0..1, layer and size (0.06..0.745)
  present on all 139. Base mesh present on all 25 nodes.
- Footprints (world matrices decoded): every flap max |x| and |z| inside the tile, every
  base spans exactly [-1, 1]. Tallest flap 1.49 (cathedral hero card), under the 1.5 cap.
  Next tallest: tranquoc hero 1.44, badinh flag pole 1.30, pole lamp 1.30.
- Art uv1 exact for all 12 hero cards vs the atlas rects (to 1e-4): turtletower, ngocson,
  thehuc, tranquoc, tubehouse (shared by tubehouse and tubehouse_b), mausoleum, vanmieu,
  onepillar, cathedral, opera, longbien. tubehouse_green, badinh and all 11 street
  models correctly have no art mesh.
- Shape sanity (vertex counts from the GLB): trafficlight lamp/glowtop flaps 84 verts vs
  plain rect 36; pedestrian figure flaps 264 verts (ellipse head built, not a rect);
  pole lamp flap 84 verts. Base prints: road base 70 near-white verts (5 zebra columns x
  2 bands, exact); sidewalk base 957 paperShade + 132 terracotta kerb verts (exact).

## 4. Landmark growth + loader/builder mirror - PASS

- Loader RECIPES vs GLB-builder RECIPES, compared entry by entry with my own line-based
  extractor (/tmp/2b-verify/atlas_mirror.py): model sets identical (25/25), text
  identical for all 25 after whitespace normalisation.
- Growth vs step-3 loader (git HEAD), counted from the real files: turtletower 4 -> 6,
  ngocson 6 -> 8, thehuc 3 -> 5, tranquoc 7 -> 9, tubehouse 5 -> 7, tubehouse_b 4 -> 6,
  tubehouse_green 5 -> 7, mausoleum 7 -> 9, badinh 5 -> 7, vanmieu 6 -> 8,
  onepillar 4 -> 6, cathedral 5 -> 7, opera 6 -> 9 (+3), longbien 4 -> 6. Every
  landmark grew by +2 or +3, exactly matching the manifest table.
- Hero card sizes in the builder HERO table match the manifest table exactly:
  turtletower 0.72x1.22, ngocson 1.30x1.08, thehuc 1.60x0.585, tranquoc 0.78x1.44,
  tubehouse 0.68x1.13, mausoleum 1.20x1.14, vanmieu 1.30x1.19, onepillar 0.80x1.28,
  cathedral 1.38x1.49, opera 1.42x1.02, longbien 1.60x0.75.
- Minor note (not a fail): hero card aspect vs sprite rect aspect differs by up to
  0.43% (worst turtletower 0.5902 vs 0.5927), so the sprite is stretched very slightly
  onto the card; the manifest's "same aspect ratio" is approximate, not exact. Invisible
  at this size, but the claim is overstated by that much.
- Minor note (not a fail): the sidewalk kerb differs slightly between the two mirrors -
  loader baseTexture paints kerb lines 3% of the tile edge, the GLB builder paints
  terracotta where |z| > 0.93 (3.5%), and the loader's joint lines have no GLB
  counterpart. Placeholder vs GLB look will differ by a hairline on that one tile.

## 5. Atlas - PASS

- Fresh check (/tmp/2b-verify/atlas_mirror.py): live sprite count 200; all 200 rects
  inside 4096x4096; pairwise overlap over all 200 rects: NONE.
- The 11 hanoi_* rects match the step-5 builder SPRITES table exactly, and the 6 basic_*
  rects match the 2A verification doc values exactly (townhouse [16,3395,294,333],
  grandmanor [326,3395,384,358], greatbarn [726,3395,384,358], marketstreet
  [16,3769,410,282], gardencottage [442,3769,358,256], townsquare [816,3769,410,282]).
  Aspect fields equal rect w/h for all 11 hanoi sprites.
- Pre-2B rects: vs git HEAD atlas (183 sprites, step 3): 0 removed, 0 rects changed.
  New keys vs HEAD are exactly the 17 expected (11 hanoi_* + 6 basic_*).
- Caveats, stated plainly: the hanoi_* rect values have no independent record beyond the
  builder's own SPRITES table (no step-5 verification doc lists them), so this check
  proves atlas.json == builder table and GLB uv1 == builder table, not atlas.json ==
  some third record. Atlas pixel equality vs the pre-2B file cannot be proven from this
  repo (no pre-2B atlas.webp snapshot exists). What bounds it: atlas.webp is byte-size
  identical to the 2A state (2,568,020 bytes, mtime 02:08), so 2B did not re-encode it.

## 6. Info-card content - PASS

- Fresh script (/tmp/2b-verify/content.mjs) re-parses docs/landmark-history.md
  independently (headings, History EN/VI lists, fun-fact paragraphs, Source lines) and
  imports the real src/game/landmark-history.js: 295 checks, 0 failures.
- For all 10 landmarks: name EN/VI, all 3 history lines EN + all 3 VI, fun fact EN + VI,
  and source URL all match the doc exactly, character for character.
- Every source URL is a well-formed https URL identical to the doc (9 Wikipedia, 1
  vietnamtourexpert.com for Ngoc Son).
- VI strings contain 0 Vietnamese diacritics; the file contains 0 long dashes and 0
  non-ASCII characters in total.
- Note: the checklist short names in src/game/landmarks.js (step-4 NAMES table) differ
  from the info-card names for two landmarks - "Pho Co" vs "Pho Co Ha Noi" and
  "Lang Chu Tich" vs "Lang Chu tich Ho Chi Minh". Pre-existing step-4 shorthand, not a
  2B change; cosmetic only, but the card and the checklist will show different names
  for the same landmark.

## 7. Info-card logic - PASS

- Fresh fake-DOM harness driving the REAL src/game/landmarks.js with the REAL
  createHanoi provider (/tmp/2b-verify/info-card.mjs, /tmp/2b-verify/discover-all.mjs):
  all checks pass (info-card.mjs all pass after fixing my own two test errors;
  discover-all.mjs 10/10).
- nearLandmark predicate (radius 1 Chebyshev + landmarkId 3x3) verified at 11 points,
  including the single-anchor cases: cathedral from (6,-1) true / (5,-1) false,
  onepillar from (-8,5) true / (-8,6) false, opera from (8,7) true, longbien from
  (16,-6) true, hoankiem at (2,-2) true via its rect cell (2,-1) / (3,-3) false.
- Discovery opens the card: walking to (6,-1) co-discovers Ngoc Son + Cathedral (count
  2) and the card shows the LAST discovered (cathedral), with title VI "Nha Tho Lon Ha
  Noi", title EN "St. Joseph's Cathedral", 3+3 history items, source href exact and
  label "Nguon: en.wikipedia.org". Co-discovery showing the last one is the pre-existing
  step-4 behaviour, documented in the manifest.
- All 10 landmarks discover from an adjacent walkable cell (discover-all.mjs): hoankiem
  (-2,-3 meadow), ngocson (4,-3), westlake (-9,-12), oldquarter (-7,-7 hanoi_sidewalk),
  mausoleum (-13,2), vanmieu (-9,10), onepillar (-9,3), cathedral (6,-2), opera (8,6),
  longbien (16,-7). Total 10/10. (One printed infoOpen=null after oldquarter is correct:
  oldquarter was already discovered on the first teleport, so no re-open, and the West
  Lake card correctly closed on walk-away in the same tick.)
- Checklist tap: tap on undiscovered opera does nothing; tap on discovered cathedral
  re-opens the card. openInfo() API: no-op for undiscovered, opens for discovered.
- Close paths: X button closes (and removes .show); header click toggles .collapsed on
  and off; walking to (0,10), far from every landmark, auto-closes the card;
  settle() hides the card; closeInfo() closes it.
- No discovery before arming: a fresh instance with game.armed false at (6,-1) discovers
  0 and opens no card.
- Storage: storeKey is hanoi:v1:1; the only localStorage calls in landmarks.js are
  getItem/setItem on that one key; landmark-history.js has no storage calls at all.
  No new key.
- No modal gate: landmarks.js and landmark-history.js contain no reference to modal;
  game.modal() (src/game/index.js:46) is true only when the atlas map is open, and 2B
  does not touch it, so keyboard walking and tap-to-walk keep working while the card
  is open. main.js:90 still gates walking only on game.modal().
- CSS fit (read from index.html): card is body.hanoi-gated, position fixed, left 50%,
  bottom 21vh, width calc(100vw - 24px), max-width 360px, max-height 52vh, body
  overflow-y auto with max-height calc(52vh - 39px), z-index 7 above the toast (6).
  At a 390px viewport the card is 360px wide (15px margins each side) and scrolls
  inside itself; the page itself never scrolls (html, body overflow hidden). The card
  covers only its own rect, so taps outside it still reach the canvas. Whether the
  toast (bottom 11vh) and the card (bottom 21vh) overlap on a short real phone screen,
  and whether the card reads well at 390px, still need the live check (check 13).

## 8. Loader - PASS

- Read src/assets/loader.js directly: shapeFor has the new `figure` branch (straight body
  + round head, absellipse cap at 0.7h) and `glowtop` branch (0.015 stem + lit box at
  0.84h), with the same constants as the GLB builder's shapeFor in
  tools/step5/build-hanoi-glb.mjs (read both - identical math). `lamp` kind exists in
  both as well.
- RECIPES present in loader.js for all 25 Hanoi models (confirmed by the solver-script
  loader check and the mirror in check 4); baseTexture has the road zebra override
  (5 dashes x 2 bands) and the sidewalk pavement/kerb override, mirrored in the GLB
  builder's buildBase (same world coords: bands at z +/-0.55, stripes at x -0.32..0.32;
  see the 3% vs 3.5% kerb note in check 4).
- Gating intact (loader.js:631): basic-grand.glb loads only when NOT Hanoi mode,
  hanoi-tiles.glb loads only in Hanoi mode; src/main.js:46-47 passes the ?map=hanoi
  flag; src/game/index.js:30 creates landmarks only when hanoi.
- No-throw paths traced: missing GLB node -> `if (!node) continue` keeps the
  placeholder; node with no base or 0 hinges -> warn + continue; adopt() throws ->
  try/catch warns; unknown model id -> placeholder tile via FALLBACK_MODEL. The
  `figure`/`glowtop` kinds fall through the same flapGeometry/shapeFor path as the
  existing kinds, and the GLB vertex counts (check 3) prove the shapes build.
- The `open` tag: no code reads it. The only tag reads in src/ are `house` (life.js),
  `water` (water.js) and `path` (book.js). The street models dropping `open` from
  their meadow stand-in therefore cannot change walkability, bake or water behaviour
  by that route. Walkability itself changed only where intended: the 3 pedestrian
  cells dropped `house` + `blocker` (check 2).

## 9. 2A regression - PASS

- Ran tools/check-basic.mjs myself: ALL BASIC CHECKS PASSED (atlas 200 sprites).
- public/models/basic-grand.glb: 704,872 bytes, exactly the 2A size. sha256
  faed7ae32e228e746822c7e229116b68923bf2af879782a3047b90cee7a51796 - recorded here
  because the 2A verification doc recorded size only, no hash, so byte-identity vs the
  2A state cannot be proven from the record; size + check-basic passing is the evidence
  available.
- The 2A smoke fix is intact: src/core/config/life.js:43 still has manor: [], village:
  [], village_b: [] with the house chimney offset [0.4, 1.15, -0.29] unchanged.
- atlas.webp byte size is exactly the 2A value (2,568,020), so 2B did not re-encode it.
- Git status file list vs the 2A manifest: no 2A-only file carries a 2B change except
  src/assets/loader.js, which 2B legitimately extends (its 2A grand recipes are intact
  - check-basic verifies them). assets.js, life.js, biomes.js, traveller.js and the
  2A tool scripts show only the pre-2B baseline diff vs HEAD; their 2A invariants all
  still hold (basicGrandUrl line, smoke offsets, check-basic green). Caveat: because
  everything is uncommitted against HEAD 4ec66a3, git alone cannot separate a 2B edit
  to those files from the steps 5-7 + 2A baseline - the invariant checks above are the
  real evidence, and they all hold.

## 10. Build + checks - PASS

- Ran myself: `npm run build` - 61 modules transformed, dist/assets/index-DjTv2yFV.js,
  1,095.99 kB (gzip 331.03 kB), built in 852ms. Bundle hash matches the fixer claim
  exactly.
- Ran myself: `npm run check:hanoi` - ALL CHECKS PASSED, 161 PASS lines counted.
- node --check passes on all 9 changed/added .js/.mjs files: hanoi-models.js,
  hanoi-map.js, loader.js, landmark-history.js, landmarks.js, check-2b.mjs,
  check-solver-options.mjs, build-hanoi-glb.mjs, verify-glb.mjs.
- Cross-checks only (fixer's own tools, agreeing with my fresh numbers): check-2b.mjs
  334 PASS / 0 FAIL, verify-glb.mjs 200 PASS (total triangles 54,632, degenerate 0).

## 11. Long dashes / diacritics - PASS

- Python scan over all 12 2B files (hanoi-models.js, hanoi-map.js, loader.js,
  build-hanoi-glb.mjs, verify-glb.mjs, check-solver-options.mjs, check-2b.mjs,
  landmark-history.js, landmarks.js, index.html, phase-2b-manifest.md,
  landmark-history.md): long dashes (U+2013/U+2014) 0 in every file; Vietnamese
  diacritics 0 in every file. index.html has 6 non-ASCII characters total - the
  pre-existing middle dots in the upstream hint div; git diff shows no added/removed
  line containing them, so 2B did not touch that line.

## 12. Impeccable detect - UNVERIFIED (tool failure, not a code verdict)

- My run: `timeout 180 npx impeccable detect` in ~/workspace/hanoi-3d, 2026-11-21.
  Result: killed by timeout at 180 s, exit 124, zero stdout/stderr output
  (/tmp/2b-verify/impeccable.log is 0 bytes).
- Same outcome as the fixer's run (120 s, no output) and both 2A runs (~8.7 min and
  300 s, no output). No findings were produced by any run, so there is nothing to pass
  or fail here. This is a tool environment failure. The pre-existing step-7 findings
  (3 in hanoi-3d/index.html + 1 in the hub) are in files 2B touched only for the
  #lm-info block; whether that block introduces a new finding cannot be known until
  Impeccable produces output somewhere.
- Hallmark sloplint: not runnable (no such package on npm, 404) - known, per WORKFLOW doc.

## 13. Live browser - UNVERIFIED (no browser in this sandbox)

- No render at all: the look of the 11 street tiles, the bigger landmark heroes, the
  zebra/pavement prints, and the info card layout were verified by code, scripts and
  build only. The parent's fresh-browser check and the user device check remain the
  decider, as with every phase.
- Real-DOM behaviour not exercised: checklist tap re-open, X close, header collapse
  toggle and walk-away auto-close were proven only against my fake DOM (real modules,
  stub elements). A real browser must confirm the tap targets, the collapse toggle,
  and that the card does not cover the toast on a short phone screen.
- FPS impact of +24,308 triangles and 11 more tile nodes on the user device is unproven
  (phase 2E owns FPS). Whether the taller cathedral hero (1.49) visually crowds its
  neighbours at some camera angles is unproven.
- The loader adopt path for hanoi-tiles.glb in ?map=hanoi mode, and the confirmed
  non-fetch of basic-grand.glb there, were verified statically only.

## Minor notes for the parent (not fails, no fixer round needed for any of them)

- tools/check-solver-options.mjs STAND_IN table compares the street models at rot 0
  (trafficlight vs path_end rot 0, police/pedestrian vs village rot 0) while the map
  actually places trafficlight at rot 2 and police/pedestrian at rot 1. The full-grid
  0-mismatch check is the authoritative evidence and it passes, so this is a test
  weakness, not a code bug - but the STAND_IN comparison as written would not catch a
  rotation error on those three models. Worth fixing in the test in a follow-up.
- Hero card aspect is off by up to 0.43% vs the sprite rects (check 4), and the
  sidewalk kerb is 3% in the loader placeholder vs 3.5% in the GLB (check 4). Cosmetic.
- Checklist short names differ from info-card names for Old Quarter and Mausoleum
  (check 6). Cosmetic, pre-existing step-4 shorthand.

## Top 3 risks

1. Never seen on screen (check 13). Everything structural passes, but the street
   tiles, the enlarged heroes, the zebra/pavement prints and the info card have no
   live render yet. The 390px card + toast stacking and the cathedral hero at 1.49
   are the two things most likely to need a visual correction.
2. Impeccable has now hung three times with zero output (check 12). If it ever runs,
   the new #lm-info block in index.html is the one untested surface; until then the
   quality gate has a known hole that no fixer round can close from here.
3. Radius-1 co-discovery shows only the last discovered card (check 7). Standing at
   (6,-1) discovers Ngoc Son + Cathedral and the card shows Cathedral; standing at
   (-2,-3) discovers Hoan Kiem + Old Quarter and shows Old Quarter. Same behaviour as
   step 4 and documented, but the user may expect the card to match the landmark he
   thinks he walked to. The checklist tap re-open is the workaround, and it works.

## Recommendation

Proceed to the parent for push - no fixer round first. Every claim I could check
without a browser recomputes clean with fresh scripts: solver 48/95/25, map 1600/0
mismatches/30 street cells/anchors unchanged/reachability up 3, GLB 25 nodes /
54,632 tris / 0 degenerate / tallest 1.49, atlas 200 / 0 overlaps / 0 HEAD rects
changed, info content exact on all 10 landmarks, info logic proven end to end
against the real modules, loader gating and fallbacks traced safe, build +
check:hanoi green, 2A regression clean, 0 long dashes / 0 diacritics. The only
UNVERIFIED items are the live browser render, the real-DOM card behaviour and
Impeccable output - all three belong to the parent's browser check and the user
device check, not to another fixer round. Suggested follow-ups after push: fix the
STAND_IN rot table in check-solver-options.mjs, and keep the 390px card + toast
stacking on the live-check list.
