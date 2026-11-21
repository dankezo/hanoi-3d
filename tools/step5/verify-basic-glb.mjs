// Verify public/models/basic-grand.glb: contract checks mirroring src/assets/loader.js adopt().
// Same shape as tools/step5/verify-glb.mjs, for the 6 Phase 2A grand buildings.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs';

const EXPECTED = {
  house: { flaps: 9, art: 'basic_townhouse', rect: [16, 3395, 294, 333], maxH: 1.3008 },
  manor: { flaps: 11, art: 'basic_grandmanor', rect: [326, 3395, 384, 358], maxH: 1.3984 },
  barn_farm: { flaps: 10, art: 'basic_greatbarn', rect: [726, 3395, 384, 358], maxH: 1.3984 },
  village: { flaps: 11, art: 'basic_marketstreet', rect: [16, 3769, 410, 282], maxH: 1.1016 },
  village_b: { flaps: 13, art: 'basic_gardencottage', rect: [442, 3769, 358, 256], maxH: 1.0 },
  village_green: { flaps: 14, art: 'basic_townsquare', rect: [816, 3769, 410, 282], maxH: 1.1016 },
};
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fail++; };

const buf = fs.readFileSync('public/models/basic-grand.glb');
const gltf = await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const scene = gltf.scene;
check(scene.children.length === 6, `6 top-level nodes (got ${scene.children.length})`);
let totalTris = 0;
let degenerate = 0;
for (const [id, exp] of Object.entries(EXPECTED)) {
  const node = scene.getObjectByName(id);
  check(!!node, `${id}: node exists`);
  if (!node) continue;
  check(node.userData.model === id && node.userData.name === id, `${id}: userData name/model`);
  let hinges = 0, meshes = 0, base = null, art = null;
  node.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const g = o.geometry;
      const p = g.getAttribute('position');
      let nan = false;
      for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) nan = true;
      if (nan) { check(false, `${id}/${o.name}: NaN in position`); }
      if (!g.getAttribute('color')) check(false, `${id}/${o.name}: missing COLOR_0`);
      if (!g.getAttribute('uv1')) check(false, `${id}/${o.name}: missing uv1`);
      if (!g.getAttribute('uv')) check(false, `${id}/${o.name}: missing uv`);
      if (o.name === id + '__base') base = o;
      if (o.name === id + '__art') art = o;
      const tris = (g.index ? g.index.count : p.count) / 3;
      totalTris += tris;
      // degenerate triangles: zero-area faces (cross product near zero)
      const idx = g.index ? g.index.array : null;
      const pos = p.array;
      const v = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
      for (let t = 0; t < tris; t++) {
        const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2;
        const [ax, ay, az] = v(a), [bx, by, bz] = v(b), [cx, cy, cz] = v(c);
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        const crx = uy * vz - uz * vy, cry = uz * vx - ux * vz, crz = ux * vy - uy * vx;
        if (Math.hypot(crx, cry, crz) < 1e-12) degenerate++;
      }
    }
    if (o.userData && o.userData.hinge) {
      hinges++;
      const ud = o.userData;
      if (!Number.isFinite(ud.foldAngle) || ud.delay < 0 || ud.delay > 1 || !Number.isInteger(ud.layer)) {
        check(false, `${id}/${o.name}: bad hinge userData ${JSON.stringify(ud)}`);
      }
    }
  });
  check(!!base, `${id}: has base`);
  check(hinges === exp.flaps, `${id}: ${hinges} hinges (expected ${exp.flaps})`);
  check(!!art, `${id}: has art flap`);
  if (art) {
    const uv1 = art.geometry.getAttribute('uv1');
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9, neg = 0, pos = 0;
    for (let i = 0; i < uv1.count; i++) {
      const x = uv1.getX(i), y = uv1.getY(i);
      if (x < 0) neg++; else { pos++; mnx = Math.min(mnx, x); mny = Math.min(mny, y); mxx = Math.max(mxx, x); mxy = Math.max(mxy, y); }
    }
    const [rx, ry, rw, rh] = exp.rect;
    const eu = [rx / 4096, ry / 4096, (rx + rw) / 4096, (ry + rh) / 4096];
    const got = [mnx, mny, mxx, mxy];
    const close = got.every((v, i) => Math.abs(v - eu[i]) < 0.002);
    check(pos > 0 && close, `${id}: art uv1 range [${got.map((v) => v.toFixed(3))}] vs rect [${eu.map((v) => v.toFixed(3))}] (${pos} art verts, ${neg} -1)`);
    const col = art.geometry.getAttribute('color');
    const nrm = art.geometry.getAttribute('normal');
    let white = true;
    for (let i = 0; i < col.count; i++) {
      if (nrm.getZ(i) > 0.9 && (col.getX(i) < 0.99 || col.getY(i) < 0.99 || col.getZ(i) < 0.99)) white = false;
    }
    check(white, `${id}: art front-face vertex colours are white`);
  }
  if (base) {
    base.geometry.computeBoundingBox();
    const bb = base.geometry.boundingBox;
    check(Math.abs(bb.min.y) < 1e-6 && Math.abs(bb.max.x - 1) < 1e-6 && Math.abs(bb.min.x + 1) < 1e-6,
      `${id}: base bbox x [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}] y [${bb.min.y.toFixed(3)}, ${bb.max.y.toFixed(3)}]`);
  }
  // whole-node height: tallest flap top must match the design height (hero card height)
  // plus the hero flap's layer-gap y offset (FLAP_GAP * flap count, hero is the last flap)
  node.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(node);
  const expH = exp.maxH + 0.004 * exp.flaps;
  check(Math.abs(bb.max.y - expH) < 0.01, `${id}: node height ${bb.max.y.toFixed(3)} (expected ${expH.toFixed(3)})`);
  check(bb.min.x >= -1.01 && bb.max.x <= 1.01 && bb.min.z >= -1.01 && bb.max.z <= 1.01,
    `${id}: node footprint x [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}] z [${bb.min.z.toFixed(2)}, ${bb.max.z.toFixed(2)}] inside the tile`);
}
console.log('total triangles:', Math.round(totalTris));
console.log('degenerate triangles:', degenerate);
check(degenerate === 0, 'zero degenerate triangles');
console.log(fail === 0 ? 'ALL GLB CHECKS PASSED' : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
