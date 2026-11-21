// Step 3 check: WFC solver option count (derived exactly the way src/world/tiles.js does),
// Hanoi grid socket consistency, and Hanoi-only model wiring.
// Run: node tools/check-solver-options.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
import { readFileSync } from 'node:fs';
import { OPTIONS, TILES, getTile, socketsOf } from '../src/world/tiles.js';
import { MODELS } from '../src/core/models.js';
import { createHanoi } from '../src/world/hanoi.js';
import { HANOI_MODELS, HANOI_MODEL_IDS, getHanoiTile, hanoiSocketsOf } from '../src/world/hanoi-models.js';
import { HANOI_LANDMARKS } from '../src/world/hanoi-map.js';

let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (!ok) fail++;
};

// 1. Solver options: exactly the tiles.js derivation (OPTIONS is built by tiles.js itself).
check(OPTIONS.length <= 96, 'solver options ' + OPTIONS.length + ' <= 96 (cap)');
check(TILES.length === 48, 'stock TILES still 48, got ' + TILES.length);
check(Object.keys(MODELS).length === 48, 'MODELS still 48 entries, got ' + Object.keys(MODELS).length);
check(!Object.keys(MODELS).some((id) => id.startsWith('hanoi_')), 'no hanoi_ id in MODELS');
for (const id of HANOI_MODEL_IDS) check(!MODELS[id], 'hanoi model ' + id + ' is Hanoi-only, not in MODELS');

// 2. Every Hanoi model has a recipe in loader.js (static text check; loader.js needs three + DOM).
const loaderSrc = readFileSync(new URL('../src/assets/loader.js', import.meta.url), 'utf8');
for (const id of HANOI_MODEL_IDS) {
  check(new RegExp('^  ' + id + ': \\[', 'm').test(loaderSrc), 'RECIPES has ' + id);
}

// 3. Hanoi grid socket consistency: every shared edge must agree (Step 2 check, must stay 0).
const hanoi = createHanoi({ seed: 1 });
let mismatches = 0;
for (let z = -20; z <= 19; z++) {
  for (let x = -20; x <= 19; x++) {
    const c = hanoi.get(x, z);
    const e = hanoi.get(x + 1, z);
    const s = hanoi.get(x, z + 1);
    if (x < 19 && c.sockets.e !== e.sockets.w) { mismatches++; console.log('  mismatch E ' + x + ',' + z + ' ' + c.tileId + ' e=' + c.sockets.e + ' vs ' + e.tileId + ' w=' + e.sockets.w); }
    if (z < 19 && c.sockets.s !== s.sockets.n) { mismatches++; console.log('  mismatch S ' + x + ',' + z + ' ' + c.tileId + ' s=' + c.sockets.s + ' vs ' + s.tileId + ' n=' + s.sockets.n); }
  }
}
check(mismatches === 0, 'Hanoi grid socket mismatches: ' + mismatches);

