import * as T from '../../assets/vendor/three.module.min.js';
import {createRenderer} from '../../assets/renderers/scene-renderer.js?v=2-visitor';
import {makeFactory} from './factory.js?v=2-visitor';
import {makeChocolate} from './chocolate.js?v=2-visitor';
import {makeVisitor} from './visitor.js?v=2-visitor';
import {duration,state,cameraFrame,smooth,mix,clamp} from './deformation.js?v=2-visitor';
const stage=document.querySelector('#stage'),play=document.querySelector('#play'),replay=document.querySelector('#replay'),timeline=document.querySelector('#timeline'),elapsed=document.querySelector('#elapsed'),status=document.querySelector('#status');
const poster=new URLSearchParams(location.search).has('poster');document.body.classList.toggle('poster',poster);
const renderer=createRenderer();stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene();scene.background=new T.Color('#171f1c');scene.fog=new T.Fog('#171f1c',30,65);
const camera=new T.OrthographicCamera(-12,12,8,-8,.1,100);
const ambient=new T.HemisphereLight('#aebcaa','#24231e',1.6);scene.add(ambient);
const key=new T.DirectionalLight('#ccd0ae',3);key.position.set(-9,17,9);key.target.position.set(0,3,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:16,bottom:-12,near:.5,far:65});key.shadow.normalBias=.04;scene.add(key,key.target);
const rim=new T.DirectionalLight('#8ba89e',1.5);rim.position.set(6,9,-9);scene.add(rim);
let environment=null;
if(!renderer.software){const env=new T.Scene();env.background=new T.Color('#4c4a3d');for(const [p,size,color,intensity]of[[[-5,8,4],[3,8],'#fff2c9',4],[[6,7,-3],[2,6],'#d7e3d8',3],[[0,10,0],[7,3],'#f5deb0',3],[[0,7,8],[12,1.2],'#fff1d3',5]]){const mesh=new T.Mesh(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide}));mesh.position.set(...p);mesh.lookAt(0,0,0);env.add(mesh);}const pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromScene(env,.08).texture;pmrem.dispose();env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.environment=environment;}
const signCanvas=document.createElement('canvas');signCanvas.width=256;signCanvas.height=64;const ink=signCanvas.getContext('2d');ink.fillStyle='#343e35';ink.fillRect(0,0,256,64);ink.strokeStyle='#85866a';ink.strokeRect(4,4,248,56);ink.fillStyle='#c5c4a4';ink.font='28px "Courier New"';ink.textAlign='center';ink.fillText('DEPT. 03',128,43);const sign=new T.CanvasTexture(signCanvas);sign.colorSpace=T.SRGBColorSpace;
const ticketCanvas=document.createElement('canvas');ticketCanvas.width=512;ticketCanvas.height=192;const lettering=ticketCanvas.getContext('2d');lettering.fillStyle='#513411';lettering.textAlign='center';lettering.font='bold 57px Georgia';lettering.fillText('GOLDEN',256,78);lettering.font='34px Georgia';lettering.fillText('T I C K E T',256,137);const ticketTexture=new T.CanvasTexture(ticketCanvas);ticketTexture.colorSpace=T.SRGBColorSpace;
const factory=makeFactory(scene,{signTexture:sign}),chocolate=makeChocolate(scene,environment),visitor=makeVisitor(scene,{ticketTexture});
const ground=new T.Mesh(new T.PlaneGeometry(90,90,18,18),new T.MeshStandardMaterial({color:'#282f29',roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.055;ground.receiveShadow=true;ground.visible=!renderer.software;ground.userData.ground=-2;scene.add(ground);
const grid=new T.Group();scene.add(grid);const lineMat=new T.MeshBasicMaterial({color:'#3d453b'});
for(let i=-12;i<=12;i+=2){for(const axis of [0,1]){const mesh=new T.Mesh(new T.BoxGeometry(axis?28:.016,.004,axis?.016:28),lineMat);mesh.position.set(axis?0:i,-.046,axis?i:0);mesh.userData.ground=-1;grid.add(mesh);}}
const smoke=[];const smokeGeo=new T.IcosahedronGeometry(1,1),smokeMat=new T.MeshBasicMaterial({color:'#45514a',transparent:true,opacity:.13,depthWrite:false});
factory.stacks.forEach(([x,base,z,top],stack)=>{for(let i=0;i<5;i++){const mesh=new T.Mesh(smokeGeo,smokeMat);scene.add(mesh);smoke.push({mesh,x,z,top,seed:i/5+stack*.11});}});
const cold=new T.Color('#171f1c'),warm=new T.Color('#21160f'),coldLight=new T.Color('#ccd0ae'),warmLight=new T.Color('#ffe2b1');
const motion=matchMedia('(prefers-reduced-motion: reduce)');let time=0,playing=false,raf=0,last=null,aspect=1;
function draw(){const s=state(time);factory.pose(time);chocolate.pose(time);visitor.pose(time);const framing=cameraFrame(aspect,time);camera.position.set(...framing.position);camera.lookAt(...framing.target);camera.top=framing.halfHeight;camera.bottom=-framing.halfHeight;camera.right=framing.halfHeight*aspect;camera.left=-camera.right;camera.updateProjectionMatrix();
 scene.background.copy(cold).lerp(warm,s.chocolate);scene.fog.color.copy(scene.background);key.color.copy(coldLight).lerp(warmLight,s.chocolate);rim.color.set(s.chocolate>.5?'#d4a961':'#8ba89e');rim.intensity=1.5+smooth(21,31,time)*1.2;
 smoke.forEach(({mesh,x,z,top,seed})=>{const q=(time*.09+seed)%1;mesh.visible=time<13;mesh.position.set(x+q*q*2,top+q*3.8,z-q*.6);mesh.scale.setScalar(.3+q*.9);mesh.rotation.set(q*2,seed*3,q);});smokeMat.opacity=.13*(1-smooth(2,13,time));
 timeline.value=String(time);timeline.style.setProperty('--progress',`${time/duration*100}%`);timeline.setAttribute('aria-valuetext',`${time.toFixed(1)} seconds, ${s.phase}`);elapsed.textContent=`00:${Math.floor(time).toString().padStart(2,'0')}`;if(status.textContent!==s.phase)status.textContent=s.phase;renderer.render(scene,camera);
}
function buttons(){play.textContent=motion.matches?'Next':playing?'Pause':time>=duration?'Replay':time===0?'Melt':'Play';play.setAttribute('aria-label',motion.matches?'Next scene':playing?'Pause animation':time>=duration?'Replay animation':'Play animation');}
function pause(){playing=false;cancelAnimationFrame(raf);raf=0;last=null;buttons();}
function tick(now){raf=0;if(!playing||document.hidden){last=null;return;}const dt=last===null?0:(now-last)/1000;last=now;time=clamp(time+dt,0,duration);draw();if(time===duration){pause();return;}raf=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{if(motion.matches){pause();time=[7,15,23,34].find(t=>t>time+.05)??0;draw();buttons();return;}if(playing){pause();return;}if(time===duration)time=0;playing=true;last=null;buttons();raf=requestAnimationFrame(tick);});
replay.addEventListener('click',()=>{pause();time=0;draw();buttons();});timeline.addEventListener('input',()=>{pause();time=Number(timeline.value);draw();buttons();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});motion.addEventListener('change',pause);
function resize(){const r=stage.getBoundingClientRect();aspect=r.width/r.height;renderer.setSize(r.width,r.height);draw();}
new ResizeObserver(resize).observe(stage);resize();buttons();for(const control of [play,replay,timeline])control.disabled=false;document.querySelector('#fallback').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();const f=document.querySelector('#fallback');f.hidden=false;f.textContent='The scene was interrupted. Refresh to return to the factory.';});
