// Step 5: build public/models/hanoi-tiles.glb (Hanoi-only landmark tiles) with three.js.
// No Blender in the sandbox, so the tiles are built procedurally and exported with GLTFExporter.
// The loader contract (src/assets/loader.js adopt()):
//   - top-level node per model id, userData { name, model }
//   - a mesh named '<id>__base' (flat, vertex colours, uv1 all -1)
//   - flap meshes named '<id>__*' with userData { hinge, foldAngle, delay, layer, size }
//   - every mesh: COLOR_0 vertex colours, uv1 (TEXCOORD_1) with (-1,-1) for non-art faces and
//     atlas UVs on the front face of the hero art card; material named 'paper'
//   - flap geometry: extruded card 0.016 thick, shape in local XY, hinge at y = 0
// The flap stack mirrors src/assets/loader.js RECIPES (Step 3) with one hero art card appended
// in front (highest layer). The hero card is a plain rect: the sprite's own alpha does the
// die-cut (see src/render/materials.js, art faces discard where art alpha < threshold).
// Palette values copied from src/core/config/render.js. No long dashes in this file.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';

// Node has no FileReader; GLTFExporter only needs readAsArrayBuffer for the final GLB assembly.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((buf) => { this.result = buf; if (this.onloadend) this.onloadend(); }); }
  };
}

const P = {
  paper: '#efe0c2', paperShade: '#e8d3ac', kraft: '#e8d3ac', ochre: '#d9a441',
  mustard: '#dca848', terracotta: '#b9603f', rust: '#b25a3b', rose: '#c98374',
  sage: '#8e9a5b', olive: '#879356', pine: '#4f6b4a', moss: '#4f6b4a',
  teal: '#5e9c9a', tealDeep: '#3f7f84', brown: '#5a3a28', ink: '#5a3a28',
  lantern: '#ffc45a',
};
const TILE_SIZE = 2;
const PATH_WIDTH = 0.5;
const RIVER_WIDTH = 0.7;
const FLAP_GAP = 0.004;
const CARD = 0.016;
const ATLAS = 4096;

// Atlas rects for the 11 hero sprites (written by tools/step5/build-atlas.py; keep in sync).
// id -> [x, y, w, h] in atlas pixels.
const SPRITES = {
  turtletower: [16, 2600, 179, 302],
  ngocson: [211, 2600, 331, 274],
  thehuc: [558, 2600, 432, 158],
  tranquoc: [1006, 2600, 202, 374],
  tubehouse: [1224, 2600, 173, 288],
  mausoleum: [16, 2990, 302, 288],
  vanmieu: [334, 2990, 331, 302],
  onepillar: [681, 2990, 207, 331],
  cathedral: [904, 2990, 360, 389],
  opera: [1280, 2990, 360, 259],
  longbien: [1656, 2990, 432, 202],
};

// Sockets (rot 0) copied from src/world/hanoi-models.js, for the painted base.
const SOCKETS = {
  hanoi_turtletower: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_ngocson: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_thehuc: { n: 'path', e: 'river', s: 'path', w: 'river' },
  hanoi_tranquoc: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_tubehouse: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_tubehouse_b: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_tubehouse_green: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_mausoleum: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_badinh: { n: 'path', e: 'path', s: 'path', w: 'path' },
  hanoi_vanmieu: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_onepillar: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_cathedral: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_opera: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_longbien: { n: 'path', e: 'river', s: 'path', w: 'river' },
  // Phase 2B street elements (copy the sockets of the cell each replaces).
  hanoi_road: { n: 'path', e: 'path', s: 'path', w: 'path' },
  hanoi_sidewalk: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_tree: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_bush: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_trafficlight: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_police: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_pedestrian: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_vendor: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_phostall: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_pole: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_lamp: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
};

