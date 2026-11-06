import * as T from '../../assets/vendor/three.module.min.js';
import {smooth,mix,clamp} from './growth.js';
const V=p=>new T.Vector3(...p);
const material=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
function merge(geometries){const p=[],indices=[];let offset=0;for(const g of geometries){p.push(...g.attributes.position.array);if(g.index)for(const i of g.index.array)indices.push(i+offset);else for(let i=0;i<g.attributes.position.count;i++)indices.push(i+offset);offset+=g.attributes.position.count;g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;}
const tube=(points,r=.01,segments=14,sides=5)=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:V(p))),segments,r,sides,false);
// A leaf with a true heart-shaped outline, a basal cleft, and a pointed tip.
function leafSurface(){const rings=7,sides=40,p=[],indices=[];for(let r=0;r<=rings;r++)for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,q=r/rings,x=Math.pow(Math.sin(a),3)*.81*q,outline=(5-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)))/22*1.7,y=mix(.65,outline,q);p.push(x,y,leafZ(x,y)+Math.sin(a*7)*.018*q*q);}for(let r=0;r<rings;r++)for(let j=0;j<sides;j++){const a=r*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;}
function leafZ(x,y){return .12*(1-(x/.9)**2)*Math.sin((y+.3)/2.1*Math.PI)+.04*Math.sin(y*3);}
function veinSurface(){
 const paths=[],outline=Array.from({length:201},(_,i)=>{const a=i/200*Math.PI*2;return [Math.sin(a)**3*.81,(5-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)))/22*1.7];});
 const widthAt=y=>{let width=0;for(let i=1;i<outline.length;i++){const [x0,y0]=outline[i-1],[x1,y1]=outline[i];if((y0<=y&&y1>=y)||(y1<=y&&y0>=y)){if(Math.abs(y1-y0)>.00001)width=Math.max(width,Math.abs(mix(x0,x1,(y-y0)/(y1-y0))));}}return width;};
 const line=points=>paths.push(tube(points.map(([x,y])=>[x,y,leafZ(x,y)+.009]),.0055,8,4));line([[0,0],[0,.45],[0,1],[0,1.61]]);
 for(const [start,end]of [[.08,.02],[.25,.36],[.57,.77],[.93,1.17]])for(const sign of [-1,1]){const w=widthAt(end)*.85;line([[0,start],[sign*w*.48,(start+end)/2],[sign*w,end]]);}return merge(paths);
}
function growingTube(parent,curve,radius,mat,segments=90){const geometry=new T.BufferGeometry(),positions=new Float32Array((segments+1)*8*3),indices=[];for(let j=0;j<segments;j++)for(let k=0;k<7;k++){const a=j*8+k,b=a+8;indices.push(a,b,a+1,a+1,b,b+1);}geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setIndex(indices);const mesh=new T.Mesh(geometry,mat);mesh.castShadow=true;parent.add(mesh);const z=new T.Vector3(0,0,1),x=new T.Vector3(1,0,0);function pose(progress){mesh.visible=progress>.002;if(!mesh.visible)return;const a=geometry.attributes.position;for(let j=0;j<=segments;j++){const u=j/segments*progress,center=curve.getPoint(u),tangent=curve.getTangent(u).normalize(),side=new T.Vector3().crossVectors(tangent,Math.abs(tangent.z)>.95?x:z).normalize(),up=new T.Vector3().crossVectors(side,tangent).normalize(),r=radius*(1-.78*(j/segments)**5)*Math.min(1,progress*7);for(let k=0;k<=7;k++){const angle=k/7*Math.PI*2,v=center.clone().addScaledVector(side,Math.cos(angle)*r).addScaledVector(up,Math.sin(angle)*r);a.setXYZ(j*8+k,v.x,v.y,v.z);}}a.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();}return {mesh,pose,curve};}
export function makePlant(scene,{nameTexture=null}={}){
 const root=new T.Group();scene.add(root);const white=material('#eee9db',.32),soil=material('#30291c'),wood=material('#ac8050',.62),woodDark=material('#89613c'),stem=material('#596535'),stemRed=material('#765640'),black=material('#262d28',.5),twine=material('#c7b68f');
 const add=(g,m,p=[0,0,0],s=[1,1,1])=>{const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
 // Ricardo Junior's white ribbed pot, saucer, and a small wooden stool.
 add(new T.CylinderGeometry(2.12,2.16,.14,64),wood,[0,.02,0]);
 for(const angle of [0,2.1,4.2]){const a=[Math.cos(angle)*1.35,-.06,Math.sin(angle)*1.35],b=[Math.cos(angle)*1.75,-1.9,Math.sin(angle)*1.75],d=V(a).sub(V(b)),o=add(new T.CylinderGeometry(.09,.12,d.length(),10),woodDark,V(a).add(V(b)).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}
 const grain=[];for(let i=-8;i<=8;i++){const z=i*.22,x=Math.sqrt(Math.max(0,4.1-z*z));grain.push(tube([[-x,.096,z],[-.4,.096,z+.025],[x,.096,z]],.006,8,3));}add(merge(grain),woodDark);
 add(new T.CylinderGeometry(1.04,1.09,.09,48),white,[0,.17,0]);
 const profile=[[.68,.23],[.74,.25],[.76,.35],[.84,.51],[.82,.57],[.88,.74],[.86,.81],[.94,1.0],[.92,1.06],[1.0,1.29],[1.01,1.48],[.96,1.52],[.91,1.46],[.88,1.30]].map(p=>new T.Vector2(...p));add(new T.LatheGeometry(profile,48),white);
 add(new T.CylinderGeometry(.91,.9,.06,40),soil,[0,1.31,0]);
 const crumbGeo=new T.IcosahedronGeometry(1,0),crumbMat=[soil,material('#675538'),material('#a29470')];for(let i=0;i<48;i++){const a=i*2.399,r=.83*Math.sqrt((i+.5)/48),o=add(crumbGeo,crumbMat[i%3],[Math.cos(a)*r,1.36+(i%3)*.008,Math.sin(a)*r],[.035+(i%4)*.013,.025,.035]);o.rotation.y=i;}
 // Exposed, lumpy purple tuber. Its top stays visible beneath the mature vines.
 const tuberGeo=new T.SphereGeometry(1,32,20),a=tuberGeo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),bulge=1+.07*Math.sin(x*8+y*4)*Math.sin(z*6);a.setXYZ(i,x*.84*bulge,y*.43*bulge,z*.34*bulge);}tuberGeo.computeVertexNormals();const potato=add(tuberGeo,material('#865044',.84),[0,1.52,.12]);potato.rotation.set(.13,0,-.13);
 const budMat=material('#b79662');for(const [x,y,z]of [[-.55,1.83,.25],[.22,1.92,.1],[.67,1.71,.35],[-.65,1.67,.24]])add(new T.SphereGeometry(.045,8,6),budMat,[x,y,z],[1,.5,1]);
 // Black stake and two little jute ties, matching the photograph.
 const stakeMat=black.clone();stakeMat.transparent=true;const stake=add(new T.CylinderGeometry(.032,.037,10.1,10),stakeMat,[.17,6.37,-.2]);
 const ties=[];for(const y of [4.2,6.6]){const points=[];for(let i=0;i<=40;i++){const t=i/40*Math.PI*2;points.push([.17+.18*Math.cos(t),y+.07*Math.sin(t*2),-.2+.16*Math.sin(t)]);}points.push([.43,y+.13,.03],[.66,y+.26,.08],[.5,y+.03,.08],[.24,y,.02]);const tie=growingTube(root,new T.CatmullRomCurve3(points.map(V)),.018,twine,55);ties.push({tie,y});}
 if(nameTexture){const m=new T.MeshBasicMaterial({map:nameTexture,transparent:true,side:T.DoubleSide});const tag=add(new T.PlaneGeometry(1.22,.3),m,[0,.91,.97]);tag.renderOrder=1;}
 const definitions=[
 {start:2,end:30,r:.043,mat:stemRed,points:[[.22,1.92,.1],[.28,2.55,.08],[.03,3.25,.12],[-.2,3.8,.06],[-.04,4.55,-.05],[.23,5.4,-.04],[.12,6.0,-.1],[-.11,6.6,.05],[.12,7.25,.05],[.29,7.9,-.18],[-.16,8.45,-.22],[-.4,9.05,.05],[-.26,9.6,.2],[.12,9.9,.16],[.08,10.5,-.08],[-.18,10.92,.05]]},
 {start:7,end:22,r:.035,mat:stem,points:[[-.55,1.83,.25],[-1,2,.32],[-1.58,1.85,.57],[-2.1,1.3,.74],[-2.75,1.5,.65],[-3.02,2.05,.33],[-2.65,2.6,.15],[-1.96,2.72,.22],[-1.5,2.32,.47],[-2.0,2.0,.74]]},
 {start:11,end:34,r:.032,mat:stem,points:[[.22,1.92,.1],[.75,2.8,-.25],[1.05,3.65,-.15],[.65,4.6,.1],[.13,5.4,.08],[.45,6.25,-.35],[.7,7.2,-.4],[1.03,7.9,-.15],[.5,8.5,.22],[-.04,9.0,.35],[.38,9.5,-.07],[.72,10.08,-.18],[.14,10.7,.22],[-.52,10.3,.43],[-.72,9.9,.4]]}
 ];
 const leafBase=leafSurface(),veinBase=veinSurface(),leaves=[],vines=definitions.map(def=>({...def,...growingTube(root,new T.CatmullRomCurve3(def.points.map(V),false,'catmullrom',.35),def.r,def.mat)}));
 const greens=['#66812d','#779b32','#4e742c','#92a638'],greenMats=greens.map(c=>{const m=material(c,.8);m.side=T.DoubleSide;return m;}),veinMat=material('#8c9b48'),dry=material('#a17a3f'),dryVein=material('#c5a15d');dry.side=T.DoubleSide;
 for(let branch=0;branch<vines.length;branch++){
  const positions=branch===0?[.08,.16,.25,.36,.43,.56,.65,.72,.78,.84,.90,.96]:branch===1?[.12,.24,.38,.52,.66,.79,.9]:[.19,.34,.49,.61,.70,.78,.85,.92,.97];
  positions.forEach((u,i)=>{const vine=vines[branch],node=vine.curve.getPoint(u),side=(i%2?1:-1),length=branch===1?.38:.38+(i%3)*.12,end=node.clone().add(new T.Vector3(side*length,.1+(i%3)*.08,.25));const petiole=growingTube(root,new T.CatmullRomCurve3([node,node.clone().lerp(end,.5).add(new T.Vector3(0,.1,0)),end]),.018,stem,12);const group=new T.Group();root.add(group);group.position.copy(end);group.rotation.set(-.3+(i%3)*.2,side*.3,-side*(1.4+(i%4)*.25));const lamina=new T.Mesh(leafBase.clone(),greenMats[(i+branch)%4]),veins=new T.Mesh(veinBase.clone(),veinMat);lamina.castShadow=lamina.receiveShadow=true;group.add(lamina,veins);const size=branch===1?.65+(i%3)*.11:.65+(i%4)*.1;const withered=branch===0&&(i===3||i===4);leaves.push({branch,u,node,end,petiole,group,lamina,veins,size,withered,baseRotation:group.rotation.clone(),parts:[lamina,veins].map(mesh=>({mesh,original:new Float32Array(mesh.geometry.attributes.position.array)}))});});
 }
 leafBase.dispose();veinBase.dispose();
 function pose(t){stakeMat.opacity=smooth(9,12,t);stake.visible=stakeMat.opacity>.001;
  const progress=vines.map(v=>smooth(v.start,v.end,t));vines.forEach((v,i)=>v.pose(progress[i]));
  ties.forEach(({tie,y})=>tie.pose(smooth(y===4.2?16:23,y===4.2?18:25,t)));
  for(const l of leaves){const age=smooth(l.u,Math.min(1,l.u+.16),progress[l.branch]);l.group.visible=age>.005;const petioleGrowth=smooth(l.u-.035,Math.min(1,l.u+.05),progress[l.branch]);l.petiole.pose(petioleGrowth);l.group.position.copy(l.petiole.curve.getPoint(petioleGrowth));if(!l.group.visible)continue;const open=smooth(.12,.88,age),wilt=l.withered?smooth(27,36,t):0;l.group.scale.setScalar(l.size*mix(.055,1,age)*(1-wilt*.22));l.group.rotation.copy(l.baseRotation);l.group.rotation.x+=Math.sin(t*.7+l.u*13)*.04*age+wilt*.8;l.group.rotation.z+=wilt*.3;l.lamina.material=wilt>.45?dry:greenMats[(Math.round(l.u*40)+l.branch)%4];l.veins.material=wilt>.45?dryVein:veinMat;for(const p of l.parts){const a=p.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const n=i*3,x=p.original[n],y=p.original[n+1],z=p.original[n+2];a.setXYZ(i,x*mix(.12,1,open)*(1-wilt*.2),y,z+Math.abs(x)*(1-open)*1.5+(1-open)*.35*y*y+wilt*.25*y*y);}a.needsUpdate=true;p.mesh.geometry.computeVertexNormals();p.mesh.geometry.computeBoundingSphere();}}
 }
 return {root,potato,stake,vines,leaves,pose};
}
