// Phase 3B check: Ho Guom + Ho Tay lakes, Tran Quoc island, 11 landmarks (3B-01..3B-12).
// Run: node tools/check-3b.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
// Every number below is measured live from the map, the recipes and the GLB file:
// the only hardcoded inputs are the spec targets from docs/phase-3-spec.md sec 1.2.
import { readFileSync, statSync } from 'node:fs';
import { OPTIONS } from '../src/world/tiles.js';
import { createHanoi } from '../src/world/hanoi.js';
import { HANOI_MODEL_IDS } from '../src/world/hanoi-models.js';
import { HANOI_ROWS, HANOI_LEGEND, HANOI_LANDMARKS, HANOI_SPAWN } from '../src/world/hanoi-map.js';
import { LANDMARKS } from '../src/game/landmarks.js';
import { LANDMARK_INFO } from '../src/game/landmark-history.js';

let fail = 0, pass = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (ok) pass++; else fail++;
};
const hasLongDash = (s) => /[\u2013\u2014]/.test(s);
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// ---- map cells ----------------------------------------------------------------
const hanoi = createHanoi({ seed: 1 });
const cellsOf = (id) => {
  const out = [];
  for (let z = -20; z <= 19; z++) for (let x = -20; x <= 19; x++) {
    if (hanoi.get(x, z).tileId === id) out.push([x, z]);
  }
  return out;
};
const at = (x, z) => hanoi.get(x, z).tileId;
const fmt = (cells) => cells.map(([x, z]) => '(' + x + ',' + z + ')').join(' ');
const walkable = (x, z) => {
  const c = hanoi.get(x, z);
  // 3B fix round (W1): a bridge cell is walkable in-game (deck clearance kind 2),
  // even though its tags carry 'water' - the check rule matches the game now.
  return c.tags.includes('bridge') || (!c.tags.includes('blocker') && !c.tags.includes('water'));
};
// Reachability from the new spawn (0,5), same BFS rule as check-3a.
const seen = new Set(['0,5']);
const queue = [[0, 5]];
while (queue.length) {
  const [x, z] = queue.pop();
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, key = nx + ',' + nz;
    if (nx < -20 || nx > 19 || nz < -20 || nz > 19 || seen.has(key)) continue;
    if (!walkable(nx, nz)) continue;
    seen.add(key);
    queue.push([nx, nz]);
  }
}
console.log('reachability from spawn (0,5): ' + seen.size + ' cells');
check(seen.size === 913, 'reachability from spawn (0,5) is 913 with the bridge-walkable rule (908 under the old tile-tag rule)');

// ---- 0. Solver + grid stay intact (trap T1) ----------------------------------
check(OPTIONS.length === 95, 'solver options 95/96 (got ' + OPTIONS.length + ')');
check(HANOI_MODEL_IDS.length === 47, 'Hanoi-only models 47 (got ' + HANOI_MODEL_IDS.length + ')');
let mismatches = 0, unresolved = 0;
for (let z = -20; z <= 19; z++) for (let x = -20; x <= 19; x++) {
  const c = hanoi.get(x, z);
  const e = hanoi.get(x + 1, z), s = hanoi.get(x, z + 1);
  if (x < 19 && c.sockets.e !== e.sockets.w) mismatches++;
  if (z < 19 && c.sockets.s !== s.sockets.n) mismatches++;
}
check(mismatches === 0, 'grid socket mismatches: ' + mismatches);

// ---- 3B-01 Ho Guom rect x -2..1, z -7..4, 40-44 pond cells --------------------
let rectPond = 0;
for (let z = -7; z <= 4; z++) for (let x = -2; x <= 1; x++) {
  if (at(x, z) === 'hanoi_pond_guom') rectPond++;
}
const guom = cellsOf('hanoi_pond_guom');
check(rectPond >= 40 && rectPond <= 44, '3B-01 Ho Guom rect pond ' + rectPond + ' in 40-44 (spec)');
check(guom.length === 45, '3B-01 Ho Guom water total 45 (43 rect + 2 strait), got ' + guom.length);
check(HANOI_SPAWN[0] === 0 && HANOI_SPAWN[1] === 5, '3B-01 spawn moved to (0,5), got (' + HANOI_SPAWN + ')');
check(walkable(0, 5) && at(0, 5) === 'hanoi_sidewalk', '3B-01 spawn (0,5) is a walkable promenade sidewalk');

