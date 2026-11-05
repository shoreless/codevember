import * as T from '../../assets/vendor/three.module.min.js';
export const mat=(color,roughness=.65,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
export const sphereGeo=new T.SphereGeometry(1,10,6);
const stickGeo=new T.CylinderGeometry(1,1,1,8);
export function ball(parent,material,p,s){const m=new T.Mesh(sphereGeo,material);m.position.set(...p);m.scale.set(...s);m.castShadow=true;parent.add(m);return m;}
export function stick(parent,material,a,b,r=.04){const m=new T.Mesh(stickGeo,material);parent.add(m);m.castShadow=true;between(m,a,b,r);return m;}
export function between(m,a,b,r){const av=a.isVector3?a:new T.Vector3(...a),bv=b.isVector3?b:new T.Vector3(...b);m.position.copy(av).add(bv).multiplyScalar(.5);const d=bv.clone().sub(av);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}
export function tube(parent,points,r,material,segments=24){const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,6,false),material);mesh.castShadow=true;parent.add(mesh);return mesh;}
const white=mat('#fff9df'),black=mat('#291d29'),flesh=mat('#f7bd41'),limb=mat('#87364e');
export function potato(index){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const skin=mat(index?'#ab2858':'#d33a61',.75);
 const profile=[[0,.15],[.15,.15],[.23,.27],[.23,.41],[.19,.61],[.12,.83],[.05,1.02],[0,1.12]];
 const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),18);
 const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setX(i,pos.getX(i)+.075*pos.getY(i)**3);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,skin);body.add(mesh);mesh.castShadow=true;
 const eyes=[];
 for(const x of [-.108,.108]){const eye=new T.Group();eye.position.set(x,.54,.19);body.add(eye);ball(eye,white,[0,0,0],[.117,.13,.055]);ball(eye,black,[.015,-.005,.047],[.067,.082,.026]);ball(eye,white,[.035,.032,.069],[.018,.023,.01]);eyes.push(eye);}
 ball(body,flesh,[0,.31,.22],[.174,.08,.024]);
 tube(body,Array.from({length:9},(_,i)=>{const a=Math.PI+i/8*Math.PI;return [Math.cos(a)*.055,.34+Math.sin(a)*.035,.25];}),.009,black,12);
 const hands=[],arms=[],legs=[];
 for(const sign of [-1,1]){hands.push(ball(root,limb,[sign*.36,.47,.07],[.055,.055,.05]));arms.push(stick(root,limb,[sign*.2,.49,0],[sign*.36,.47,.07],.033));const leg=new T.Group();leg.position.set(sign*.105,.13,0);root.add(leg);stick(leg,limb,[0,0,0],[0,-.1,.03],.033);ball(leg,limb,[0,-.09,.06],[.07,.045,.12]);legs.push(leg);}
 const snack=ball(root,mat(index?'#6b3822':'#efb6b1'),[.35,.4,.1],[.105,.08,.09]);snack.visible=false;
 const sugar=new T.Group();root.add(sugar);tube(sugar,Array.from({length:16},(_,i)=>{const a=i*.24;return [Math.cos(a)*(.1-i*.004),i*.014,Math.sin(a)*(.1-i*.004)];}),.017,mat('#edbb54',.2,{metalness:.25}),20);sugar.visible=false;
 function setHand(i,p){hands[i].position.copy(p.isVector3?p:new T.Vector3(...p));between(arms[i],[i? .2:-.2,.49,0],hands[i].position,.033);}
 return {root,body,eyes,hands,legs,snack,sugar,setHand};
}
export function mushroom(parent,x,z,size=1,color='#e9b1b4'){
 const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(size);parent.add(root);
 const stem=mat('#f3dfb0'),icing=mat('#fff3d0'),capMat=mat(color,.43);
 ball(root,stem,[.04,.63,0],[.22,.68,.22]);
 const profile=[[0,1.23],[.35,1.24],[.78,1.3],[.93,1.44],[.88,1.56],[.66,1.83],[.36,2.02],[0,2.09]];
 const whole=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),20);
 const bitten=whole.clone(),p=bitten.attributes.position;
 for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i);const d=Math.hypot(xx-.68,(yy-1.5)*.8,zz-.4);if(d<.46){p.setXYZ(i,xx-(.46-d)*.65,yy-(.46-d)*.35,zz-(.46-d)*.7);}}bitten.computeVertexNormals();
 const cap=new T.Mesh(whole,capMat);root.add(cap);cap.castShadow=true;cap.receiveShadow=true;
 const rim=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;rim.push([Math.cos(a)*.87,1.4+Math.sin(a*12)*.025,Math.sin(a)*.87]);}tube(root,rim,.035,icing,48);
 for(let i=0;i<7;i++){const a=i*2.4,r=.24+(i%3)*.17;ball(root,icing,[Math.cos(a)*r,2.04-r*.48,Math.sin(a)*r],[.07,.023,.065]);}
 return {root,cap,whole,bitten};
}
export function fern(parent,x,z,size=1){
 const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(size);parent.add(root);
 const sugar=mat('#d9a84a',.22,{metalness:.3,transparent:true,opacity:.87});
 const fronds=[];
 for(let j=0;j<5;j++){const g=new T.Group();g.rotation.y=j*1.25;root.add(g);const points=Array.from({length:19},(_,i)=>{const t=i/18,a=t*Math.PI*1.65;return [Math.sin(a)*(.18+t*.17),t*1.32,0];});tube(g,points,.025,sugar,24);
 for(let k=3;k<15;k+=3){const [cx,cy]=points[k];for(const sign of [-1,1])ball(g,sugar,[cx+sign*.105,cy+.05,0],[.13,.035,.028]);}fronds.push(g);}
 return {root,fronds};
}
export function chocolateTree(parent,x,z,size=1){
 const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(size);parent.add(root);
 const chocolate=mat('#573020',.35),praline=mat('#d7aa71'),mint=mat('#7b9858',.72);
 stick(root,chocolate,[0,0,0],[.12,2.9,0],.23);
 const end=new T.Vector3(-.9,1.35,.25);stick(root,chocolate,[.06,1.1,0],end,.13);
 const section=ball(root,praline,end.toArray(),[.104,.022,.104]);section.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-.96,.25,.25).normalize());
 for(let i=0;i<4;i++){const a=i*2.4;ball(root,mint,[Math.cos(a)*.48,2.7+(i%2)*.55,Math.sin(a)*.45],[.74,.8,.67]);}
 // Raised chocolate seams and a pale cut end identify confectionery bark.
 for(let j=0;j<3;j++)tube(root,[[Math.sin(j*2)*.2,.2,Math.cos(j*2)*.2],[Math.sin(j*2)*.23,1.2,Math.cos(j*2)*.23],[.12+Math.sin(j*2)*.18,2.7,Math.cos(j*2)*.18]],.025,praline,12);
 return root;
}
