import * as T from '../../assets/vendor/three.module.min.js';
import {deform,smooth,mix,clamp} from './deformation.js';
export function makeChocolate(scene,environment){
 const material=new T.MeshPhysicalMaterial({color:'#542916',roughness:.14,metalness:.04,clearcoat:1,clearcoatRoughness:.1,envMap:environment,envMapIntensity:1.25});
 const root=new T.Group();scene.add(root);const rings=16,segments=80,positions=[],indices=[];
 for(let r=0;r<=rings;r++)for(let j=0;j<=segments;j++)positions.push(0,0,0);
 for(let r=0;r<rings;r++)for(let j=0;j<segments;j++){const a=r*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setIndex(indices);
 const pool=new T.Mesh(geo,material);pool.receiveShadow=true;pool.frustumCulled=false;root.add(pool);
 const anchors=[[-2.7,6.1,1.8],[2.65,6.1,1.8],[-.6,6.6,1.1],[1.6,7.7,.4],[-4.8,5.7,1.1],[4.8,3.4,1.6],[-4.05,9.6,-.5],[-1.5,10.9,-.65],[1.35,9.1,-1],[-1.2,4.3,2.1],[2.8,3.8,2.1],[-3.2,7.8,-1.25]];
 const dripGeo=new T.SphereGeometry(1,10,8),neckGeo=new T.CylinderGeometry(1,1,1,8,4),drips=anchors.map((anchor,i)=>{const neck=new T.Mesh(neckGeo,material),drop=new T.Mesh(dripGeo,material);root.add(neck,drop);drop.castShadow=true;neck.castShadow=true;return {anchor,neck,drop,seed:i*.137};});
 const bubbles=[[-3,.9],[2.6,1.4],[.4,-1.8]].map((p,i)=>{const dome=new T.Mesh(new T.SphereGeometry(1,16,10),material),ripple=new T.Mesh(new T.TorusGeometry(1,.015,5,40),material);ripple.rotation.x=-Math.PI/2;root.add(dome,ripple);return {dome,ripple,p,seed:i*.31};});
 function pose(t){
  const amount=smooth(10,29,t),spread=mix(.045,1,amount),a=geo.attributes.position;root.visible=t>8.3;
  for(let r=0;r<=rings;r++)for(let j=0;j<=segments;j++){const radius=r/rings,angle=j/segments*Math.PI*2,edge=1+.055*Math.sin(angle*3+.3)+.035*Math.sin(angle*7);const x=Math.cos(angle)*7.8*radius*edge*spread,z=Math.sin(angle)*5.6*radius*edge*spread;const wave=Math.sin(radius*27-t*2.1+Math.sin(angle*3))*.018*amount*(1-radius);const y=.045+Math.pow(1-radius*radius,1.5)*(.13+.12*amount)+wave;a.setXYZ(r*(segments+1)+j,x,y,z);}
  a.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();pool.visible=t>10;
  drips.forEach(({anchor,neck,drop,seed},i)=>{const appear=smooth(8.5+i*.18,11.5+i*.18,t)*(1-smooth(24,28,t));const point=deform(...anchor,t);const age=Math.max(0,t-9-i*.18),phase=(age*.22+seed)%1;const bottom=mix(point[1],.16,phase**1.6),r=(.055+phase*.085)*appear;drop.visible=neck.visible=appear>.01&&point[1]>.25;drop.position.set(point[0],bottom,point[2]);drop.scale.set(r,r*(1.6-phase*.5),r);neck.position.set(point[0],(bottom+point[1])*.5,point[2]);neck.scale.set(r*.42,Math.max(.01,point[1]-bottom),r*.42);});
  bubbles.forEach(({dome,ripple,p,seed})=>{const q=((t-23)*.23+seed)%1,active=t>23;const grow=clamp(q/.72),size=.3*Math.sin(grow*Math.PI*.5)*(1-smooth(.72,.9,q));dome.visible=active&&size>.005;dome.position.set(p[0],.2,p[1]);dome.scale.set(size,size*.7,size);ripple.visible=active&&q>.72;ripple.position.set(p[0],.235,p[1]);const radius=.3+(q-.72)*3;ripple.scale.setScalar(radius);});
 }
 return {root,pool,drips,pose,material};
}
