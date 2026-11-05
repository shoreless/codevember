import * as T from '../../assets/vendor/three.module.min.js';
import {smooth,mix} from './deformation.js?v=2-visitor';
// An original storybook visitor. The body and ticket rise through the same
// liquid surface; poses depend only on timeline time, including in reverse.
export function makeVisitor(scene,{ticketTexture=null}={}){
 const root=new T.Group();root.rotation.y=.88;root.position.z=.65;scene.add(root);
 const source=new T.Group(),parts=[];
 const mat=(color,roughness=.65,metalness=0)=>new T.MeshPhysicalMaterial({color,roughness,metalness});
 const skin=mat('#d8ceae',.7),hair=mat('#1d211d',.45),coat=mat('#303a35',.7),lapel=mat('#465046'),black=mat('#101611',.23),sock=mat('#b5afa0'),stripe=mat('#565e4c'),gold=mat('#e9b640',.14,.85),edge=mat('#87621e',.3,.75),shine=new T.MeshBasicMaterial({color:'#f9edd0'});
 const put=(geo,m,p=[0,0,0],s=[1,1,1],head=false)=>{const o=new T.Mesh(geo,m);o.position.set(...p);o.scale.set(...s);o.userData.head=head;source.add(o);return o;};
 const ball=(m,p,s,head=false)=>put(new T.SphereGeometry(1,20,14),m,p,s,head);
 const box=(m,p,s)=>put(new T.BoxGeometry(...s),m,p);
 const limb=(m,a,b,r)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=put(new T.CylinderGeometry(r,r,d.length(),10),m,av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
 // Short striped socks and oversized, politely aligned shoes.
 for(const x of [-.3,.3]){limb(sock,[x,.3,0],[x,1.15,0],.13);for(let y=.43;y<1.1;y+=.17)put(new T.CylinderGeometry(.135,.135,.065,12),stripe,[x,y,0]);ball(black,[x,.22,.14],[.24,.19,.42]);}
 const profile=[[.55,.9],[.62,1.05],[.57,1.45],[.49,2.25],[.46,2.6],[.33,2.75]].map(([r,y])=>new T.Vector2(r,y));put(new T.LatheGeometry(profile,24),coat);
 // Collar, angular lapels, and three tiny brass buttons.
 const left=box(sock,[-.18,2.67,.35],[.28,.25,.09]);left.rotation.z=.45;
 const right=box(sock,[.18,2.67,.35],[.28,.25,.09]);right.rotation.z=-.45;
 for(const side of [-1,1]){const o=box(lapel,[side*.21,2.38,.45],[.22,.58,.07]);o.rotation.z=side*-.3;}
 for(const y of [1.38,1.75,2.12])ball(edge,[0,y,.54],[.055,.055,.035]);
 limb(skin,[0,2.65,0],[0,3.1,0],.18);
 // Large eyes under a crooked fringe; one small highlight in each socket.
 ball(skin,[0,3.6,0],[.7,.81,.6],true);
 put(new T.SphereGeometry(1,24,12,0,Math.PI*2,0,1.48),hair,[0,3.64,-.035],[.73,.83,.64],true);
 for(let i=0;i<7;i++){const x=-.54+i*.18,o=put(new T.ConeGeometry(.15,.43,4),hair,[x,4.01-.13*Math.cos(i),.48],[1,1,.5],true);o.rotation.z=Math.PI+.1*Math.sin(i);}
 for(const side of [-1,1]){ball(skin,[side*.69,3.55,0],[.12,.21,.13],true);ball(lapel,[side*.255,3.58,.541],[.23,.27,.075],true);ball(black,[side*.255,3.6,.585],[.18,.22,.075],true);ball(shine,[side*.255-.045,3.665,.65],[.038,.046,.025],true);}
 ball(skin,[0,3.4,.60],[.095,.12,.08],true);ball(black,[0,3.19,.51],[.052,.075,.025],true);
 // One hand at the side; the other holds the ticket in front of the coat.
 limb(coat,[-.42,2.5,0],[-.72,1.65,.12],.17);ball(skin,[-.73,1.53,.14],[.13,.18,.13]);
 limb(coat,[.43,2.5,0],[.77,2.13,.27],.18);limb(coat,[.77,2.13,.27],[.95,2.7,.57],.15);
 const ticket=new T.Group();ticket.position.set(1.02,2.85,.73);ticket.rotation.z=-.13;source.add(ticket);
 const ticketPart=(g,m,p)=>{const o=new T.Mesh(g,m);o.position.set(...p);ticket.add(o);return o;};
 ticketPart(new T.BoxGeometry(1.65,.83,.045),gold,[0,0,0]);
 for(const y of [-.34,.34])ticketPart(new T.BoxGeometry(1.49,.016,.01),edge,[0,y,.028]);
 for(const x of [-.74,.74])ticketPart(new T.BoxGeometry(.016,.68,.01),edge,[x,0,.028]);
 for(const x of [-.65,.65])for(const y of [-.25,.25]){const star=ticketPart(new T.OctahedronGeometry(.055),edge,[x,y,.04]);star.scale.z=.2;}
 if(ticketTexture)ticketPart(new T.PlaneGeometry(1.28,.48),new T.MeshBasicMaterial({map:ticketTexture,transparent:true}),[0,0,.031]).renderOrder=2;
 ball(skin,[.99,2.47,.8],[.14,.12,.12]);
 // Bake local transforms so geometry can be clipped at the chocolate surface
 // in both WebGL and the software renderer, without any shader-only trick.
 source.updateMatrixWorld(true);source.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),mesh=new T.Mesh(geo,o.material);mesh.castShadow=mesh.receiveShadow=true;mesh.renderOrder=o.renderOrder;root.add(mesh);parts.push({mesh,original:new Float32Array(geo.attributes.position.array),head:o.userData.head===true});});
 source.traverse(o=>o.geometry?.dispose());
 function pose(t){const rise=smooth(22,31,t),lift=mix(-4.5,.23,rise),tilt=-.12-.045*smooth(29,34,t);root.visible=t>22;if(!root.visible)return;root.rotation.y=.88+.035*Math.sin(t*.65)*smooth(25,31,t);for(const part of parts){const a=part.mesh.geometry.attributes.position;let highest=-Infinity;for(let i=0;i<a.count;i++){let [x,y,z]=part.original.slice(i*3,i*3+3);if(part.head){const dy=y-3.1,xx=x;x=xx*Math.cos(tilt)-dy*Math.sin(tilt);y=3.1+xx*Math.sin(tilt)+dy*Math.cos(tilt);}y+=lift;highest=Math.max(highest,y);a.setXYZ(i,x,Math.max(.19,y),z);}part.mesh.visible=highest>.24;a.needsUpdate=true;part.mesh.geometry.computeVertexNormals();part.mesh.geometry.computeBoundingSphere();}}
 return {root,parts,pose};
}
