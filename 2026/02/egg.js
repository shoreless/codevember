import * as T from '../../assets/vendor/three.module.min.js';
import {smooth,mix} from './story.js';
export function makeEgg(scene,environment){
 const root=new T.Group();root.position.set(0,2.3,.65);scene.add(root);
 const gold=new T.MeshPhysicalMaterial({color:'#e8ae35',metalness:.9,roughness:.25,clearcoat:.35,side:T.DoubleSide,envMap:environment,envMapIntensity:1.3});
 const crackMat=new T.MeshBasicMaterial({color:'#ffdd8b',side:T.DoubleSide});const pieces=[],cracks=[];

 // Boundary jitter is shared by neighbouring sectors to keep the egg sealed.
 function vertex(sector,row,col){const phi=.015+(Math.PI-.03)*row/20,y=Math.cos(phi),theta=(sector+col/8)/8*Math.PI*2+Math.sin(row*1.9)*.035*Math.sin(phi),r=Math.sin(phi)*.87*(1-.21*y);return new T.Vector3(r*Math.cos(theta),1.3*y,r*Math.sin(theta));}
 for(let s=0;s<8;s++){
  const pos=[],ids=[],center=new T.Vector3();for(let r=0;r<=20;r++)for(let col=0;col<=8;col++){const p=vertex(s,r,col);pos.push(...p.toArray());center.add(p);}center.multiplyScalar(1/189);
  for(let i=0;i<pos.length;i+=3){pos[i]-=center.x;pos[i+1]-=center.y;pos[i+2]-=center.z;}
  for(let r=0;r<20;r++)for(let col=0;col<8;col++){const a=r*9+col,b=a+9;ids.push(a,a+1,b,a+1,b+1,b);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ids);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,gold);mesh.position.copy(center);mesh.castShadow=true;root.add(mesh);pieces.push({mesh,center,angle:(s+.5)/8*Math.PI*2});
  const seamPts=[];for(let r=0;r<=20;r++)seamPts.push(vertex(s,r,0).multiplyScalar(1.004));
  const curve=new T.CatmullRomCurve3(seamPts);const seam=new T.Mesh(new T.TubeGeometry(curve,32,.009,4,false),crackMat);root.add(seam);cracks.push(seam);
 }
 const light=new T.PointLight('#ffca67',0,6,2);root.add(light);
 function pose(t){
  const open=smooth(8.5,15,t);root.visible=t<17;root.rotation.z=Math.sin(t*7)*.009*smooth(1,5,t)*(1-open);
  pieces.forEach(({mesh,center,angle},i)=>{const separation=.045*smooth(3+i*.23,9,t)+open*3;mesh.position.copy(center).add(new T.Vector3(Math.cos(angle)*separation,-open*1.8+Math.sin(angle)*open*.6,Math.sin(angle)*separation));mesh.rotation.set(open*(i%2?.75:-.7),open*(i%2?-.55:.55),-Math.cos(angle)*open*1.1);});
  cracks.forEach((mesh,i)=>{const progress=smooth(.8+i*.5,5.8+i*.3,t);mesh.visible=t<9.7&&progress>0;mesh.geometry.setDrawRange(0,Math.floor(mesh.geometry.index.count*progress/3)*3);});
  light.intensity=smooth(2,8,t)*5*(1-smooth(12,16,t));
 }
 return {root,pose};
}
