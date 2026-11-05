import assert from 'node:assert/strict';
import { createShards, projectShard } from '../2026/02/fracture.js';
const area=vs=>Math.abs(vs.reduce((n,a,i)=>{const b=vs[(i+1)%vs.length];return n+a.x*b.y-b.x*a.y;},0))/2;
for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const [x,y] of [[.5,.48],[.02,.02],[.98,.98]]){
 const shards=createShards(width,height,{x:width*x,y:height*y});
 assert(shards.length>20);
 assert(Math.abs(shards.reduce((s,t)=>s+area(t.vertices),0)-width*height)<.01,'Fractures cover the entire page');
 for(const s of shards){
  const start=projectShard(s,0,width,height);
  assert(start.points.every((p,i)=>Math.hypot(p.x-s.vertices[i].x,p.y-s.vertices[i].y)<1e-9),'Restored fragments reconstruct the page');
  for(const t of [.5,1,2,3,4]){
   const pose=projectShard(s,t,width,height);
   assert(pose.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'No singular perspective projection');
   if(t===4)assert.equal(pose.opacity,0,'All fragments clear the reveal');
  }
 }
 console.log(`${width}x${height}, impact ${x},${y}: ${shards.length} fragments, full coverage`);
}
