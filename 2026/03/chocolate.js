import * as T from '../../assets/vendor/three.module.min.js';
import {deform,smooth,mix,clamp,meltClock} from './deformation.js?v=2-visitor';
export function makeChocolate(scene,environment){
 const material=new T.MeshPhysicalMaterial({color:'#35180f',roughness:.055,metalness:.12,clearcoat:1,clearcoatRoughness:.025,envMap:environment,envMapIntensity:2.2});
 const root=new T.Group();scene.add(root);const rings=30,segments=100,positions=[],indices=[];
 for(let r=0;r<=rings;r++)for(let j=0;j<=segments;j++)positions.push(0,0,0);
 for(let r=0;r<rings;r++)for(let j=0;j<segments;j++){const a=r*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setIndex(indices);
 const pool=new T.Mesh(geo,material);pool.receiveShadow=true;pool.frustumCulled=false;root.add(pool);
 const anchors=[[-2.7,6.1,1.8],[2.65,6.1,1.8],[-.6,6.6,1.1],[1.6,7.7,.4],[-4.8,5.7,1.1],[4.8,3.4,1.6],[-4.05,9.6,-.5],[-1.5,10.9,-.65],[1.35,9.1,-1],[-1.2,4.3,2.1],[2.8,3.8,2.1],[-3.2,7.8,-1.25]];
 const dripGeo=new T.SphereGeometry(1,10,8),neckGeo=new T.CylinderGeometry(1,1,1,8,4),drips=anchors.map((anchor,i)=>{const neck=new T.Mesh(neckGeo,material),drop=new T.Mesh(dripGeo,material);root.add(neck,drop);drop.castShadow=true;neck.castShadow=true;return {anchor,neck,drop,seed:i*.137};});
 const bubbles=[[-3,.9],[2.6,1.4],[.4,-1.8]].map((p,i)=>{const dome=new T.Mesh(new T.SphereGeometry(1,16,10),material),ripple=new T.Mesh(new T.TorusGeometry(1,.015,5,40),material);ripple.rotation.x=-Math.PI/2;root.add(dome,ripple);return {dome,ripple,p,seed:i*.31};});
 const curls=[-1,1,2.5].map((angle,i)=>{const points=Array.from({length:25},(_,j)=>new T.Vector3(j/24,0,0));const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.07,7,false),material);root.add(mesh);return {mesh,angle,seed:i*.8};});
 function pose(t){
  const story=t;t=meltClock(t);
  const amount=smooth(10,29,t),spread=mix(.045,1,amount),a=geo.attributes.position;root.visible=t>8.3;
  for(let r=0;r<=rings;r++)for(let j=0;j<=segments;j++){const radius=r/rings,angle=j/segments*Math.PI*2,edge=1+.055*Math.sin(angle*3+.3)+.035*Math.sin(angle*7);const x=Math.cos(angle)*7.8*radius*edge*spread,z=Math.sin(angle)*5.6*radius*edge*spread;const wave=Math.sin(radius*27-t*2.1+Math.sin(angle*3)*radius)*.09*amount*(1-radius);const spiral=Math.sin(angle*3-radius*18+story*.65)*.065*amount*Math.sin(radius*Math.PI);const swell=Math.sin(radius*14-story*.9)*.045*amount*(1-radius);const y=.045+spiral+swell+Math.pow(1-radius*radius,1.5)*(.13+.12*amount)+wave;a.setXYZ(r*(segments+1)+j,x,y,z);}
  a.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();pool.visible=t>10;
  drips.forEach(({anchor,neck,drop,seed},i)=>{const appear=smooth(8.5+i*.18,11.5+i*.18,t)*(1-smooth(24,28,t));const point=deform(...anchor,story);const age=Math.max(0,t-9-i*.18),phase=(age*.22+seed)%1;const bottom=mix(point[1],.16,phase**1.6),r=(.055+phase*.085)*appear;drop.visible=neck.visible=appear>.01&&point[1]>.25;drop.position.set(point[0],bottom,point[2]);drop.scale.set(r,r*(1.6-phase*.5),r);neck.position.set(point[0],(bottom+point[1])*.5,point[2]);neck.scale.set(r*.42,Math.max(.01,point[1]-bottom),r*.42);});
  curls.forEach(({mesh,angle,seed})=>{const life=smooth(16,21,story)*(1-smooth(29,34,story)),points=[];mesh.visible=life>.005;if(!mesh.visible)return;for(let j=0;j<=24;j++){const q=j/24,a=angle+q*2.4+story*.08,r=2.3+Math.sin(q*Math.PI)*.55;points.push(new T.Vector3(Math.cos(a)*r,.25+Math.sin(q*Math.PI)*(.5+.25*Math.sin(story*.8+seed))*life,Math.sin(a)*r));}const next=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.065*life+.015,7,false);mesh.geometry.dispose();mesh.geometry=next;});
  bubbles.forEach(({dome,ripple,p,seed})=>{const q=((t-23)*.23+seed)%1,active=t>23;const grow=clamp(q/.72),size=.3*Math.sin(grow*Math.PI*.5)*(1-smooth(.72,.9,q));dome.visible=active&&size>.005;dome.position.set(p[0],.2,p[1]);dome.scale.set(size,size*.7,size);ripple.visible=active&&q>.72;ripple.position.set(p[0],.235,p[1]);const radius=.3+(q-.72)*3;ripple.scale.setScalar(radius);});
 }
 return {root,pool,drips,pose,material};
}
