import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {splitCabinMesh} from '../app/cmf.ts';
import {partCategory,partOffset} from '../app/study-state.ts';
import {assemblyKey,buildExplosionLayout,explosionCameraDistance} from '../app/explosion-layout.ts';
import {defaults,shareUrl,readSettings} from '../app/experience.ts';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const bytes=fs.readFileSync('public/models/zeekr-9x.glb');
const car=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
car.updateMatrixWorld(true);
const meshes=[];car.traverse(o=>{if(o.isMesh)meshes.push(o);});
const seatBytes=fs.readFileSync('public/models/seat-layout-a.glb');
const seat=(await new GLTFLoader().parseAsync(seatBytes.buffer.slice(seatBytes.byteOffset,seatBytes.byteOffset+seatBytes.byteLength),'')).scene;
seat.updateMatrixWorld(true);seat.traverse(o=>{if(o.isMesh)meshes.push(o);});
const parts=meshes.flatMap(splitCabinMesh).map((m,i)=>{
 const path=[];for(let o=m;o;o=o.parent)path.push(o.name);
 const materials=(Array.isArray(m.material)?m.material:[m.material]).map(m=>m.name).join(' ');
 return {id:String(i),category:partCategory(path.join('/'),materials,m.userData.cmfZone),door:['Door_LF','Door_RF','Door_LB','Door_RB','Trunk_up','Hood'].find(d=>path.includes(d))??null,bounds:new T.Box3().setFromObject(m)};
});
const offsets=buildExplosionLayout(parts);
function boxes(multiplier, legacy=false){
 const groups=new Map();
 for(const p of parts){
  const key=assemblyKey(p),c=p.bounds.getCenter(new T.Vector3());
  const offset=legacy?new T.Vector3(...partOffset(p.category,c)):offsets.get(p.id).clone();
  const box=p.bounds.clone().translate(offset.multiplyScalar(multiplier));
  if(!groups.has(key))groups.set(key,new T.Box3());groups.get(key).union(box);
 }
 return [...groups.values()];
}
function collisions(boxes){let n=0;for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxes[i].intersectsBox(boxes[j]))n++;return n;}
const oldCount=collisions(boxes(1,true));
for(const amount of [1,1.5,2]){
 const groups=boxes(amount),count=collisions(groups);assert.equal(count,0,`assembly overlap at ${amount*100}%`);
 const bounds=new T.Box3();groups.forEach(b=>bounds.union(b));
 for(const aspect of [.6,1,1.7,2.5]){
  const center=bounds.getCenter(new T.Vector3()),camera=new T.PerspectiveCamera(38,aspect,.025,1000);
  camera.position.copy(center).addScaledVector(new T.Vector3(-6.9,2.15,-8.3).normalize(),explosionCameraDistance(bounds,38,aspect));
  camera.lookAt(center);camera.updateMatrixWorld();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1, 'expanded bounds stay in frustum');
  }
 }
 console.log(`${amount*100}%: ${groups.length} assemblies, ${count} bounding-box overlaps; extent ${bounds.getSize(new T.Vector3()).toArray().map(v=>v.toFixed(1))}`);
}
for(const p of parts)assert.ok(p.bounds.clone().translate(offsets.get(p.id).clone().multiplyScalar(0)).equals(p.bounds));
globalThis.window={location:{href:'http://localhost:3001/',search:''}};
for(const explode of [0,100,150,200]){const s={...defaults,section:'structure',explode};window.location.search=new URL(shareUrl(s)).search;assert.deepEqual(readSettings(),s);}
assert.ok(oldCount>0);console.log(`PASS: old 100% layout had ${oldCount} assembly overlaps; restored geometry and 0–200% sharing preserved. Not a browser visual test.`);
