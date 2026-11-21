// Phase 3A check: Map + duong pho, vibe Ha Noi that (3A-01..3A-17).
// Run: node tools/check-3a.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
// Every number below is measured live from the map, the recipes and the GLB file:
// the only hardcoded inputs are the spec targets and the pre-3A audit values,
// which are labelled BEFORE and come from the 2026-11-21 pre-3A audit.
import { readFileSync, statSync } from 'node:fs';
import { OPTIONS } from '../src/world/tiles.js';
import { MODELS } from '../src/core/models.js';
import { createHanoi } from '../src/world/hanoi.js';
import { HANOI_MODELS, HANOI_MODEL_IDS, getHanoiTile } from '../src/world/hanoi-models.js';
import { HANOI_ROWS, HANOI_LEGEND } from '../src/world/hanoi-map.js';
import { animals } from '../src/core/config/animals.js';

let fail = 0, pass = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (ok) pass++; else fail++;
};
const hasLongDash = (s) => /[\u2013\u2014]/.test(s);

// ---- recipe parsing (same line shape as check-2b) -----------------------------
// One recipe entry per line: ['kind', w, h, x, z, ry, P.color, op] or tree(...).
function parseRecipes(src) {
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
    const entries = [];
    for (const line of block.split('\n')) {
      const a = line.match(/^\s*\['(\w+)',\s*([\d.]+),\s*([\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(\d+),\s*P\.(\w+),\s*([\d.]+)\]/);
      if (a) entries.push({ kind: a[1], w: +a[2], h: +a[3], x: +a[4], z: +a[5], ry: +a[6], color: a[7], op: +a[8] });
      const t = line.match(/tree\((-?[\d.]+),\s*(-?[\d.]+),\s*([\d.]+),\s*P\.(\w+)\)/);
      if (t) entries.push({ kind: 'tree', w: +t[3], h: +t[3], x: +t[1], z: +t[2], ry: 0, color: t[4], op: 1 });
    }
    out[id] = entries;
  }
  return out;
}
const loaderSrc = readFileSync(new URL('../src/assets/loader.js', import.meta.url), 'utf8');
const buildSrc = readFileSync(new URL('../tools/step5/build-hanoi-glb.mjs', import.meta.url), 'utf8');
const loaderRecipes = parseRecipes(loaderSrc);
const buildRecipes = parseRecipes(buildSrc);

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
const byCell = (a, b) => (a[1] - b[1]) || (a[0] - b[0]); // numeric sort by z, then x

// ---- 0. Solver + grid stay intact (trap T1) ----------------------------------
check(OPTIONS.length === 95, 'solver options 95/96 (got ' + OPTIONS.length + ')');
check(HANOI_MODEL_IDS.length === 47, 'Hanoi-only models 47 (got ' + HANOI_MODEL_IDS.length + ')');
let mismatches = 0, unresolved = 0;
for (let z = -20; z <= 19; z++) for (let x = -20; x <= 19; x++) {
  const c = hanoi.get(x, z);
  const e = hanoi.get(x + 1, z), s = hanoi.get(x, z + 1);
  if (x < 19 && c.sockets.e !== e.sockets.w) mismatches++;
  if (z < 19 && c.sockets.s !== s.sockets.n) mismatches++;
  if (!getHanoiTile(c.tileId) && !MODELS[c.tileId]) unresolved++;
}
check(mismatches === 0, 'grid socket mismatches: ' + mismatches);
check(unresolved === 0, 'all 1600 cells resolve, unresolved: ' + unresolved);

// ---- 0b. Old Quarter cell count -----------------------------------------------
let oqTotal = 0, oqHanoi = 0;
for (let z = -9; z <= -3; z++) for (let x = -8; x <= 2; x++) {
  oqTotal++;
  if (HANOI_MODEL_IDS.includes(at(x, z))) oqHanoi++;
}
check(oqTotal === 77, 'Old Quarter rect x -8..2, z -9..-3 is 77 cells (got ' + oqTotal + ')');
console.log('Old Quarter: ' + oqHanoi + ' Hanoi-model cells of 77, rest stock path/meadow');

// ---- 3A-01 yellow tube houses, 3 storeys --------------------------------------
const yellow = [...cellsOf('hanoi_tubehouse'), ...cellsOf('hanoi_tubehouse_b')];
const green = cellsOf('hanoi_tubehouse_green');
check(yellow.length === 6, '3A-01 yellow tube houses: 6 cells after 3B flooded 2 ' + fmt(yellow));
const tube = loaderRecipes.hanoi_tubehouse;
check(tube.length === 9, '3A-01 tubehouse recipe 9 flaps (got ' + tube.length + ')');
check(Math.max(...tube.map((f) => f.h)) === 1.35, '3A-01 tubehouse height 1.35 (roof tri 0.9 x 1.35)');
check(tube.some((f) => f.kind === 'tri' && f.color === 'terracotta'), '3A-01 tubehouse has terracotta curved roof tri');
check(tube.some((f) => f.color === 'tealDeep'), '3A-01 tubehouse has green shutter (tealDeep)');
check(tube.some((f) => f.kind === 'dormer'), '3A-01 tubehouse has shop sign dormer');
check(buildRecipes.hanoi_tubehouse.length === 9, '3A-01 GLB build mirrors tubehouse 9 flaps');

// ---- 3A-02 green tube houses, ratio 1 green : 2 yellow ------------------------
check(green.length === 4, '3A-02 green tube houses: 4 cells ' + fmt(green));
// Phase 3B flooded 2 yellow tube houses ((-2,-6), (0,-6)), so the 1:2 ratio
// becomes 4:6 (2:3). The green houses survive; the ratio is a 3A design
// target, not a functional rule - the lake takes priority.
check(yellow.length === 6 && green.length === 4, '3A-02 ratio 2 green : 3 yellow after 3B (' + green.length + ':' + yellow.length + ')');
check(loaderRecipes.hanoi_tubehouse_green.length === 7, '3A-02 green recipe 7 flaps');
check(loaderRecipes.hanoi_tubehouse_green.some((f) => f.color === 'sage'), '3A-02 green house body is sage');

// ---- 3A-03 Ta Hien corner house -----------------------------------------------
check(at(-6, -6) === 'hanoi_cornerhouse', '3A-03 corner house at (-6,-6), got ' + at(-6, -6));
const corner = loaderRecipes.hanoi_cornerhouse;
check(corner.length === 8, '3A-03 corner house recipe 8 flaps');
check(Math.max(...corner.map((f) => f.h)) === 1.4, '3A-03 corner house 1.40 high, tallest in the quarter');
check(corner.filter((f) => f.kind === 'lamp').length === 3, '3A-03 corner house has 3 stacked sign boards (Tiger / Crystal / BOLD)');
check(buildRecipes.hanoi_cornerhouse.length === 8, '3A-03 GLB build mirrors corner house 8 flaps');

// ---- 3A-04 the 4 beer signs only ----------------------------------------------
const signs = {
  hanoi_sign_phoco: [[-4, -5], 'mustard'],
  hanoi_sign_biahoi: [[-8, -7], 'terracotta'],
  hanoi_sign_trucbach: [[2, -7], 'paper'],
  hanoi_sign_paramount: [[-5, -3], 'rose'],
};
for (const [id, [[sx, sz], board]] of Object.entries(signs)) {
  check(at(sx, sz) === id, '3A-04 ' + id + ' at (' + sx + ',' + sz + '), got ' + at(sx, sz));
  const r = loaderRecipes[id];
  check(r.length === 4, '3A-04 ' + id + ' recipe 4 flaps');
  check(r.some((f) => f.kind === 'lamp' && f.color === board), '3A-04 ' + id + ' board is ' + board);
  check(buildRecipes[id].length === 4, '3A-04 GLB build mirrors ' + id + ' 4 flaps');
}
const signCells = Object.keys(signs).flatMap((id) => cellsOf(id));
check(signCells.length === 4, '3A-04 exactly 4 sign cells in the whole map (no other brand names)');

// ---- 3A-05 poles + sagging wires ----------------------------------------------
const poles = cellsOf('hanoi_pole'), poleStreets = cellsOf('hanoi_pole_street');
check(poles.length === 3, '3A-05 poles: 3 cells ' + fmt(poles));
check(poleStreets.length === 1, '3A-05 street pole: 1 cell ' + fmt(poleStreets));
check(at(0, 6) === 'hanoi_pole', '3A-05 pole moved by 3B to (0,6) - (0,-3) is now lake');
check(at(-6, -9) === 'hanoi_pole_street', '3A-05 new pole at (-6,-9)');
const pole = loaderRecipes.hanoi_pole;
check(pole.length === 6, '3A-05 pole recipe 6 flaps (got ' + pole.length + ')');
const sags = pole.filter((f) => f.kind === 'sag');
check(sags.length === 3, '3A-05 pole has 3 sagging wires');
check(Math.min(...sags.map((f) => f.h - 0.5)) === 0.75, '3A-05 wires sag to 0.75 at the lowest dip (h - 0.5)');
check(loaderRecipes.hanoi_pole_street.length === 6, '3A-05 street pole recipe 6 flaps');
check(buildRecipes.hanoi_pole.length === 6 && buildRecipes.hanoi_pole_street.length === 6, '3A-05 GLB build mirrors both pole recipes');

// ---- 3A-06 sao den ancient trees ----------------------------------------------
const trees = cellsOf('hanoi_tree');
check(trees.length === 8, '3A-06 sao den trees: 8 cells ' + fmt(trees));
const tree = loaderRecipes.hanoi_tree;
check(tree.length === 5, '3A-06 tree recipe 5 flaps (got ' + tree.length + ')');
check(tree.some((f) => f.kind === 'tree' && f.w === 1.2 && f.h === 1.4), '3A-06 tree canopy 1.2 x 1.40 (tallest in the quarter)');
check(tree.some((f) => f.kind === 'rect' && f.w === 0.25 && f.color === 'brown'), '3A-06 tree has thick brown trunk');
check(tree.some((f) => f.color === 'paperShade' && f.h === 0.15), '3A-06 tree has granite seat block');
check(buildRecipes.hanoi_tree.length === 5, '3A-06 GLB build mirrors tree 5 flaps');

// ---- 3A-07 sau trees + golden leaves -------------------------------------------
const saus = cellsOf('hanoi_sautree');
check(saus.length === 4, '3A-07 sau trees: 4 cells ' + fmt(saus));
check(JSON.stringify([...saus].sort(byCell)) === JSON.stringify([[-3, 1], [3, 1], [-4, 2], [-3, 2]]), '3A-07 sau trees on the south street of Ho Guom');
const sau = loaderRecipes.hanoi_sautree;
check(sau.length === 5, '3A-07 sau recipe 5 flaps');
check(sau.some((f) => f.kind === 'tree' && f.color === 'mustard' && f.h === 1.2), '3A-07 sau canopy mustard 1.0 x 1.20');
check(loaderSrc.includes('Phase 3A-07'), '3A-07 base print has fallen golden leaves (mustard dots)');
check(buildRecipes.hanoi_sautree.length === 5, '3A-07 GLB build mirrors sau 5 flaps');

// ---- 3A-08 white-globe lamps ----------------------------------------------------
const lamps = cellsOf('hanoi_lamp');
check(lamps.length === 7, '3A-08 lamps: 7 cells ' + fmt(lamps));
const lakeLamps = lamps.filter(([x, z]) => x >= 2 && z >= 2);
check(lakeLamps.length === 5, '3A-08 4 lamps along the NEW lake edge + 1 relocated by 3B to (2,6) ' + fmt(lakeLamps));
const lamp = loaderRecipes.hanoi_lamp;
check(lamp.length === 5, '3A-08 lamp recipe 5 flaps (got ' + lamp.length + ')');
check(lamp.filter((f) => f.kind === 'glowtop' && f.w === 0.18).length === 2, '3A-08 lamp has 2 white globes 0.18 wide');
check(lamp.some((f) => f.kind === 'lamp' && f.color === 'tealDeep'), '3A-08 lamp post is dark green (tealDeep)');
check(buildRecipes.hanoi_lamp.length === 5, '3A-08 GLB build mirrors lamp 5 flaps');

// ---- 3A-09 flags + banners -------------------------------------------------------
const flags = cellsOf('hanoi_flag'), banners = cellsOf('hanoi_banner');
check(flags.length === 10, '3A-09 red flags: 10 cells (6 street + 4 promenade corners after the 3B fix round) ' + fmt(flags));
check(banners.length === 3, '3A-09 red banners: 3 cells ' + fmt(banners));
const flag = loaderRecipes.hanoi_flag;
check(flag.length === 4, '3A-09 flag recipe 4 flaps');
check(flag.some((f) => f.kind === 'star' && f.color === 'mustard'), '3A-09 flag has a yellow star');
check(flag.some((f) => f.color === 'terracotta'), '3A-09 flag board is terracotta red');
check(loaderRecipes.hanoi_banner.length === 4, '3A-09 banner recipe 4 flaps');
check(buildRecipes.hanoi_flag.length === 4 && buildRecipes.hanoi_banner.length === 4, '3A-09 GLB build mirrors flag + banner');

// ---- 3A-10 granite sidewalks ------------------------------------------------------
const walks = cellsOf('hanoi_sidewalk');
check(walks.length === 10, '3A-10 sidewalks: 10 cells after 3B promenade ring (4 corners are flags now) ' + fmt(walks));
check(loaderRecipes.hanoi_sidewalk.length === 1, '3A-10 sidewalk recipe 1 flap');
check(loaderRecipes.hanoi_sidewalk[0].h === 0.08, '3A-10 kerb flap 0.08 high (was 0.12)');
check(loaderSrc.includes('Phase 3A-10'), '3A-10 base print is granite squares + kerb');

// ---- 3A-11 street vendors ---------------------------------------------------------
check(at(-8, -5) === 'hanoi_vendor' && at(-8, -4) === 'hanoi_vendor', '3A-11 vendors at (-8,-5) and (-8,-4)');
check(at(3, -6) === 'hanoi_vendor_street', '3A-11 street vendor moved by 3B to (3,-6) - (2,-6) is now Pen Tower');
check(loaderRecipes.hanoi_vendor.length === 4, '3A-11 vendor recipe 4 flaps (with teal stool)');
check(loaderRecipes.hanoi_vendor_street.length === 4, '3A-11 street vendor recipe 4 flaps');
check(buildRecipes.hanoi_vendor.length === 4 && buildRecipes.hanoi_vendor_street.length === 4, '3A-11 GLB build mirrors both vendor recipes');

// ---- 3A-12 pho stalls ---------------------------------------------------------------
check(at(2, -5) === 'hanoi_phostall', '3A-12 pho stall at (2,-5) (upgraded)');
check(at(-8, -6) === 'hanoi_phostall_street', '3A-12 new pho stall at (-8,-6)');
check(loaderRecipes.hanoi_phostall.length === 10, '3A-12 pho recipe 10 flaps (got ' + loaderRecipes.hanoi_phostall.length + ')');
check(loaderRecipes.hanoi_phostall.filter((f) => f.w === 0.12 && f.h === 0.15).length === 4, '3A-12 pho has 4 tiny plastic stools 0.12 x 0.15');
check(buildRecipes.hanoi_phostall.length === 10 && buildRecipes.hanoi_phostall_street.length === 10, '3A-12 GLB build mirrors both pho recipes');

// ---- 3A-03/04/09/12 sign text on the boards (fix round) --------------------------------
// The 3A boards were flat-colour flaps; the text now lives in 6 atlas sprites drawn
// by tools/step5/build-sign-atlas.py, each shown by a hero art card that copies its
// board flap geometry exactly (same kind/w/h/x/z as the board flap in the loader
// recipe), so the sprite head box lands on the board head box.
const atlas = JSON.parse(readFileSync(new URL('../public/textures/art/atlas.json', import.meta.url), 'utf8'));
const SIGN_SPRITES = {
  hanoi_sign_biaphoco: [2104, 2990, 173, 274],
  hanoi_sign_biahoi: [2293, 2990, 173, 274],
  hanoi_sign_trucbach: [2482, 2990, 173, 274],
  hanoi_sign_paramount: [2671, 2990, 173, 274],
  hanoi_sign_banner304: [2860, 2990, 72, 202],
  hanoi_sign_pho: [2948, 2990, 98, 52],
};
const rectOverlap = (a, b) => !(a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1]);
for (const [key, rect] of Object.entries(SIGN_SPRITES)) {
  const sp = atlas.sprites[key];
  check(!!sp, 'F2 atlas.json has sprite ' + key);
  if (!sp) continue;
  check(JSON.stringify(sp.rect) === JSON.stringify(rect), 'F2 ' + key + ' rect matches the builder plan: ' + JSON.stringify(sp.rect));
  check(rect[0] >= 0 && rect[1] >= 0 && rect[0] + rect[2] <= 4096 && rect[1] + rect[3] <= 4096, 'F2 ' + key + ' rect inside the 4096 atlas');
  let hits = 0;
  for (const [k, v] of Object.entries(atlas.sprites)) {
    if (k === key) continue;
    if (rectOverlap(rect, v.rect)) { hits++; console.log('  overlap: ' + key + ' hits ' + k + ' ' + JSON.stringify(v.rect)); }
  }
  check(hits === 0, 'F2 ' + key + ' overlaps 0 other sprites');
}
check(Object.keys(atlas.sprites).length === 206, 'F2 atlas sprites total 206 (200 + 6 sign texts), got ' + Object.keys(atlas.sprites).length);
// Hero wiring: read the HERO + SPRITES maps out of the GLB builder source (not
// an empty existence check - the hero flap must copy a board flap of the loader
// recipe, and the sprite rect must be the same rect atlas.json carries).
const heroBlock = buildSrc.slice(buildSrc.indexOf('const HERO = {'), buildSrc.indexOf('};', buildSrc.indexOf('const HERO = {')));
const hero = {};
const heroRe = /^  (hanoi_\w+): \[\['(\w+)',\s*([\d.]+),\s*([\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(\d+),\s*P\.(\w+),\s*(\d+)\], '(\w+)'\],$/gm;
let hm;
while ((hm = heroRe.exec(heroBlock)) !== null) {
  hero[hm[1]] = { kind: hm[2], w: +hm[3], h: +hm[4], x: +hm[5], z: +hm[6], ry: +hm[7], color: hm[8], sprite: hm[10] };
}
const spritesBlock = buildSrc.slice(buildSrc.indexOf('const SPRITES = {'), buildSrc.indexOf('};', buildSrc.indexOf('const SPRITES = {')));
const spritesMap = {};
const spRe = /^  (\w+): \[(\d+), (\d+), (\d+), (\d+)\],$/gm;
let sm;
while ((sm = spRe.exec(spritesBlock)) !== null) {
  spritesMap[sm[1]] = [+sm[2], +sm[3], +sm[4], +sm[5]];
}
const SIGN_HERO = {
  hanoi_cornerhouse: 'sign_biaphoco',
  hanoi_sign_phoco: 'sign_biaphoco',
  hanoi_sign_biahoi: 'sign_biahoi',
  hanoi_sign_trucbach: 'sign_trucbach',
  hanoi_sign_paramount: 'sign_paramount',
  hanoi_banner: 'sign_banner304',
  hanoi_phostall: 'sign_pho',
  hanoi_phostall_street: 'sign_pho',
};
for (const [id, sprite] of Object.entries(SIGN_HERO)) {
  const h = hero[id];
  check(!!h, 'F2 ' + id + ' has a hero art card in the GLB builder');
  if (!h) continue;
  check(h.sprite === sprite, 'F2 ' + id + ' hero uses sprite ' + sprite + ' (got ' + h.sprite + ')');
  const board = (loaderRecipes[id] || []).some((f) => f.kind === h.kind && f.w === h.w && f.h === h.h && f.x === h.x && f.z === h.z && f.ry === h.ry);
  check(board, 'F2 ' + id + ' hero flap ' + h.kind + ' ' + h.w + 'x' + h.h + ' at (' + h.x + ',' + h.z + ') matches a board flap in the loader recipe');
  check(JSON.stringify(spritesMap[h.sprite]) === JSON.stringify(SIGN_SPRITES['hanoi_' + h.sprite]), 'F2 ' + id + ' hero sprite rect matches atlas.json (' + JSON.stringify(spritesMap[h.sprite]) + ')');
}

// ---- 3A-13 parked motorbikes (Q7: no moving bikes) -----------------------------------
const bikes = [...cellsOf('hanoi_bike_red'), ...cellsOf('hanoi_bike_blue'), ...cellsOf('hanoi_bike_black')];
check(bikes.length === 6, '3A-13 parked bikes: 6 cells ' + fmt(bikes));
check(cellsOf('hanoi_bike_red').length === 2 && cellsOf('hanoi_bike_blue').length === 2 && cellsOf('hanoi_bike_black').length === 2, '3A-13 bikes mixed 2 red + 2 blue + 2 black');
for (const id of ['hanoi_bike_red', 'hanoi_bike_blue', 'hanoi_bike_black']) {
  check(loaderRecipes[id].length === 4, '3A-13 ' + id + ' recipe 4 flaps');
  check(buildRecipes[id].length === 4, '3A-13 GLB build mirrors ' + id);
}

// ---- 3A-14 one-way sign + folk mural ---------------------------------------------------
const tl = loaderRecipes.hanoi_trafficlight;
check(tl.length === 5, '3A-14 traffic light recipe 5 flaps (with one-way sign)');
check(tl.some((f) => f.kind === 'lamp' && f.color === 'teal' && f.w === 0.25), '3A-14 one-way board is blue (teal) 0.25 wide');
check(tl.some((f) => f.kind === 'dormer' && f.color === 'paper'), '3A-14 one-way board has a white mark');
const murals = cellsOf('hanoi_mural');
check(murals.length === 2, '3A-14 mural wall: 2 cells ' + fmt(murals));
check(JSON.stringify([...murals].sort(byCell)) === JSON.stringify([[-10, 1], [-10, 2]]), '3A-14 mural at (-10,1) and (-10,2) on the west wall');
check(loaderRecipes.hanoi_mural.length === 5, '3A-14 mural recipe 5 flaps');
check(loaderRecipes.hanoi_mural.some((f) => f.w === 1.9 && f.ry === 90), '3A-14 mural wall 1.9 long, runs N-S (ry 90)');
check(buildRecipes.hanoi_mural.length === 5, '3A-14 GLB build mirrors mural 5 flaps');

// ---- 3A-15 rural audit, before / after -----------------------------------------------
// BEFORE = pre-3A audit 2026-11-21 (1600 cells): the only rural-looking thing in the
// map was the mausoleum placeholder (brown block + kraft step); no barn, windmill,
// stock village, house, bridge or gazebo cell existed. AFTER is measured live below.
const RURAL_IDS = ['barn_farm', 'windmill', 'village', 'village_b', 'village_green', 'house', 'bridge', 'blossom_gazebo'];
console.log('3A-15 rural audit (before -> after, cells in 1600):');
const auditRows = [];
for (const id of RURAL_IDS) {
  const after = cellsOf(id).length;
  auditRows.push([id, 0, after]);
  check(after === 0, '3A-15 no ' + id + ' cells in the map (before 0 -> after ' + after + ')');
}
const mau = loaderRecipes.hanoi_mausoleum;
check(mau.length === 11, '3A-15 mausoleum recipe 11 flaps after 3B-12 (got ' + mau.length + ')');
check(!mau.some((f) => f.color === 'brown' || f.color === 'kraft'), '3A-15 mausoleum has no brown block and no kraft step (was brown body + kraft step)');
check(mau.some((f) => f.color === 'paperShade' && f.w === 1.3 && f.h === 0.14), '3A-15 mausoleum has a wide granite bottom step 1.3 x 0.14');
check(buildRecipes.hanoi_mausoleum.length === 11, '3A-15 GLB build mirrors mausoleum 11 flaps');
for (const [id, before, after] of auditRows) console.log('  ' + id + ': ' + before + ' -> ' + after);
console.log('  hanoi_mausoleum placeholder: brown block + kraft step -> granite paperShade steps 1.15 + 1.30');

// ---- 3A-15b no farm animals spawn in Hanoi (fix round) ----------------------------------
// The map audit above only covers tile cells; sheep/cow still spawned on the 650
// meadow cells through spawns.hanoi, which reads as countryside in frame. The
// fix round removes sheep/lamb/cow from spawns.hanoi only; heartland keeps them.
const FARM = ['sheep', 'lamb', 'cow'];
const hanoiSpawns = animals.spawns.hanoi;
const farmFound = [];
for (const [model, rows] of Object.entries(hanoiSpawns)) {
  for (const row of rows) if (FARM.includes(row[0])) farmFound.push(model + ':' + row[0]);
}
check(farmFound.length === 0, '3A-15 no farm animals (sheep/lamb/cow) in spawns.hanoi' + (farmFound.length ? ' (found ' + farmFound.join(', ') + ')' : ''));
check(hanoiSpawns.meadow.some((r) => r[0] === 'cat'), '3A-15 Hanoi meadow still spawns cats');
check(hanoiSpawns.meadow.some((r) => r[0] === 'rabbit'), '3A-15 Hanoi meadow still spawns rabbits');
check(hanoiSpawns.meadow_flowers.some((r) => r[0] === 'songbird'), '3A-15 Hanoi meadow_flowers still spawns songbirds');
check(animals.spawns.all.pond.some((r) => r[0] === 'duck'), '3A-15 pond spawns still include ducks');
check(animals.spawns.heartland.meadow.some((r) => r[0] === 'sheep'), '3A-15 heartland meadow still spawns sheep (only Hanoi changed)');

// ---- 3A-16 narrow west alley ------------------------------------------------------------
const alleys = cellsOf('hanoi_alley');
check(alleys.length === 4, '3A-16 alley: 4 cells ' + fmt(alleys));
check(JSON.stringify([...alleys].sort(byCell)) === JSON.stringify([[-12, -2], [-12, -1], [-12, 1], [-12, 2]]), '3A-16 alley in the west block x -12, z -2..2');
const alley = loaderRecipes.hanoi_alley;
check(alley.length === 7, '3A-16 alley recipe 7 flaps');
// Lane gap between the house WALLS in world units (1 tile = 2 units, spec 3A-16:
// lane 0.5 tile = 1 unit). Fix round: the old check asserted gap === 0.5 and
// called it "0.5 tile", but 0.5 world units is only 0.25 tile, half the spec.
// Houses are 0.5 wide at x +-0.75, so the inner walls sit at +-0.5, and the
// roofs are flush with the walls (no overhang), so the gap is 1 unit at every height.
const laneGap = (recipe, kind) => {
  const west = recipe.filter((f) => f.x < 0 && f.kind === kind);
  const east = recipe.filter((f) => f.x > 0 && f.kind === kind);
  return Math.min(...east.map((f) => f.x - f.w / 2)) - Math.max(...west.map((f) => f.x + f.w / 2));
};
check(laneGap(alley, 'rect') === 1, '3A-16 alley lane gap 1 world unit (0.5 tile) between the house walls (got ' + laneGap(alley, 'rect') + ' units)');
check(laneGap(alley, 'tri') === 1, '3A-16 alley roof gap also 1 unit (roofs flush with walls, got ' + laneGap(alley, 'tri') + ' units)');
check(laneGap(buildRecipes.hanoi_alley, 'rect') === 1, '3A-16 GLB build mirrors the 1 unit lane gap (got ' + laneGap(buildRecipes.hanoi_alley, 'rect') + ' units)');
check(loaderSrc.includes('g.fillRect(0.25 * N, 0, 0.5 * N, N)'), '3A-16 alley base print lane is 0.5 N wide (1 unit) in loader.js');
check(buildSrc.includes('if (Math.abs(x) < 0.5) c.copy(hex(P.kraft))'), '3A-16 alley base print lane is 1 unit wide in the GLB build');
check(alley.some((f) => f.kind === 'sag'), '3A-16 alley has a low sagging wire');
check(buildRecipes.hanoi_alley.length === 7, '3A-16 GLB build mirrors alley 7 flaps');

// ---- 3A-17 brick road print ----------------------------------------------------------------
// Phase 3B flooded the (-3,-6) junction - the street ends at the lake, so the road
// cell is gone and the brick print now has no cell on the map. The print code
// itself is unchanged (the two checks below), and the model stays in the registry.
check(at(-3, -6) === 'path_t', '3A-17 (-3,-6) is now the lake-side street terminus (path_t), got ' + at(-3, -6));
check(loaderSrc.includes('Phase 3A-17'), '3A-17 road base print is grey brick + dashed white line (zebra kept)');
check(buildSrc.includes('Phase 3A-17'), '3A-17 GLB build mirrors the brick road print');

// ---- reachability from spawn (baseline 913 after the 3B fix round, was 998) --------------
// Phase 3B moves the spawn to (0,5) and floods ~90 walkable cells with the two
// lakes, so the baseline drops 998 -> 908 on purpose under the old tile-tag rule.
// 3B fix round (W1): a bridge cell is walkable in-game (deck clearance kind 2 in
// world.js, "bridge decks are free"), even though its tags carry 'water', so the
// check rule matches the game now and the true baseline is 913: +5 cells over 908
// (thehuc (3,-2), path_end (2,-2), 2 longbien cells, path_end (19,-6)).
const walkable = (x, z) => {
  const c = hanoi.get(x, z);
  return c.tags.includes('bridge') || (!c.tags.includes('blocker') && !c.tags.includes('water'));
};
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
console.log('reachability from spawn (0,5): ' + seen.size + ' cells (baseline 913 after 3B fix round)');
check(seen.size === 913, '3A reachability is the 913 baseline with the bridge-walkable rule (got ' + seen.size + ')');

// ---- GLB file: size + nodes + tallest flap --------------------------------------------------
const glbPath = new URL('../public/models/hanoi-tiles.glb', import.meta.url);
const glbBytes = statSync(glbPath).size;
check(glbBytes < 3500000, '3A GLB under 3.5 MB (' + glbBytes + ' bytes)');
const glb = readFileSync(glbPath);
check(glb.subarray(0, 4).toString() === 'glTF', '3A GLB magic is glTF');
const jsonLen = glb.readUInt32LE(12);
const glbJson = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
const glbNames = (glbJson.nodes || []).map((n) => n.name);
const glbRoots = (glbJson.scenes && glbJson.scenes[0] && glbJson.scenes[0].nodes) || [];
check(glbRoots.length === 47, '3A GLB has 47 top-level nodes (got ' + glbRoots.length + ', ' + glbNames.length + ' nodes total incl. children)');
const missing = HANOI_MODEL_IDS.filter((id) => !glbNames.includes(id));
check(missing.length === 0, '3A every Hanoi model is a GLB node' + (missing.length ? ' (missing ' + missing.join(',') + ')' : ''));
let tallest = 0;
for (const id of HANOI_MODEL_IDS) {
  for (const f of loaderRecipes[id] || []) tallest = Math.max(tallest, f.h);
}
check(tallest <= 1.5, '3A tallest flap ' + tallest + ' <= 1.5');
check(!hasLongDash(loaderSrc.slice(loaderSrc.indexOf('hanoi_tubehouse'))), '3A no long dash in loader Hanoi recipes');

// ---- 3B zone: which 3A items sit inside the future lake rect x -2..1, z -7..4 --------------
const zone3B = [];
for (let z = -7; z <= 4; z++) for (let x = -2; x <= 1; x++) {
  const id = at(x, z);
  if (HANOI_MODEL_IDS.includes(id)) zone3B.push([x, z, id]);
}
console.log('3B zone (x -2..1, z -7..4) holds ' + zone3B.length + ' Hanoi-model cells; 3A items inside it will move in 3B:');
for (const [x, z, id] of zone3B) console.log('  (' + x + ',' + z + ') ' + id);

console.log(pass + ' PASS, ' + fail + ' FAIL');
if (fail) process.exit(1);
console.log('ALL 3A CHECKS PASSED');
