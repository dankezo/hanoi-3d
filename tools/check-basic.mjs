// Phase 2A check: solver count + registry frozen, loader RECIPES + atlas rects for the 6 grand buildings.
// Run: node tools/check-basic.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { OPTIONS, TILES, socketsOf, getTile } from '../src/world/tiles.js';
import { MODELS } from '../src/core/models.js';

let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (!ok) fail++;
};

// 1. Solver: 48 models, 95 options, cap 96 (models.js untouched, but prove it here).
check(TILES.length === 48, 'stock TILES still 48, got ' + TILES.length);
check(Object.keys(MODELS).length === 48, 'MODELS still 48 entries, got ' + Object.keys(MODELS).length);
check(OPTIONS.length === 95, 'solver options ' + OPTIONS.length + ' (expected 95, cap 96)');
check(OPTIONS.length <= 96, 'solver options ' + OPTIONS.length + ' <= 96 (cap)');

// 2. The 6 replaced ids keep their exact sockets, tags and biome weights.
const EXPECTED = {
  house: { sockets: { n: 'grass', e: 'grass', s: 'path', w: 'grass' }, tags: ['path', 'house', 'blocker'], biomes: { heartland: 1, desert: 0, snow: 0, blossom: 1.1, pinewood: 0.45 } },
  manor: { sockets: { n: 'grass', e: 'grass', s: 'path', w: 'grass' }, tags: ['path', 'house', 'landmark', 'blocker'], biomes: { heartland: 0.7, blossom: 0.5 } },
  barn_farm: { sockets: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' }, tags: ['landmark', 'blocker'], biomes: { heartland: 0.16, blossom: 0.12 } },
  village: { sockets: { n: 'path', e: 'grass', s: 'path', w: 'grass' }, tags: ['path', 'house', 'village', 'blocker'], biomes: { heartland: 1, desert: 0, snow: 0, blossom: 1, pinewood: 0.08 } },
  village_b: { sockets: { n: 'path', e: 'grass', s: 'path', w: 'grass' }, tags: ['path', 'house', 'village', 'blocker'], biomes: { heartland: 1, blossom: 1 } },
  village_green: { sockets: { n: 'path', e: 'grass', s: 'path', w: 'grass' }, tags: ['path', 'village'], biomes: { heartland: 1, blossom: 1 } },
};
for (const [id, exp] of Object.entries(EXPECTED)) {
  const t = getTile(id);
  check(JSON.stringify(t.sockets) === JSON.stringify(exp.sockets), id + ' sockets unchanged: ' + JSON.stringify(t.sockets));
  check(JSON.stringify(t.tags) === JSON.stringify(exp.tags), id + ' tags unchanged: ' + JSON.stringify(t.tags));
  check(JSON.stringify(t.biomes) === JSON.stringify(exp.biomes), id + ' biomes unchanged');
  check(JSON.stringify(socketsOf(id, 0)) === JSON.stringify(exp.sockets), id + ' socketsOf rot 0 matches');
}

// 3. Loader has a grand RECIPES entry for each of the 6 ids (placeholder fallback).
const loaderSrc = readFileSync(new URL('../src/assets/loader.js', import.meta.url), 'utf8');
for (const id of Object.keys(EXPECTED)) {
  check(new RegExp('^  ' + id + ': \\[', 'm').test(loaderSrc), 'RECIPES has ' + id);
}
// 4. Loader wires the basic-grand GLB only off Hanoi mode, and the asset URL exists.
check(/basicGrandUrl/.test(loaderSrc), 'loader.js references basicGrandUrl');
check(/!hanoi \? loadGLTF\(A\.basicGrandUrl\)/.test(loaderSrc), 'loader.js loads basic-grand only when NOT Hanoi mode');
const assetsSrc = readFileSync(new URL('../src/core/config/assets.js', import.meta.url), 'utf8');
check(/basicGrandUrl: '\.\/models\/basic-grand\.glb'/.test(assetsSrc), 'assets.js has basicGrandUrl');
check(existsSync(new URL('../public/models/basic-grand.glb', import.meta.url)), 'public/models/basic-grand.glb exists');
console.log('basic-grand.glb bytes:', statSync(new URL('../public/models/basic-grand.glb', import.meta.url)).size);

// 5. Atlas: all 6 new rects inside the atlas, zero overlap with each other and existing sprites.
const atlas = JSON.parse(readFileSync(new URL('../public/textures/art/atlas.json', import.meta.url), 'utf8'));
check(atlas.size[0] === 4096 && atlas.size[1] === 4096, 'atlas size 4096x4096');
const NEW = {
  basic_townhouse: [16, 3395, 294, 333],
  basic_grandmanor: [326, 3395, 384, 358],
  basic_greatbarn: [726, 3395, 384, 358],
  basic_marketstreet: [16, 3769, 410, 282],
  basic_gardencottage: [442, 3769, 358, 256],
  basic_townsquare: [816, 3769, 410, 282],
};
const overlap = (a, b) => !(a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1]);
for (const [name, rect] of Object.entries(NEW)) {
  const sp = atlas.sprites[name];
  check(!!sp, 'atlas.json has sprite ' + name);
  if (!sp) continue;
  check(JSON.stringify(sp.rect) === JSON.stringify(rect), name + ' rect matches plan: ' + JSON.stringify(sp.rect));
  check(rect[0] >= 0 && rect[1] >= 0 && rect[0] + rect[2] <= 4096 && rect[1] + rect[3] <= 4096, name + ' rect inside atlas');
  let hits = 0;
  for (const [k, v] of Object.entries(atlas.sprites)) {
    if (k === name) continue;
    if (overlap(rect, v.rect)) { hits++; console.log('  overlap: ' + name + ' hits ' + k + ' ' + JSON.stringify(v.rect)); }
  }
  check(hits === 0, name + ' overlaps 0 other sprites');
}
check(Object.keys(atlas.sprites).length === 200, 'atlas sprites total 200, got ' + Object.keys(atlas.sprites).length);

console.log(fail === 0 ? 'ALL BASIC CHECKS PASSED' : fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
