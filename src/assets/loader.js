// Loads the runtime glTF models and texture manifest:
//   ./models/tiles.glb      tile models with hinged paper flaps
//   ./models/traveller.glb  the paper traveller (body/head/legs/arms/lantern, clip 'walk')
//   ./textures/manifest.json
// Never throws: anything missing falls back to the procedural PLACEHOLDER tiles / traveller below, which use
// the same hinge convention (source = 'placeholder' | 'mixed' | 'gltf').
// All cardstock uses ONE material, materials.paper({ color: '#ffffff' }), coloured by vertex colours (COLOR_0);
// window panes / lantern glass use ONE emissive material.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG, TILE_SIZE, PATH_WIDTH, RIVER_WIDTH, FLAP_LAYER_GAP } from '../core/config.js';
import { MODELS, MODEL_IDS, FALLBACK_MODEL } from '../core/models.js';
import { HANOI_MODELS, HANOI_MODEL_IDS } from '../world/hanoi-models.js';

const P = CONFIG.palette;

/** Phase 2A: stock ids whose tiles come from basic-grand.glb (grand Basic buildings). */
const BASIC_GRAND_IDS = ['house', 'manor', 'barn_farm', 'village', 'village_b', 'village_green'];

// ---- flat printed base -----------------------------------------------------------------------
function baseTexture(id, sockets) {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = P.sage;
  g.fillRect(0, 0, N, N);
  const s = sockets;
  const u = N / TILE_SIZE; // pixels per world unit. Canvas: +x = east, top = north.
  const strip = (dir, width, color) => {
    const w = width * u;
    g.fillStyle = color;
    const m = N / 2;
    if (dir === 'n') g.fillRect(m - w / 2, 0, w, m + w / 2);
    if (dir === 's') g.fillRect(m - w / 2, m - w / 2, w, m + w / 2);
    if (dir === 'e') g.fillRect(m - w / 2, m - w / 2, m + w / 2, w);
    if (dir === 'w') g.fillRect(0, m - w / 2, m + w / 2, w);
  };
  for (const d of ['n', 'e', 's', 'w']) if (s[d] === 'river') strip(d, RIVER_WIDTH, P.teal);
  for (const d of ['n', 'e', 's', 'w']) if (s[d] === 'path') strip(d, PATH_WIDTH, P.kraft);
  if (id === 'pond') {
    g.fillStyle = P.teal;
    g.beginPath();
    g.arc(N / 2, N / 2, 0.6 * u, 0, Math.PI * 2);
    g.fill();
  }
  if (id === 'hanoi_road') {
    // zebra crossing bands on the N and S arms: 5 white dashes each (paper print)
    g.fillStyle = '#fbf6ea';
    for (const cy of [0.5 - 0.55 / 2, 0.5 + 0.55 / 2]) {
      for (const cx of [0.34, 0.42, 0.5, 0.58, 0.66]) {
        g.fillRect((cx - 0.0225) * N, (cy - 0.075) * N, 0.045 * N, 0.15 * N);
      }
    }
  }
  if (id === 'hanoi_sidewalk') {
    // pavement slab: kraft-cream wash, terracotta kerb lines on both long edges, joints
    g.fillStyle = P.paperShade;
    g.fillRect(0, 0, N, N);
    g.fillStyle = P.terracotta;
    g.fillRect(0, 0, N, 0.03 * N);
    g.fillRect(0, 0.97 * N, N, 0.03 * N);
    g.fillStyle = 'rgba(90,58,40,0.25)';
    g.fillRect(0.5 * N, 0, 1, N);
    g.fillRect(0, 0.5 * N, N, 1);
  }
  g.strokeStyle = 'rgba(74,52,38,0.18)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, N - 1, N - 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---- upright cut-paper flaps -----------------------------------------------------------------
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
    // Phase 2A: thin stem (hidden against the body) + box + cap, a dormer high on the roof face
    const st = 0.015;
    const y0 = h * 0.61, y1 = h * 0.86;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, y1);
    s.lineTo(0, h); s.lineTo(-a, y1); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else if (kind === 'swag') {
    // Phase 2A: bunting band, two side posts + a top band, open middle (hole)
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h); s.lineTo(-a, h); s.closePath();
    const hole = new THREE.Path();
    const p = 0.05, top = h * 0.82;
    hole.moveTo(-a + p, 0.02); hole.lineTo(a - p, 0.02); hole.lineTo(a - p, top); hole.lineTo(-a + p, top); hole.closePath();
    s.holes.push(hole);
  } else if (kind === 'lamp') {
    // Phase 2A: thin post + head box at the top, one piece
    const st = 0.03;
    const y0 = h * 0.82;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, h);
    s.lineTo(-a, h); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else if (kind === 'figure') {
    // Phase 2B: paper person - straight body + round head, one piece
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h * 0.7);
    s.absellipse(0, h * 0.7, a, h * 0.3, 0, Math.PI, false);
    s.closePath();
  } else if (kind === 'glowtop') {
    // Phase 2B: thin stem + small lit box at the top (traffic light / street lamp glow)
    const st = 0.015;
    const y0 = h * 0.84;
    s.moveTo(-st, 0); s.lineTo(st, 0); s.lineTo(st, y0); s.lineTo(a, y0); s.lineTo(a, h);
    s.lineTo(-a, h); s.lineTo(-a, y0); s.lineTo(-st, y0); s.closePath();
  } else {
    s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, h); s.lineTo(-a, h); s.closePath();
  }
  return s;
}

