// Train (Phase 3E, owner: train agent): 3 cars on a closed loop around the Hanoi map.
// - 1 object, NOT a WFC tile: it never touches the solver (95/96), the tile grid,
//   streaming or fold. The rails, sleepers, street props and station are plain
//   objects built here too, so no Hanoi model, no GLB change, no map change.
// - Loop: rounded rectangle, 2 tiles from the map edge where the land allows it.
//   It CANNOT cross Long Bien bridge: the Red River has a single crossing, so a
//   closed loop cannot cross it twice without retracing. The east leg runs at
//   x = 7, about 10 tiles west of the bridge. See TRAIN_WAYPOINTS_CELLS.
// - The loop touches water in exactly ONE cell, (-8, -10): a 1-cell lobe of
//   Ho Tay that no land route can go around (the land gaps are blocked by a
//   tree, a bush and tubehouses). The rail crosses it on a short wooden bridge.
//   Every other sample of the path is on land, verified by tools/check-3e.mjs.
// - Speed: 2.5 unit/s, 1.5 unit/s on the train street (x = -9, z -8..-3).
// - No death: if the traveller stands on the rails the train pushes them off
//   sideways (or along the track when both sides are blocked). When there is
//   nowhere to push them to, the train stops instead of running through them
//   (N4 fallback) and moves again once the rails ahead are clear. No game over.
// - No sound at all (Q6: keep the game silent). This file never touches audio.
// - At quality low the moving train hides (first thing to drop, 3E-06); the
//   static rails and street props stay, they cost almost nothing per frame.
// No long dashes in this file: only short hyphens (-).
import * as THREE from 'three';
import { TILE_SIZE } from '../core/config.js';

// ---- tunables (spec 3E-01, 3E-03) ---------------------------------------------------------
export const TRAIN_SPEED = 2.5; // unit/s (1.25 tile/s), clearly faster than the traveller (1.15)
export const TRAIN_STREET_SPEED = 1.5; // unit/s through the train street
export const TRAIN_CAR_LEN = 4; // 2 tiles per car
export const TRAIN_CAR_W = 1; // 0.5 tile wide
export const TRAIN_CAR_H = 1.10; // top of the roof, all cars
export const TRAIN_GAP = 0.4; // 0.2 tile between cars
export const TRAIN_CAR_COUNT = 3; // 1 loco + 2 passenger cars
export const TRAIN_TOTAL_LEN = TRAIN_CAR_COUNT * TRAIN_CAR_LEN + (TRAIN_CAR_COUNT - 1) * TRAIN_GAP; // 12.8

// ---- the loop, in cell coords, in travel order --------------------------------------------
// ga Ha Noi (SE corner) -> west along the south edge -> north up the west leg
// (train street, x = -9, z -8..-3) -> 1-cell bridge over the Ho Tay lobe at
// (-8, -10) -> north along the east shore (x = -7) -> east along the north edge
// -> south down the east leg (x = 7, with a 1-cell jog around the cathedral at
// (7, -1)) -> back to the station. Direction: one way only, never reversed.
// Cells the loop runs on: path / meadow / meadow_flowers only, plus the one
// bridge water cell. It never runs through a house, tree, grove, rock, pond or
// river cell (checked by tools/check-3e.mjs).
export const TRAIN_WAYPOINTS_CELLS = Object.freeze([
  [7, 17], [-9, 17], [-9, -10], [-7, -10], [-7, -16], [7, -16],
  [7, -2], [8, -2], [8, -1], [8, 0], [7, 0], [7, 17],
]);
// The one water cell the loop is allowed to cross, on a wooden bridge.
export const TRAIN_BRIDGE_CELL = Object.freeze([-8, -10]);
// Train street (3E-04): 6 straight tiles on the west side of the Old Quarter.
export const TRAIN_STREET = Object.freeze({ x: -9, z0: -8, z1: -3 });
// Station (ga Ha Noi) at the SE corner of the loop.
export const TRAIN_STATION_CELL = Object.freeze([7, 17]);

