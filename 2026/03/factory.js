import * as T from '../../assets/vendor/three.module.min.js';
import {deform,smooth,mix,meltClock} from './deformation.js?v=2-visitor';
const vec=p=>new T.Vector3(...p);
export function makeFactory(scene,{signTexture=null}={}){
 const source=new T.Group(),root=new T.Group();scene.add(root);
 const material=(color,roughness=.85,metalness=0)=>new T.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:0});
 const concrete=material('#74796d'),concreteDark=material('#4f5851'),metal=material('#58625b',.5,.65),rust=material('#7b5641',.7,.35),black=material('#242f2c',.8,.2),ochre=material('#9f9165',.7),light=new T.MeshBasicMaterial({color:'#c6c88e'}),unlit=material('#39443c');
 const materials=[concrete,concreteDark,metal,rust,black,ochre,light,unlit];
 const box=(m,p,s,segments=[1,1,1])=>{const o=new T.Mesh(new T.BoxGeometry(...s,...segments),m);o.position.set(...p);source.add(o);return o;};
 const cylinder=(m,a,b,r,segments=12)=>{const d=vec(b).sub(vec(a));const o=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),segments,Math.max(1,Math.ceil(d.length()*2))),m);o.position.copy(vec(a).add(vec(b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());source.add(o);return o;};
 const pipe=(points,r=.25,m=metal)=>{const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(vec),false,'catmullrom',.15),40,r,10,false);const o=new T.Mesh(g,m);source.add(o);return o;};
 const ring=(p,r=.32,m=rust,axis=[0,1,0])=>{const o=new T.Mesh(new T.TorusGeometry(r,.065,5,14),m);o.position.set(...p);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vec(axis).normalize());source.add(o);return o;};
 // A municipal block swallowed by ducts, gantries and redundant equipment.
 box(concrete,[0,3.05,0],[5.7,6.1,3.8],[8,12,5]);
 box(concreteDark,[-4,2.15,-.2],[2.2,4.3,3.1],[4,8,4]);
 box(concreteDark,[4,1.7,.3],[2.2,3.4,3.2],[4,6,4]);
 box(concrete,[.25,6.38,-.4],[3.7,.55,3],[6,2,4]);
 box(black,[0,.1,.2],[11.8,.2,6.8],[12,1,8]);
 for(const x of [-2.9,2.9])box(concreteDark,[x,3.2,0],[.3,6.4,4.1],[1,12,5]);
 // Deep, repetitive windows: mostly dead, some fluorescent and sickly.
 for(let row=0;row<7;row++)for(let col=0;col<8;col++){
  const x=-2.35+col*.67,y=.88+row*.7;
  box(black,[x,y,1.925],[.47,.43,.06],[2,2,1]);
  box((col*3+row*7)%5<2?light:unlit,[x,y,1.97],[.32,.28,.025],[2,2,1]);
 }
 for(let row=0;row<7;row++)for(let col=0;col<5;col++){
  const z=-1.45+col*.65,y=.9+row*.7;
  box(black,[2.92,y,z],[.03,.42,.43]);box((row+col)%4===0?light:unlit,[2.945,y,z],[.02,.27,.28]);
 }
 for(let i=0;i<5;i++)box(concreteDark,[0,.65+i*1.3,2.03],[6,.12,.32],[10,1,1]);
 // Tall stacks with masonry collars and black mouths.
 const stacks=[[-4.05,4.3,-.5,10.1,.53],[-1.5,6.65,-.65,11.45,.42],[1.35,6.65,-1.0,9.6,.6]];
 for(const [x,base,z,top,r]of stacks){cylinder(concreteDark,[x,base,z],[x,top,z],r,16);for(let y=base+.3;y<top;y+=1.15)ring([x,y,z],r+.045,metal);cylinder(black,[x,top-.05,z],[x,top+.06,z],r*.88,16);ring([x,top+.06,z],r,metal);}
 // Oversized invasive plumbing bends around the office rather than serving it.
 pipe([[-5,0,1.1],[-5,5.1,1.1],[-4.8,5.8,1.1],[-3.2,5.8,1.1],[-2.7,5.5,1.1],[-2.7,2.5,2.35],[-1.3,2.5,2.35]],.34);
 pipe([[-3.9,4.5,-1.25],[-3.9,7.6,-1.25],[-3.5,8.05,-1.25],[2.6,8.05,-1.25],[3.2,7.5,-1.25],[3.2,2.1,-1.25]],.42);
 pipe([[-1.8,.2,2.65],[-1.8,1.9,2.65],[-1.2,2.1,2.65],[2.5,2.1,2.65],[3.8,2.8,2.65],[4.8,2.8,2.65],[4.8,.1,2.65]],.17,rust);
 pipe([[1.6,6.6,.4],[1.6,7.35,.4],[2.1,7.7,.4],[4.7,7.7,.4],[5.2,7.2,.4],[5.2,3.3,.4]],.28);
 for(let y=.5;y<5.7;y+=.5)ring([-5,y,1.1],.39,metal);
 for(let x=-3.2;x<2.8;x+=.55)ring([x,8.05,-1.25],.47,rust,[1,0,0]);
 for(let y=3.6;y<7.6;y+=.55)ring([5.2,y,.4],.33,metal);
 // Ventilator and its cage.
 cylinder(black,[0,4.7,2.05],[0,4.7,2.3],1.05,24);ring([0,4.7,2.36],1.05,metal,[0,0,1]);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,o=box(metal,[Math.cos(a)*.47,4.7+Math.sin(a)*.47,2.37],[.95,.17,.08],[3,1,1]);o.rotation.z=a+.45;}
 cylinder(rust,[0,4.7,2.4],[0,4.7,2.48],.18,12);
 for(const x of [-.65,-.32,0,.32,.65])cylinder(metal,[x,4.7-Math.sqrt(1-x*x),2.51],[x,4.7+Math.sqrt(1-x*x),2.51],.025,6);
 // Catwalk, a ladder, and the pointless little door at its base.
 box(metal,[.2,3.12,2.85],[7.8,.12,.75],[14,1,2]);
 for(let x=-3.6;x<4.1;x+=.7)cylinder(rust,[x,3.17,3.2],[x,3.83,3.2],.027,6);
 cylinder(metal,[-3.6,3.83,3.2],[4,3.83,3.2],.035,6);
 for(const x of [-3.6,-3.05])cylinder(metal,[x,.2,2.7],[x,6.25,2.7],.035,6);
 for(let y=.3;y<6.3;y+=.28)cylinder(metal,[-3.6,y,2.7],[-3.05,y,2.7],.024,6);
 box(black,[.1,.65,2.2],[.8,1.25,.13],[2,4,1]);box(light,[.1,1.46,2.3],[.55,.06,.13]);
 const signMat=signTexture?new T.MeshBasicMaterial({map:signTexture,color:'#ffffff',side:T.DoubleSide}):ochre;
 if(signTexture)materials.push(signMat);
 const sign=new T.Mesh(new T.PlaneGeometry(1.65,.38,8,2),signMat);sign.position.set(.2,5.74,2.14);source.add(sign);
 // Bake all transforms before deformation, grouping compatible surfaces.
 source.updateMatrixWorld(true);const buckets=new Map();source.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push(o);});
 const parts=[];
 for(const [material,objects]of buckets){const positions=[],normals=[],uvs=[],indices=[];let offset=0;
  for(const o of objects){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,nm=new T.Matrix3().getNormalMatrix(o.matrixWorld);for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),normal=new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(nm).normalize();positions.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}if(g.index)for(const i of g.index.array)indices.push(offset+i);else for(let i=0;i<p.count;i++)indices.push(offset+i);offset+=p.count;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);parts.push({mesh,original:new Float32Array(positions),base:material.color.clone(),roughness:material.roughness??1,metalness:material.metalness??0});
 }
 source.traverse(o=>{o.geometry?.dispose();});
 const chocolate=new T.Color('#35180f');
 function pose(t){
  const clock=meltClock(t);root.visible=clock<30;if(!root.visible)return;
  for(const part of parts){const {mesh,original,base}=part,a=mesh.geometry.attributes.position;
   for(let i=0;i<a.count;i++){const n=i*3;a.setXYZ(i,...deform(original[n],original[n+1],original[n+2],t));}
   a.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
   const p=smooth(mesh.material===light?7:8,mesh.material===light?14:22,clock);mesh.material.color.copy(base).lerp(chocolate,p);
   if(mesh.material.roughness!==undefined){mesh.material.roughness=mix(part.roughness,.065,p);mesh.material.metalness=mix(part.metalness,.12,p);mesh.material.clearcoat=p;mesh.material.clearcoatRoughness=.035;}
   if(mesh.material.map)mesh.material.opacity=1-smooth(13,20,clock),mesh.material.transparent=true;
  }
 }
 return {root,parts,stacks,pose};
}