const geoCache = new Map();
function flapGeometry(kind, w, h) {
  const key = kind + '|' + w + '|' + h;
  let geo = geoCache.get(key);
  if (!geo) { geo = new THREE.ShapeGeometry(shapeFor(kind, w, h), 10); geoCache.set(key, geo); }
  return geo;
}

// [kind, w, h, x, z, ryDeg, color, foldSign]
const tuft = (x, z) => ['tri', 0.28, 0.2, x, z, 0, P.olive, 1];
const tree = (x, z, h = 1, c = P.moss) => ['tree', h * 0.62, h, x, z, 0, c, 1];
const RECIPES = {
  meadow: [tuft(-0.5, -0.3), tuft(0.45, 0.4)],
  meadow_flowers: [tuft(-0.55, 0.2), ['tri', 0.16, 0.26, 0.1, -0.4, 0, P.mustard, 1], ['tri', 0.16, 0.22, 0.5, 0.35, 0, P.terracotta, 1]],
  hills: [['arch', 1.7, 0.75, 0, -0.45, 0, P.olive, 1], ['arch', 1.25, 0.5, -0.2, 0, 0, P.sage, 1], ['arch', 0.8, 0.32, 0.35, 0.45, 0, P.moss, 1]],
  forest: [tree(-0.55, -0.6, 1.15), tree(0.45, -0.5, 1.0, P.olive), tree(-0.1, -0.1, 0.95), tree(-0.6, 0.35, 0.8, P.olive), tree(0.55, 0.3, 0.9)],
  grove: [tree(-0.4, -0.3, 1.0), tree(0.45, 0.2, 0.8, P.olive)],
  rocks: [['arch', 0.7, 0.4, -0.2, -0.1, 0, P.paperShade, 1], ['arch', 0.45, 0.26, 0.35, 0.3, 0, P.kraft, 1]],
  pond: [tuft(-0.75, -0.6), ['rect', 0.06, 0.4, 0.7, -0.5, 0, P.olive, 1], ['rect', 0.06, 0.32, 0.8, -0.42, 0, P.moss, 1]],
  windmill: [['rect', 0.42, 1.2, 0, -0.2, 0, P.paper, 1], ['tri', 1.0, 0.5, 0, -0.18, 0, P.terracotta, 1], tuft(0.6, 0.5)],
  path_straight: [tuft(0.65, -0.5), tuft(-0.6, 0.45)],
  path_corner: [tuft(-0.6, 0.55), tree(-0.6, -0.55, 0.7, P.olive)],
  path_t: [tuft(-0.6, -0.6), tuft(0.6, -0.6)],
  path_cross: [tuft(-0.7, -0.7), tuft(0.7, 0.7)],
  path_end: [['rect', 0.07, 0.55, 0, -0.1, 0, P.ink, 1], ['rect', 0.42, 0.16, 0, -0.08, 0, P.kraft, 1], tuft(0.6, -0.5)],
  lantern_post: [['rect', 0.06, 0.95, 0.5, 0, 0, P.ink, 1], ['rect', 0.2, 0.24, 0.5, 0.02, 0, P.lantern, 1], tuft(-0.65, 0.4)],
  // Phase 2A grand Basic buildings (mirror of RECIPES in tools/step5/build-basic-glb.mjs,
  // without the hero art card). The stock ids are kept on purpose: wfc.js, world.js and the
  // animal/life configs all key on them, so renaming would break the solver. Only the
  // geometry + art change; sockets, tags and biome weights in core/models.js are untouched.
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
  river_straight: [['rect', 0.06, 0.36, 0.6, -0.4, 0, P.olive, 1], tuft(-0.65, 0.5)],
  river_corner: [tuft(-0.6, 0.6), ['rect', 0.06, 0.36, -0.55, -0.2, 0, P.olive, 1]],
  river_source: [['arch', 0.9, 0.5, 0, -0.25, 0, P.paperShade, 1], ['arch', 0.5, 0.3, 0.3, -0.1, 0, P.kraft, 1]],
  bridge: [['arch', 1.3, 0.34, -0.3, 0, 90, P.kraft, 1], ['arch', 1.3, 0.34, 0.3, 0, 90, P.kraft, -1]],
  // Step 3 Hanoi landmarks (Hanoi-only models; flat cut-paper silhouettes).
  // Layering rule: every flap starts at ground y = 0, so a taller piece behind (smaller z) shows
  // above a shorter wider piece in front of it. Heights stay under ~1.35 (traveller is 0.6).
  // Phase 2B: landmarks are bigger and more layered (taller flaps up to ~1.5, extra wings,
  // plinths and side pieces); the GLB hero cards grow to match (same atlas sprites).
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
  // Phase 2B street elements (Old Quarter only; flat cut-paper silhouettes, static figures).
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

function buildPlaceholderTile(id, materials) {
  const group = new THREE.Group();
  group.name = id;
  group.userData.model = id;

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE).rotateX(-Math.PI / 2),
    materials.paper({ color: '#ffffff', map: baseTexture(id, (MODELS[id] && MODELS[id].sockets) || (HANOI_MODELS[id] && HANOI_MODELS[id].sockets) || MODELS[FALLBACK_MODEL].sockets), side: THREE.FrontSide }),
  );
  base.name = 'base';
  base.receiveShadow = true;
  group.add(base);

  const recipe = RECIPES[id] || RECIPES[FALLBACK_MODEL];
  recipe.forEach(([kind, w, h, x, z, ry, color, sign], i) => {
    const flap = new THREE.Group();
    flap.name = 'flap_' + i;
    flap.position.set(x, FLAP_LAYER_GAP * (i + 1), z);
    flap.rotation.y = THREE.MathUtils.degToRad(ry);
    flap.userData = {
      hinge: true,
      foldAngle: sign * Math.PI / 2,
      delay: recipe.length > 1 ? i / (recipe.length - 1) : 0,
      layer: i,
      size: Math.min(1, h / TILE_SIZE),
    };
    const mesh = new THREE.Mesh(flapGeometry(kind, w, h), materials.paper({ color, side: THREE.DoubleSide }));
    mesh.name = 'flap_' + i + '_mesh';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    flap.add(mesh);
    group.add(flap);
  });
  return group;
}

