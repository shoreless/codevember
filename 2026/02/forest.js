import {batchScenery} from './batch.js';
import * as T from '../../assets/vendor/three.module.min.js';
import {mat,ball,stick,tube,mushroom,fern,chocolateTree} from './models.js';
import {randomSource} from './fracture.js';
export function makeForest(scene,{batch=true}={}){
 const root=new T.Group();scene.add(root);const rand=randomSource(91);
 const moss=mat('#6d8050'),crumb=mat('#ba9670'),choc=mat('#4f2e25'),sugar=mat('#f1d9a2');
 const floor=new T.Mesh(new T.PlaneGeometry(80,70),moss);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.04,-37.5);floor.userData.ground=-2;floor.receiveShadow=true;root.add(floor);
 const pts=[],uv=[],ids=[];
 for(let i=0;i<=40;i++){const z=-1.5-i*.85,center=Math.sin(i*.22)*.24,w=i>25?2.3:1.3;pts.push(center-w,.005,z,center+w,.005,z);uv.push(0,i,1,i);if(i<40){const n=i*2;ids.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const path=new T.BufferGeometry();path.setAttribute('position',new T.Float32BufferAttribute(pts,3));path.setAttribute('uv',new T.Float32BufferAttribute(uv,2));path.setIndex(ids);path.computeVertexNormals();const trail=new T.Mesh(path,crumb);trail.userData.ground=-1;trail.receiveShadow=true;root.add(trail);
 const palette=['#e7babd','#c7d7a0','#e4cd93','#b6cbbd'];
 for(let i=0;i<25;i++){const sign=i%2?1:-1,x=sign*(2.7+rand()*3.8),z=-2-rand()*32;mushroom(root,x,z,1+rand()*1.25,palette[i%4]);}
 for(let i=0;i<9;i++){const sign=i%2?1:-1;chocolateTree(root,sign*(4+rand()*3),-4-rand()*32,1+rand()*.65);}
 for(let i=0;i<12;i++)fern(root,(i%2?1:-1)*(1.7+rand()*2),-2-rand()*29,.4+rand()*.65);
 for(let i=0;i<75;i++){const x=(rand()-.5)*11,z=-rand()*33;ball(root,i%3?crumb:sugar,[x,.035,z],[.035+rand()*.045,.025,.03]);}
 mushroom(root,-1.3,-30,1.8,'#c9d9ab');mushroom(root,2.5,-32,2.1,'#e3b5bd');chocolateTree(root,-3,-31,1.6);chocolateTree(root,2,-35,1.9);fern(root,.6,-27,1.0);
 const snackMushroom=mushroom(root,-1.48,-7.1,.67,'#efb5b5');
 const snackFern=fern(root,1.42,-12.1,.95);
 chocolateTree(root,2.15,-16.5,.95);
 const log=new T.Group();log.position.set(0,.36,-23);root.add(log);
 const biscuit=mat('#bd864c'),cream=mat('#f1d7a4');stick(log,biscuit,[-1.7,0,0],[1.7,0,0],.34);
 for(const sign of [-1,1]){for(let j=0;j<3;j++){const ring=new T.Mesh(new T.TorusGeometry(.1+j*.08,.017,6,20),j%2?choc:cream);ring.rotation.y=Math.PI/2;ring.position.x=sign*1.71;log.add(ring);}}
 for(let j=0;j<14;j++){const x=-1.5+j*.23;ball(log,choc,[x,.32,.02],[.025,.012,.025]);ball(log,choc,[x,.16,.29],[.025,.025,.012]);}
 const stretch=stick(root,mat('#efb5b5'),[0,0,0],[0,1,0],.035);stretch.visible=false;
 const sugarCrumbs=[];for(let i=0;i<14;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.035,0),mat('#efca73',.2,{metalness:.35}));root.add(m);sugarCrumbs.push({mesh:m,angle:rand()*6.28,speed:.4+rand(),seed:rand()});}
 const spores=[];const sporeMat=new T.MeshBasicMaterial({color:'#e3bd72',transparent:true,opacity:.6});
 for(let i=0;i<34;i++){const m=ball(root,sporeMat,[(rand()-.5)*11,.5+rand()*4,-3-rand()*29],[.018,.018,.018]);spores.push({mesh:m,base:m.position.clone(),seed:rand()*6});}
 if(batch)batchScenery(root,new Set([snackMushroom.root,snackFern.root,stretch,...sugarCrumbs.map(o=>o.mesh),...spores.map(o=>o.mesh)]));
 return {root,snackMushroom,snackFern,stretch,sugarCrumbs,spores};
}