// ---- shapes (same math as shapeFor in src/assets/loader.js) ------------------------------------
function shapeFor(kind, w, h) {
  const s = new THREE.Shape();
  const a = w / 2;
  if (kind === 'tri') {
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(0, h); s.closePath();
  } else if (kind === 'tree') {
    const t = w * 0.12;
    const th = h * 0.22;
    s.moveTo(-t, 0); s.lineTo(t, 0); s.lineTo(t, th); s.lineTo(a, th); s.lineTo(0, h); s.lineTo(-a, th); s.lineTo(-t, th); s.closePath();
  } else if (kind === 'arch') {
    s.moveTo(-a, 0); s.lineTo(a, 0);
    s.absellipse(0, 0, a, h, 0, Math.PI, false);
    s.closePath();
  } else if (kind === 'house') {
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h * 0.6); s.lineTo(0, h); s.lineTo(-a, h * 0.6); s.closePath();
  } else if (kind === 'figure') {
    // Phase 2B: paper person - straight body + round head, one piece (mirrors loader.js)
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h * 0.7);
    s.absellipse(0, h * 0.7, a, h * 0.3, 0, Math.PI, false);
    s.closePath();
  } else if (kind === 'glowtop') {
    // Phase 2B: thin stem + small lit box at the top (mirrors loader.js)
    const st = 0.015;
    const y0 = h * 0.84;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, h);
    s.lineTo(-a, h); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else if (kind === 'lamp') {
    // Phase 2B: thin post + head box at the top (mirrors loader.js)
    const st = 0.03;
    const y0 = h * 0.82;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, h);
    s.lineTo(-a, h); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else {
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h); s.lineTo(-a, h); s.closePath();
  }
  return s;
}

const hex = (c) => new THREE.Color(c);
function hash01(i, salt) {
  let h = (Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// ---- base: subdivided plane, vertex colours painted from the sockets (like baseTexture) ----------
function buildBase(id, mat) {
  const seg = 32;
  const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position');
  const count = pos.count;
  const col = new Float32Array(count * 3);
  const uv1 = new Float32Array(count * 2).fill(-1);
  const s = SOCKETS[id];
  const sage = hex(P.sage), kraft = hex(P.kraft), teal = hex(P.teal);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    c.copy(sage);
    // river strips first, then path strips (same order as baseTexture in loader.js)
    const hw = RIVER_WIDTH / 2, pw = PATH_WIDTH / 2;
    if (s.n === 'river' && Math.abs(x) < hw && z < 0) c.copy(teal);
    if (s.s === 'river' && Math.abs(x) < hw && z > 0) c.copy(teal);
    if (s.e === 'river' && Math.abs(z) < hw && x > 0) c.copy(teal);
    if (s.w === 'river' && Math.abs(z) < hw && x < 0) c.copy(teal);
    if (s.n === 'path' && Math.abs(x) < pw && z < 0) c.copy(kraft);
    if (s.s === 'path' && Math.abs(x) < pw && z > 0) c.copy(kraft);
    if (s.e === 'path' && Math.abs(z) < pw && x > 0) c.copy(kraft);
    if (s.w === 'path' && Math.abs(z) < pw && x < 0) c.copy(kraft);
    // Phase 2B ground prints (mirror of baseTexture in loader.js).
    if (id === 'hanoi_road') {
      // zebra dashes: 5 stripes on each of the N and S arms (z near -0.55 / +0.55)
      const inBand = (zz) => Math.abs(z - zz) <= 0.15;
      const inStripe = [-0.32, -0.16, 0, 0.16, 0.32].some((sx) => Math.abs(x - sx) <= 0.045);
      if ((inBand(-0.55) || inBand(0.55)) && inStripe) c.set('#fbf6ea');
    }
    if (id === 'hanoi_sidewalk') {
      // pavement wash + terracotta kerb lines on both long edges
      c.copy(hex(P.paperShade));
      if (Math.abs(z) > 0.93) c.copy(hex(P.terracotta));
    }
    // faint hand-painted value jitter (+/- 3%)
    const j = 0.97 + hash01(i, 7) * 0.06;
    col[i * 3] = c.r * j; col[i * 3 + 1] = c.g * j; col[i * 3 + 2] = c.b * j;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = id + '__base';
  return mesh;
}

// ---- one flap: extruded card; front face gets uv1 (art) or -1; vertex colours flat --------------
function buildFlap(id, index, entry, total, spriteRect) {
  const [kind, w, h, x, z, ry, color, sign] = entry;
  const shape = shapeFor(kind, w, h);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: CARD, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -CARD / 2);
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const count = pos.count;
  const uv1 = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);
  const base = hex(color);
  const white = new THREE.Color(1, 1, 1);
  const back = base.clone().multiplyScalar(0.92);
  const hasArt = !!spriteRect;
  for (let i = 0; i < count; i++) {
    const isFront = nrm.getZ(i) > 0.9;
    if (hasArt && isFront) {
      // map the shape bbox into the atlas rect (flipY false: v = 0 is the top of the atlas)
      const u = (spriteRect[0] + ((pos.getX(i) + w / 2) / w) * spriteRect[2]) / ATLAS;
      const v = (spriteRect[1] + (1 - pos.getY(i) / h) * spriteRect[3]) / ATLAS;
      uv1[i * 2] = u; uv1[i * 2 + 1] = v;
      col[i * 3] = white.r; col[i * 3 + 1] = white.g; col[i * 3 + 2] = white.b;
    } else {
      uv1[i * 2] = -1; uv1[i * 2 + 1] = -1;
      const cc = isFront ? base : back;
      col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
    }
  }
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, buildFlap.mat);
  mesh.name = id + '__' + (hasArt ? 'art' : 'flap_' + index);
  mesh.position.set(x, FLAP_GAP * (index + 1), z);
  mesh.rotation.y = THREE.MathUtils.degToRad(ry);
  mesh.userData = {
    hinge: true,
    foldAngle: sign * Math.PI / 2,
    delay: total > 1 ? index / (total - 1) : 0,
    layer: index,
    size: Math.min(1, h / TILE_SIZE),
  };
  return mesh;
}

