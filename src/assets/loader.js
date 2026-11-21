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
  if (id === 'hanoi_pond_guom' || id === 'hanoi_pond_tay' || id === 'hanoi_lotus') {
    // Phase 3B: the two lakes read differently - Ho Guom dark green, Ho Tay deep blue
    // (lotus pond included). Round disc (no 90-degree water corners) + faint ripples.
    g.fillStyle = id === 'hanoi_pond_guom' ? '#2f6b5e' : '#2456a8';
    g.beginPath();
    g.arc(N / 2, N / 2, 0.6 * u, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.14)';
    for (const [rx, ry, rr] of [[-0.25, -0.1, 0.05], [0.2, 0.15, 0.04], [0.05, -0.25, 0.035]]) {
      g.beginPath(); g.arc((0.5 + rx) * N, (0.5 + ry) * N, rr * N, 0, Math.PI * 2); g.fill();
    }
    // Phase 3B fix round: stone bank ring - a grey stone rim (paperShade) 0.1
    // wide around the water disc edge, so the lake edge reads as a stone bank.
    g.strokeStyle = P.paperShade;
    g.lineWidth = 0.1 * u;
    g.beginPath();
    g.arc(N / 2, N / 2, 0.55 * u, 0, Math.PI * 2);
    g.stroke();
  }
  if (id === 'hanoi_stonebridge') {
    // Phase 3B: Ho Tay deep-blue water under the low stone deck.
    g.fillStyle = '#2456a8';
    g.beginPath();
    g.arc(N / 2, N / 2, 0.6 * u, 0, Math.PI * 2);
    g.fill();
  }
  if (id === 'hanoi_road') {
    // Phase 3A-17: grey brick paving (paperShade base + ink joints) + a dashed white
    // centre line on the E-W axis + the zebra bands on the N and S arms (kept).
    g.fillStyle = P.paperShade;
    g.fillRect(0, 0, N, N);
    g.fillStyle = 'rgba(90,58,40,0.22)';
    for (let yy = 16; yy < N; yy += 16) g.fillRect(0, yy, N, 1);
    for (let yy = 0; yy < N; yy += 32) {
      for (let xx = (yy / 32) % 2 ? 0 : 16; xx < N; xx += 32) g.fillRect(xx, yy, 1, 16);
    }
    g.fillStyle = '#fbf6ea';
    for (const cy of [0.5 - 0.55 / 2, 0.5 + 0.55 / 2]) {
      for (const cx of [0.34, 0.42, 0.5, 0.58, 0.66]) {
        g.fillRect((cx - 0.0225) * N, (cy - 0.075) * N, 0.045 * N, 0.15 * N);
      }
    }
    for (const cx of [0.2, 0.4, 0.6, 0.8]) {
      g.fillRect((cx - 0.03) * N, (0.5 - 0.02) * N, 0.06 * N, 0.04 * N);
    }
  }
  if (id === 'hanoi_sidewalk' || id === 'hanoi_flag' || id === 'hanoi_banner' ||
      id === 'hanoi_bike_red' || id === 'hanoi_bike_blue' || id === 'hanoi_bike_black') {
    // Phase 3A-10: granite pavement - 4x4 stone squares with a faint value step per
    // square, ink joints, terracotta kerb lines on both long edges. Flags, banners
    // and parked bikes stand on the same sidewalk print, so the pavement reads on.
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        g.fillStyle = (sx + sy) % 2 ? '#e3cda3' : P.paperShade;
        g.fillRect(sx * 32, sy * 32, 32, 32);
      }
    }
    g.fillStyle = 'rgba(90,58,40,0.28)';
    for (let i = 0; i <= 4; i++) {
      g.fillRect(i * 32 - 0.5, 0, 1, N);
      g.fillRect(0, i * 32 - 0.5, N, 1);
    }
    g.fillStyle = P.terracotta;
    g.fillRect(0, 0, N, 0.03 * N);
    g.fillRect(0, 0.97 * N, N, 0.03 * N);
  }
  if (id === 'hanoi_sautree') {
    // Phase 3A-07: fallen golden leaves - mustard dots scattered on the grass base.
    g.fillStyle = P.mustard;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 22; i++) {
      g.fillRect(rnd() * N, rnd() * N, 3, 2);
    }
  }
  if (id === 'hanoi_alley') {
    // Phase 3A-16: narrow paved lane, 1 unit wide down the middle (N-S), brick edges.
    // Fix round: the lane was 0.5 unit wide (0.25 tile); spec wants 1 unit (0.5 tile).
    g.fillStyle = P.kraft;
    g.fillRect(0.25 * N, 0, 0.5 * N, N);
    g.fillStyle = 'rgba(90,58,40,0.25)';
    g.fillRect(0.25 * N, 0, 1, N);
    g.fillRect(0.75 * N, 0, 1, N);
    g.fillRect(0.25 * N, 0.5 * N, 0.5 * N, 1);
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
  // Phase 3A-01: yellow 3-storey tube house, 1.35 high - mustard walls, terracotta
  // pitched roof, paper shopfront, dormer shop sign, side annex. The hero art card
  // (atlas tubehouse sprite) already shows green shutters + iron balcony + shop door.
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
  // Phase 3A-02: green 2-storey tube house, 1.05 high - sage walls, white shutters,
  // vertical sign, one tree. Ratio on the map is 1 green : 2 yellow (4 green, 8 yellow).
  hanoi_tubehouse_green: [
    ['tri', 0.62, 1.05, 0, -0.26, 0, P.terracotta, 1],
    ['rect', 0.52, 0.9, 0, -0.23, 0, P.sage, 1],
    ['rect', 0.4, 0.35, 0, -0.2, 0, P.paper, 1],
    ['rect', 0.12, 0.3, 0, -0.18, 0, P.ink, 1],
    ['dormer', 0.3, 0.55, 0.05, -0.2, 0, P.paper, 1],
    tree(-0.55, 0.05, 0.8, P.olive),
    ['rect', 0.12, 0.24, 0.3, -0.18, 0, P.paper, 1],
  ],
  // Phase 3A-15: the brown barn-like block is gone - granite steps (paperShade, the
  // palette has no true grey) + granite body. The GLB hero art already shows grey
  // granite with clear steps; this recipe is the placeholder fallback.
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
  // Phase 2B street elements (Old Quarter only; flat cut-paper silhouettes, static figures).
  hanoi_road: [
    ['rect', 0.12, 0.3, -0.75, -0.75, 0, P.ink, 1],
    ['rect', 0.12, 0.3, 0.75, 0.75, 0, P.ink, 1],
  ],
  // Phase 3A-10: kerb flap 0.08 high (was 0.12); base print is now granite squares.
  hanoi_sidewalk: [
    ['rect', 0.5, 0.08, 0, 0.55, 0, P.paperShade, 1],
  ],
  // Phase 3A-06: sao den ancient tree - thick trunk, dark canopy 1.2 wide at 1.40 high
  // (tallest in the quarter, above the 1.35 roofs), granite seat block at the base.
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
  // Phase 3A-14: the traffic light now carries the one-way sign (blue board + white
  // mark) on its pole, at (-6,-3) next to the light itself - the cell holds the light,
  // so the sign shares the pole instead of taking a second cell.
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
  // Phase 3A-11: vendor gains a small teal plastic stool beside the baskets.
  hanoi_vendor: [
    ['figure', 0.3, 0.9, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.5, 0.32, -0.5, 0.1, 0, P.ochre, 1],
    ['arch', 0.5, 0.32, 0.5, 0.1, 0, P.ochre, 1],
    ['rect', 0.15, 0.12, 0.4, 0.25, 0, P.teal, 1],
  ],
  // Phase 3A-12: pho stall - terracotta awning roof, counter, pot, PHO sign, white
  // steam puff, low table, 4 tiny plastic stools (0.12 x 0.15).
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
  // Phase 3A-05: pole + transformer + 3 sagging wire bands (lowest dip 0.75) +
  // a cable coil bundle at the pole side. Wires use the new 'sag' shape kind.
  hanoi_pole: [
    ['lamp', 0.55, 1.3, 0, -0.15, 0, P.ink, 1],
    ['rect', 0.22, 0.35, 0.3, 0.1, 0, P.paperShade, 1],
    ['sag', 1.9, 1.25, 0, -0.1, 0, P.ink, 1],
    ['sag', 1.9, 1.3, 0, -0.05, 90, P.ink, 1],
    ['sag', 1.7, 1.28, 0, 0, 0, P.brown, 1],
    ['arch', 0.3, 0.45, 0.28, 0.08, 0, P.ink, 1],
  ],
  // Phase 3A-08: white-globe street lamp - dark green post, 2 white globes 0.18 wide
  // 0.26 apart at 1.10 high, round base, small blue plate.
  hanoi_lamp: [
    ['lamp', 0.1, 1.1, 0, -0.1, 0, P.tealDeep, 1],
    ['glowtop', 0.18, 1.1, -0.13, -0.05, 0, P.paper, 1],
    ['glowtop', 0.18, 1.1, 0.13, -0.05, 0, P.paper, 1],
    ['rect', 0.3, 0.12, 0, 0.05, 0, P.tealDeep, 1],
    ['rect', 0.2, 0.14, 0.18, 0.1, 0, P.teal, 1],
  ],
  // Phase 3A street elements (vibe Ha Noi that). The loader placeholder keeps
  // flat-colour flaps only; the GLB hero art cards (fix round: sign text sprites
  // for the corner house, the 4 beer signs, the banner and the pho stalls) live
  // in tools/step5/build-hanoi-glb.mjs HERO, not in these RECIPES.
  // 3A-03: corner house at Ta Hien, 1.40 high (tallest house in the quarter) - yellow
  // 2-face facade, ground-floor shop, 3 stacked sign boards: BIA PHO CO yellow,
  // CRYSTAL neon blue, BOLD & Light white.
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
  // 3A-04: the 4 beer signs, one model each - dark post, coloured board, vertical
  // board, base block. No other brand names are used anywhere in the game.
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
  // 3A-09: red flag with yellow star - dark pole, red board (lamp kind), star
  // (new 'star' kind, floating on the board), stone base. Base is granite print.
  hanoi_flag: [
    ['rect', 0.06, 1.1, -0.05, -0.12, 0, P.ink, 1],
    ['lamp', 0.3, 1.1, 0, -0.1, 0, P.terracotta, 1],
    ['star', 0.14, 1.1, 0, -0.06, 0, P.mustard, 1],
    ['rect', 0.24, 0.1, 0, 0.2, 0, P.paperShade, 1],
  ],
  // 3A-09: red vertical banner with a yellow emblem (dormer kind) on a dark pole.
  hanoi_banner: [
    ['rect', 0.06, 1.15, 0, -0.1, 0, P.ink, 1],
    ['rect', 0.25, 0.7, 0.12, -0.06, 0, P.terracotta, 1],
    ['dormer', 0.2, 0.85, 0.12, -0.04, 0, P.mustard, 1],
    ['rect', 0.24, 0.1, 0, 0.2, 0, P.paperShade, 1],
  ],
  // 3A-07: sau tree with golden leaves - brown trunk, mustard + ochre canopy 1.0
  // wide at 1.20 high, leaf mound at the base, fallen leaves on the base print.
  hanoi_sautree: [
    ['rect', 0.22, 0.95, 0, -0.1, 0, P.brown, 1],
    ['tree', 1.0, 1.2, 0, -0.15, 0, P.mustard, 1],
    ['tree', 0.7, 1.0, -0.2, 0, 0, P.ochre, 1],
    ['arch', 0.5, 0.25, 0.25, 0.2, 0, P.mustard, 1],
    ['rect', 0.4, 0.12, -0.25, 0.3, 0, P.paperShade, 1],
  ],
  // 3A-13: parked motorbikes, standing still (Q7: no moving bikes in 3A) - body
  // 0.45 long, 2 wheel domes, handlebar stem. One model per colour, placed mixed.
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
  // 3A-14: folk-painting mural wall - paperShade wall 1.9 long (ry 90, runs N-S),
  // rose + teal art panels, mustard folk figure, paper base strip. The wall sits at
  // z 0 so its 1.9 span stays inside the tile ([-0.95, 0.95]); the strip sits 0.05
  // in front of the wall foot ([-0.90, 1.00]).
  hanoi_mural: [
    ['rect', 1.9, 0.8, 0, 0, 90, P.paperShade, 1],
    ['arch', 0.5, 0.6, 0, 0.05, 90, P.rose, 1],
    ['arch', 0.5, 0.55, 0, 0.15, 90, P.teal, 1],
    ['figure', 0.3, 0.6, 0, 0.1, 90, P.mustard, 1],
    ['rect', 1.9, 0.12, 0, 0.05, 90, P.paper, 1],
  ],
  // 3A-16: narrow west alley - yellow + ochre house silhouettes tight on both sides
  // (1 unit lane gap in the middle = 0.5 tile, spec 3A-16), red flag with star on the
  // west house wall, low sagging wire. Fix round: houses were 0.7 wide at x +-0.6
  // (gap 0.5 unit, half the spec); now 0.5 wide at x +-0.75 so the lane is 1 unit
  // and the 0.5 roofs stay inside the tile ([-1.00, -0.50]).
  hanoi_alley: [
    ['tri', 0.5, 1.35, -0.75, -0.22, 0, P.terracotta, 1],
    ['rect', 0.5, 1.3, -0.75, -0.2, 0, P.mustard, 1],
    ['tri', 0.5, 1.3, 0.75, -0.2, 0, P.rust, 1],
    ['rect', 0.5, 1.25, 0.75, -0.18, 0, P.ochre, 1],
    ['lamp', 0.3, 1.05, -0.62, 0, 0, P.terracotta, 1],
    ['star', 0.12, 1.05, -0.62, 0.04, 0, P.mustard, 1],
    ['sag', 1.9, 1.2, 0, 0.1, 0, P.ink, 1],
  ],
  // 3A-11: street vendor on the main street - same 4 flaps as hanoi_vendor.
  hanoi_vendor_street: [
    ['figure', 0.3, 0.9, 0, -0.15, 0, P.paper, 1],
    ['arch', 0.5, 0.32, -0.5, 0.1, 0, P.ochre, 1],
    ['arch', 0.5, 0.32, 0.5, 0.1, 0, P.ochre, 1],
    ['rect', 0.15, 0.12, 0.4, 0.25, 0, P.teal, 1],
  ],
  // 3A-12: street pho stall on the main street - same 10 flaps as hanoi_phostall.
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
  // 3A-05: pole on the house row - same 6 flaps as hanoi_pole, wires turned 90 deg
  // so they run along the N-S house row instead of the E-W street. The ry-90 wire
  // sits at z -0.05 (not -0.1) so its 1.9 span stays inside the tile ([-1.00, 0.90]).
  hanoi_pole_street: [
    ['lamp', 0.55, 1.3, 0, -0.15, 0, P.ink, 1],
    ['rect', 0.22, 0.35, 0.3, 0.1, 0, P.paperShade, 1],
    ['sag', 1.9, 1.25, 0, -0.05, 90, P.ink, 1],
    ['sag', 1.9, 1.3, 0, -0.05, 0, P.ink, 1],
    ['sag', 1.7, 1.28, 0, 0, 90, P.brown, 1],
    ['arch', 0.3, 0.45, 0.28, 0.08, 0, P.ink, 1],
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

async function loadGLTF(url, onProgress) {
  try {
    return await new GLTFLoader().loadAsync(url, onProgress);
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

async function loadTexture(url, { srgb = false, repeat = true, flipY = true, anisotropy = 4 } = {}, onProgress) {
  try {
    const t = await new THREE.TextureLoader().loadAsync(url, onProgress);
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

// ---- Phase 3D-04: real progress ------------------------------------------------------------
// A loader progress event carries { loaded, total } in bytes, but total is 0
// when the server sends no Content-Length, so every job also carries an
// expected byte size (measured from public/, see docs/phase-3d-manifest.md).
// fraction = total > 0 ? loaded / total : min(1, loaded / expected).
// A stage's fraction is the byte-weighted sum of its jobs. The caller
// (main.js) maps each stage fraction onto its % range on the loading screen.
// Jobs with no progress event at all (fetchJSON) report nothing: main.js
// shows them as a fake milestone instead, marked MOC GIA in the code there.
/** Expected on-disk bytes, measured 2026-11-21 (ls -l public/models). */
const GLB_BYTES = { tiles: 6147140, basicGrand: 704872, hanoiTiles: 3464792, traveller: 85024 };
/** Expected bytes for texture files the manifest does not size (atlas.webp). */
const TEXTURE_BYTES_FALLBACK = { 'art/atlas.webp': 2532524 };
function stageTracker(jobs, onProgress, stage) {
  const total = jobs.reduce((s, j) => s + (j.bytes || 0), 0) || 1;
  const frac = jobs.map(() => 0);
  return jobs.map((job, i) => (ev) => {
    const loaded = (ev && ev.loaded) || 0;
    const evTotal = (ev && ev.total) || 0;
    frac[i] = evTotal > 0 ? Math.min(1, loaded / evTotal) : Math.min(1, loaded / (job.bytes || 1));
    const stageFraction = frac.reduce((s, f, k) => s + f * (jobs[k].bytes || 0), 0) / total;
    try {
      if (onProgress) onProgress({ stage, file: job.file, fileLabel: job.label, loaded, total: evTotal || job.bytes || 0, stageFraction });
    } catch (err) { /* progress reporting never breaks a load */ }
  });
}

/** Paper, page and print maps from the runtime texture manifest (tolerates absence). */
async function loadTextures(A, anisotropy, onProgress) {
  const out = { paper: null, paperNormal: null, paperRough: null, manifest: null };
  const jobs = [];
  const manifest = await fetchJSON(A.manifestUrl);
  if (manifest && typeof manifest === 'object') {
    out.manifest = manifest;
    const entries = [];
    for (const key of Object.keys(manifest)) {
      const e = manifest[key];
      if (!e || typeof e !== 'object' || !e.file) continue;
      entries.push({ key, e });
    }
    const trackers = stageTracker(entries.map(({ e }) => ({ file: e.file, label: e.file.split('/').pop(), bytes: e.bytes || TEXTURE_BYTES_FALLBACK[e.file] || 100000 })), onProgress, 'textures');
    for (let i = 0; i < entries.length; i++) {
      const { key, e } = entries[i];
      const wrap = String(e.wrap || 'repeat');
      jobs.push(loadTexture(A.texturesBase + e.file, { srgb: e.colorSpace === 'srgb', repeat: wrap.indexOf('repeat') >= 0, flipY: e.flipY !== false, anisotropy }, trackers[i])
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
 * Options: { materials, renderer, quality, hanoi, onProgress }.
 * onProgress(report) fires per loader event: { stage: 'glb' | 'textures',
 * file, fileLabel, loaded, total, stageFraction 0..1 } - real byte progress
 * (3D-04). The caller maps each stage onto its loading-screen % range.
 *
 * Phase 3D-02 ROLLBACK (2026-11-21): tiles.glb IS fetched again in Hanoi
 * mode, like before Phase 3D - the spec assumed Hanoi uses no stock tiles,
 * but the Hanoi map uses 14 stock tile ids on 1321 of 1600 cells (meadow,
 * forest, pond, path, river, lantern_post, rocks...), so skipping tiles.glb
 * turned 83% of the map into flat RECIPES placeholders, against the user
 * requirement that the map stay as realistic as possible. The 47
 * Hanoi-only models (279 cells) keep their GLB art from hanoi-tiles.glb.
 * basic-grand.glb stays gated on NOT Hanoi: Hanoi uses none of its 6
 * grand buildings, only non-Hanoi mode does. See
 * docs/phase-3d-manifest.md (3D-02) for the full reason and numbers.
 * Default (WFC) mode is unchanged: tiles.glb + basic-grand.glb still load.
 */
export async function loadAssets({ materials, renderer, quality, hanoi = false, onProgress = null } = {}) {
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

  // Phase 3D: the old single Promise.all is split into real stages, so the
  // loading screen can report byte progress per stage (3D-04). Jobs inside
  // one stage still load in parallel; stages run in order.
  // Stage 1 - GLB models (main.js maps this to 20-45% "Tai ban do...").
  const glbJobs = [];
  // 3D-02 ROLLBACK: tiles.glb is fetched in BOTH modes (see the JSDoc above).
  glbJobs.push({ key: 'tiles', url: A.tilesUrl, file: 'tiles.glb', label: 'tiles.glb 5.9 MB', bytes: GLB_BYTES.tiles });
  if (!hanoi) glbJobs.push({ key: 'basicGrand', url: A.basicGrandUrl, file: 'basic-grand.glb', label: 'basic-grand.glb 0.7 MB', bytes: GLB_BYTES.basicGrand });
  if (hanoi) glbJobs.push({ key: 'hanoiTiles', url: A.hanoiTilesUrl, file: 'hanoi-tiles.glb', label: 'hanoi-tiles.glb 3.5 MB', bytes: GLB_BYTES.hanoiTiles });
  glbJobs.push({ key: 'traveller', url: A.travellerUrl, file: 'traveller.glb', label: 'traveller.glb 0.1 MB', bytes: GLB_BYTES.traveller });
  const glbTrackers = stageTracker(glbJobs, onProgress, 'glb');
  const glbResults = await Promise.all(glbJobs.map((job, i) => loadGLTF(job.url, glbTrackers[i])));
  const glbByKey = {};
  glbJobs.forEach((job, i) => { glbByKey[job.key] = glbResults[i]; });
  const tilesGltf = glbByKey.tiles || null;
  const basicGrandGltf = glbByKey.basicGrand || null;
  const hanoiGltf = glbByKey.hanoiTiles || null;
  const travGltf = glbByKey.traveller || null;
  // Stage 2 - textures (main.js maps this to 45-65% "Dung nha ong...").
  const textures = await loadTextures(A, anisotropy, onProgress).catch(noTex);
  // Stage 3 - per-tile meta (assets_meta.json, 105 KB). fetchJSON gives no
  // progress events, so this is a MOC GIA (fake) milestone in main.js: the
  // file is tiny and the % jumps straight to the next stage when it lands.
  const meta = await fetchJSON(A.metaUrl);

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
