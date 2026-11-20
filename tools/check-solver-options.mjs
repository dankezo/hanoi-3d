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
  hanoi_turtletower: ['watchtower', 0], hanoi_ngocson: ['manor', 1], hanoi_thehuc: ['bridge', 1],
  hanoi_tranquoc: ['manor', 0], hanoi_mausoleum: ['barn_farm', 0], hanoi_badinh: ['market_square', 0],
  hanoi_vanmieu: ['manor', 0], hanoi_onepillar: ['blossom_gazebo', 1], hanoi_cathedral: ['church', 0],
  hanoi_opera: ['manor', 0], hanoi_longbien: ['bridge', 1],
  hanoi_tubehouse: ['village', 0], hanoi_tubehouse_b: ['village_b', 0], hanoi_tubehouse_green: ['village_green', 0],
};
for (const [id, [standIn, rot]] of Object.entries(STAND_IN)) {
  const a = hanoiSocketsOf(id, rot);
  const b = socketsOf(standIn, rot);
  check(JSON.stringify(a) === JSON.stringify(b), id + ' sockets rot ' + rot + ' match ' + standIn + ': ' + JSON.stringify(a));
  const t = getHanoiTile(id);
  const st = getTile(standIn);
  check(JSON.stringify(t.tags) === JSON.stringify(st.tags), id + ' tags match ' + standIn + ': ' + JSON.stringify(t.tags));
}
const ANCHOR_MODEL = {
  hoankiem: 'hanoi_turtletower', ngocson: 'hanoi_ngocson', westlake: 'hanoi_tranquoc',
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
// Old Quarter street cells all use the tubehouse family now (no stock village ids left in the rect).
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
check(tubeCells === 19, 'oldquarter tubehouse cells: ' + tubeCells + ' (was 19 village cells)');
check(HANOI_MODEL_IDS.length === 14, 'Hanoi-only models: ' + HANOI_MODEL_IDS.length);
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
