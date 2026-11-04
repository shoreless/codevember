// Export the folded pose as a lightweight static gallery image, without WebGL.
import * as THREE from '../assets/vendor/three.module.min.js';
import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('../2026/01/scene.js', import.meta.url), 'utf8');
// Reuse the experiment's mesh, fold function and camera coordinates.
const xs = source.match(/const xs = (\[[^;]+\]);/)[1].slice(1,-1).split(",").map(Number);
const radii = source.match(/const radii = (\[[^;]+\]);/)[1].slice(1,-1).split(",").map(Number);
const clamp = THREE.MathUtils.clamp, mix = THREE.MathUtils.lerp;
const smooth = (a,b,t) => { const v=clamp((t-a)/(b-a),0,1); return v*v*(3-2*v); };
const foldSource = source.slice(source.indexOf('function paperPoint('),source.indexOf('function pose('));
const paperPoint = new Function('xs','radii','smooth','mix',foldSource+'; return paperPoint;')(xs,radii,smooth,mix);
const camera = new THREE.PerspectiveCamera(40,1,.1,60);
camera.position.set(6.2,8.8,11);camera.lookAt(0,.35,0);camera.updateMatrixWorld();
const world = new THREE.Matrix4().makeRotationY(-.21);world.setPosition(.35,.08,.1);
const points = xs.map((_,r)=>Array.from({length:9},(_,c)=>new THREE.Vector3(...paperPoint(r,c,8)).applyMatrix4(world)));
const projected=points.flat().map(v=>v.clone().applyMatrix4(camera.matrixWorldInverse));
const minX=Math.min(...projected.map(v=>v.x)),maxX=Math.max(...projected.map(v=>v.x));
const minY=Math.min(...projected.map(v=>v.y)),maxY=Math.max(...projected.map(v=>v.y));
const scale=Math.min(490/(maxX-minX),245/(maxY-minY));
const project=v=>{const q=v.clone().applyMatrix4(camera.matrixWorldInverse);return [330+(q.x-(minX+maxX)/2)*scale,198-(q.y-(minY+maxY)/2)*scale,q.z];};
const light=new THREE.Vector3(-3,8,5).normalize(),fill=new THREE.Vector3(5,4,-5).normalize();
const view=camera.position.clone().sub(new THREE.Vector3(0,.35,0)).normalize();
const faces=[];
for(let i=0;i<8;i++)for(let j=0;j<8;j++){
 const a=points[i][j],b=points[i+1][j],c=points[i+1][j+1],d=points[i][j+1];
 for(const f of (i+j)%2?[[a,d,b],[b,d,c]]:[[a,c,b],[a,d,c]]){
  const n=f[1].clone().sub(f[0]).cross(f[2].clone().sub(f[0])).normalize();
  const front=n.dot(view)>0;if(!front)n.negate();
  const base=new THREE.Color(front?'#bb8494':'#71334f');
  const intensity=.72+.55*Math.max(0,n.dot(light))+.18*Math.max(0,n.dot(fill));
  base.multiplyScalar(intensity);
  const p=f.map(project);
  faces.push({depth:p.reduce((sum,v)=>sum+v[2],0)/3,color:'#'+base.getHexString(),path:p.map(v=>v.slice(0,2).map(x=>x.toFixed(2)).join(',')).join(' ')});
 }
}
faces.sort((a,b)=>a.depth-b.depth);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="660" height="400" viewBox="0 0 660 400"><defs><filter id="shadow" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="10"/></filter></defs><path fill="#f2f0e9" d="M0 0h660v400H0z"/><ellipse cx="335" cy="${(198+(maxY-minY)*scale/2-9).toFixed(1)}" rx="180" ry="20" fill="#75606b" opacity=".17" filter="url(#shadow)"/>${faces.map(f=>`<polygon points="${f.path}" fill="${f.color}" stroke="${f.color}" stroke-width=".4"/>`).join('')}</svg>\n`;
writeFileSync(new URL('../assets/previews/01-folded.svg',import.meta.url),svg);
