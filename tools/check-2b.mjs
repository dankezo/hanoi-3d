// Phase 2B check: street elements + bigger landmarks + proximity info cards.
// Run: node tools/check-2b.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
import { readFileSync } from 'node:fs';
import { OPTIONS, TILES } from '../src/world/tiles.js';
import { MODELS } from '../src/core/models.js';
import { createHanoi } from '../src/world/hanoi.js';
import { HANOI_MODELS, HANOI_MODEL_IDS, getHanoiTile } from '../src/world/hanoi-models.js';
import { HANOI_LANDMARKS } from '../src/world/hanoi-map.js';
import { createLandmarks, LANDMARKS, LANDMARK_RADIUS } from '../src/game/landmarks.js';
import { LANDMARK_INFO } from '../src/game/landmark-history.js';
import { TILE_SIZE } from '../src/core/config.js';

let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (!ok) fail++;
};

// 1. Solver + registries: untouched stock, Hanoi-only registry grew 14 -> 25 -> 41 (Phase 3A) -> 47 (Phase 3B).
check(TILES.length === 48, 'stock TILES still 48, got ' + TILES.length);
check(Object.keys(MODELS).length === 48, 'MODELS still 48 entries, got ' + Object.keys(MODELS).length);
check(OPTIONS.length === 95, 'solver options ' + OPTIONS.length + ' (expected 95, cap 96)');
check(OPTIONS.length <= 96, 'solver options ' + OPTIONS.length + ' <= 96 (cap)');
check(HANOI_MODEL_IDS.length === 47, 'Hanoi-only models: ' + HANOI_MODEL_IDS.length + ' (expected 47)');
for (const id of HANOI_MODEL_IDS) check(!MODELS[id], 'hanoi model ' + id + ' is Hanoi-only, not in MODELS');

// 2. Grid: 0 socket mismatches, all 1600 cells resolve, all 35 street cells resolve.
const hanoi = createHanoi({ seed: 1 });
let mismatches = 0;
for (let z = -20; z <= 19; z++) {
  for (let x = -20; x <= 19; x++) {
    const c = hanoi.get(x, z);
    const e = hanoi.get(x + 1, z);
    const s = hanoi.get(x, z + 1);
    if (x < 19 && c.sockets.e !== e.sockets.w) mismatches++;
    if (z < 19 && c.sockets.s !== s.sockets.n) mismatches++;
  }
}
check(mismatches === 0, 'Hanoi grid socket mismatches: ' + mismatches);
let unresolved = 0;
for (let z = -20; z <= 19; z++) {
  for (let x = -20; x <= 19; x++) {
    const c = hanoi.get(x, z);
    if (!getHanoiTile(c.tileId) && !MODELS[c.tileId]) unresolved++;
  }
}
check(unresolved === 0, 'all 1600 cells resolve in MODELS or HANOI_MODELS, unresolved: ' + unresolved);
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
    check(hanoi.get(x, z).tileId === model, model + ' at (' + x + ',' + z + ')');
  }
}
check(streetCells === 35, 'street-element cells: ' + streetCells + ' (expected 35)');
// Phase 3A spreads the Old Quarter vibe past the rect on purpose (user direction):
// lakeside lamps + sidewalks along the NEW lake edge (x 2..4, z 2..5) follow the 3B
// lake edge, not the old lake. Phase 3B adds the relocated street cells (police +
// pedestrian on the east main street, pole + lamp + sidewalks on the new promenade).
// Every other street cell stays inside the rect.
const SPILL = new Set(['4,-4', '4,-3', '2,3', '2,4', '2,5', '3,2', '5,-6', '4,-6', '0,6', '2,6', '-2,5', '0,5']);
for (const cells of Object.values(STREET_CELLS)) {
  for (const [x, z] of cells) {
    const inside = x >= -8 && x <= 2 && z >= -9 && z <= -3;
    check(inside || SPILL.has(x + ',' + z), 'street cell (' + x + ',' + z + ') inside Old Quarter rect or documented 3A spillover');
  }
}

// 3. Landmark anchors unchanged, landmarkIds intact.
const ANCHORS = {
  hoankiem: [-1, -1], ngocson: [5, -2], westlake: [-9, -11], tranquoc: [-13, -12], oldquarter: [-6, -6],
  mausoleum: [-12, 3], vanmieu: [-8, 11], onepillar: [-8, 4], cathedral: [7, -1],
  opera: [9, 7], longbien: [17, -6],
};
for (const [id, [ax, az]] of Object.entries(ANCHORS)) {
  const [mx, mz] = HANOI_LANDMARKS[id].anchor;
  check(mx === ax && mz === az, id + ' anchor still (' + ax + ',' + az + ')');
  check(hanoi.get(ax, az).landmarkId === id, id + ' anchor landmarkId is ' + id);
}
check(LANDMARKS.length === 11, 'LANDMARKS still 11, got ' + LANDMARKS.length);
check(LANDMARK_RADIUS === 1, 'discovery radius still 1, got ' + LANDMARK_RADIUS);