// Footprints of the 3 procedural house fronts on the west side of the train
// street (same centres/sizes as buildStreetProps, world units). The traveller
// must not walk through them (N2 fix): the train pushes them out to the
// nearest edge, reusing the push-aside idea, with canStand as the guard.
export const TRAIN_STREET_HOUSES = Object.freeze([
  { x: -19.7, z: -10, hw: 0.65, hd: 0.95 },
  { x: -19.7, z: -8, hw: 0.65, hd: 0.95 },
  { x: -19.7, z: -6, hw: 0.65, hd: 0.95 },
]);
// Traveller radius used when testing the house footprints.
const HOUSE_MARGIN = 0.3;
// How far ahead of the loco front the N4 stop check looks (world units).
const TRAIN_BRAKE_LOOKAHEAD = 5;

// Fillet radius at corners (world units). Short jog segments are 2 units long,
// so the radius must stay at most half of that.
export const TRAIN_FILLET_R = 1.0;
// Resample step for the arc-length table (world units).
const SAMPLE_DS = 0.25;

/** True when world (x, z) is on the train street segment (the slow zone). */
export function isInStreetZone(x, z) {
  return Math.abs(x - TRAIN_STREET.x * TILE_SIZE) < 1.2
    && z >= TRAIN_STREET.z0 * TILE_SIZE - 0.5 && z <= TRAIN_STREET.z1 * TILE_SIZE + 0.5;
}

/**
 * Build the closed loop path from cell waypoints. Pure math, no THREE, so the
 * check script can exercise it in Node. Returns { length, lengthTiles,
 * pointAt(s), samples } where pointAt gives { x, z, tx, tz } (position plus a
 * unit tangent) at arc length s, wrapping around the loop.
 */
export function buildTrainPath(waypointsCells = TRAIN_WAYPOINTS_CELLS, filletR = TRAIN_FILLET_R) {
  const wps = waypointsCells.map(([cx, cz]) => [cx * TILE_SIZE, cz * TILE_SIZE]);
  const n = wps.length;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = (a) => Math.hypot(a[0], a[1]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  // Dense polyline: straights sampled every 0.5, corners as quadratic beziers.
  const pts = [];
  const pushPt = (p) => {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-6) pts.push(p);
  };
  for (let i = 0; i < n; i++) {
    const prev = wps[(i - 1 + n) % n];
    const cur = wps[i];
    const next = wps[(i + 1) % n];
    const dIn = norm(sub(cur, prev));
    const dOut = norm(sub(next, cur));
    const cross = dIn[0] * dOut[1] - dIn[1] * dOut[0];
    const dot = dIn[0] * dOut[0] + dIn[1] * dOut[1];
    const straight = Math.abs(cross) < 1e-9 && dot > 0;
    const p0 = straight ? cur : [cur[0] - dIn[0] * filletR, cur[1] - dIn[1] * filletR];
    const p1 = straight ? cur : [cur[0] + dOut[0] * filletR, cur[1] + dOut[1] * filletR];
    // Straight from the previous corner exit to this corner entry.
    const from = pts.length ? pts[pts.length - 1] : p0;
    const segLen = len(sub(p0, from));
    const steps = Math.max(1, Math.round(segLen / 0.5));
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      pushPt([from[0] + (p0[0] - from[0]) * t, from[1] + (p0[1] - from[1]) * t]);
    }
    if (straight) continue;
    // Quadratic bezier p0 -> cur -> p1, 8 steps.
    for (let k = 1; k <= 8; k++) {
      const t = k / 8;
      const u = 1 - t;
      pushPt([
        u * u * p0[0] + 2 * u * t * cur[0] + t * t * p1[0],
        u * u * p0[1] + 2 * u * t * cur[1] + t * t * p1[1],
      ]);
    }
  }
  // Cumulative lengths, then a uniform arc-length resample.
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len(sub(pts[i], pts[i - 1])));
  const total = cum[cum.length - 1] + len(sub(pts[0], pts[pts.length - 1]));
  const count = Math.max(2, Math.round(total / SAMPLE_DS));
  const ds = total / count;
  const samples = [];
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const s = i * ds;
    let a;
    let b;
    let s0;
    let s1;
    if (s < cum[cum.length - 1]) {
      while (seg < cum.length - 2 && cum[seg + 1] < s) seg++;
      s0 = cum[seg];
      s1 = cum[seg + 1];
      b = pts[seg];
      a = pts[seg + 1];
    } else {
      // Closing segment: last dense point back to the first.
      s0 = cum[cum.length - 1];
      s1 = total;
      b = pts[pts.length - 1];
      a = pts[0];
    }
    const t = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
    const x = b[0] + (a[0] - b[0]) * t;
    const z = b[1] + (a[1] - b[1]) * t;
    const tv = norm(sub(a, b));
    samples.push({ x, z, tx: tv[0], tz: tv[1], s });
  }
  const length = count * ds;
  function pointAt(s) {
    let w = s % length;
    if (w < 0) w += length;
    const f = w / ds;
    const i0 = Math.floor(f) % count;
    const i1 = (i0 + 1) % count;
    const t = f - Math.floor(f);
    const a = samples[i0];
    const b = samples[i1];
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, tx: a.tx + (b.tx - a.tx) * t, tz: a.tz + (b.tz - a.tz) * t };
  }
  return { length, lengthTiles: length / TILE_SIZE, samples, pointAt, ds };
}