// ---- 3B-02 Turtle Tower on an island at the lake centre ------------------------
check(at(-1, -1) === 'hanoi_turtletower', '3B-02 Turtle Tower at (-1,-1), got ' + at(-1, -1));
const towerNeighbours = [[-1, -2], [-1, 0], [-2, -1], [0, -1]].map(([x, z]) => at(x, z));
check(towerNeighbours.every((t) => t === 'hanoi_pond_guom'), '3B-02 tower island is ringed by water: ' + towerNeighbours.join(', '));
check(HANOI_LANDMARKS.hoankiem.anchor[0] === -1 && HANOI_LANDMARKS.hoankiem.anchor[1] === -1, '3B-02 Hoan Kiem anchor moved to the tower (-1,-1)');
const tower = src('src/assets/loader.js').match(/hanoi_turtletower: \[([\s\S]*?)\n  \],/);
const towerFlaps = tower ? tower[1].split('\n').filter((l) => l.includes("['")).length : -1;
check(towerFlaps === 13, '3B-02 tower recipe 13 flaps (3 tiers + eaves + doors, got ' + towerFlaps + ')');
// ---- 3B-02 fix round (F1): "Quy Son Thap" on tier 3 -------------------------------------
// The letters are pixels inside the existing turtletower sprite, drawn by
// tools/step5/fix-turtletower-sign.py (option (a) in the task: sprite, not a new
// flap - a flap board would sit behind the hero art card and never show). A JS
// check cannot read WebP pixels, so the proof is the cropped sprite viewed by eye;
// see the fix-round section of docs/phase-3b-manifest.md.

// ---- 3B-03 The Huc bridge + Ngoc Son -------------------------------------------
check(at(2, -2) === 'path_end', '3B-03 bridge approach path_end at (2,-2)');
check(at(3, -2) === 'hanoi_thehuc', '3B-03 The Huc bridge tile at (3,-2)');
check(at(4, -2) === 'path_straight', '3B-03 bridge lands on Ngoc Son island as a path at (4,-2), got ' + at(4, -2));
check(at(5, -2) === 'hanoi_ngocson', '3B-03 Ngoc Son temple tile at (5,-2), got ' + at(5, -2));
check(HANOI_LANDMARKS.ngocson.anchor[0] === 5 && HANOI_LANDMARKS.ngocson.anchor[1] === -2, '3B-03 Ngoc Son anchor still (5,-2)');
check(at(2, -3) === 'hanoi_pond_guom' && at(2, -1) === 'hanoi_pond_guom', '3B-03 strait cells (2,-3) and (2,-1) are pond');

// ---- 3B-04 West Lake rect x -19..-7, z -19..-6, ~130 water ----------------------
const tay = cellsOf('hanoi_pond_tay'), lotus = cellsOf('hanoi_lotus');
check(tay.length + lotus.length === 130, '3B-04 West Lake water 130 (pond ' + tay.length + ' + lotus ' + lotus.length + ')');
check(tay.length + lotus.length > guom.length, '3B-04 West Lake (130) is the largest water body, Ho Guom is ' + guom.length);
let westRect = 0;
for (let z = -19; z <= -6; z++) for (let x = -19; x <= -7; x++) {
  if (at(x, z) === 'hanoi_pond_tay' || at(x, z) === 'hanoi_lotus') westRect++;
}
check(westRect === 130, '3B-04 all 130 West Lake water cells sit inside the rect x -19..-7, z -19..-6');

// ---- 3B-05 Tran Quoc on an island in West Lake ----------------------------------
check(at(-13, -12) === 'hanoi_tranquoc', '3B-05 Tran Quoc on its island at (-13,-12), got ' + at(-13, -12));
const tqNeighbours = [[-13, -13], [-13, -11], [-14, -12], [-12, -12]].map(([x, z]) => at(x, z));
check(tqNeighbours[0] === 'hanoi_pond_tay' && tqNeighbours[1] === 'hanoi_pond_tay' && tqNeighbours[2] === 'hanoi_pond_tay', '3B-05 Tran Quoc island ringed by water on 3 sides: ' + tqNeighbours.join(', '));
check(tqNeighbours[3] === 'hanoi_stonebridge', '3B-05 stone bridge at (-12,-12) links the island east');
check(at(-11, -12) === 'path_end', '3B-05 bridge landing path_end at (-11,-12)');
check(HANOI_LANDMARKS.tranquoc && HANOI_LANDMARKS.tranquoc.anchor[0] === -13 && HANOI_LANDMARKS.tranquoc.anchor[1] === -12, '3B-05 Tran Quoc landmark anchor (-13,-12)');
const tq = src('src/assets/loader.js').match(/hanoi_tranquoc: \[([\s\S]*?)\n  \],/);
const tqFlaps = tq ? tq[1].split('\n').filter((l) => l.includes("['") || l.includes('tree(')).length : -1;
check(tqFlaps === 16, '3B-05 Tran Quoc recipe 16 flaps (11 tiers + spire, got ' + tqFlaps + ')');

