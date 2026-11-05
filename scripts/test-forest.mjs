import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three.module.min.js';
import {story,duration,framing} from '../2026/02/story.js';
import {makeForest} from '../2026/02/forest.js';
import {potato} from '../2026/02/models.js';
const scene=new T.Scene();makeForest(scene);scene.add(potato(0).root,potato(1).root);
let triangles=0;
scene.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(const value of p.array)assert(Number.isFinite(value),'All geometry is finite');triangles+=(o.geometry.index?.count||p.count)/3;}});
for(const aspect of [390/844,1440/900,844/390])for(let t=18;t<=duration;t+=.5){
 const s=story(t),view=framing(s,aspect);const cam=new T.PerspectiveCamera(43,aspect,.1,110);cam.position.set(...view.camera);cam.lookAt(...view.look);cam.updateMatrixWorld();
 for(const x of [-.95,-.45,.45,.95])for(const y of [.05,1.3]){const v=new T.Vector3(x,s.guide[1]+y,s.guide[2]).project(cam);assert(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1,`Guide stays on screen: ${aspect}, ${t}`);}

}
console.log(`Finite forest geometry: ${triangles} triangles; guides remain framed on portrait, landscape and wide screens.`);