// ---- materials (plain three materials, no atlas, no GLB) -----------------------------------
const MAT = {
  locoRed: new THREE.MeshStandardMaterial({ color: 0xa83c28, roughness: 0.85, metalness: 0.1 }),
  carGreen: new THREE.MeshStandardMaterial({ color: 0x2f5d46, roughness: 0.85, metalness: 0.1 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.9, metalness: 0.1 }),
  windowYellow: new THREE.MeshStandardMaterial({ color: 0xe8b93c, roughness: 0.6, metalness: 0.1 }),
  bogie: new THREE.MeshStandardMaterial({ color: 0x2a2725, roughness: 0.95, metalness: 0.2 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8f9aa3, roughness: 0.35, metalness: 0.7 }),
  ballast: new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 1, metalness: 0 }),
  sleeper: new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 1, metalness: 0 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 1, metalness: 0 }),
  mustard: new THREE.MeshStandardMaterial({ color: 0xc79a3f, roughness: 0.9, metalness: 0 }),
  ochre: new THREE.MeshStandardMaterial({ color: 0xb97a3a, roughness: 0.9, metalness: 0 }),
  sage: new THREE.MeshStandardMaterial({ color: 0x7d8f5a, roughness: 0.9, metalness: 0 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xb9603f, roughness: 0.9, metalness: 0 }),
  ink: new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.9, metalness: 0 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xefe0c2, roughness: 0.9, metalness: 0 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.9, metalness: 0 }),
  teal: new THREE.MeshStandardMaterial({ color: 0x2e6b62, roughness: 0.9, metalness: 0 }),
  rose: new THREE.MeshStandardMaterial({ color: 0xc26a6a, roughness: 0.9, metalness: 0 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3a6ea8, roughness: 0.9, metalness: 0 }),
  lampRed: new THREE.MeshStandardMaterial({ color: 0xd23c2e, roughness: 0.5, metalness: 0.1, emissive: 0x7a1408 }),
  lampGreen: new THREE.MeshStandardMaterial({ color: 0x3fae5a, roughness: 0.5, metalness: 0.1, emissive: 0x0e4d1e }),
  lampOff: new THREE.MeshStandardMaterial({ color: 0x5a5148, roughness: 0.6, metalness: 0.1 }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0, shadow = false) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (shadow) m.castShadow = true;
  return m;
}