// ---- recipes: mirror of RECIPES in src/assets/loader.js (Step 3), plus the hero art card ---------
// Each entry: [kind, w, h, x, z, ryDeg, color, foldSign]. The hero is appended last (front-most).
const tuft = (x, z) => ['tri', 0.28, 0.2, x, z, 0, P.olive, 1];
const tree = (x, z, h = 1, c = P.moss) => ['tree', h * 0.62, h, x, z, 0, c, 1];
const RECIPES = {
  hanoi_turtletower: [
    ['tri', 0.58, 1.05, 0, -0.25, 0, P.terracotta, 1],
    ['rect', 0.44, 0.8, 0, -0.22, 0, P.paper, 1],
    ['rect', 0.66, 0.22, 0, -0.19, 0, P.paperShade, 1],
    ['rect', 0.1, 0.3, 0, -0.18, 0, P.ink, 1],
    ['rect', 0.8, 0.18, 0, -0.12, 0, P.paperShade, 1],
    ['rect', 0.3, 0.5, 0.42, -0.2, 0, P.paper, 1],
  ],
  hanoi_ngocson: [
    ['tri', 1.1, 0.9, 0, -0.28, 0, P.rust, 1],
    ['rect', 0.9, 0.62, 0, -0.25, 0, P.paper, 1],
    ['tri', 1.05, 0.42, 0, -0.22, 0, P.terracotta, 1],
    ['rect', 0.08, 0.5, -0.35, -0.19, 0, P.rust, 1],
    ['rect', 0.08, 0.5, 0.35, -0.19, 0, P.rust, 1],
    ['arch', 0.16, 0.42, 0, -0.18, 0, P.ink, 1],
    ['house', 0.42, 0.62, 0.62, -0.2, 0, P.paperShade, 1],
    ['rect', 0.06, 0.8, -0.62, -0.18, 0, P.rust, 1],
  ],
  hanoi_thehuc: [
    ['arch', 1.3, 0.34, -0.3, 0, 90, P.rust, 1],
    ['arch', 1.3, 0.34, 0.3, 0, 90, P.rust, -1],
    ['rect', 1.5, 0.12, 0, 0.02, 0, P.terracotta, 1],
    ['rect', 0.08, 0.5, -0.6, 0, 90, P.rust, 1],
    ['rect', 0.08, 0.5, 0.6, 0, 90, P.rust, 1],
  ],
  hanoi_tranquoc: [
    ['rect', 0.06, 1.3, 0, -0.3, 0, P.mustard, 1],
    ['tri', 0.46, 1.18, 0, -0.27, 0, P.terracotta, 1],
    ['rect', 0.32, 1.0, 0, -0.24, 0, P.paper, 1],
    ['tri', 0.68, 0.85, 0, -0.21, 0, P.rust, 1],
    ['rect', 0.5, 0.7, 0, -0.18, 0, P.paperShade, 1],
    ['tri', 0.9, 0.55, 0, -0.15, 0, P.terracotta, 1],
    ['rect', 0.7, 0.38, 0, -0.12, 0, P.paper, 1],
    ['rect', 0.9, 0.25, 0, -0.1, 0, P.paperShade, 1],
    ['house', 0.45, 0.7, 0.55, -0.18, 0, P.paper, 1],
  ],
  hanoi_tubehouse: [
    ['house', 0.55, 0.95, -0.55, -0.28, 0, P.paper, 1],
    ['tri', 0.68, 0.5, -0.55, -0.25, 0, P.terracotta, 1],
    ['house', 0.5, 0.8, 0.55, -0.24, 0, P.paperShade, 1],
    ['tri', 0.62, 0.42, 0.55, -0.21, 0, P.rust, 1],
    ['rect', 0.1, 0.32, -0.55, -0.22, 0, P.ink, 1],
    ['rect', 0.1, 0.55, -0.35, -0.22, 0, P.brown, 1],
    ['rect', 0.4, 0.12, 0.55, -0.18, 0, P.teal, 1],
  ],
  hanoi_tubehouse_b: [
    ['house', 0.62, 1.0, 0.42, -0.26, 0, P.paper, 1],
    ['tri', 0.74, 0.55, 0.42, -0.23, 0, P.terracotta, 1],
    ['rect', 0.2, 0.14, 0.42, -0.2, 0, P.mustard, 1],
    tree(-0.55, 0.05, 0.85, P.olive),
    ['rect', 0.4, 0.12, 0.42, -0.17, 0, P.mustard, 1],
    ['rect', 0.1, 0.5, 0.62, -0.2, 0, P.brown, 1],
  ],
  hanoi_tubehouse_green: [
    tree(-0.6, -0.35, 0.9),
    tree(0.6, 0.3, 0.8, P.olive),
    ['rect', 0.06, 0.95, 0.55, 0, 0, P.ink, 1],
    ['rect', 0.2, 0.24, 0.55, 0.02, 0, P.lantern, 1],
    ['rect', 0.34, 0.22, -0.15, 0.35, 0, P.kraft, 1],
    ['rect', 0.06, 0.8, -0.55, 0, 0, P.ink, 1],
    ['rect', 0.18, 0.2, -0.55, 0.02, 0, P.lantern, 1],
  ],
  hanoi_mausoleum: [
    ['rect', 1.0, 0.95, 0, -0.28, 0, P.brown, 1],
    ['rect', 0.8, 0.85, 0, -0.25, 0, P.paper, 1],
    ['rect', 0.95, 0.55, 0, -0.22, 0, P.paperShade, 1],
    ['rect', 1.1, 0.28, 0, -0.19, 0, P.kraft, 1],
    ['rect', 0.06, 0.45, -0.25, -0.17, 0, P.ink, 1],
    ['rect', 0.06, 0.45, 0, -0.17, 0, P.ink, 1],
    ['rect', 0.06, 0.45, 0.25, -0.17, 0, P.ink, 1],
    ['rect', 0.4, 0.6, -0.62, -0.2, 0, P.paperShade, 1],
    ['rect', 0.4, 0.6, 0.62, -0.2, 0, P.paperShade, 1],
  ],
  hanoi_badinh: [
    ['rect', 0.07, 1.05, 0, -0.6, 0, P.ink, 1],
    ['rect', 0.8, 0.16, 0, -0.12, 0, P.paperShade, 1],
    ['rect', 0.5, 0.3, 0, -0.09, 0, P.kraft, 1],
    tuft(-0.7, 0.5),
    tuft(0.7, -0.5),
    ['rect', 0.06, 1.3, 0.45, -0.3, 0, P.ink, 1],
    ['arch', 0.5, 0.25, -0.5, 0.4, 0, P.rose, 1],
  ],
  hanoi_vanmieu: [
    ['tri', 0.95, 1.0, 0, -0.28, 0, P.rust, 1],
    ['rect', 0.72, 0.72, 0, -0.25, 0, P.paper, 1],
    ['tri', 0.95, 0.42, 0, -0.22, 0, P.terracotta, 1],
    ['rect', 0.08, 0.55, -0.28, -0.19, 0, P.rust, 1],
    ['rect', 0.08, 0.55, 0.28, -0.19, 0, P.rust, 1],
    ['arch', 0.18, 0.42, 0, -0.18, 0, P.ink, 1],
    ['rect', 0.2, 0.4, -0.52, -0.15, 0, P.paperShade, 1],
    ['rect', 0.2, 0.4, 0.52, -0.15, 0, P.paperShade, 1],
  ],
  hanoi_onepillar: [
    ['tri', 0.68, 1.12, 0, -0.28, 0, P.terracotta, 1],
    ['rect', 0.5, 0.92, 0, -0.25, 0, P.paper, 1],
    ['rect', 0.62, 0.34, 0, -0.2, 0, P.paperShade, 1],
    ['rect', 0.1, 0.26, 0, -0.17, 0, P.ink, 1],
    ['arch', 0.9, 0.3, 0, 0.15, 0, P.teal, 1],
    ['rect', 0.7, 0.2, 0, -0.12, 0, P.paperShade, 1],
  ],
  hanoi_cathedral: [
    ['tri', 0.32, 1.35, -0.38, -0.28, 0, P.paperShade, 1],
    ['tri', 0.32, 1.35, 0.38, -0.28, 0, P.paperShade, 1],
    ['tri', 0.72, 1.0, 0, -0.28, 0, P.terracotta, 1],
    ['rect', 0.62, 0.72, 0, -0.25, 0, P.paper, 1],
    ['arch', 0.16, 0.45, 0, -0.22, 0, P.ink, 1],
    ['tri', 0.25, 0.8, -0.58, -0.2, 0, P.paper, 1],
    ['tri', 0.25, 0.8, 0.58, -0.2, 0, P.paper, 1],
  ],
  hanoi_opera: [
    ['tri', 1.2, 0.85, 0, -0.28, 0, P.terracotta, 1],
    ['rect', 1.0, 0.62, 0, -0.25, 0, P.paper, 1],
    ['arch', 0.2, 0.5, 0, -0.22, 0, P.ink, 1],
    ['arch', 0.12, 0.36, -0.32, -0.22, 0, P.tealDeep, 1],
    ['arch', 0.12, 0.36, 0.32, -0.22, 0, P.tealDeep, 1],
    ['rect', 1.1, 0.16, 0, -0.19, 0, P.paperShade, 1],
    ['rect', 0.35, 0.55, -0.68, -0.2, 0, P.paperShade, 1],
    ['rect', 0.35, 0.55, 0.68, -0.2, 0, P.paperShade, 1],
    ['rect', 1.2, 0.14, 0, -0.12, 0, P.paperShade, 1],
  ],
  hanoi_longbien: [
    ['arch', 1.3, 0.34, -0.3, 0, 90, P.brown, 1],
    ['arch', 1.3, 0.34, 0.3, 0, 90, P.brown, -1],
    ['rect', 0.08, 0.5, -0.3, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.5, 0.3, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.6, -0.5, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.6, 0.5, 0, 90, P.ink, 1],
  ],
  // Phase 2B street elements (Old Quarter only; flat cut-paper, no hero art card).
  hanoi_road: [
    ['rect', 0.12, 0.3, -0.75, -0.75, 0, P.ink, 1],
    ['rect', 0.12, 0.3, 0.75, 0.75, 0, P.ink, 1],
  ],
  hanoi_sidewalk: [
    ['rect', 0.5, 0.12, 0, 0.55, 0, P.paperShade, 1],
  ],
  hanoi_tree: [
    tree(-0.25, -0.15, 1.15, P.pine),
    tree(0.3, 0.25, 0.85, P.sage),
  ],
  hanoi_bush: [
    ['arch', 0.55, 0.42, -0.35, -0.1, 0, P.sage, 1],
    ['arch', 0.45, 0.34, 0.3, 0.15, 0, P.olive, 1],
    ['arch', 0.35, 0.28, 0.05, 0.35, 0, P.moss, 1],
  ],
  hanoi_trafficlight: [
    ['rect', 0.08, 0.95, 0.35, -0.1, 0, P.ink, 1],
    ['lamp', 0.26, 1.0, 0.35, -0.1, 0, P.ink, 1],
    ['glowtop', 0.12, 1.0, 0.35, -0.1, 0, P.lantern, 1],
  ],
  hanoi_police: [
    ['figure', 0.36, 1.0, 0, -0.1, 0, P.ink, 1],
    ['figure', 0.26, 0.85, 0, -0.08, 0, P.paper, 1],
  ],
  hanoi_pedestrian: [
    ['figure', 0.3, 0.95, -0.45, -0.1, 0, P.rose, 1],
    ['figure', 0.3, 0.9, 0.45, 0.05, 0, P.teal, 1],
    ['figure', 0.2, 0.6, 0.05, 0.2, 0, P.mustard, 1],
  ],
  hanoi_vendor: [
    ['figure', 0.3, 0.9, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.5, 0.32, -0.5, 0.1, 0, P.ochre, 1],
    ['arch', 0.5, 0.32, 0.5, 0.1, 0, P.ochre, 1],
  ],
  hanoi_phostall: [
    ['house', 0.9, 1.0, 0, -0.2, 0, P.terracotta, 1],
    ['rect', 0.5, 0.4, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.24, 0.3, -0.2, -0.1, 0, P.ink, 1],
    ['rect', 0.34, 0.18, 0.2, -0.05, 0, P.mustard, 1],
  ],
  hanoi_pole: [
    ['lamp', 0.55, 1.3, 0, -0.15, 0, P.ink, 1],
    ['rect', 0.22, 0.35, 0.3, 0.1, 0, P.paperShade, 1],
  ],
  hanoi_lamp: [
    ['lamp', 0.3, 1.05, 0, -0.1, 0, P.ink, 1],
    ['glowtop', 0.14, 1.05, 0, -0.1, 0, P.lantern, 1],
  ],
};