// 4. Info content: every card has EN+VI names, 3+3 history lines, EN+VI fun fact and a source
// URL, and every string is EXACTLY the text in docs/landmark-history.md (independent parse).
const doc = readFileSync(new URL('../docs/landmark-history.md', import.meta.url), 'utf8');
function parseDoc(md) {
  const out = {};
  const chunks = md.split(/\n## /).slice(1);
  for (const chunk of chunks) {
    const head = chunk.match(/^(\w+) - (.+)$/m);
    if (!head) continue;
    const id = head[1];
    const names = head[2].split(' / ');
    const section = (title) => {
      const i = chunk.indexOf('### ' + title);
      if (i < 0) return null;
      const rest = chunk.slice(i + ('### ' + title).length);
      const end = rest.search(/\n### /);
      return (end < 0 ? rest : rest.slice(0, end)).trim();
    };
    if (!section('History (EN)')) continue; // skips the "Notes" section, not a landmark
    const bullets = (text) => (text || '').split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
    const para = (text) => (text || '').split('\n').filter((l) => l.trim() !== '').join(' ').trim();
    out[id] = {
      nameEN: names[0].trim(), nameVI: (names[1] || '').trim(),
      histEN: bullets(section('History (EN)')), histVI: bullets(section('History (VI)')),
      funEN: para(section('Fun fact (EN)')), funVI: para(section('Fun fact (VI)')),
      source: (section('Source') || '').split('\n').filter((l) => l.trim() !== '')[0].trim(),
    };
  }
  return out;
}
const fromDoc = parseDoc(doc);
check(Object.keys(fromDoc).length === 11, 'doc parses to 11 landmarks, got ' + Object.keys(fromDoc).length);
for (const def of LANDMARKS) {
  const info = LANDMARK_INFO[def.id];
  const want = fromDoc[def.id];
  check(!!info, def.id + ': info card exists');
  if (!info || !want) continue;
  check(info.nameEN === want.nameEN, def.id + ': nameEN matches doc ("' + info.nameEN + '")');
  check(info.nameVI === want.nameVI, def.id + ': nameVI matches doc ("' + info.nameVI + '")');
  check(JSON.stringify(info.histEN) === JSON.stringify(want.histEN), def.id + ': 3 EN history lines match doc exactly');
  check(JSON.stringify(info.histVI) === JSON.stringify(want.histVI), def.id + ': 3 VI history lines match doc exactly');
  check(info.funEN === want.funEN, def.id + ': EN fun fact matches doc exactly');
  check(info.funVI === want.funVI, def.id + ': VI fun fact matches doc exactly');
  check(info.source === want.source, def.id + ': source URL matches doc exactly (' + info.source + ')');
  check(/^https:\/\//.test(info.source), def.id + ': source is an https URL');
}
check(JSON.stringify(Object.keys(LANDMARK_INFO).sort()) === JSON.stringify(Object.keys(fromDoc).sort()),
  'info ids match doc ids exactly');
// The whole info module must be pure ASCII (VI without diacritics, no long dashes).
const infoSrc = readFileSync(new URL('../src/game/landmark-history.js', import.meta.url), 'utf8');
check(!/[^\x00-\x7F]/.test(infoSrc), 'landmark-history.js is pure ASCII (no diacritics)');
check(!/[\u2013\u2014]/.test(infoSrc), 'landmark-history.js has no long dashes');

// 5. Loader RECIPES mirror the GLB build RECIPES (same flap count per Hanoi model, both files).
// Each recipe entry is one line starting with 4 spaces + '[' or 'tree(' or 'tuft('.
function recipeCounts(src) {
  const out = {};
  const re = /^  (hanoi_\w+): \[$/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const id = m[1];
    const start = m.index + m[0].length;
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') depth--;
      i++;
    }
    const block = src.slice(start, i);
    const entries = block.split('\n').filter((l) => /^    (\[|tree\(|tuft\()/.test(l));
    out[id] = entries.length;
  }
  return out;
}
const loaderSrc = readFileSync(new URL('../src/assets/loader.js', import.meta.url), 'utf8');
const buildSrc = readFileSync(new URL('../tools/step5/build-hanoi-glb.mjs', import.meta.url), 'utf8');
const loaderRecipes = recipeCounts(loaderSrc);
const buildRecipes = recipeCounts(buildSrc);
for (const id of HANOI_MODEL_IDS) {
  check(loaderRecipes[id] > 0, 'loader RECIPES has ' + id + ' (' + (loaderRecipes[id] || 0) + ' flaps)');
  check(buildRecipes[id] > 0, 'GLB build RECIPES has ' + id + ' (' + (buildRecipes[id] || 0) + ' flaps)');
  check(loaderRecipes[id] === buildRecipes[id], id + ': loader (' + loaderRecipes[id] + ') mirrors GLB build (' + buildRecipes[id] + ')');
}
// Landmark upgrades: every landmark recipe is bigger than step 3 (flap counts grew).
const STEP3 = {
  hanoi_turtletower: 4, hanoi_ngocson: 6, hanoi_thehuc: 3, hanoi_tranquoc: 7, hanoi_tubehouse: 5,
  hanoi_tubehouse_b: 4, hanoi_tubehouse_green: 5, hanoi_mausoleum: 7, hanoi_badinh: 5,
  hanoi_vanmieu: 6, hanoi_onepillar: 4, hanoi_cathedral: 5, hanoi_opera: 6, hanoi_longbien: 4,
};
for (const [id, old] of Object.entries(STEP3)) {
  check(loaderRecipes[id] > old, id + ': recipe grew ' + old + ' -> ' + loaderRecipes[id] + ' flaps');
}

// 6. Atlas: the 6 sign-text sprites were added in the Phase 3A fix round
// (206 total, was 200); no sprite rect overlaps another.
const atlas = JSON.parse(readFileSync(new URL('../public/textures/art/atlas.json', import.meta.url), 'utf8'));
check(Object.keys(atlas.sprites).length === 206, 'atlas sprites 206 (200 + 6 sign texts), got ' + Object.keys(atlas.sprites).length);
const overlap = (a, b) => !(a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1]);
let overlaps = 0;
const entries = Object.entries(atlas.sprites);
for (let i = 0; i < entries.length; i++) {
  for (let j = i + 1; j < entries.length; j++) {
    if (overlap(entries[i][1].rect, entries[j][1].rect)) overlaps++;
  }
}
check(overlaps === 0, 'atlas sprite overlaps: ' + overlaps);

// 7. Radius-1 discovery, headless: no discovery before arming, every landmark discovers
// from an adjacent walkable cell, and the nearLandmark predicate is false far away.
const game = { armed: false };
const traveller = { position: { x: 0, z: 0 }, moveDir: { x: 0, z: -1 } };
const lm = createLandmarks({ traveller, progress: null, wfc: hanoi, seed: 1, persist: false, game });
const walkable = (x, z) => {
  const c = hanoi.get(x, z);
  // 3B fix round (W1): a bridge cell is walkable in-game (deck clearance kind 2),
  // even though its tags carry 'water' - the check rule matches the game now.
  return c.tags.includes('bridge') || (!c.tags.includes('blocker') && !c.tags.includes('water'));
};
lm.update(0.016);
check(lm.count() === 0, 'no discovery before arming (spawn), count ' + lm.count());
game.armed = true;
for (const def of LANDMARKS) {
  const [ax, az] = def.cell;
  let spot = null;
  for (let dz = -1; dz <= 1 && !spot; dz++) {
    for (let dx = -1; dx <= 1 && !spot; dx++) {
      if (dx === 0 && dz === 0) continue;
      if (walkable(ax + dx, az + dz)) spot = [ax + dx, az + dz];
    }
  }
  // Phase 3B: island landmarks (Turtle Tower) have no walkable neighbour of the
  // anchor - discovery also fires from a walkable cell next to any area cell,
  // so fall back to that (same second test as landmarks.js discovery).
  if (!spot) {
    const area = HANOI_LANDMARKS[def.id];
    const cells = [];
    for (const [x0, z0, x1, z1] of area.rects) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) cells.push([x, z]);
    for (const [x, z] of area.cells) cells.push([x, z]);
    outer: for (const [cx, cz] of cells) {
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;
        if (walkable(cx + dx, cz + dz)) { spot = [cx + dx, cz + dz]; break outer; }
      }
    }
  }
  check(!!spot, def.id + ': has a walkable cell within radius 1 of its anchor or next to an area cell');
  if (!spot) continue;
  check(lm.nearLandmark(def.id, spot[0], spot[1]), def.id + ': nearLandmark true at (' + spot[0] + ',' + spot[1] + ')');
  traveller.position.x = spot[0] * TILE_SIZE;
  traveller.position.z = spot[1] * TILE_SIZE;
  lm.update(0.016);
  check(lm.visited(def.id), def.id + ': discovered from (' + spot[0] + ',' + spot[1] + ')');
}
check(lm.count() === 11, 'all 11 landmarks discovered, count ' + lm.count());
check(lm.nearLandmark('hoankiem', 15, 15) === false, 'nearLandmark false far away (15,15)');
check(lm.storeKey === 'hanoi:v1:1', 'store key still hanoi:v1:<seed>, got ' + lm.storeKey);
lm.dispose();

console.log(fail === 0 ? 'ALL 2B CHECKS PASSED' : fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