// A flat ribbon following the path samples: width w, fixed y, one draw call.
function ribbon(samples, length, w, y, mat) {
  const n = samples.length;
  const pos = new Float32Array(n * 2 * 3);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const nx = -s.tz;
    const nz = s.tx;
    pos.set([s.x - nx * w / 2, y, s.z - nz * w / 2], i * 6);
    pos.set([s.x + nx * w / 2, y, s.z + nz * w / 2], i * 6 + 3);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// Text board: canvas texture when a document exists (browser), plain board
// otherwise (Node check runs). Text is drawn once at boot, not per frame.
function textBoard(text, w, h, bg, fg) {
  let mat = new THREE.MeshStandardMaterial({ color: 0x1e4d3a, roughness: 0.9 });
  if (typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 128);
      g.strokeStyle = fg;
      g.lineWidth = 6;
      g.strokeRect(8, 8, 496, 112);
      g.fillStyle = fg;
      g.font = 'bold 52px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 256, 66);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    } catch (err) { /* plain board fallback */ }
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.material.side = THREE.DoubleSide;
  return m;
}

function buildCar(kind) {
  const g = new THREE.Group();
  const bodyMat = kind === 'loco' ? MAT.locoRed : MAT.carGreen;
  g.add(box(TRAIN_CAR_LEN, 0.8, TRAIN_CAR_W, bodyMat, 0, 0.61, 0, true));
  g.add(box(TRAIN_CAR_LEN * 0.98, 0.09, TRAIN_CAR_W * 0.94, MAT.roof, 0, 1.055, 0, true));
  g.add(box(TRAIN_CAR_LEN * 0.9, 0.3, TRAIN_CAR_W + 0.04, MAT.windowYellow, 0, 0.72, 0));
  g.add(box(TRAIN_CAR_LEN * 0.8, 0.18, 0.7, MAT.bogie, 0, 0.12, 0));
  if (kind === 'loco') {
    g.add(box(0.04, 0.34, 0.7, MAT.windowYellow, 2.01, 0.72, 0)); // front window, thin plate on the loco front face so it shows
    g.add(box(0.12, 0.14, 0.3, MAT.lampOff, 2.02, 0.5, 0)); // headlamp housing
  }
  return g;
}

function buildTrack(path) {
  const g = new THREE.Group();
  g.add(ribbon(path.samples, path.length, 1.5, 0.012, MAT.ballast));
  // Two steel rails, one ribbon each, offset sideways from the centre line.
  const off = (dx) => path.samples.map((s) => ({
    x: s.x - s.tz * dx, z: s.z + s.tx * dx, tx: s.tx, tz: s.tz, s: s.s,
  }));
  g.add(ribbon(off(0.35), path.length, 0.09, 0.035, MAT.steel));
  g.add(ribbon(off(-0.35), path.length, 0.09, 0.035, MAT.steel));
  // Sleepers, one InstancedMesh.
  const count = Math.floor(path.length / 0.9);
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.05, 1.3), MAT.sleeper, count);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const p = path.pointAt(i * 0.9 + 0.45);
    q.setFromAxisAngle(up, Math.atan2(-p.tz, p.tx));
    m4.compose(new THREE.Vector3(p.x, 0.025, p.z), q, new THREE.Vector3(1, 1, 1));
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
  // Wooden bridge deck over the one water cell (-8, -10), world (-16, -20).
  const bx = TRAIN_BRIDGE_CELL[0] * TILE_SIZE;
  const bz = TRAIN_BRIDGE_CELL[1] * TILE_SIZE;
  g.add(box(3.0, 0.12, 1.7, MAT.wood, bx, 0.0, bz));
  g.add(box(3.0, 0.2, 0.12, MAT.wood, bx, 0.08, bz - 0.8));
  g.add(box(3.0, 0.2, 0.12, MAT.wood, bx, 0.08, bz + 0.8));
  return g;
}

function buildStreetProps() {
  const g = new THREE.Group();
  // 3 narrow house fronts on the west side of the street, faces 1 unit from
  // the rail centre (0.5 tile, like the real 1-2 m). East side houses already
  // stand in the map (pole, sign, pho stall, vendors, bike at x = -8).
  const houses = [
    { z: -10, mat: MAT.mustard }, { z: -8, mat: MAT.sage }, { z: -6, mat: MAT.ochre },
  ];
  for (const h of houses) {
    g.add(box(1.3, 1.3, 1.9, h.mat, -19.7, 0.65, h.z, true));
    g.add(box(1.4, 0.12, 2.0, MAT.terracotta, -19.7, 1.36, h.z));
    g.add(box(0.06, 0.4, 0.4, MAT.ink, -19.02, 0.8, h.z - 0.45));
    g.add(box(0.06, 0.4, 0.4, MAT.ink, -19.02, 0.8, h.z + 0.45));
    g.add(box(0.06, 0.7, 0.45, MAT.ink, -19.02, 0.35, h.z));
  }
  // Plastic chairs tight against the walls on both sides of the rail.
  const chairs = [
    [-19.0, -15, MAT.teal], [-19.0, -13, MAT.rose], [-19.0, -11, MAT.mustard],
    [-19.0, -9, MAT.blue], [-19.0, -7, MAT.teal],
    [-16.9, -15, MAT.rose], [-16.9, -11, MAT.blue], [-16.9, -7, MAT.mustard],
  ];
  for (const [x, z, mat] of chairs) {
    const c = new THREE.Group();
    c.add(box(0.32, 0.06, 0.32, mat, 0, 0.18, 0));
    c.add(box(0.32, 0.3, 0.05, mat, x < -18 ? 0.14 : -0.14, 0.32, 0));
    c.position.set(x, 0, z);
    g.add(c);
  }
  // Small cafe at the south end of the street + the CA PHE DUONG TAU sign.
  g.add(box(0.7, 0.5, 0.7, MAT.wood, -19.6, 0.25, -3.5));
  g.add(box(1.1, 0.06, 1.1, MAT.terracotta, -19.6, 0.62, -3.5));
  const sign = textBoard('CA PHE DUONG TAU', 2.4, 0.6, '#1e4d3a', '#f2c230');
  sign.position.set(-19.4, 1.05, -4.5);
  sign.rotation.y = Math.PI / 2;
  g.add(sign);
  g.add(box(0.09, 1.3, 0.09, MAT.ink, -19.4, 0.65, -5.6));
  g.add(box(0.09, 1.3, 0.09, MAT.ink, -19.4, 0.65, -3.4));
  return g;
}

