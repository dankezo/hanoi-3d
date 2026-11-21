// Step 2A: build public/models/basic-grand.glb (grand Basic-map buildings) with three.js.
// No Blender in the sandbox, so the tiles are built procedurally and exported with GLTFExporter.
// Same loader contract as tools/step5/build-hanoi-glb.mjs:
//   - top-level node per stock model id, userData { name, model }
//   - a mesh named '<id>__base' (flat, vertex colours, uv1 all -1)
//   - flap meshes named '<id>__*' with userData { hinge, foldAngle, delay, layer, size }
//   - every mesh: COLOR_0 vertex colours, uv1 (TEXCOORD_1) with (-1,-1) for non-art faces and
//     atlas UVs on the front face of the hero art card; material named 'paper'
//   - flap geometry: extruded card 0.016 thick, shape in local XY, hinge at y = 0
// DECISION (see docs/phase-2a-manifest.md): the stock ids are KEPT (house, manor, barn_farm,
// village, village_b, village_green). Renaming would break wfc.js, world.js, the animal/life
// configs and the solver check, which all key on the stock ids. Only geometry + art change.
// The GLB node ids are therefore the stock ids; the atlas sprite keys carry the basic_* names.
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
const PX = 256; // atlas px per world unit for the 6 basic sprites (see build-basic-atlas.py)

// Atlas rects for the 6 hero sprites (written by tools/step5/build-basic-atlas.py; keep in sync).
// sprite key -> [x, y, w, h] in atlas pixels. Free zone y 3395-4051, below the step-5 rows (end 3379).
const SPRITES = {
  basic_townhouse: [16, 3395, 294, 333],
  basic_grandmanor: [326, 3395, 384, 358],
  basic_greatbarn: [726, 3395, 384, 358],
  basic_marketstreet: [16, 3769, 410, 282],
  basic_gardencottage: [442, 3769, 358, 256],
  basic_townsquare: [816, 3769, 410, 282],
};

// Sockets (rot 0) copied from src/core/models.js, for the painted base. Unchanged from stock.
const SOCKETS = {
  house: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  manor: { n: 'grass', e: 'grass', s: 'path', w: 'grass' },
  barn_farm: { n: 'grass', e: 'grass', s: 'grass', w: 'grass' },
  village: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  village_b: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
  village_green: { n: 'path', e: 'grass', s: 'path', w: 'grass' },
};