// Hero art card per model: [kind, w, h, x, z, ryDeg, color, foldSign] + sprite key (or null).
// The card is a plain rect; the sprite's alpha does the die-cut. Sizes match the atlas rects above.
const HERO = {
  hanoi_turtletower: [['rect', 0.72, 1.22, 0, -0.15, 0, P.paper, 1], 'turtletower'],
  hanoi_ngocson: [['rect', 1.3, 1.08, 0, -0.15, 0, P.paper, 1], 'ngocson'],
  hanoi_thehuc: [['rect', 1.6, 0.585, -0.32, 0, 90, P.paper, 1], 'thehuc'],
  hanoi_tranquoc: [['rect', 0.78, 1.44, 0, -0.1, 0, P.paper, 1], 'tranquoc'],
  hanoi_tubehouse: [['rect', 0.68, 1.13, -0.55, -0.19, 0, P.paper, 1], 'tubehouse'],
  hanoi_tubehouse_b: [['rect', 0.68, 1.13, 0.42, -0.19, 0, P.paper, 1], 'tubehouse'],
  hanoi_tubehouse_green: null,
  hanoi_mausoleum: [['rect', 1.2, 1.14, 0, -0.15, 0, P.paper, 1], 'mausoleum'],
  hanoi_badinh: null,
  hanoi_vanmieu: [['rect', 1.3, 1.19, 0, -0.15, 0, P.paper, 1], 'vanmieu'],
  hanoi_onepillar: [['rect', 0.8, 1.28, 0, -0.15, 0, P.paper, 1], 'onepillar'],
  hanoi_cathedral: [['rect', 1.38, 1.49, 0, -0.15, 0, P.paper, 1], 'cathedral'],
  hanoi_opera: [['rect', 1.42, 1.02, 0, -0.15, 0, P.paper, 1], 'opera'],
  hanoi_longbien: [['rect', 1.6, 0.75, -0.32, 0, 90, P.paper, 1], 'longbien'],
  // Phase 2B street elements: flat-colour flaps only, no hero art card (no new atlas sprites).
  hanoi_road: null,
  hanoi_sidewalk: null,
  hanoi_tree: null,
  hanoi_bush: null,
  hanoi_trafficlight: null,
  hanoi_police: null,
  hanoi_pedestrian: null,
  hanoi_vendor: null,
  hanoi_phostall: null,
  hanoi_pole: null,
  hanoi_lamp: null,
};

function buildTile(id, mat) {
  const root = new THREE.Group();
  root.name = id;
  root.userData = { name: id, model: id };
  root.add(buildBase(id, mat));
  const entries = RECIPES[id].slice();
  const hero = HERO[id];
  if (hero) entries.push(hero[0]);
  const total = entries.length;
  entries.forEach((entry, i) => {
    const sprite = hero && i === total - 1 ? SPRITES[hero[1]] : null;
    root.add(buildFlap(id, i, entry, total, sprite));
  });
  return root;
}

const paperMat = new THREE.MeshStandardMaterial({
  name: 'paper', color: 0xffffff, roughness: 1, metalness: 0,
  vertexColors: true, side: THREE.DoubleSide,
});
buildFlap.mat = paperMat;

const scene = new THREE.Scene();
for (const id of Object.keys(RECIPES)) scene.add(buildTile(id, paperMat));

const out = await new GLTFExporter().parseAsync(scene, { binary: true });
fs.writeFileSync(new URL('../../public/models/hanoi-tiles.glb', import.meta.url), Buffer.from(out));
console.log('wrote public/models/hanoi-tiles.glb:', out.byteLength, 'bytes,', Object.keys(RECIPES).length, 'tiles');
