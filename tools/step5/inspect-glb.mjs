import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs';
const buf = fs.readFileSync('public/models/tiles.glb');
const loader = new GLTFLoader();
const gltf = await loader.parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const scene = gltf.scene;
console.log('top-level children:', scene.children.length);
console.log('names:', scene.children.map(c => c.name).join(', '));
let uv1Meshes = 0, colorMeshes = 0, hingeNodes = 0, totalMeshes = 0;
const sample = {};
for (const c of scene.children.slice(0, 6)) {
  let m = 0, u = 0, col = 0, h = 0;
  c.traverse(o => {
    if (o.isMesh) { m++; totalMeshes++;
      if (o.geometry.getAttribute('uv1')) { u++; uv1Meshes++; }
      if (o.geometry.getAttribute('color')) { col++; colorMeshes++; }
    }
    if (o.userData && o.userData.hinge) { h++; hingeNodes++; }
  });
  sample[c.name] = { meshes: m, uv1: u, color: col, hinges: h };
  // show one uv1 mesh detail
  c.traverse(o => {
    if (o.isMesh && o.geometry.getAttribute('uv1') && !sample[c.name].shown) {
      sample[c.name].shown = true;
      const uv1 = o.geometry.getAttribute('uv1');
      const vals = [];
      for (let i = 0; i < Math.min(8, uv1.count); i++) vals.push([+uv1.getX(i).toFixed(3), +uv1.getY(i).toFixed(3)]);
      console.log(' UV1 sample', c.name, '/', o.name, 'count', uv1.count, JSON.stringify(vals), 'mat', o.material && o.material.name);
    }
  });
}
console.log(JSON.stringify(sample, null, 1));
console.log('totals: meshes', totalMeshes, 'uv1', uv1Meshes, 'color', colorMeshes, 'hinges(first6)', hingeNodes);
// check a specific known tile with art: manor
const manor = scene.getObjectByName('manor');
if (manor) {
  manor.traverse(o => {
    if (o.isMesh) {
      const g = o.geometry;
      console.log('manor mesh', o.name, 'uv1?', !!g.getAttribute('uv1'), 'color?', !!g.getAttribute('color'), 'pos', g.getAttribute('position').count, 'mat', o.material && o.material.name, 'hinge?', !!(o.userData && o.userData.hinge), 'parent hinge?', !!(o.parent && o.parent.userData && o.parent.userData.hinge));
    }
  });
}
console.log('animations:', gltf.animations.length);
console.log('asset:', JSON.stringify(gltf.asset));