function buildSignals() {
  const g = new THREE.Group();
  const lamps = [];
  // Signal posts with a lamp at both ends of the train street. The lamp is a
  // COLOUR effect only (red when the train is near, green otherwise) - Q6
  // keeps the game silent, so there is no bell sound.
  for (const z of [-17, -5]) {
    g.add(box(0.09, 1.25, 0.09, MAT.ink, -19.3, 0.625, z));
    g.add(box(0.5, 0.08, 0.08, MAT.ink, -19.1, 1.2, z));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), MAT.lampGreen.clone());
    lamp.position.set(-18.85, 1.32, z);
    g.add(lamp);
    lamps.push(lamp);
  }
  // Plain crossing posts (white with a red band, no lamp) where the loop
  // crosses a road: (-9, 0) and (7, 0).
  for (const [x, z] of [[-19.3, 0.8], [12.8, 0.8]]) {
    g.add(box(0.1, 0.9, 0.1, MAT.white, x, 0.45, z));
    g.add(box(0.12, 0.14, 0.12, MAT.terracotta, x, 0.7, z));
  }
  return { group: g, lamps };
}

function buildStation() {
  const g = new THREE.Group();
  const sx = TRAIN_STATION_CELL[0] * TILE_SIZE;
  const sz = TRAIN_STATION_CELL[1] * TILE_SIZE;
  // Platform south of the rail; the train NEVER stops here (3E-03).
  g.add(box(5.0, 0.35, 1.6, MAT.paper, sx, 0.175, sz + 1.6));
  g.add(box(5.0, 0.08, 1.6, MAT.terracotta, sx, 0.39, sz + 1.6));
  const sign = textBoard('GA HA NOI', 2.6, 0.6, '#5a3a28', '#f2c230');
  sign.position.set(sx, 1.05, sz + 2.6);
  sign.rotation.y = Math.PI; // faces north, toward the rail
  g.add(sign);
  g.add(box(0.09, 1.3, 0.09, MAT.ink, sx - 1.1, 0.65, sz + 2.6));
  g.add(box(0.09, 1.3, 0.09, MAT.ink, sx + 1.1, 0.65, sz + 2.6));
  return g;
}

/**
 * Create the train. Hanoi mode only; the caller passes null otherwise.
 * world.isWalkable(x, z) is used only to pick a safe push target; when it is
 * missing every candidate counts as walkable (test harness).
 */
