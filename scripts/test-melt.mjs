import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three.module.min.js';
import {makeFactory} from '../2026/03/factory.js';
import {makeChocolate} from '../2026/03/chocolate.js';
import {deform,cameraFrame} from '../2026/03/deformation.js';
const scene=new T.Scene(),factory=makeFactory(scene),chocolate=makeChocolate(scene,null);
factory.pose(0);const baseline=factory.parts.map(p=>new Float32Array(p.mesh.geometry.attributes.position.array));
for(const t of [0,5,10,15,20,25,29,34]){
 factory.pose(t);chocolate.pose(t);
 for(const {mesh}of factory.parts){for(const v of mesh.geometry.attributes.position.array)assert(Number.isFinite(v),'Finite deforming factory geometry');const n=mesh.geometry.attributes.normal.array;for(const v of n)assert(Number.isFinite(v),'Finite factory normals');}
 for(const v of chocolate.pool.geometry.attributes.position.array)assert(Number.isFinite(v),'Finite chocolate surface');
}
factory.pose(0);factory.parts.forEach((p,i)=>assert.deepEqual(p.mesh.geometry.attributes.position.array,baseline[i],'Scrubbing back restores the factory exactly'));
for(const p of factory.parts)for(let i=0;i<p.original.length;i+=3){const [x,y,z]=p.original.slice(i,i+3);assert(deform(x,y,z,30)[1]<.08,'All architecture sinks below the chocolate surface');}
for(const aspect of [390/844,1440/900,844/390])for(const t of [0,15,23,34]){
 factory.pose(t);chocolate.pose(t);scene.updateMatrixWorld(true);const f=cameraFrame(aspect,t),cam=new T.OrthographicCamera(-f.halfHeight*aspect,f.halfHeight*aspect,f.halfHeight,-f.halfHeight,.1,100);cam.position.set(...f.position);cam.lookAt(...f.target);cam.updateMatrixWorld();
 const meshes=t===34?[chocolate.pool]:factory.parts.map(p=>p.mesh);
 for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).project(cam);assert(Math.abs(v.x)<.99&&Math.abs(v.y)<.99,`Model stays framed at ${aspect}, ${t}`);}}
}
console.log(`Melt checks passed: ${factory.parts.length} factory batches, reversible geometry, finite normals, complete submersion, portrait/landscape framing.`);