function buildPlaceholderTraveller(materials) {
  const H = CONFIG.TRAVELLER_HEIGHT;
  const root = new THREE.Group();
  root.name = 'traveller';
  const cloak = new THREE.Shape();
  cloak.moveTo(-0.15, 0); cloak.lineTo(0.15, 0); cloak.lineTo(0.08, H * 0.68); cloak.lineTo(-0.08, H * 0.68); cloak.closePath();
  const bodyMat = materials.paper({ color: P.terracotta, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.ShapeGeometry(cloak), bodyMat);
  body.name = 'body';
  const side = body.clone();
  side.name = 'body_side';
  side.rotation.y = Math.PI / 2;
  side.scale.x = 0.7;
  const head = new THREE.Mesh(new THREE.CircleGeometry(H * 0.17, 20), materials.paper({ color: P.paper, side: THREE.DoubleSide }));
  head.name = 'head';
  head.position.y = H * 0.8;
  const hat = new THREE.Mesh(flapGeometry('tri', 0.3, 0.16), materials.paper({ color: P.ink, side: THREE.DoubleSide }));
  hat.name = 'hat';
  hat.position.set(0, H * 0.9, 0.002);
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.09, 0.07),
    new THREE.MeshStandardMaterial({ color: P.lantern, emissive: P.lantern, emissiveIntensity: 2, roughness: 1 }),
  );
  lantern.name = 'lantern';
  lantern.position.set(0.2, H * 0.42, 0.06);
  for (const m of [body, side, head, hat, lantern]) { m.castShadow = true; root.add(m); }
  lantern.castShadow = false;
  root.animations = [];
  return root;
}