// 4. Every landmark anchor resolves to its Hanoi model, with the stand-in's sockets at the same rot.
const STAND_IN = {
  hanoi_turtletower: ['pond', 0], hanoi_ngocson: ['manor', 1], hanoi_thehuc: ['bridge', 1],
  hanoi_tranquoc: ['manor', 0], hanoi_mausoleum: ['barn_farm', 0], hanoi_badinh: ['market_square', 0],
  hanoi_vanmieu: ['manor', 0], hanoi_onepillar: ['blossom_gazebo', 1], hanoi_cathedral: ['church', 0],
  hanoi_opera: ['manor', 0], hanoi_longbien: ['bridge', 1],
  hanoi_tubehouse: ['village', 0], hanoi_tubehouse_b: ['village_b', 0], hanoi_tubehouse_green: ['village_green', 0],
  // Phase 2B street elements: each copies the sockets + tags of the cell it replaces.
  hanoi_road: ['path_cross', 0], hanoi_sidewalk: ['meadow', 0], hanoi_tree: ['meadow', 0],
  hanoi_bush: ['meadow', 0], hanoi_trafficlight: ['path_end', 2], hanoi_police: ['village_green', 1],
  hanoi_pedestrian: ['village', 1], hanoi_vendor: ['meadow', 0], hanoi_phostall: ['meadow', 0],
  hanoi_pole: ['meadow', 0], hanoi_lamp: ['meadow', 0],
  // Phase 3A street elements: each copies the sockets + tags of the cell it replaces.
  hanoi_cornerhouse: ['path_cross', 0],
  hanoi_sign_phoco: ['meadow', 0], hanoi_sign_biahoi: ['meadow', 0],
  hanoi_sign_trucbach: ['meadow', 0], hanoi_sign_paramount: ['meadow', 0],
  hanoi_flag: ['meadow', 0], hanoi_banner: ['meadow', 0], hanoi_sautree: ['meadow', 0],
  hanoi_bike_red: ['meadow', 0], hanoi_bike_blue: ['meadow', 0], hanoi_bike_black: ['meadow', 0],
  hanoi_mural: ['meadow', 0], hanoi_alley: ['meadow', 0],
  hanoi_vendor_street: ['village', 1], hanoi_phostall_street: ['village', 1],
  hanoi_pole_street: ['village', 0],
  // Phase 3B lake models: each copies the sockets + tags of the cell it replaces.
  hanoi_pond_guom: ['pond', 0], hanoi_pond_tay: ['pond', 0], hanoi_lotus: ['pond', 0],
  hanoi_stonebridge: ['path_straight', 1], hanoi_pentower: ['watchtower', 3],
  hanoi_mausoleum_wing: ['barn_farm', 0],
};
for (const [id, [standIn, rot]] of Object.entries(STAND_IN)) {
  const a = hanoiSocketsOf(id, rot);
  const b = socketsOf(standIn, rot);
  check(JSON.stringify(a) === JSON.stringify(b), id + ' sockets rot ' + rot + ' match ' + standIn + ': ' + JSON.stringify(a));
  const t = getHanoiTile(id);
  const st = getTile(standIn);
  // Phase 2B: some street models intentionally differ from their meadow stand-in (tags
  // ['open'] would be wrong for a stall or a lamp). 'open' is only vocabulary - no code
  // reads it - and none of these carry 'house', 'water' or 'blocker', so walkability and
  // the book bake behave exactly like the meadow they replace. hanoi_pedestrian drops
  // 'house' + 'blocker' from village so the main street stays walkable.
  const EXPECTED_TAGS = {
    hanoi_sidewalk: [], hanoi_tree: [], hanoi_bush: [],
    hanoi_vendor: ['village'], hanoi_phostall: ['village'], hanoi_pole: ['village'], hanoi_lamp: ['village'],
    hanoi_pedestrian: ['path', 'village'],
    // Phase 3A: street furniture keeps the 'village' tag like the 2B pieces; the
    // trees, mural and alley keep the bare meadow tags (no 'open' vocabulary).
    hanoi_sign_phoco: ['village'], hanoi_sign_biahoi: ['village'],
    hanoi_sign_trucbach: ['village'], hanoi_sign_paramount: ['village'],
    hanoi_flag: ['village'], hanoi_banner: ['village'],
    hanoi_bike_red: ['village'], hanoi_bike_blue: ['village'], hanoi_bike_black: ['village'],
    hanoi_sautree: [], hanoi_mural: [], hanoi_alley: [],
    hanoi_vendor_street: ['path', 'village'], hanoi_phostall_street: ['path', 'village'],
    // Phase 3B: the tower stands in for a pond (sockets) but keeps its landmark tags.
    hanoi_turtletower: ['path', 'landmark', 'blocker'],
  };
  const wantTags = EXPECTED_TAGS[id] || st.tags;
  check(JSON.stringify(t.tags) === JSON.stringify(wantTags), id + ' tags match ' + standIn + ': ' + JSON.stringify(t.tags));
}
const ANCHOR_MODEL = {
  hoankiem: 'hanoi_turtletower', ngocson: 'hanoi_ngocson', westlake: 'hanoi_pond_tay', tranquoc: 'hanoi_tranquoc',
  mausoleum: 'hanoi_mausoleum', vanmieu: 'hanoi_vanmieu', onepillar: 'hanoi_onepillar',
  cathedral: 'hanoi_cathedral', opera: 'hanoi_opera', longbien: 'hanoi_longbien',
};
for (const [lm, model] of Object.entries(ANCHOR_MODEL)) {
  const [ax, az] = HANOI_LANDMARKS[lm].anchor;
  const cell = hanoi.get(ax, az);
  check(cell.tileId === model && cell.model === model, lm + ' anchor (' + ax + ',' + az + ') is ' + model + ', got ' + cell.tileId);
  check(cell.landmarkId === lm, lm + ' anchor landmarkId is ' + lm + ', got ' + cell.landmarkId);
}
// Long Bien second cell + The Huc bridge cell.
check(hanoi.get(18, -6).tileId === 'hanoi_longbien', 'longbien second cell (18,-6) is hanoi_longbien');
check(hanoi.get(3, -2).tileId === 'hanoi_thehuc', 'thehuc cell (3,-2) is hanoi_thehuc');
check(hanoi.get(-12, 5).tileId === 'hanoi_badinh', 'badinh cell (-12,5) is hanoi_badinh');
// Old Quarter street cells: 19 tubehouse cells in step 3, minus 4 replaced by Phase 2B
// street elements (1 police + 3 pedestrians on the z = -6 main street), minus 3
// replaced by Phase 3A (pole_street at (-6,-9), street pho stall at (-8,-6),
// street vendor at (2,-6)), minus 2 flooded by the Phase 3B lake
// (tubehouse_b at (-2,-6), tubehouse at (0,-6)). The corner house at (-6,-6)
// replaced a road cell, not a tubehouse, so it does not count in 19 - 4 - 3 - 2 = 10.
let stockVillage = 0;
let tubeCells = 0;
for (let z = -9; z <= -3; z++) {
  for (let x = -8; x <= 2; x++) {
    const c = hanoi.get(x, z);
    if (['village', 'village_b', 'village_green'].includes(c.tileId)) stockVillage++;
    if (c.tileId.startsWith('hanoi_tubehouse')) tubeCells++;
  }
}
check(stockVillage === 0, 'no stock village ids left in oldquarter rect, got ' + stockVillage);
check(tubeCells === 10, 'oldquarter tubehouse cells: ' + tubeCells + ' (19 minus 4 street elements minus 3 phase 3A minus 2 flooded by the lake)');
check(HANOI_MODEL_IDS.length === 47, 'Hanoi-only models: ' + HANOI_MODEL_IDS.length);
// Phase 2B + 3A: all street-element cells resolve to their model at the planned coords.
// 3A moved 2 of the 2B cells (road (-6,-6) is now the corner house, tree (-8,-4) is now
// a vendor) and added 2 lakeside sidewalks, 1 pole, 4 lamps and 1 vendor of the same models.
const STREET_CELLS = {
  // Phase 3B: the (-3,-6) road junction is gone - the street ends at the lake (path_t).
  // Flooded sidewalks (0,-7), (-2,-5) are replaced by the new promenade ring cells.
  hanoi_sidewalk: [[-5, -7], [-2, -8], [0, -8], [-2, 5], [0, 5], [4, -4], [4, -3]],
  hanoi_flag: [[-2, -7]], // 3B fix round: promenade NW corner is a flag now, not a bare sidewalk
  hanoi_tree: [[-8, -9], [-4, -9], [1, -9]],
  hanoi_bush: [[-7, -9], [-5, -9], [-2, -9], [0, -9], [2, -9]],
  hanoi_trafficlight: [[-6, -3], [-3, -3]],
  hanoi_police: [[5, -6]], // Phase 3B: moved off the flooded (-1,-6) to the east main street
  hanoi_pedestrian: [[-7, -6], [-4, -6], [4, -6]], // Phase 3B: (1,-6) flooded, moved to (4,-6)
  hanoi_vendor: [[-8, -5], [-8, -4]],
  hanoi_phostall: [[2, -5]],
  hanoi_pole: [[-8, -8], [2, -8], [0, 6]], // Phase 3B: (0,-3) flooded, moved to (0,6)
  hanoi_lamp: [[-5, -5], [2, 6], [-4, -7], [2, 3], [2, 4], [2, 5], [3, 2]], // Phase 3B: (1,-5) flooded, moved to (2,6)
};
let streetCells = 0;
for (const [model, cells] of Object.entries(STREET_CELLS)) {
  for (const [x, z] of cells) {
    streetCells++;
    const c = hanoi.get(x, z);
    check(c.tileId === model, model + ' at (' + x + ',' + z + '), got ' + c.tileId);
  }
}
check(streetCells === 35, 'street-element cells: ' + streetCells + ' (expected 35)');
// No legend id silently falls back to meadow: every cell tileId resolves in one of the two registries.
let unresolved = 0;
for (let z = -20; z <= 19; z++) {
  for (let x = -20; x <= 19; x++) {
    const c = hanoi.get(x, z);
    if (!getHanoiTile(c.tileId) && !MODELS[c.tileId]) unresolved++;
  }
}
check(unresolved === 0, 'all 1600 cells resolve in MODELS or HANOI_MODELS, unresolved: ' + unresolved);

console.log(fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
