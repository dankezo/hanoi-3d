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
  // Phase 3A fix round: sign-text sprites (written by tools/step5/build-sign-atlas.py).
  // Rect size = hero flap world size x 288 px/unit. The lamp-board sprites only
  // paint the head box (top 18% of the rect); the rest is transparent, so the
  // flat board flap behind shows through (art alpha discard in materials.js).
  sign_biaphoco: [2104, 2990, 173, 274],
  sign_biahoi: [2293, 2990, 173, 274],
  sign_trucbach: [2482, 2990, 173, 274],
  sign_paramount: [2671, 2990, 173, 274],
  sign_banner304: [2860, 2990, 72, 202],
  sign_pho: [2948, 2990, 98, 52],
};

// Sockets (rot 0) copied from src/world/hanoi-models.js, for the painted base.
const SOCKETS = {
  hanoi_turtletower: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
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
  // Phase 3A street elements (copy the sockets of the cell each replaces).
  hanoi_cornerhouse: { n: 'path', e: 'path', s: 'path', w: 'path' },
  hanoi_sign_phoco: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_sign_biahoi: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_sign_trucbach: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_sign_paramount: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_flag: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_banner: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_sautree: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_bike_red: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_bike_blue: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_bike_black: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_mural: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_alley: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_vendor_street: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_phostall_street: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_pole_street: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  // Phase 3B lake models (copy the sockets of the cell each replaces).
  hanoi_pond_guom: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_pond_tay: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_lotus: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  hanoi_stonebridge: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  hanoi_pentower: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  hanoi_mausoleum_wing: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
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
  } else if (kind === 'dormer') {
    // Phase 3A: thin stem + box + cap, a sign board high on a facade (mirrors loader.js)
    const st = 0.015;
    const y0 = h * 0.61, y1 = h * 0.86;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, y1);
    s.lineTo(0, h); s.lineTo(-a, y1); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else if (kind === 'figure') {
    // Phase 2B: paper person - straight body + round head, one piece (mirrors loader.js)
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h * 0.7);
    s.absellipse(0, h * 0.7, a, h * 0.3, 0, Math.PI, false);
    s.closePath();
  } else if (kind === 'star') {
    // Phase 3A: 5-point star for the red flag, drawn at the top of its box
    // (centre y = h - R, outer radius R = w / 2, inner radius 0.382 R). The shape
    // floats: it sits on the flag board in front of it, so it has no stem.
    const R = w / 2, r = R * 0.382, cy = h - R;
    for (let i = 0; i < 10; i++) {
      const ang = Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? R : r;
      const px = rad * Math.cos(ang), py = cy + rad * Math.sin(ang);
      if (i === 0) s.moveTo(px, py); else s.lineTo(px, py);
    }
    s.closePath();
  } else if (kind === 'sag') {
    // Phase 3A: sagging power-line band - the top edge dips 0.5 below its ends,
    // band thickness 0.035. The shape floats (no stem to the ground): it hangs
    // between poles, so the fold hinge still sits at y = 0.
    const th = 0.035;
    s.moveTo(-a, h);
    s.quadraticCurveTo(0, h - 1.0, a, h);
    s.lineTo(a, h - th);
    s.quadraticCurveTo(0, h - 1.0 - th, -a, h - th);
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
// Phase 3A: new models use seg 16 (their prints are simple) to keep the GLB under
// 3.5 MB; the 25 older models keep seg 32, so their zebra / kerb prints stay exact.
// A 16-seg base is ~21 KB vs ~80 KB at 32 seg (16 new bases: ~0.34 MB, not ~1.3 MB).
// Phase 3B fix: the 10 old landmark bases also use seg 16 now. They only carry
// path / river strips, so the strips stay readable (0.125 per vertex, strip 0.5
// wide = 4 vertices) and each base saves ~24 KB, which brings the 47-node GLB
// from 3,678,092 bytes down under the 3.5 MB target. Trade-off: the landmark
// base print is a little softer than at seg 24, nothing else changes.
const SEG16 = new Set([
  'hanoi_turtletower', 'hanoi_ngocson', 'hanoi_thehuc', 'hanoi_tranquoc', 'hanoi_vanmieu',
  'hanoi_onepillar', 'hanoi_cathedral', 'hanoi_opera', 'hanoi_longbien', 'hanoi_badinh',
  'hanoi_cornerhouse', 'hanoi_sign_phoco', 'hanoi_sign_biahoi', 'hanoi_sign_trucbach',
  'hanoi_sign_paramount', 'hanoi_flag', 'hanoi_banner', 'hanoi_sautree', 'hanoi_bike_red',
  'hanoi_bike_blue', 'hanoi_bike_black', 'hanoi_mural', 'hanoi_alley', 'hanoi_vendor_street',
  'hanoi_phostall_street', 'hanoi_pole_street',
  'hanoi_pond_guom', 'hanoi_pond_tay', 'hanoi_lotus', 'hanoi_stonebridge',
  'hanoi_pentower', 'hanoi_mausoleum_wing',
]);
const GRANITE_IDS = new Set([
  'hanoi_sidewalk', 'hanoi_flag', 'hanoi_banner',
  'hanoi_bike_red', 'hanoi_bike_blue', 'hanoi_bike_black',
]);
function buildBase(id, mat) {
  const seg = SEG16.has(id) ? 16 : 32;
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
    // Phase 3B lake discs: round water disc (no 90-degree corners) + faint ripple
    // dots. Ho Guom dark green, Ho Tay deep blue (stone bridge sits in Ho Tay).
    if (id === 'hanoi_pond_guom' || id === 'hanoi_pond_tay' || id === 'hanoi_lotus' || id === 'hanoi_stonebridge') {
      if (Math.hypot(x, z) < 0.6) {
        if (id === 'hanoi_pond_guom') c.set('#2f6b5e');
        else c.set('#2456a8');
        if (hash01(i, 21) > 0.96) c.multiplyScalar(1.12);
      }
    }
    // Phase 3B fix round: stone bank ring - grey stone rim (paperShade, a touch
    // darker so it reads as stone) on the disc edge, pond cells only, not the
    // stone bridge deck. Band 0.47..0.6 catches a full vertex ring at SEG16.
    if ((id === 'hanoi_pond_guom' || id === 'hanoi_pond_tay' || id === 'hanoi_lotus') && Math.hypot(x, z) >= 0.47 && Math.hypot(x, z) < 0.6) {
      c.copy(hex(P.paperShade)).multiplyScalar(0.88);
    }
    // Phase 2B ground prints (mirror of baseTexture in loader.js).
    if (id === 'hanoi_road') {
      // Phase 3A-17: grey brick paving + dashed white centre line + zebra (kept).
      c.copy(hex(P.paperShade)).multiplyScalar(0.94);
      const row = Math.floor((z + 1) / 0.25);
      const off = (row % 2) * 0.125;
      const jx = (((x + 1 + off) % 0.25) + 0.25) % 0.25;
      const jz = (((z + 1) % 0.25) + 0.25) % 0.25;
      if (jx < 0.03 || jz < 0.03) c.multiplyScalar(0.82);
      const dx = (((x + 1) % 0.4) + 0.4) % 0.4;
      if (Math.abs(z) < 0.04 && (dx < 0.06 || dx > 0.34)) c.set('#fbf6ea');
      const inBand = (zz) => Math.abs(z - zz) <= 0.15;
      const inStripe = [-0.32, -0.16, 0, 0.16, 0.32].some((sx) => Math.abs(x - sx) <= 0.045);
      if ((inBand(-0.55) || inBand(0.55)) && inStripe) c.set('#fbf6ea');
    }
    if (GRANITE_IDS.has(id)) {
      // Phase 3A-10: granite pavement - 4x4 stone squares, ink joints, terracotta kerb.
      const fx = Math.floor((x + 1) / 0.5), fz = Math.floor((z + 1) / 0.5);
      c.copy(hex(P.paperShade));
      if ((fx + fz) % 2) c.multiplyScalar(0.96);
      const gx = (((x + 1) % 0.5) + 0.5) % 0.5, gz = (((z + 1) % 0.5) + 0.5) % 0.5;
      if (gx < 0.035 || gz < 0.035) c.multiplyScalar(0.85);
      if (Math.abs(z) > 0.93) c.copy(hex(P.terracotta));
    }
    if (id === 'hanoi_sautree') {
      // Phase 3A-07: fallen golden leaves - mustard dots on the grass base.
      if (hash01(i, 13) > 0.9) c.set(P.mustard);
    }
    if (id === 'hanoi_alley') {
      // Phase 3A-16: narrow paved lane, 1 unit wide down the middle (N-S).
      // Fix round: was 0.5 unit wide (|x| < 0.25); spec wants 1 unit (0.5 tile).
      if (Math.abs(x) < 0.5) c.copy(hex(P.kraft));
      else if (Math.abs(x) < 0.54) c.multiplyScalar(0.7);
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
    ['tri', 0.3, 1.2, 0, -0.26, 0, P.terracotta, 1],
    ['rect', 0.24, 1.02, 0, -0.24, 0, P.paper, 1],
    ['rect', 0.42, 0.92, 0, -0.22, 0, P.terracotta, 1],
    ['rect', 0.36, 0.84, 0, -0.21, 0, P.paperShade, 1],
    ['dormer', 0.3, 0.9, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.56, 0.66, 0, -0.19, 0, P.terracotta, 1],
    ['rect', 0.5, 0.58, 0, -0.18, 0, P.paper, 1],
    ['rect', 0.72, 0.4, 0, -0.16, 0, P.terracotta, 1],
    ['rect', 0.64, 0.32, 0, -0.15, 0, P.paperShade, 1],
    ['arch', 0.12, 0.26, -0.19, -0.14, 0, P.ink, 1],
    ['arch', 0.12, 0.26, 0, -0.14, 0, P.ink, 1],
    ['arch', 0.12, 0.26, 0.19, -0.14, 0, P.ink, 1],
    ['arch', 0.55, 0.1, 0, 0.08, 0, P.moss, 1],
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
    ['arch', 1.3, 0.34, -0.3, 0, 90, P.terracotta, 1],
    ['arch', 1.3, 0.34, 0.3, 0, 90, P.terracotta, -1],
    ['rect', 1.5, 0.12, 0, 0.02, 0, P.terracotta, 1],
    ['rect', 0.08, 0.55, -0.6, 0, 90, P.rust, 1],
    ['rect', 0.08, 0.55, 0.6, 0, 90, P.rust, 1],
    ['lamp', 0.14, 0.42, -0.6, 0, 90, P.rust, 1],
    ['lamp', 0.14, 0.42, 0.6, 0, 90, P.rust, 1],
  ],
  hanoi_tranquoc: [
    ['tri', 0.16, 1.4, 0, -0.28, 0, P.mustard, 1],
    ['rect', 0.24, 1.34, 0, -0.265, 0, P.paperShade, 1],
    ['rect', 0.28, 1.25, 0, -0.25, 0, P.paper, 1],
    ['rect', 0.32, 1.16, 0, -0.235, 0, P.paperShade, 1],
    ['rect', 0.36, 1.07, 0, -0.22, 0, P.paper, 1],
    ['rect', 0.4, 0.98, 0, -0.205, 0, P.paperShade, 1],
    ['rect', 0.44, 0.89, 0, -0.19, 0, P.paper, 1],
    ['rect', 0.48, 0.8, 0, -0.175, 0, P.paperShade, 1],
    ['rect', 0.52, 0.71, 0, -0.16, 0, P.paper, 1],
    ['rect', 0.56, 0.62, 0, -0.145, 0, P.paperShade, 1],
    ['rect', 0.6, 0.53, 0, -0.13, 0, P.paper, 1],
    ['rect', 0.64, 0.44, 0, -0.115, 0, P.paperShade, 1],
    ['arch', 0.14, 0.3, 0, -0.1, 0, P.ink, 1],
    ['house', 0.45, 0.7, 0.55, -0.18, 0, P.paper, 1],
    tree(-0.55, 0.05, 0.85, P.olive),
    ['rect', 0.8, 0.14, 0, 0.05, 0, P.paperShade, 1],
  ],
  hanoi_tubehouse: [
    ['tri', 0.9, 1.35, 0, -0.28, 0, P.terracotta, 1],
    ['rect', 0.6, 1.12, 0, -0.25, 0, P.mustard, 1],
    ['rect', 0.5, 0.4, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.12, 0.32, 0, -0.18, 0, P.ink, 1],
    ['dormer', 0.45, 0.6, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.1, 0.5, 0.45, -0.22, 0, P.brown, 1],
    ['house', 0.4, 0.75, 0.55, -0.2, 0, P.paperShade, 1],
    ['tri', 0.5, 0.4, 0.55, -0.18, 0, P.rust, 1],
    ['rect', 0.14, 0.28, 0.28, -0.2, 0, P.tealDeep, 1],
  ],
  hanoi_tubehouse_b: [
    ['tri', 0.88, 1.3, 0, -0.28, 0, P.rust, 1],
    ['rect', 0.58, 1.08, 0, -0.25, 0, P.ochre, 1],
    ['rect', 0.46, 0.38, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.12, 0.3, -0.12, -0.18, 0, P.ink, 1],
    ['dormer', 0.42, 0.58, 0.1, -0.2, 0, P.terracotta, 1],
    tree(-0.55, 0.05, 0.85, P.olive),
    ['rect', 0.1, 0.45, 0.45, -0.2, 0, P.brown, 1],
    ['rect', 0.12, 0.26, 0.3, -0.18, 0, P.tealDeep, 1],
  ],
  hanoi_tubehouse_green: [
    ['tri', 0.62, 1.05, 0, -0.26, 0, P.terracotta, 1],
    ['rect', 0.52, 0.9, 0, -0.23, 0, P.sage, 1],
    ['rect', 0.4, 0.35, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.12, 0.3, 0, -0.18, 0, P.ink, 1],
    ['dormer', 0.3, 0.55, 0.05, -0.2, 0, P.paper, 1],
    tree(-0.55, 0.05, 0.8, P.olive),
    ['rect', 0.12, 0.24, 0.3, -0.18, 0, P.paper, 1],
  ],
  hanoi_mausoleum: [
    ['rect', 1.0, 1.3, 0, -0.28, 0, P.paperShade, 1],
    ['rect', 0.8, 1.15, 0, -0.25, 0, P.paper, 1],
    ['rect', 0.95, 0.9, 0, -0.22, 0, P.paperShade, 1],
    ['rect', 0.06, 0.55, -0.25, -0.17, 0, P.ink, 1],
    ['rect', 0.06, 0.55, 0, -0.17, 0, P.ink, 1],
    ['rect', 0.06, 0.55, 0.25, -0.17, 0, P.ink, 1],
    ['rect', 0.4, 0.7, -0.62, -0.2, 0, P.paperShade, 1],
    ['rect', 0.4, 0.7, 0.62, -0.2, 0, P.paperShade, 1],
    ['rect', 1.0, 0.42, 0, 0, 0, P.paperShade, 1],
    ['rect', 1.15, 0.28, 0, 0.05, 0, P.paperShade, 1],
    ['rect', 1.3, 0.14, 0, 0.1, 0, P.paperShade, 1],
  ],
  hanoi_badinh: [
    ['rect', 0.07, 1.3, 0, -0.6, 0, P.ink, 1],
    ['lamp', 0.34, 1.3, 0.06, -0.62, 0, P.rust, 1],
    ['star', 0.14, 1.3, 0.06, -0.61, 0, P.mustard, 1],
    ['rect', 0.8, 0.16, 0, -0.12, 0, P.paperShade, 1],
    ['rect', 0.5, 0.3, 0, -0.09, 0, P.kraft, 1],
    ['rect', 0.06, 1.3, 0.45, -0.3, 0, P.ink, 1],
    ['arch', 0.5, 0.25, -0.5, 0.4, 0, P.rose, 1],
    ['arch', 0.5, 0.25, 0.5, 0.4, 0, P.rose, 1],
    tuft(-0.7, 0.5),
    tuft(0.7, -0.5),
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
    ['arch', 1.3, 0.34, -0.3, 0, 90, P.rust, 1],
    ['arch', 1.3, 0.34, 0.3, 0, 90, P.rust, -1],
    ['rect', 0.08, 0.5, -0.3, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.5, 0.3, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.6, -0.5, 0, 90, P.ink, 1],
    ['rect', 0.08, 0.6, 0.5, 0, 90, P.ink, 1],
    ['rect', 0.14, 0.34, -0.3, 0.1, 90, P.paperShade, 1],
    ['rect', 0.14, 0.34, 0.3, 0.1, 90, P.paperShade, 1],
  ],
  // Phase 3B lake models: flat-colour flaps only, no hero art card (no new atlas sprites).
  // Pond cells copy the stock pond recipe (reeds at the edge); the lake colours live on
  // the base disc (baseTexture here, buildBase in the GLB builder), not on the flaps.
  hanoi_pond_guom: [
    tuft(-0.75, -0.6),
    ['rect', 0.06, 0.4, 0.7, -0.5, 0, P.olive, 1],
    ['rect', 0.06, 0.32, 0.8, -0.42, 0, P.moss, 1],
  ],
  hanoi_pond_tay: [
    tuft(-0.75, -0.6),
    ['rect', 0.06, 0.4, 0.7, -0.5, 0, P.olive, 1],
    ['rect', 0.06, 0.32, 0.8, -0.42, 0, P.moss, 1],
  ],
  hanoi_lotus: [
    ['arch', 0.3, 0.18, -0.3, -0.2, 0, P.moss, 1],
    ['arch', 0.3, 0.18, 0.3, 0.1, 0, P.moss, 1],
    ['arch', 0.25, 0.22, 0, -0.3, 0, P.rose, 1],
    ['arch', 0.25, 0.22, -0.1, 0.25, 0, P.rose, 1],
    ['rect', 0.06, 0.4, 0.7, -0.5, 0, P.olive, 1],
  ],
  hanoi_stonebridge: [
    ['arch', 1.3, 0.3, -0.3, 0, 90, P.paperShade, 1],
    ['arch', 1.3, 0.3, 0.3, 0, 90, P.paperShade, -1],
    ['rect', 1.5, 0.1, 0, 0.02, 0, P.paperShade, 1],
    ['rect', 0.08, 0.42, -0.6, 0, 90, P.paperShade, 1],
    ['rect', 0.08, 0.42, 0.6, 0, 90, P.paperShade, 1],
  ],
  // Phase 3B-10: Pen Tower, 5 shrinking tiers + a pen-tip tri at 1.45 (tallest around
  // Ho Guom). The light rect at the foot is the inscription tablet.
  hanoi_pentower: [
    ['rect', 0.5, 0.35, 0, -0.2, 0, P.paperShade, 1],
    ['rect', 0.42, 0.62, 0, -0.22, 0, P.paper, 1],
    ['rect', 0.34, 0.88, 0, -0.24, 0, P.paperShade, 1],
    ['rect', 0.26, 1.12, 0, -0.26, 0, P.paper, 1],
    ['rect', 0.18, 1.32, 0, -0.28, 0, P.paperShade, 1],
    ['tri', 0.16, 1.45, 0, -0.3, 0, P.terracotta, 1],
    ['rect', 0.2, 0.08, 0, -0.18, 0, P.paper, 1],
  ],
  // Phase 3B-12: mausoleum side wing - the second tile of the 2-tile mausoleum.
  hanoi_mausoleum_wing: [
    ['rect', 0.9, 0.85, 0, -0.25, 0, P.paperShade, 1],
    ['rect', 0.7, 0.7, 0, -0.22, 0, P.paper, 1],
    ['rect', 0.06, 0.4, -0.2, -0.19, 0, P.ink, 1],
    ['rect', 0.06, 0.4, 0.2, -0.19, 0, P.ink, 1],
    ['rect', 1.0, 0.28, 0, 0.02, 0, P.paperShade, 1],
    ['rect', 1.15, 0.14, 0, 0.08, 0, P.paperShade, 1],
  ],
  // Phase 2B street elements (Old Quarter only; flat cut-paper, no hero art card).
  hanoi_road: [
    ['rect', 0.12, 0.3, -0.75, -0.75, 0, P.ink, 1],
    ['rect', 0.12, 0.3, 0.75, 0.75, 0, P.ink, 1],
  ],
  hanoi_sidewalk: [
    ['rect', 0.5, 0.08, 0, 0.55, 0, P.paperShade, 1],
  ],
  hanoi_tree: [
    ['rect', 0.25, 1.0, 0, -0.1, 0, P.brown, 1],
    ['tree', 1.2, 1.4, 0, -0.15, 0, P.pine, 1],
    ['tree', 0.8, 1.15, 0.25, 0, 0, P.moss, 1],
    ['rect', 0.5, 0.15, 0, 0.35, 0, P.paperShade, 1],
    ['arch', 0.4, 0.2, 0.3, 0.25, 0, P.sage, 1],
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
    ['lamp', 0.25, 0.8, -0.35, 0.05, 0, P.teal, 1],
    ['dormer', 0.12, 0.8, -0.35, 0.08, 0, P.paper, 1],
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
    ['rect', 0.15, 0.12, 0.4, 0.25, 0, P.teal, 1],
  ],
  hanoi_phostall: [
    ['house', 0.9, 1.0, 0, -0.2, 0, P.terracotta, 1],
    ['rect', 0.5, 0.4, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.24, 0.3, -0.2, -0.1, 0, P.ink, 1],
    ['rect', 0.34, 0.18, 0.2, -0.05, 0, P.mustard, 1],
    ['arch', 0.2, 0.3, -0.2, -0.05, 0, P.paper, 1],
    ['rect', 0.5, 0.3, -0.35, 0.15, 0, P.paperShade, 1],
    ['rect', 0.12, 0.15, -0.5, 0.25, 0, P.teal, 1],
    ['rect', 0.12, 0.15, -0.2, 0.28, 0, P.rose, 1],
    ['rect', 0.12, 0.15, 0.45, 0.25, 0, P.mustard, 1],
    ['rect', 0.12, 0.15, 0.2, 0.3, 0, P.teal, 1],
  ],
  hanoi_pole: [
    ['lamp', 0.55, 1.3, 0, -0.15, 0, P.ink, 1],
    ['rect', 0.22, 0.35, 0.3, 0.1, 0, P.paperShade, 1],
    ['sag', 1.9, 1.25, 0, -0.1, 0, P.ink, 1],
    ['sag', 1.9, 1.3, 0, -0.05, 90, P.ink, 1],
    ['sag', 1.7, 1.28, 0, 0, 0, P.brown, 1],
    ['arch', 0.3, 0.45, 0.28, 0.08, 0, P.ink, 1],
  ],
  hanoi_lamp: [
    ['lamp', 0.1, 1.1, 0, -0.1, 0, P.tealDeep, 1],
    ['glowtop', 0.18, 1.1, -0.13, -0.05, 0, P.paper, 1],
    ['glowtop', 0.18, 1.1, 0.13, -0.05, 0, P.paper, 1],
    ['rect', 0.3, 0.12, 0, 0.05, 0, P.tealDeep, 1],
    ['rect', 0.2, 0.14, 0.18, 0.1, 0, P.teal, 1],
  ],
  // Phase 3A street elements (mirror of RECIPES in src/assets/loader.js).
  hanoi_cornerhouse: [
    ['tri', 0.9, 1.4, 0, -0.28, 0, P.terracotta, 1],
    ['rect', 0.75, 1.15, 0, -0.25, 0, P.mustard, 1],
    ['rect', 0.62, 0.42, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.14, 0.34, -0.15, -0.18, 0, P.ink, 1],
    ['rect', 0.14, 0.34, 0.15, -0.18, 0, P.ink, 1],
    ['lamp', 0.6, 1.05, 0, -0.16, 0, P.mustard, 1],
    ['lamp', 0.5, 0.88, 0.1, -0.14, 0, P.teal, 1],
    ['lamp', 0.55, 0.72, -0.1, -0.12, 0, P.paper, 1],
  ],
  hanoi_sign_phoco: [
    ['lamp', 0.5, 1.0, 0, -0.1, 0, P.ink, 1],
    ['lamp', 0.6, 0.95, 0, -0.08, 0, P.mustard, 1],
    ['rect', 0.18, 0.6, 0.35, -0.05, 0, P.paper, 1],
    ['rect', 0.5, 0.12, 0, 0.25, 0, P.brown, 1],
  ],
  hanoi_sign_biahoi: [
    ['lamp', 0.5, 1.0, 0, -0.1, 0, P.ink, 1],
    ['lamp', 0.6, 0.95, 0, -0.08, 0, P.terracotta, 1],
    ['rect', 0.18, 0.6, 0.35, -0.05, 0, P.rust, 1],
    ['rect', 0.5, 0.12, 0, 0.25, 0, P.brown, 1],
  ],
  hanoi_sign_trucbach: [
    ['lamp', 0.5, 1.0, 0, -0.1, 0, P.ink, 1],
    ['lamp', 0.6, 0.95, 0, -0.08, 0, P.paper, 1],
    ['rect', 0.18, 0.6, 0.35, -0.05, 0, P.paperShade, 1],
    ['rect', 0.5, 0.12, 0, 0.25, 0, P.brown, 1],
  ],
  hanoi_sign_paramount: [
    ['lamp', 0.5, 1.0, 0, -0.1, 0, P.ink, 1],
    ['lamp', 0.6, 0.95, 0, -0.08, 0, P.rose, 1],
    ['rect', 0.18, 0.6, 0.35, -0.05, 0, P.mustard, 1],
    ['rect', 0.5, 0.12, 0, 0.25, 0, P.brown, 1],
  ],
  hanoi_flag: [
    ['rect', 0.06, 1.1, -0.05, -0.12, 0, P.ink, 1],
    ['lamp', 0.3, 1.1, 0, -0.1, 0, P.terracotta, 1],
    ['star', 0.14, 1.1, 0, -0.06, 0, P.mustard, 1],
    ['rect', 0.24, 0.1, 0, 0.2, 0, P.paperShade, 1],
  ],
  hanoi_banner: [
    ['rect', 0.06, 1.15, 0, -0.1, 0, P.ink, 1],
    ['rect', 0.25, 0.7, 0.12, -0.06, 0, P.terracotta, 1],
    ['dormer', 0.2, 0.85, 0.12, -0.04, 0, P.mustard, 1],
    ['rect', 0.24, 0.1, 0, 0.2, 0, P.paperShade, 1],
  ],
  hanoi_sautree: [
    ['rect', 0.22, 0.95, 0, -0.1, 0, P.brown, 1],
    ['tree', 1.0, 1.2, 0, -0.15, 0, P.mustard, 1],
    ['tree', 0.7, 1.0, -0.2, 0, 0, P.ochre, 1],
    ['arch', 0.5, 0.25, 0.25, 0.2, 0, P.mustard, 1],
    ['rect', 0.4, 0.12, -0.25, 0.3, 0, P.paperShade, 1],
  ],
  hanoi_bike_red: [
    ['rect', 0.45, 0.28, 0, 0, 0, P.rust, 1],
    ['arch', 0.16, 0.16, -0.18, 0.05, 0, P.ink, 1],
    ['arch', 0.16, 0.16, 0.18, 0.05, 0, P.ink, 1],
    ['rect', 0.06, 0.35, 0.22, 0.02, 0, P.ink, 1],
  ],
  hanoi_bike_blue: [
    ['rect', 0.45, 0.28, 0, 0, 0, P.tealDeep, 1],
    ['arch', 0.16, 0.16, -0.18, 0.05, 0, P.ink, 1],
    ['arch', 0.16, 0.16, 0.18, 0.05, 0, P.ink, 1],
    ['rect', 0.06, 0.35, 0.22, 0.02, 0, P.ink, 1],
  ],
  hanoi_bike_black: [
    ['rect', 0.45, 0.28, 0, 0, 0, P.ink, 1],
    ['arch', 0.16, 0.16, -0.18, 0.05, 0, P.ink, 1],
    ['arch', 0.16, 0.16, 0.18, 0.05, 0, P.ink, 1],
    ['rect', 0.06, 0.35, 0.22, 0.02, 0, P.paperShade, 1],
  ],
  hanoi_mural: [
    ['rect', 1.9, 0.8, 0, 0, 90, P.paperShade, 1],
    ['arch', 0.5, 0.6, 0, 0.05, 90, P.rose, 1],
    ['arch', 0.5, 0.55, 0, 0.15, 90, P.teal, 1],
    ['figure', 0.3, 0.6, 0, 0.1, 90, P.mustard, 1],
    ['rect', 1.9, 0.12, 0, 0.05, 90, P.paper, 1],
  ],
  hanoi_alley: [
    ['tri', 0.5, 1.35, -0.75, -0.22, 0, P.terracotta, 1],
    ['rect', 0.5, 1.3, -0.75, -0.2, 0, P.mustard, 1],
    ['tri', 0.5, 1.3, 0.75, -0.2, 0, P.rust, 1],
    ['rect', 0.5, 1.25, 0.75, -0.18, 0, P.ochre, 1],
    ['lamp', 0.3, 1.05, -0.62, 0, 0, P.terracotta, 1],
    ['star', 0.12, 1.05, -0.62, 0.04, 0, P.mustard, 1],
    ['sag', 1.9, 1.2, 0, 0.1, 0, P.ink, 1],
  ],
  hanoi_vendor_street: [
    ['figure', 0.3, 0.9, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.5, 0.32, -0.5, 0.1, 0, P.ochre, 1],
    ['arch', 0.5, 0.32, 0.5, 0.1, 0, P.ochre, 1],
    ['rect', 0.15, 0.12, 0.4, 0.25, 0, P.teal, 1],
  ],
  hanoi_phostall_street: [
    ['house', 0.9, 1.0, 0, -0.2, 0, P.terracotta, 1],
    ['rect', 0.5, 0.4, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.24, 0.3, -0.2, -0.1, 0, P.ink, 1],
    ['rect', 0.34, 0.18, 0.2, -0.05, 0, P.mustard, 1],
    ['arch', 0.2, 0.3, -0.2, -0.05, 0, P.paper, 1],
    ['rect', 0.5, 0.3, -0.35, 0.15, 0, P.paperShade, 1],
    ['rect', 0.12, 0.15, -0.5, 0.25, 0, P.teal, 1],
    ['rect', 0.12, 0.15, -0.2, 0.28, 0, P.rose, 1],
    ['rect', 0.12, 0.15, 0.45, 0.25, 0, P.mustard, 1],
    ['rect', 0.12, 0.15, 0.2, 0.3, 0, P.teal, 1],
  ],
  hanoi_pole_street: [
    ['lamp', 0.55, 1.3, 0, -0.15, 0, P.ink, 1],
    ['rect', 0.22, 0.35, 0.3, 0.1, 0, P.paperShade, 1],
    ['sag', 1.9, 1.25, 0, -0.05, 90, P.ink, 1],
    ['sag', 1.9, 1.3, 0, -0.05, 0, P.ink, 1],
    ['sag', 1.7, 1.28, 0, 0, 90, P.brown, 1],
    ['arch', 0.3, 0.45, 0.28, 0.08, 0, P.ink, 1],
  ],
};

// Hero art card per model: [kind, w, h, x, z, ryDeg, color, foldSign] + sprite key (or null).
// The card is a plain rect; the sprite's alpha does the die-cut. Sizes match the atlas rects above.
const HERO = {
  hanoi_turtletower: [['rect', 0.71, 1.2, 0, -0.15, 0, P.paper, 1], 'turtletower'],
  hanoi_ngocson: [['rect', 1.3, 1.08, 0, -0.15, 0, P.paper, 1], 'ngocson'],
  hanoi_thehuc: [['rect', 1.6, 0.585, -0.32, 0, 90, P.paper, 1], 'thehuc'],
  hanoi_tranquoc: [['rect', 0.78, 1.44, 0, -0.1, 0, P.paper, 1], 'tranquoc'],
  hanoi_tubehouse: [['rect', 0.81, 1.35, 0, -0.15, 0, P.paper, 1], 'tubehouse'],
  hanoi_tubehouse_b: [['rect', 0.78, 1.3, 0, -0.15, 0, P.paper, 1], 'tubehouse'],
  hanoi_tubehouse_green: null,
  hanoi_mausoleum: [['rect', 1.36, 1.3, 0, -0.15, 0, P.paper, 1], 'mausoleum'],
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
  // hanoi_phostall is in the fix-round block below: it shares the PHO hero card.
  hanoi_pole: null,
  hanoi_lamp: null,
  // Phase 3A street elements: flat-colour flaps only, no hero art card (no new atlas sprites).
  // Phase 3A fix round: the sign boards DO get a hero art card now - the board text
  // ("BIA PHO CO" etc.) lives in the new sign sprites, so the boards read by text,
  // not just by colour. The hero flap copies the board flap geometry exactly, so
  // the sprite's head box lands on the board's head box (lamp kind, top 18%).
  hanoi_cornerhouse: [['lamp', 0.6, 1.05, 0, -0.16, 0, P.mustard, 1], 'sign_biaphoco'],
  hanoi_sign_phoco: [['lamp', 0.6, 0.95, 0, -0.08, 0, P.mustard, 1], 'sign_biaphoco'],
  hanoi_sign_biahoi: [['lamp', 0.6, 0.95, 0, -0.08, 0, P.terracotta, 1], 'sign_biahoi'],
  hanoi_sign_trucbach: [['lamp', 0.6, 0.95, 0, -0.08, 0, P.paper, 1], 'sign_trucbach'],
  hanoi_sign_paramount: [['lamp', 0.6, 0.95, 0, -0.08, 0, P.rose, 1], 'sign_paramount'],
  hanoi_flag: null,
  hanoi_banner: [['rect', 0.25, 0.7, 0.12, -0.06, 0, P.terracotta, 1], 'sign_banner304'],
  hanoi_sautree: null,
  hanoi_bike_red: null,
  hanoi_bike_blue: null,
  hanoi_bike_black: null,
  hanoi_mural: null,
  hanoi_alley: null,
  hanoi_vendor_street: null,
  // hanoi_phostall (2B model) shares the PHO hero card with hanoi_phostall_street:
  // both stalls carry the same mustard PHO sign flap.
  hanoi_phostall: [['rect', 0.34, 0.18, 0.2, -0.05, 0, P.mustard, 1], 'sign_pho'],
  hanoi_phostall_street: [['rect', 0.34, 0.18, 0.2, -0.05, 0, P.mustard, 1], 'sign_pho'],
  hanoi_pole_street: null,
  // Phase 3B lake models: flat-colour flaps only, no hero art card (no new atlas sprites).
  hanoi_pond_guom: null,
  hanoi_pond_tay: null,
  hanoi_lotus: null,
  hanoi_stonebridge: null,
  hanoi_pentower: null,
  hanoi_mausoleum_wing: null,
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