// ---- shapes (same math as shapeFor in src/assets/loader.js, plus dormer / swag / lamp) -----------
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
    // thin stem (hidden against the body) + box + cap: a dormer window high on the roof face
    const st = 0.015;
    const y0 = h * 0.61, y1 = h * 0.86;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, y1);
    s.lineTo(0, h); s.lineTo(-a, y1); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else if (kind === 'swag') {
    // bunting band: two side posts + a top band, open middle (hole)
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h); s.lineTo(-a, h); s.closePath();
    const hole = new THREE.Path();
    const p = 0.05, top = h * 0.82;
    hole.moveTo(-a + p, 0.02); hole.lineTo(a - p, 0.02); hole.lineTo(a - p, top); hole.lineTo(-a + p, top); hole.closePath();
    s.holes.push(hole);
  } else if (kind === 'lamp') {
    // thin post + head box at the top, one piece
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
    const hw = RIVER_WIDTH / 2, pw = PATH_WIDTH / 2;
    if (s.n === 'river' && Math.abs(x) < hw && z < 0) c.copy(teal);
    if (s.s === 'river' && Math.abs(x) < hw && z > 0) c.copy(teal);
    if (s.e === 'river' && Math.abs(z) < hw && x > 0) c.copy(teal);
    if (s.w === 'river' && Math.abs(z) < hw && x < 0) c.copy(teal);
    if (s.n === 'path' && Math.abs(x) < pw && z < 0) c.copy(kraft);
    if (s.s === 'path' && Math.abs(x) < pw && z > 0) c.copy(kraft);
    if (s.e === 'path' && Math.abs(z) < pw && x > 0) c.copy(kraft);
    if (s.w === 'path' && Math.abs(z) < pw && x < 0) c.copy(kraft);
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

// ---- recipes: mirror of RECIPES in src/assets/loader.js (Phase 2A), plus the hero art card -------
// Each entry: [kind, w, h, x, z, ryDeg, color, foldSign]. The hero is appended last (front-most).
// Layering rule (same as step 5): every flap starts at ground y = 0, so a taller piece behind
// (smaller z) shows above a shorter wider piece in front of it.
const tuft = (x, z) => ['tri', 0.28, 0.2, x, z, 0, P.olive, 1];
const tree = (x, z, h = 1, c = P.moss) => ['tree', h * 0.62, h, x, z, 0, c, 1];
const RECIPES = {
  // basic_townhouse (was house): 3-storey townhouse, steep roof, dormer, shutters, flower box, chimney.
  house: [
    ['tri', 1.2, 1.3, 0, -0.35, 0, P.terracotta, 1],
    ['rect', 1.0, 0.95, 0, -0.32, 0, P.paper, 1],
    ['rect', 0.12, 1.15, 0.4, -0.29, 0, P.ink, 1],
    ['dormer', 0.26, 1.02, 0.18, -0.26, 0, P.paperShade, 1],
    ['rect', 0.1, 0.42, -0.32, -0.23, 0, P.sage, 1],
    ['rect', 0.1, 0.42, 0.32, -0.23, 0, P.sage, 1],
    ['rect', 0.36, 0.12, 0, -0.2, 0, P.terracotta, 1],
    ['rect', 0.14, 0.3, 0, -0.17, 0, P.ink, 1],
  ],
  // basic_grandmanor (was manor): manor + side tower, arched windows, garden wall + gate, cypress trees.
  manor: [
    ['tri', 0.44, 1.4, 0.55, -0.38, 0, P.rose, 1],
    ['rect', 0.34, 1.3, 0.55, -0.35, 0, P.ochre, 1],
    ['tri', 1.3, 1.05, -0.15, -0.32, 0, P.rose, 1],
    ['rect', 1.1, 0.85, -0.15, -0.29, 0, P.ochre, 1],
    ['arch', 0.14, 0.42, -0.45, -0.26, 0, P.ink, 1],
    ['arch', 0.14, 0.42, -0.05, -0.26, 0, P.ink, 1],
    ['rect', 1.5, 0.22, 0, -0.12, 0, P.paperShade, 1],
    ['rect', 0.16, 0.34, 0, -0.09, 0, P.ink, 1],
    tree(-0.72, -0.05, 0.9, P.pine),
    tree(0.72, 0.02, 0.85, P.pine),
  ],
  // basic_greatbarn (was barn_farm): great barn + round silo, haystacks, cart, fence run.
  barn_farm: [
    ['tri', 0.34, 1.4, 0.62, -0.38, 0, P.rust, 1],
    ['rect', 0.3, 1.28, 0.62, -0.35, 0, P.paperShade, 1],
    ['tri', 1.3, 1.05, -0.2, -0.32, 0, P.rust, 1],
    ['rect', 1.1, 0.85, -0.2, -0.29, 0, P.kraft, 1],
    ['rect', 0.3, 0.45, -0.2, -0.26, 0, P.brown, 1],
    ['tri', 0.4, 0.35, -0.78, -0.05, 0, P.mustard, 1],
    ['tri', 0.32, 0.28, 0.78, 0.05, 0, P.mustard, 1],
    ['rect', 0.3, 0.18, -0.45, 0.15, 0, P.brown, 1],
    ['rect', 1.6, 0.14, 0, 0.28, 0, P.brown, 1],
  ],
  // basic_marketstreet (was village): houses both sides + awnings, stalls, lantern, bunting band.
  village: [
    ['tri', 0.74, 1.1, -0.62, -0.35, 0, P.terracotta, 1],
    ['rect', 0.62, 0.85, -0.62, -0.32, 0, P.paper, 1],
    ['tri', 0.74, 1.05, 0.62, -0.32, 0, P.rust, 1],
    ['rect', 0.62, 0.8, 0.62, -0.29, 0, P.paperShade, 1],
    ['rect', 0.5, 0.14, -0.62, -0.23, 0, P.teal, 1],
    ['rect', 0.5, 0.14, 0.62, -0.2, 0, P.terracotta, 1],
    ['rect', 0.34, 0.3, -0.25, 0.05, 0, P.kraft, 1],
    ['rect', 0.3, 0.1, -0.25, 0.08, 0, P.mustard, 1],
    ['rect', 0.34, 0.3, 0.28, 0.08, 0, P.kraft, 1],
    ['swag', 1.6, 1.0, 0, -0.14, 0, P.rose, 1],
  ],
  // basic_gardencottage (was village_b): cottage + walled flower garden, pond with reeds, stone lantern.
  village_b: [
    ['tri', 1.05, 1.0, 0.25, -0.35, 0, P.rose, 1],
    ['rect', 0.9, 0.8, 0.25, -0.32, 0, P.paper, 1],
    ['rect', 0.14, 0.3, 0.25, -0.29, 0, P.ink, 1],
    ['rect', 0.1, 0.3, -0.05, -0.26, 0, P.sage, 1],
    ['rect', 0.1, 0.3, 0.55, -0.26, 0, P.sage, 1],
    ['rect', 1.5, 0.25, 0, -0.1, 0, P.paperShade, 1],
    ['arch', 0.5, 0.22, -0.55, 0.12, 0, P.teal, 1],
    ['rect', 0.05, 0.3, -0.7, 0.15, 0, P.moss, 1],
    ['rect', 0.05, 0.26, -0.42, 0.15, 0, P.olive, 1],
    ['rect', 0.08, 0.45, 0.72, 0.1, 0, P.ink, 1],
    ['rect', 0.18, 0.1, 0.72, 0.13, 0, P.paperShade, 1],
    ['tri', 0.14, 0.18, -0.15, 0.3, 0, P.mustard, 1],
  ],
  // basic_townsquare (was village_green): fountain, four lamp posts, benches, two trees, pigeons.
  village_green: [
    tree(-0.68, -0.3, 1.0, P.moss),
    tree(0.68, -0.25, 0.95, P.olive),
    ['rect', 0.3, 0.8, 0, -0.2, 0, P.paper, 1],
    ['arch', 0.34, 1.1, 0, -0.23, 0, P.teal, 1],
    ['rect', 0.7, 0.25, 0, -0.14, 0, P.tealDeep, 1],
    ['lamp', 0.14, 0.95, -0.68, -0.05, 0, P.ink, 1],
    ['lamp', 0.14, 0.95, 0.68, -0.02, 0, P.ink, 1],
    ['lamp', 0.14, 0.9, -0.55, 0.25, 0, P.ink, 1],
    ['lamp', 0.14, 0.9, 0.55, 0.28, 0, P.ink, 1],
    ['rect', 0.4, 0.16, -0.55, 0.22, 0, P.brown, 1],
    ['rect', 0.4, 0.16, 0.55, 0.22, 0, P.brown, 1],
    ['tri', 0.08, 0.07, -0.2, 0.3, 0, P.ink, 1],
    ['tri', 0.08, 0.07, 0.22, 0.32, 0, P.ink, 1],
  ],
};

// Hero art card per stock id: [kind, w, h, x, z, ryDeg, color, foldSign] + sprite key.
// Card size = atlas rect / PX so the art aspect matches the flap exactly.
const HERO = {
  house: [SPRITES.basic_townhouse, 'basic_townhouse'],
  manor: [SPRITES.basic_grandmanor, 'basic_grandmanor'],
  barn_farm: [SPRITES.basic_greatbarn, 'basic_greatbarn'],
  village: [SPRITES.basic_marketstreet, 'basic_marketstreet'],
  village_b: [SPRITES.basic_gardencottage, 'basic_gardencottage'],
  village_green: [SPRITES.basic_townsquare, 'basic_townsquare'],
};

function buildTile(id, mat) {
  const root = new THREE.Group();
  root.name = id;
  root.userData = { name: id, model: id };
  root.add(buildBase(id, mat));
  const entries = RECIPES[id].slice();
  const [rect, sprite] = HERO[id];
  const heroEntry = ['rect', rect[2] / PX, rect[3] / PX, 0, -0.12, 0, P.paper, 1];
  entries.push(heroEntry);
  const total = entries.length;
  entries.forEach((entry, i) => {
    const spriteRect = i === total - 1 ? rect : null;
    root.add(buildFlap(id, i, entry, total, spriteRect));
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
fs.writeFileSync(new URL('../../public/models/basic-grand.glb', import.meta.url), Buffer.from(out));
console.log('wrote public/models/basic-grand.glb:', out.byteLength, 'bytes,', Object.keys(RECIPES).length, 'tiles');
