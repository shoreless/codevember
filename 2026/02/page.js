import * as T from '../../assets/vendor/three.module.min.js';
import {createShards} from './fracture.js';
import {smooth} from './story.js';
export function makePage(scene){
 const root=new T.Group();scene.add(root);let shards=[],texture=null,material=null,w=1,h=1;
 function resize(width,height,camera){
  w=width;h=height;
  for(const s of shards)s.mesh.geometry.dispose();root.clear();texture?.dispose();material?.dispose();
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.fillStyle='#eee5d3';c.fillRect(0,0,w,h);c.strokeStyle='#c1ae8855';c.strokeRect(12,12,w-24,h-24);c.strokeRect(17,17,w-34,h-34);
  c.fillStyle='#173b3b';c.font=`italic ${w<600?18:21}px Georgia`;c.fillText('↖ Codevember',w*.05,42);c.font='12px "Courier New"';c.textAlign='right';c.fillText('02',w*.95,40);
  c.beginPath();c.moveTo(w*.05,65);c.lineTo(w*.95,65);c.stroke();c.textAlign='center';c.font=`italic ${Math.min(w*.13,70)}px Georgia`;c.fillText('Shatter',w*.5,h*.2);c.font='12px "Courier New"';c.fillStyle='#6c765f';c.fillText('Tap the egg',w*.5,h*.79);
  texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});
  const planeH=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*9,planeW=planeH*camera.aspect;
  shards=createShards(w,h,{x:w*.5,y:h*.53}).map((shard,i)=>{
   const pos=[],uv=[];for(const p of shard.vertices){pos.push((p.x/w-.5)*planeW,(.5-p.y/h)*planeH+2.5,0);uv.push(p.x/w,1-p.y/h);}
   const center=new T.Vector3((shard.cx/w-.5)*planeW,(.5-shard.cy/h)*planeH+2.5,0);
   for(let k=0;k<pos.length;k+=3){pos[k]-=center.x;pos[k+1]-=center.y;}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.position.copy(center);root.add(mesh);
   return {mesh,center,shard,i};
  });
 }
 function pose(t){root.visible=t<18;for(const s of shards){const delay=s.shard.distance/Math.hypot(w,h);const fracture=smooth(10+delay,12.4+delay,t);const fall=smooth(12.3+delay,16.5+delay,t);s.mesh.position.copy(s.center);s.mesh.position.x+=Math.cos(s.shard.angle)*(fracture*.025+fall*13);s.mesh.position.y+=Math.sin(s.shard.angle)*fracture*.02-fall*fall*16;s.mesh.position.z=fracture*.035+Math.sin(fall*Math.PI)*2;s.mesh.rotation.set(fall*s.shard.rx,fall*s.shard.ry,fall*s.shard.rz);}}
 return {resize,pose,root};
}
