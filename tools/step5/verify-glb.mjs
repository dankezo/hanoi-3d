// Verify public/models/hanoi-tiles.glb: contract checks mirroring src/assets/loader.js adopt().
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs';

const EXPECTED = {
  hanoi_turtletower: { flaps: 14, art: 'turtletower', rect: [16, 2600, 179, 302] },
  hanoi_ngocson: { flaps: 9, art: 'ngocson', rect: [211, 2600, 331, 274] },
  hanoi_thehuc: { flaps: 8, art: 'thehuc', rect: [558, 2600, 432, 158] },
  hanoi_tranquoc: { flaps: 17, art: 'tranquoc', rect: [1006, 2600, 202, 374] },
  hanoi_tubehouse: { flaps: 10, art: 'tubehouse', rect: [1224, 2600, 173, 288] },
  hanoi_tubehouse_b: { flaps: 9, art: 'tubehouse', rect: [1224, 2600, 173, 288] },
  hanoi_tubehouse_green: { flaps: 7, art: null },
  hanoi_mausoleum: { flaps: 12, art: 'mausoleum', rect: [16, 2990, 302, 288] },
  hanoi_badinh: { flaps: 10, art: null },
  hanoi_vanmieu: { flaps: 9, art: 'vanmieu', rect: [334, 2990, 331, 302] },
  hanoi_onepillar: { flaps: 7, art: 'onepillar', rect: [681, 2990, 207, 331] },
  hanoi_cathedral: { flaps: 8, art: 'cathedral', rect: [904, 2990, 360, 389] },
  hanoi_opera: { flaps: 10, art: 'opera', rect: [1280, 2990, 360, 259] },
  hanoi_longbien: { flaps: 9, art: 'longbien', rect: [1656, 2990, 432, 202] },
  // Phase 2B street elements: flat-colour flaps only, no hero art card.
  hanoi_road: { flaps: 2, art: null },
  hanoi_sidewalk: { flaps: 1, art: null },
  hanoi_tree: { flaps: 5, art: null },
  hanoi_bush: { flaps: 3, art: null },
  hanoi_trafficlight: { flaps: 5, art: null },
  hanoi_police: { flaps: 2, art: null },
  hanoi_pedestrian: { flaps: 3, art: null },
  hanoi_vendor: { flaps: 4, art: null },
  hanoi_phostall: { flaps: 11, art: 'sign_pho', rect: [2948, 2990, 98, 52] },
  hanoi_pole: { flaps: 6, art: null },
  hanoi_lamp: { flaps: 5, art: null },
  // Phase 3A street elements: flat-colour flaps only, no hero art card - except
  // the sign boards, which gained a text hero card in the fix round (see below).
  hanoi_cornerhouse: { flaps: 9, art: 'sign_biaphoco', rect: [2104, 2990, 173, 274] },
  hanoi_sign_phoco: { flaps: 5, art: 'sign_biaphoco', rect: [2104, 2990, 173, 274] },
  hanoi_sign_biahoi: { flaps: 5, art: 'sign_biahoi', rect: [2293, 2990, 173, 274] },
  hanoi_sign_trucbach: { flaps: 5, art: 'sign_trucbach', rect: [2482, 2990, 173, 274] },
  hanoi_sign_paramount: { flaps: 5, art: 'sign_paramount', rect: [2671, 2990, 173, 274] },
  hanoi_flag: { flaps: 4, art: null },
  hanoi_banner: { flaps: 5, art: 'sign_banner304', rect: [2860, 2990, 72, 202] },
  hanoi_sautree: { flaps: 5, art: null },
  hanoi_bike_red: { flaps: 4, art: null },
  hanoi_bike_blue: { flaps: 4, art: null },
  hanoi_bike_black: { flaps: 4, art: null },
  hanoi_mural: { flaps: 5, art: null },
  hanoi_alley: { flaps: 7, art: null },
  hanoi_vendor_street: { flaps: 4, art: null },
  hanoi_phostall_street: { flaps: 11, art: 'sign_pho', rect: [2948, 2990, 98, 52] },
  hanoi_pole_street: { flaps: 6, art: null },
  // Phase 3B lake models: flat-colour flaps only, no hero art card.
  hanoi_pond_guom: { flaps: 3, art: null },
  hanoi_pond_tay: { flaps: 3, art: null },
  hanoi_lotus: { flaps: 5, art: null },
  hanoi_stonebridge: { flaps: 5, art: null },
  hanoi_pentower: { flaps: 7, art: null },
  hanoi_mausoleum_wing: { flaps: 6, art: null },
};
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fail++; };

const buf = fs.readFileSync('public/models/hanoi-tiles.glb');
const gltf = await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const scene = gltf.scene;
check(scene.children.length === 47, `47 top-level nodes (got ${scene.children.length})`);
let totalTris = 0;
let totalDegenerate = 0;
for (const [id, exp] of Object.entries(EXPECTED)) {
  const node = scene.getObjectByName(id);
  check(!!node, `${id}: node exists`);
  if (!node) continue;
  check(node.userData.model === id && node.userData.name === id, `${id}: userData name/model`);
  let hinges = 0, meshes = 0, base = null, art = null;
  let degenerate = 0;
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
      const ax = new THREE.Vector3(), bx = new THREE.Vector3(), cx = new THREE.Vector3();
      const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cr = new THREE.Vector3();
      for (let t = 0; t < tris; t++) {
        const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
        ax.fromBufferAttribute(p, i0); bx.fromBufferAttribute(p, i1); cx.fromBufferAttribute(p, i2);
        ab.subVectors(bx, ax); ac.subVectors(cx, ax); cr.crossVectors(ab, ac);
        if (cr.lengthSq() < 1e-12) degenerate++;
      }
      // footprint: flap meshes sit upright in the GLB (shape XY, hinge at y = 0). The world
      // footprint is the mesh bbox after its own position + rotation.y: x/z must stay inside
      // the tile ([-1, 1]) and the flap height (local y) under 1.5.
      if (o.name !== id + '__base') {
        g.computeBoundingBox();
        const bb = g.boundingBox.clone();
        const m = new THREE.Matrix4().makeRotationY(o.rotation.y).setPosition(o.position.x, o.position.y, o.position.z);
        bb.applyMatrix4(m);
        const inside = bb.min.x >= -1.01 && bb.max.x <= 1.01 && bb.min.z >= -1.01 && bb.max.z <= 1.01;
        if (!inside) check(false, `${id}/${o.name}: footprint outside tile x [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}] z [${bb.min.z.toFixed(2)}, ${bb.max.z.toFixed(2)}]`);
        // height is the flap's own extent (bb.min.y carries the layer gap offset, not height)
        const flapH = bb.max.y - bb.min.y;
        if (flapH > 1.51) check(false, `${id}/${o.name}: flap height ${flapH.toFixed(2)} over 1.5`);
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
  totalDegenerate += degenerate;
  check(degenerate === 0, `${id}: ${degenerate} degenerate triangles`);
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
console.log('total degenerate triangles:', totalDegenerate);
console.log(fail === 0 ? 'ALL GLB CHECKS PASSED' : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
