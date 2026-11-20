// Primitives test: does GLTFExporter preserve userData extras, uv1, COLOR_0, material names, node names?
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Node has no FileReader; GLTFExporter only needs readAsArrayBuffer for the final GLB assembly.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((buf) => { this.result = buf; if (this.onloadend) this.onloadend(); }); }
  };
}


const mat = new THREE.MeshStandardMaterial({ name: 'paper', color: 0xffffff, roughness: 1, metalness: 0, vertexColors: true, side: THREE.DoubleSide });
const shape = new THREE.Shape();
shape.moveTo(-0.5, 0); shape.lineTo(0.5, 0); shape.lineTo(0.5, 1.0); shape.lineTo(-0.5, 1.0); shape.closePath();
const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.016, bevelEnabled: false, curveSegments: 4 });
geo.translate(0, 0, -0.008);
// attributes: uv1 + color
const pos = geo.getAttribute('position');
const nrm = geo.getAttribute('normal');
const count = pos.count;
const uv1 = new Float32Array(count * 2);
const col = new Float32Array(count * 3);
let front = 0;
for (let i = 0; i < count; i++) {
  const isFront = nrm.getZ(i) > 0.9;
  if (isFront) front++;
  const x = pos.getX(i), y = pos.getY(i);
  uv1[i * 2] = isFront ? 0.5 + x * 0.1 : -1;
  uv1[i * 2 + 1] = isFront ? 0.5 - y * 0.1 : -1;
  col[i * 3] = isFront ? 1 : 0.8; col[i * 3 + 1] = isFront ? 1 : 0.7; col[i * 3 + 2] = isFront ? 1 : 0.6;
}
geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
console.log('verts', count, 'front-face verts (normal.z>0.9):', front, 'indexed?', !!geo.index);
const flap = new THREE.Mesh(geo, mat);
flap.name = 'hanoi_test__art';
flap.position.set(0.1, 0.004, -0.2);
flap.userData = { hinge: true, foldAngle: Math.PI / 2, delay: 0.5, layer: 3, size: 0.5 };
const root = new THREE.Group();
root.name = 'hanoi_test';
root.userData = { name: 'hanoi_test', model: 'hanoi_test' };
root.add(flap);
const scene = new THREE.Scene();
scene.add(root);
const out = await new GLTFExporter().parseAsync(scene, { binary: true });
console.log('exported bytes:', out.byteLength);
const gltf = await new GLTFLoader().parseAsync(out, '');
const r2 = gltf.scene.getObjectByName('hanoi_test');
console.log('root found:', !!r2, 'userData:', JSON.stringify(r2 && r2.userData));
const f2 = gltf.scene.getObjectByName('hanoi_test__art');
console.log('flap found:', !!f2, 'userData:', JSON.stringify(f2 && f2.userData));
if (f2) {
  const g = f2.geometry;
  console.log('attrs:', Object.keys(g.attributes), 'mat:', f2.material.name, 'vertexColors:', f2.material.vertexColors, 'side:', f2.material.side === THREE.DoubleSide ? 'double' : f2.material.side);
  const u = g.getAttribute('uv1');
  console.log('uv1[0..3]:', u ? [u.getX(0), u.getY(0), u.getX(1), u.getY(1)].map(v => +v.toFixed(3)) : null);
  const c = g.getAttribute('color');
  console.log('color[0]:', c ? [c.getX(0), c.getY(0), c.getZ(0)] : null);
  console.log('pos[0]:', [g.getAttribute('position').getX(0), g.getAttribute('position').getY(0), g.getAttribute('position').getZ(0)].map(v => +v.toFixed(3)));
  console.log('uv[0]:', g.getAttribute('uv') ? [g.getAttribute('uv').getX(0), g.getAttribute('uv').getY(0)] : null);
}