// ---- glTF -> prototypes ----------------------------------------------------------------------------
const warnings = [];
function warn(...a) { warnings.push(a.join(' ')); console.warn('[assets]', ...a); }

async function loadGLTF(url) {
  try {
    return await new GLTFLoader().loadAsync(url);
  } catch (err) {
    warn('could not load', url, '-', err && err.message ? err.message : String(err));
    return null;
  }
}

/** Blender object names are globally unique, so they carry a '<model>__' prefix: strip it. */
function stripName(name, prefix) {
  let n = String(name || '');
  if (n.startsWith(prefix)) n = n.slice(prefix.length);
  return n;
}

function renameClips(clips, prefix) {
  return (clips || []).map((c) => {
    const clip = c.clone();
    for (const t of clip.tracks) {
      const i = t.name.indexOf(prefix);
      if (i >= 0) t.name = t.name.slice(0, i) + t.name.slice(i + prefix.length);
    }
    return clip;
  });
}

/**
 * Turn one exported top-level node into a prototype: strip name prefixes, swap in the shared materials,
 * normalise the hinge userData, set shadow flags. Returns { hinges, triangles, meshes }.
 */
function adopt(root, prefix, mats, opts = {}) {
  const stats = { hinges: 0, triangles: 0, meshes: 0, bad: 0 };
  root.traverse((o) => {
    o.name = stripName(o.name, prefix);
    const ud = o.userData || (o.userData = {});
    if (ud.hinge) {
      ud.hinge = true;
      ud.foldAngle = Number(ud.foldAngle);
      ud.delay = Math.min(1, Math.max(0, Number(ud.delay) || 0));
      ud.layer = Math.max(0, Math.round(Number(ud.layer) || 0));
      if (!Number.isFinite(ud.foldAngle)) { ud.foldAngle = Math.PI / 2; stats.bad++; }
      stats.hinges++;
    }
    if (o.isMesh) {
      const glow = o.material && /glow/i.test(o.material.name || '');
      if (o.material && o.material.dispose) o.material.dispose();
      o.material = glow ? mats.glow : mats.paper;
      const isBase = !glow && (o.name === 'base' || (o.parent && o.parent.name === 'base'));
      o.castShadow = !glow && !isBase && opts.castShadow !== false;
      o.receiveShadow = !glow;
      if (glow) o.userData.glow = true;
      const g = o.geometry;
      if (g) {
        if (!g.boundingSphere) g.computeBoundingSphere();
        if (!g.boundingBox) g.computeBoundingBox();
        stats.triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
      }
      stats.meshes++;
    }
  });
  return stats;
}

async function loadTexture(url, { srgb = false, repeat = true, flipY = true, anisotropy = 4 } = {}) {
  try {
    const t = await new THREE.TextureLoader().loadAsync(url);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.flipY = flipY;
    t.anisotropy = anisotropy;
    return t;
  } catch (err) {
    return null;
  }
}