export function createTrain({ scene, world, traveller, quality = 'high' } = {}) {
  const path = buildTrainPath();
  const canStand = (x, z) => {
    try { return !world || !world.isWalkable || world.isWalkable(x, z); }
    catch (err) { return true; }
  };
  // Try to push the traveller off the track at one path pose: sideways first
  // (both sides, walkable side wins), then along the track. pose is a path
  // point, along is the traveller offset along the track from that pose,
  // sPose is the arc length at the pose. Used by the N4 ahead check only;
  // pushTraveller below keeps its own identical logic for the cars.
  const tryPushFromPose = (pose, along, sPose) => {
    if (!traveller || !traveller.position) return false;
    const p = traveller.position;
    const nx = -pose.tz;
    const nz = pose.tx;
    const lat = (p.x - pose.x) * nx + (p.z - pose.z) * nz;
    const sides = lat >= 0 ? [1, -1] : [-1, 1];
    for (const side of sides) {
      const cx = pose.x + pose.tx * along + nx * side * 1.15;
      const cz = pose.z + pose.tz * along + nz * side * 1.15;
      if (canStand(cx, cz)) {
        p.x = cx;
        p.z = cz;
        return true;
      }
    }
    for (const ahead of [sPose + 2.0, sPose - TRAIN_TOTAL_LEN - 2.0]) {
      const q = path.pointAt(ahead);
      if (canStand(q.x, q.z)) {
        p.x = q.x;
        p.z = q.z;
        return true;
      }
    }
    return false;
  };
  // True when the traveller overlaps any car rectangle right now.
  const travellerOnTrain = (s) => {
    if (!traveller || !traveller.position) return false;
    const p = traveller.position;
    for (let i = 0; i < cars.length; i++) {
      const offset = i * (TRAIN_CAR_LEN + TRAIN_GAP) + TRAIN_CAR_LEN / 2;
      const pose = path.pointAt(s - offset);
      const dx = p.x - pose.x;
      const dz = p.z - pose.z;
      const along = dx * pose.tx + dz * pose.tz;
      const lat = dx * -pose.tz + dz * pose.tx;
      if (Math.abs(along) <= TRAIN_CAR_LEN / 2 + 0.45 && Math.abs(lat) <= TRAIN_CAR_W / 2 + 0.45) return true;
    }
    return false;
  };
  const trainGroup = new THREE.Group();
  const cars = [buildCar('loco'), buildCar('car'), buildCar('car')];
  for (const c of cars) trainGroup.add(c);
  scene.add(trainGroup);
  scene.add(buildTrack(path));
  scene.add(buildStreetProps());
  const signals = buildSignals();
  scene.add(signals.group);
  scene.add(buildStation());

  const train = {
    path,
    length: path.length,
    s: 0, // arc length of the loco front; starts at the station
    speed: 0,
    visible: quality !== 'low',
    // Car centre offsets behind the loco front (arc length).
    carOffsets: cars.map((_, i) => i * (TRAIN_CAR_LEN + TRAIN_GAP) + TRAIN_CAR_LEN / 2),
    setQuality(level) {
      this.visible = level !== 'low';
      trainGroup.visible = this.visible;
    },
    // Push the traveller out of a car rectangle. No death, no game over:
    // sideways first (both sides tried, walkable side wins), then shove
    // along the track ahead of / behind the train when both sides are blocked.
    pushTraveller() {
      if (!traveller || !traveller.position) return false;
      const p = traveller.position;
      for (let i = 0; i < cars.length; i++) {
        const pose = path.pointAt(this.s - this.carOffsets[i]);
        const tx = pose.tx;
        const tz = pose.tz;
        const nx = -tz;
        const nz = tx;
        const dx = p.x - pose.x;
        const dz = p.z - pose.z;
        const along = dx * tx + dz * tz;
        const lat = dx * nx + dz * nz;
        if (Math.abs(along) > TRAIN_CAR_LEN / 2 + 0.45) continue;
        if (Math.abs(lat) > TRAIN_CAR_W / 2 + 0.45) continue;
        const sides = lat >= 0 ? [1, -1] : [-1, 1];
        for (const side of sides) {
          const cx = pose.x + tx * along + nx * side * 1.15;
          const cz = pose.z + tz * along + nz * side * 1.15;
          if (canStand(cx, cz)) {
            p.x = cx;
            p.z = cz;
            return true;
          }
        }
        // Both sides blocked: shove along the track, ahead first.
        for (const ahead of [this.s + 2.0, this.s - TRAIN_TOTAL_LEN - 2.0]) {
          const q = path.pointAt(ahead);
          if (canStand(q.x, q.z)) {
            p.x = q.x;
            p.z = q.z;
            return true;
          }
        }
        return false;
      }
      return false;
    },
    // N2: push the traveller out of a train-street house footprint. Nearest
    // edge first; a candidate counts only when canStand says it is walkable,
    // so the traveller is never pushed into water, off the map or into the
    // train. Returns false when the traveller is outside every house or no
    // edge is walkable (then the traveller simply stays, no jitter, no trap).
    pushOutOfStreetHouses() {
      if (!traveller || !traveller.position) return false;
      const p = traveller.position;
      for (const h of TRAIN_STREET_HOUSES) {
        const hw = h.hw + HOUSE_MARGIN;
        const hd = h.hd + HOUSE_MARGIN;
        // On the edge counts as outside (1e-9 covers float error on the
        // pushed position, so a second call does not push the same spot).
        if (Math.abs(p.x - h.x) > hw - 1e-9 || Math.abs(p.z - h.z) > hd - 1e-9) continue;
        const cands = [
          { x: h.x + hw, z: p.z, d: h.x + hw - p.x },
          { x: h.x - hw, z: p.z, d: p.x - (h.x - hw) },
          { x: p.x, z: h.z + hd, d: h.z + hd - p.z },
          { x: p.x, z: h.z - hd, d: p.z - (h.z - hd) },
        ].sort((a, b) => a.d - b.d);
        for (const c of cands) {
          if (canStand(c.x, c.z)) {
            p.x = c.x;
            p.z = c.z;
            return true;
          }
        }
        return false;
      }
      return false;
    },
    // N4: true when the traveller stands on the rails ahead of the loco front
    // (within the braking lookahead) and cannot be pushed off. A pushable
    // traveller is pushed aside here and this returns false, so the train
    // only stops when there is really nowhere to stand.
    travellerAheadBlocked() {
      if (!traveller || !traveller.position) return false;
      const p = traveller.position;
      for (let d = 0; d <= TRAIN_BRAKE_LOOKAHEAD; d += 0.5) {
        const pose = path.pointAt(this.s + d);
        const dx = p.x - pose.x;
        const dz = p.z - pose.z;
        const along = dx * pose.tx + dz * pose.tz;
        const lat = dx * -pose.tz + dz * pose.tx;
        if (Math.abs(along) > 0.6 || Math.abs(lat) > TRAIN_CAR_W / 2 + 0.45) continue;
        return !tryPushFromPose(pose, along, this.s + d);
      }
      return false;
    },
    update(dt) {
      if (!this.visible) return;
      if (!(dt > 0) || !Number.isFinite(dt)) dt = 0;
      this.pushOutOfStreetHouses();
      this.pushTraveller();
      // N4 fallback: no standing room anywhere the push can reach, so the
      // train brakes to 0 instead of running through the traveller. It holds
      // still and only moves again once the rails ahead are clear (the
      // traveller walks off or can be pushed). Braking reuses the normal
      // 3 unit/s/s ramp, so the stop is gradual, not a snap.
      const blocked = travellerOnTrain(this.s) || this.travellerAheadBlocked();
      const head = path.pointAt(this.s);
      const target = blocked ? 0 : (isInStreetZone(head.x, head.z) ? TRAIN_STREET_SPEED : TRAIN_SPEED);
      const step = 3 * dt;
      this.speed += Math.max(-step, Math.min(step, target - this.speed));
      this.s = (this.s + this.speed * dt) % path.length;
      for (let i = 0; i < cars.length; i++) {
        const pose = path.pointAt(this.s - this.carOffsets[i]);
        cars[i].position.set(pose.x, 0, pose.z);
        cars[i].rotation.y = Math.atan2(-pose.tz, pose.tx);
      }
      // Signal lamps: red while the head is near the street, green otherwise.
      const near = Math.hypot(head.x - TRAIN_STREET.x * TILE_SIZE, head.z - (TRAIN_STREET.z0 + TRAIN_STREET.z1) / 2 * TILE_SIZE) < 24;
      for (const lamp of signals.lamps) {
        const want = near ? MAT.lampRed : MAT.lampGreen;
        if (lamp.material.color.getHex() !== want.color.getHex()) {
          lamp.material.color.copy(want.color);
          lamp.material.emissive.copy(want.emissive);
        }
      }
      this.pushTraveller();
    },
  };
  trainGroup.visible = train.visible;
  return train;
}
