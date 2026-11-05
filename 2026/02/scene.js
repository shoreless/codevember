import * as T from '../../assets/vendor/three.module.min.js';
import {createRenderer} from './renderer.js';
import {makeEgg} from './egg.js';
import {makePage} from './page.js';
import {makeForest} from './forest.js';
import {potato,between} from './models.js';
import {duration,story,framing,smooth,mix,clamp} from './story.js';
const stage=document.querySelector('#stage'),play=document.querySelector('#play'),replay=document.querySelector('#replay'),timeline=document.querySelector('#timeline'),start=document.querySelector('#start'),status=document.querySelector('#status'),elapsed=document.querySelector('#elapsed');
const renderer=createRenderer();stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene();scene.background=new T.Color('#eee5d3');scene.fog=new T.Fog('#34493a',14,47);
const camera=new T.PerspectiveCamera(43,1,.1,110);camera.position.set(0,2.5,9);camera.lookAt(0,2.5,0);
scene.add(new T.HemisphereLight('#fff1d7','#667a57',2.3));
const sun=new T.DirectionalLight('#ffe2ac',3.3);sun.position.set(-7,12,8);sun.target.position.set(0,0,-15);scene.add(sun,sun.target);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-15,right:15,top:25,bottom:-25,near:.5,far:70});sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.05;
const fill=new T.DirectionalLight('#cbdcd2',1.1);fill.position.set(5,6,-18);scene.add(fill);
let environment=null;
if(!renderer.software){const env=new T.Scene();env.background=new T.Color('#b1a086');for(const [position,size,intensity]of[[[-4,6,3],[4,7],5],[[4,3,-3],[2,6],3],[[0,7,-1],[5,5],2]]){const panel=new T.Mesh(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color('#fff1d1').multiplyScalar(intensity),side:T.DoubleSide}));panel.position.set(...position);panel.lookAt(0,0,0);env.add(panel);}const pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromScene(env,.02).texture;pmrem.dispose();env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
const forest=makeForest(scene,{batch:!renderer.software}),egg=makeEgg(scene,environment),page=makePage(scene);
const guides=[potato(0),potato(1)];guides.forEach(p=>scene.add(p.root));
const shadow=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:'#7e694c',transparent:true,opacity:.12,depthWrite:false}));shadow.position.set(0,.86,.035);shadow.scale.set(1.05,.18,1);scene.add(shadow);
const paperColor=new T.Color('#eee5d3'),forestColor=new T.Color('#34493a');
const motion=matchMedia('(prefers-reduced-motion: reduce)');let time=0,playing=false,raf=0,last=null,aspect=1;
function pose(t){
 const s=story(t);scene.background.copy(paperColor).lerp(forestColor,smooth(11,17,t));scene.fog.color.copy(forestColor);forest.root.visible=t>=10;page.pose(t);egg.pose(t);shadow.visible=t<12;
 const view=framing(s,aspect);camera.position.set(...view.camera);camera.lookAt(...view.look);
 guides.forEach((p,i)=>{
  const sign=i?1:-1;const walkWeight=Math.max(smooth(12,12.7,t)*(1-smooth(19,20,t)),smooth(24.6,25.2,t)*(1-smooth(26.2,27,t)),smooth(30,30.6,t)*(1-smooth(32.2,33,t)),smooth(35,35.7,t)*(1-smooth(38,39,t)));const step=Math.sin(t*12+i*2)*walkWeight;
  p.root.visible=t>=5.5;p.root.scale.setScalar(s.scale*(i?.9:1));p.root.position.set(sign*mix(.28,.7,smooth(11,17,t)),s.guide[1]+Math.abs(step)*.065,s.guide[2]+i*.1);
  p.root.rotation.set(0,mix(sign*-.12,Math.PI+.2*sign,walkWeight),step*.05);p.body.rotation.x=0;p.body.scale.set(1,1,1);
  // A glance and nudge inside the egg, then both turn to lead us away.
  if(t>6&&t<12){p.root.rotation.y=mix(sign*.35,sign*1.2,smooth(7,8,t))*(1-smooth(9,11,t));p.root.position.x+=Math.sin(t*4+i)*.025*smooth(7,8,t);}
  p.legs[0].rotation.x=step*.7+s.sit*.9;p.legs[1].rotation.x=-step*.7+s.sit*.9;
  p.eyes.forEach(e=>e.scale.y=1-.9*Math.max(0,1-Math.abs((t+i*.5)%5-4.8)/.09));
  p.setHand(0,[-.36,.46+step*.06,.08]);p.setHand(1,[.36,.46-step*.06,.08]);p.snack.visible=false;p.sugar.visible=false;
  if(i===0&&t>=20&&t<25.5){
   const reach=smooth(20,21,t),pull=smooth(21.5,23.4,t),eat=smooth(23.4,24.7,t);
   const hand=new T.Vector3(mix(-.36,-.28,reach),mix(.46,.88,reach),mix(.08,-.42,reach));hand.lerp(new T.Vector3(-.04,.35,.35),pull);
   p.setHand(0,hand);p.snack.visible=t>22.3;p.snack.position.copy(hand);p.snack.scale.setScalar(.09*(1-eat)+.002);p.body.scale.y=1+Math.sin(t*22)*.025*eat;
  }
  if(i===1&&t>=27&&t<30.8){const reach=smooth(27,27.8,t),pull=smooth(28.1,29,t),eat=smooth(29,30,t);const hand=new T.Vector3(mix(.36,.58,reach),mix(.46,1.05,reach),mix(.07,-.7,reach)).lerp(new T.Vector3(.03,.35,.35),pull);p.setHand(1,hand);p.sugar.visible=t>=28.1;p.sugar.position.copy(hand);p.sugar.scale.setScalar(1-eat);p.body.scale.y=1+Math.sin(t*22)*.025*eat;}
  if(i===1&&t>=32){p.snack.visible=true;p.snack.position.set(.32,.5,.23);p.snack.scale.set(.1,.08,.14);p.setHand(1,[.32,.5,.23]);if(t>39){const chew=Math.sin(t*2)*.5+.5;p.snack.position.lerp(new T.Vector3(.04,.35,.3),chew*.6);p.setHand(1,p.snack.position);p.body.scale.y=1+Math.sin(t*20)*.015;}}
  if(i===0&&t>=39){p.snack.visible=true;const hand=new T.Vector3(-.25,.45,.15).lerp(new T.Vector3(-.05,.36,.85),s.offer);p.snack.position.copy(hand);p.snack.scale.set(.09,.07,.09);p.setHand(0,hand);p.body.rotation.x=-s.offer*.1;}
 });
 forest.snackMushroom.cap.geometry=t>=23.5?forest.snackMushroom.bitten:forest.snackMushroom.whole;
 forest.snackFern.fronds[0].visible=t<28.1;
 forest.stretch.visible=t>21.5&&t<23.5;
 if(forest.stretch.visible){scene.updateMatrixWorld();const hand=guides[0].hands[0].getWorldPosition(new T.Vector3());between(forest.stretch,[-1.02,1.04,-6.83],hand,.028*(1-.65*s.stretch));}
 const crumbT=t-28.1;forest.sugarCrumbs.forEach(({mesh,angle,speed,seed})=>{mesh.visible=crumbT>0&&crumbT<1.5;if(mesh.visible){mesh.position.set(1.05+Math.cos(angle)*crumbT*speed,1.08+crumbT*.35-crumbT*crumbT*.8,-11.8+Math.sin(angle)*crumbT*speed);mesh.rotation.set(crumbT*2,seed*5,crumbT*3);}});
 forest.spores.forEach(({mesh,base,seed})=>{mesh.position.copy(base);mesh.position.x+=Math.sin(t*.4+seed)*.1;mesh.position.y+=Math.sin(t*.5+seed)*.12;});
 document.body.classList.toggle('inside',t>14);document.body.classList.toggle('crossing',t>10&&t<17);start.hidden=t>0;
 timeline.value=String(t);timeline.style.setProperty('--progress',`${t/duration*100}%`);timeline.setAttribute('aria-valuetext',`${t.toFixed(1)} seconds, ${s.phase}`);elapsed.textContent=`00:${Math.floor(t).toString().padStart(2,'0')}`;
 if(status.textContent!==s.phase)status.textContent=s.phase;
 renderer.render(scene,camera);
}
function buttons(){play.disabled=false;replay.disabled=false;timeline.disabled=false;start.disabled=false;play.textContent=motion.matches?'Next':playing?'Pause':time>=duration?'Replay':'Play';play.setAttribute('aria-label',motion.matches?'Next scene':playing?'Pause animation':time>=duration?'Replay animation':'Play animation');}
function tick(now){raf=0;if(!playing||document.hidden){last=null;return;}const dt=last===null?0:(now-last)/1000;last=now;time=clamp(time+dt,0,duration);pose(time);if(time>=duration){playing=false;buttons();return;}raf=requestAnimationFrame(tick);}
function pause(){playing=false;cancelAnimationFrame(raf);raf=0;last=null;buttons();}
function activate(){
 if(motion.matches){pause();time=[8,16,24.5,30.5,36,46].find(t=>t>time+.05)??0;pose(time);return;}
 if(playing){pause();return;}if(time>=duration)time=0;playing=true;last=null;buttons();raf=requestAnimationFrame(tick);
}
play.addEventListener('click',activate);start.addEventListener('click',activate);
replay.addEventListener('click',()=>{pause();time=0;pose(time);buttons();});
timeline.addEventListener('input',()=>{pause();time=Number(timeline.value);pose(time);buttons();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
motion.addEventListener('change',()=>{pause();buttons();});
function resize(){const r=stage.getBoundingClientRect();aspect=r.width/r.height;camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height);page.resize(r.width,r.height,camera);pose(time);}
new ResizeObserver(resize).observe(stage);resize();buttons();document.querySelector('#fallback').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();const f=document.querySelector('#fallback');f.hidden=false;f.textContent='The scene was interrupted. Refresh to return to the egg.';});
