import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs';
const buf = fs.readFileSync('public/models/tiles.glb');
const gltf = await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const scene = gltf.scene;
const name = process.argv[2] || 'watchtower';
const root = scene.getObjectByName(name);
function dump(o, d = 0) {
  const pad = '  '.repeat(d);
  const ud = o.userData ? JSON.stringify(o.userData) : '';
  let extra = '';
  if (o.isMesh) {
    const g = o.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const uv1 = g.getAttribute('uv1');
    let uv1r = 'none';
    if (uv1) {
      let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9, neg=0;
      for (let i=0;i<uv1.count;i++){const x=uv1.getX(i),y=uv1.getY(i); if(x<0){neg++;continue;} mnx=Math.min(mnx,x);mny=Math.min(mny,y);mxx=Math.max(mxx,x);mxy=Math.max(mxy,y);}
      uv1r = neg? `neg${neg} range[${mnx.toFixed(3)},${mny.toFixed(3)}]-[${mxx.toFixed(3)},${mxy.toFixed(3)}]` : `range[${mnx.toFixed(3)},${mny.toFixed(3)}]-[${mxx.toFixed(3)},${mxy.toFixed(3)}]`;
    }
    const col = g.getAttribute('color');
    let colr = 'none';
    if (col) { const s = new Set(); for (let i=0;i<col.count;i++) s.add([col.getX(i).toFixed(2),col.getY(i).toFixed(2),col.getZ(i).toFixed(2)].join(',')); colr = [...s].slice(0,4).join('|'); }
    const uv0 = g.getAttribute('uv');
    extra = ` verts=${g.getAttribute('position').count} idx=${g.index?g.index.count:0} bbox=[${bb.min.x.toFixed(2)},${bb.min.y.toFixed(2)},${bb.min.z.toFixed(2)}]-[${bb.max.x.toFixed(2)},${bb.max.y.toFixed(2)},${bb.max.z.toFixed(2)}] uv1=${uv1r} uv0=${uv0?'yes':'no'} color=${colr} mat=${o.material&&o.material.name}`;
  }
  console.log(`${pad}${o.type} ${o.name} pos=[${o.position.x.toFixed(2)},${o.position.y.toFixed(2)},${o.position.z.toFixed(2)}] rot=[${o.rotation.x.toFixed(2)},${o.rotation.y.toFixed(2)},${o.rotation.z.toFixed(2)}] scale=[${o.scale.x.toFixed(2)},${o.scale.y.toFixed(2)},${o.scale.z.toFixed(2)}] ud=${ud}${extra}`);
  for (const c of o.children) dump(c, d+1);
}
dump(root);
