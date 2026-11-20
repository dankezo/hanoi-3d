// Verify public/models/hanoi-tiles.glb: contract checks mirroring src/assets/loader.js adopt().
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs';

const EXPECTED = {
  hanoi_turtletower: { flaps: 5, art: 'turtletower', rect: [16, 2600, 179, 302] },
  hanoi_ngocson: { flaps: 7, art: 'ngocson', rect: [211, 2600, 331, 274] },
  hanoi_thehuc: { flaps: 4, art: 'thehuc', rect: [558, 2600, 432, 158] },
  hanoi_tranquoc: { flaps: 8, art: 'tranquoc', rect: [1006, 2600, 202, 374] },
  hanoi_tubehouse: { flaps: 6, art: 'tubehouse', rect: [1224, 2600, 173, 288] },
  hanoi_tubehouse_b: { flaps: 5, art: 'tubehouse', rect: [1224, 2600, 173, 288] },
  hanoi_tubehouse_green: { flaps: 5, art: null },
  hanoi_mausoleum: { flaps: 8, art: 'mausoleum', rect: [16, 2990, 302, 288] },
  hanoi_badinh: { flaps: 5, art: null },
  hanoi_vanmieu: { flaps: 7, art: 'vanmieu', rect: [334, 2990, 331, 302] },
  hanoi_onepillar: { flaps: 5, art: 'onepillar', rect: [681, 2990, 207, 331] },
  hanoi_cathedral: { flaps: 6, art: 'cathedral', rect: [904, 2990, 360, 389] },
  hanoi_opera: { flaps: 7, art: 'opera', rect: [1280, 2990, 360, 259] },
  hanoi_longbien: { flaps: 5, art: 'longbien', rect: [1656, 2990, 432, 202] },
};
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fail++; };

const buf = fs.readFileSync('public/models/hanoi-tiles.glb');
const gltf = await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const scene = gltf.scene;
check(scene.children.length === 14, `14 top-level nodes (got ${scene.children.length})`);
let totalTris = 0;
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
      totalTris += (g.index ? g.index.count : p.count) / 3;
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
  if (exp.art) {
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
      // front-face vertex colours must be white (art shows unmodified)
      const col = art.geometry.getAttribute('color');
      const nrm = art.geometry.getAttribute('normal');
      let white = true;
      for (let i = 0; i < col.count; i++) {
        if (nrm.getZ(i) > 0.9 && (col.getX(i) < 0.99 || col.getY(i) < 0.99 || col.getZ(i) < 0.99)) white = false;
      }
      check(white, `${id}: art front-face vertex colours are white`);
    }
  } else {
    check(!art, `${id}: no art flap (as designed)`);
  }
  // base must be flat at y=0 and span the tile
  if (base) {
    base.geometry.computeBoundingBox();
    const bb = base.geometry.boundingBox;
    check(Math.abs(bb.min.y) < 1e-6 && Math.abs(bb.max.x - 1) < 1e-6 && Math.abs(bb.min.x + 1) < 1e-6,
      `${id}: base bbox x [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}] y [${bb.min.y.toFixed(3)}, ${bb.max.y.toFixed(3)}]`);
  }
}
console.log('total triangles:', Math.round(totalTris));
console.log(fail === 0 ? 'ALL GLB CHECKS PASSED' : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