// ---- 3B-06 promenade ring around Ho Guom -----------------------------------------
const promNorth = [[-2, -8], [-1, -8], [0, -8], [1, -8]].every(([x, z]) => at(x, z) === 'hanoi_sidewalk');
const promSouth = [[-2, 5], [-1, 5], [0, 5]].every(([x, z]) => at(x, z) === 'hanoi_sidewalk');
check(promNorth, '3B-06 north promenade row z=-8, x -2..1');
check(promSouth, '3B-06 south promenade row z=5, x -2..0 (+ path_end at (1,5))');
check(at(1, 5) === 'path_end', '3B-06 south promenade ends in path_end at (1,5)');
// ---- 3B-06 fix round (F2): 4 red flags on the promenade corners -------------------------
const promFlags = [[-2, -7], [1, -7], [-2, 4], [1, 4]];
check(promFlags.every(([x, z]) => at(x, z) === 'hanoi_flag'), '3B-06 fix: 4 red flags on the promenade corners (-2,-7) (1,-7) (-2,4) (1,4)');
check(cellsOf('hanoi_flag').length === 10, '3B-06 fix: 10 flags total (6 street + 4 promenade), got ' + cellsOf('hanoi_flag').length);

// ---- 3B-07 lotus pond, SW corner of West Lake ------------------------------------
check(lotus.length >= 4 && lotus.length <= 6, '3B-07 lotus pond 4-6 cells, got ' + lotus.length);
check(lotus.every(([x, z]) => x >= -18 && x <= -16 && z >= -8 && z <= -6), '3B-07 all lotus cells in the SW corner x -18..-16, z -8..-6: ' + fmt(lotus));