async function fetchJSON(url) {
  try {
    if (typeof fetch !== 'function') return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/** Paper, page and print maps from the runtime texture manifest (tolerates absence). */
async function loadTextures(A, anisotropy) {
  const out = { paper: null, paperNormal: null, paperRough: null, manifest: null };
  const jobs = [];
  const manifest = await fetchJSON(A.manifestUrl);
  if (manifest && typeof manifest === 'object') {
    out.manifest = manifest;
    for (const key of Object.keys(manifest)) {
      const e = manifest[key];
      if (!e || typeof e !== 'object' || !e.file) continue;
      const wrap = String(e.wrap || 'repeat');
      jobs.push(loadTexture(A.texturesBase + e.file, { srgb: e.colorSpace === 'srgb', repeat: wrap.indexOf('repeat') >= 0, flipY: e.flipY !== false, anisotropy })
        .then((t) => {
          if (!t) { warn('texture missing:', e.file); return; }
          if (wrap === 'repeat,clamp') { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; }
          t.userData = { key, repeat: e.repeat || 1, type: e.type || '', manifest: e };
          // glTF TEXCOORD_1 addresses the art atlas top-down, so the manifest says flipY:false.
          if (e.type === 'art-atlas') { t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; }
          out[key] = t;
        }));
    }
  }
  await Promise.all(jobs);
  // aliases other modules look for
  if (out.paper && !out.card) out.card = out.paper;
  if (out.paperNormal && !out.cardNormal) out.cardNormal = out.paperNormal;
  return out;
}

/**
 * @returns {Promise<{getTilePrototype:(modelId:string)=>THREE.Group, traveller:THREE.Group,
 *   textures:Record<string,any>, modelIds:string[], source:'placeholder'|'gltf'|'mixed',
 *   meta:object|null, warnings:string[], stats:object}>}
 */
export async function loadAssets({ materials, renderer, quality, hanoi = false } = {}) {
  const A = CONFIG.assets;
  const caps = renderer && renderer.capabilities;
  const anisotropy = Math.min(8, (caps && caps.getMaxAnisotropy && caps.getMaxAnisotropy()) || 4);
  const mats = {
    paper: materials.paper({ color: '#ffffff', side: THREE.DoubleSide }),
    glow: materials.paper({ color: '#ffffff', side: THREE.DoubleSide, emissive: A.glowColor, emissiveIntensity: A.glowIntensity, fibre: 'none', vary: false }),
  };
  // The tiles are drawn through a BatchedMesh, the traveller as plain meshes: separate material instances
  // (same look) so three does not re-derive the program parameters on every batch <-> mesh switch.
  const travMats = {
    paper: materials.paper({ color: '#ffffff', side: THREE.DoubleSide, variant: 'traveller' }),
    glow: materials.paper({ color: '#ffffff', side: THREE.DoubleSide, emissive: A.glowColor, emissiveIntensity: A.glowIntensity, fibre: 'none', vary: false, variant: 'traveller' }),
  };
  const noTex = () => ({ paper: null, paperNormal: null, paperRough: null, manifest: null });

  const [tilesGltf, basicGrandGltf, hanoiGltf, travGltf, textures, meta] = await Promise.all([
    loadGLTF(A.tilesUrl), !hanoi ? loadGLTF(A.basicGrandUrl) : Promise.resolve(null), hanoi ? loadGLTF(A.hanoiTilesUrl) : Promise.resolve(null), loadGLTF(A.travellerUrl), loadTextures(A, anisotropy).catch(noTex), fetchJSON(A.metaUrl),
  ]);

  const protos = new Map();
  const stats = { tiles: {}, traveller: null };
  let fromGltf = 0;
  if (tilesGltf && tilesGltf.scene) {
    const byName = new Map();
    for (const c of [...tilesGltf.scene.children]) byName.set(c.name, c);
    for (const id of MODEL_IDS) {
      const node = byName.get(id);
      if (!node) continue;
      try {
        node.removeFromParent();
        node.position.set(0, 0, 0); node.quaternion.identity(); node.scale.set(1, 1, 1);
        const st = adopt(node, id + '__', mats);
        const base = node.getObjectByName('base');
        if (!base || st.hinges === 0) { warn('tile', id, 'has no base / flaps in tiles.glb - using placeholder'); continue; }
        node.name = id;
        node.userData.model = id;
        node.updateMatrixWorld(true);
        protos.set(id, node);
        stats.tiles[id] = st;
        fromGltf++;
      } catch (err) {
        warn('tile', id, 'failed:', err && err.message);
      }
    }
  }
  // Phase 2A: basic-grand.glb overrides the 6 stock building tiles with the grand versions.
  // Loaded only off Hanoi mode (mirror of the step-6 lazy-load pattern); if a node is
  // missing or invalid, the tiles.glb version already in protos stays in place.
  if (basicGrandGltf && basicGrandGltf.scene) {
    const byName = new Map();
    for (const c of [...basicGrandGltf.scene.children]) byName.set(c.name, c);
    for (const id of BASIC_GRAND_IDS) {
      const node = byName.get(id);
      if (!node) continue;
      try {
        node.removeFromParent();
        node.position.set(0, 0, 0); node.quaternion.identity(); node.scale.set(1, 1, 1);
        const st = adopt(node, id + '__', mats);
        const base = node.getObjectByName('base');
        if (!base || st.hinges === 0) { warn('tile', id, 'has no base / flaps in basic-grand.glb - keeping tiles.glb version'); continue; }
        node.name = id;
        node.userData.model = id;
        node.updateMatrixWorld(true);
        protos.set(id, node);
        stats.tiles[id] = st;
      } catch (err) {
        warn('tile', id, 'failed:', err && err.message);
      }
    }
  }
  if (hanoiGltf && hanoiGltf.scene) {
    const byName = new Map();
    for (const c of [...hanoiGltf.scene.children]) byName.set(c.name, c);
    for (const id of HANOI_MODEL_IDS) {
      const node = byName.get(id);
      if (!node) continue;
      try {
        node.removeFromParent();
        node.position.set(0, 0, 0); node.quaternion.identity(); node.scale.set(1, 1, 1);
        const st = adopt(node, id + '__', mats);
        const base = node.getObjectByName('base');
        if (!base || st.hinges === 0) { warn('tile', id, 'has no base / flaps in hanoi-tiles.glb - using placeholder'); continue; }
        node.name = id;
        node.userData.model = id;
        node.updateMatrixWorld(true);
        protos.set(id, node);
        stats.tiles[id] = st;
      } catch (err) {
        warn('tile', id, 'failed:', err && err.message);
      }
    }
  }
  for (const id of [...MODEL_IDS, ...HANOI_MODEL_IDS]) {
    if (!protos.has(id)) {
      if (tilesGltf) warn('tile', id, 'missing in tiles.glb - placeholder');
      protos.set(id, buildPlaceholderTile(id, materials));
    }
  }

  let traveller = null;
  if (travGltf && travGltf.scene) {
    try {
      const node = travGltf.scene.getObjectByName('traveller') || travGltf.scene.children[0];
      node.removeFromParent();
      node.position.set(0, 0, 0); node.quaternion.identity(); node.scale.set(1, 1, 1);
      stats.traveller = adopt(node, 'traveller__', travMats);
      node.name = 'traveller';
      node.animations = renameClips(travGltf.animations, 'traveller__');
      const s = CONFIG.TRAVELLER_HEIGHT / (node.userData.height || CONFIG.TRAVELLER_HEIGHT);
      if (Math.abs(s - 1) > 1e-3) node.scale.setScalar(s);
      const tab = node.getObjectByName('base_tab');
      if (tab && A.travellerBaseTab === false) tab.visible = false;
      traveller = node;
    } catch (err) {
      warn('traveller failed:', err && err.message);
      traveller = null;
    }
  }
  const travFromGltf = !!traveller;
  if (!traveller) traveller = buildPlaceholderTraveller(materials);

  const n = MODEL_IDS.length;
  const source = fromGltf === n && travFromGltf ? 'gltf' : (fromGltf === 0 && !travFromGltf ? 'placeholder' : 'mixed');
  const warned = new Set();
  return {
    /** Shared prototype (do NOT mutate or add to the scene): use getTilePrototype(id).clone(true). */
    getTilePrototype(modelId) {
      const p = protos.get(modelId);
      if (p) return p;
      if (!warned.has(modelId)) { warned.add(modelId); console.warn('[assets] unknown tile model', modelId); }
      return protos.get(FALLBACK_MODEL);
    },
    traveller,
    textures,
    modelIds: [...MODEL_IDS, ...HANOI_MODEL_IDS],
    source,
    /** public/models/assets_meta.json (per-tile numbers, bridge deck profile, lantern post position) or null. */
    meta,
    materials: mats,
    warnings,
    stats,
  };
}