// ---- 3B-08 two lake colours ------------------------------------------------------
const loader = src('src/assets/loader.js');
check(loader.includes("'#2f6b5e'") && loader.includes("'#2456a8'"), '3B-08 lake discs: Ho Guom #2f6b5e (dark green), Ho Tay #2456a8 (deep blue)');
check(/hanoi_pond_guom' \? '#2f6b5e' : '#2456a8'/.test(loader), '3B-08 base print picks the colour per lake id');

// ---- 3B-09 soft banks: round disc base print --------------------------------------
check(loader.includes("hanoi_pond_guom' || id === 'hanoi_pond_tay' || id === 'hanoi_lotus'"), '3B-09 pond base prints use the round lake-disc branch');
// ---- 3B-09 fix round (F3): stone bank ring on the pond edge ---------------------------
check(loader.includes('stone bank ring'), '3B-09 fix: pond base print (loader) has the stone bank ring');
check(src('tools/step5/build-hanoi-glb.mjs').includes('stone bank ring'), '3B-09 fix: pond base print (GLB builder) has the stone bank ring');

// ---- 3B-10 Pen Tower, NOT a checklist landmark -------------------------------------
check(at(2, -6) === 'hanoi_pentower', '3B-10 Pen Tower at (2,-6), got ' + at(2, -6));
check(!LANDMARKS.some((d) => d.id === 'pentower'), '3B-10 Pen Tower is not in the 11-landmark checklist');
const pen = loader.match(/hanoi_pentower: \[([\s\S]*?)\n  \],/);
const penFlaps = pen ? pen[1].split('\n').filter((l) => l.includes("['")).length : -1;
check(penFlaps === 7, '3B-10 Pen Tower recipe 7 flaps (5 tiers + pen tip, got ' + penFlaps + ')');

// ---- 3B-11 Red River wider below Long Bien -----------------------------------------
const river = [];
for (let z = -5; z <= 5; z++) if (at(16, z) === 'river_straight' || at(16, z) === 'river_source') river.push(z);
check(river.length === 11, '3B-11 Red River runs x=16, z -5..5 (11 cells, got ' + river.length + ')');
check(HANOI_LANDMARKS.longbien.anchor[0] === 17 && HANOI_LANDMARKS.longbien.anchor[1] === -6, '3B-11 Long Bien anchor still (17,-6)');

// ---- 3B-12 Mausoleum wing + granite steps -------------------------------------------
check(at(-13, 3) === 'hanoi_mausoleum_wing', '3B-12 mausoleum wing at (-13,3), got ' + at(-13, 3));
const mau = loader.match(/hanoi_mausoleum: \[([\s\S]*?)\n  \],/);
const mauFlaps = mau ? mau[1].split('\n').filter((l) => l.includes("['")).length : -1;
check(mauFlaps === 11, '3B-12 mausoleum recipe 11 flaps (3-step base, got ' + mauFlaps + ')');

// ---- checklist is 11 everywhere -------------------------------------------------------
check(LANDMARKS.length === 11, 'checklist LANDMARKS is 11, got ' + LANDMARKS.length);
check(Object.keys(LANDMARK_INFO).length === 11, 'checklist LANDMARK_INFO is 11, got ' + Object.keys(LANDMARK_INFO).length);
check(Object.keys(HANOI_LANDMARKS).length === 11, 'checklist HANOI_LANDMARKS is 11, got ' + Object.keys(HANOI_LANDMARKS).length);
check(LANDMARKS.some((d) => d.id === 'tranquoc'), 'checklist includes Tran Quoc as the 11th landmark');
const indexHtml = src('index.html');
check(indexHtml.includes('0/11') && !indexHtml.includes('0/10'), 'index.html static checklist string is 0/11');
check(src('README.md').includes('11 landmarks'), 'README.md says 11 landmarks');

// ---- reachability: every anchor has >= 1 walkable cell ------------------------------
for (const def of LANDMARKS) {
  const area = HANOI_LANDMARKS[def.id];
  const [ax, az] = area.anchor;
  let spot = null;
  for (let dz = -1; dz <= 1 && !spot; dz++) for (let dx = -1; dx <= 1 && !spot; dx++) {
    if (dx === 0 && dz === 0) continue;
    if (walkable(ax + dx, az + dz)) spot = [ax + dx, az + dz];
  }
  if (!spot) {
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
  check(!!spot, 'reachability: ' + def.id + ' anchor has a walkable cell ' + (spot ? 'at (' + spot + ')' : '(none)'));
}

// ---- no leftover "10" strings (the old landmark count) -------------------------------
const countedFiles = [
  'index.html', 'README.md', 'src/game/landmarks.js', 'src/game/landmark-history.js',
  'src/core/config/edge.js', 'data/provenance.json', 'workers/hanoi-edge/src/index.js',
  'workers/hanoi-edge/README.md',
  'docs/landmark-history.md', '../3dlabobo/index.html', '../3dlabobo/README.md', '../3dlabobo/README.vi.md',
];
const stalePatterns = [
  /10 landmarks?/i, /0\/10/, /10 real ids?/i, /10 entries/i, /10 ids/i,
  /10-record/i, /10 totals/i, /10 landmark histories/i, /still 10/i, /has 10 /i,
];
let stale = 0;
for (const f of countedFiles) {
  const text = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  for (const re of stalePatterns) {
    if (re.test(text)) { console.log('FAIL stale "10" in ' + f + ': ' + re); stale++; }
  }
}
check(stale === 0, 'no leftover "10" count strings in ' + countedFiles.length + ' counted files (stale hits: ' + stale + ')');

// ---- GLB: size recorded, nodes + tallest flap ------------------------------------------
const glbPath = new URL('../public/models/hanoi-tiles.glb', import.meta.url);
const glbBytes = statSync(glbPath).size;
const glb = readFileSync(glbPath);
const jsonLen = glb.readUInt32LE(12);
const glbJson = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
const glbRoots = (glbJson.scenes && glbJson.scenes[0] && glbJson.scenes[0].nodes) || [];
console.log('GLB size: ' + glbBytes + ' bytes (target < 3,500,000 - overflow is tracked by check-3a, see the manifest)');
check(glbRoots.length === 47, '3B GLB has 47 top-level nodes (got ' + glbRoots.length + ')');

// ---- long dashes ----------------------------------------------------------------------
for (const f of ['index.html', 'src/world/hanoi-map.js', 'src/world/hanoi-models.js', 'src/game/landmarks.js', 'src/game/landmark-history.js', 'src/assets/loader.js', 'tools/step5/build-hanoi-glb.mjs', 'tools/check-3b.mjs', 'docs/phase-3b-manifest.md']) {
  check(!hasLongDash(src(f)), '(dash) no long dash in ' + f);
}

console.log(pass + ' PASS, ' + fail + ' FAIL');
if (fail) { console.log('failures: see FAIL lines above'); process.exit(1); }
console.log('ALL 3B CHECKS PASSED');
