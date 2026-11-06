import * as T from '../../assets/vendor/three.module.min.js';
import {createRenderer} from '../../assets/renderers/scene-renderer.js?v=2-visitor';
import {makePlant} from './plant.js?v=1-junior';
import {duration,phase,cameraFrame} from './growth.js';
const stage=document.querySelector('#stage'),play=document.querySelector('#play'),replay=document.querySelector('#replay'),timeline=document.querySelector('#timeline'),elapsed=document.querySelector('#elapsed'),status=document.querySelector('#status');
document.body.classList.toggle('poster',new URLSearchParams(location.search).has('poster'));
const renderer=createRenderer();stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene();scene.background=new T.Color('#e7e1d0');scene.fog=new T.Fog('#e7e1d0',35,65);
const camera=new T.OrthographicCamera(-7,7,7,-7,.1,100);
scene.add(new T.HemisphereLight('#fff7d6','#6b7051',2.3));
const sunlight=new T.DirectionalLight('#fff2c9',3.2);sunlight.position.set(-8,13,9);sunlight.target.position.set(0,5,0);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-9,right:9,top:13,bottom:-7,near:.5,far:40});sunlight.shadow.normalBias=.025;scene.add(sunlight,sunlight.target);
const fill=new T.DirectionalLight('#d2e1b9',.8);fill.position.set(6,9,-4);scene.add(fill);
// A hint of the curtain and afternoon window light from Junior's home.
const curtainGeo=new T.PlaneGeometry(5,22,32,1),cp=curtainGeo.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i);cp.setZ(i,Math.sin(x*6)*.12+Math.sin(x*12)*.035);}curtainGeo.computeVertexNormals();const curtain=new T.Mesh(curtainGeo,new T.MeshStandardMaterial({color:'#d5cbb5',roughness:1,side:T.DoubleSide}));curtain.position.set(-5.8,7,-2.8);curtain.receiveShadow=true;scene.add(curtain);
const nameCanvas=document.createElement('canvas');nameCanvas.width=512;nameCanvas.height=128;const ink=nameCanvas.getContext('2d');ink.fillStyle='#5d6750';ink.font='italic 43px Georgia';ink.textAlign='center';ink.fillText('Ricardo Junior',256,80);const nameTexture=new T.CanvasTexture(nameCanvas);nameTexture.colorSpace=T.SRGBColorSpace;
const plant=makePlant(scene,{nameTexture});
const motion=matchMedia('(prefers-reduced-motion: reduce)');let time=0,playing=false,raf=0,last=null,aspect=1;
function draw(){plant.pose(time);const framing=cameraFrame(aspect,time);camera.position.set(...framing.position);camera.lookAt(...framing.target);camera.top=framing.halfHeight;camera.bottom=-framing.halfHeight;camera.right=framing.halfHeight*aspect;camera.left=-camera.right;camera.updateProjectionMatrix();timeline.value=String(time);timeline.style.setProperty('--progress',`${time/duration*100}%`);const label=phase(time);timeline.setAttribute('aria-valuetext',`${time.toFixed(1)} seconds, ${label}`);elapsed.textContent=`00:${Math.floor(time).toString().padStart(2,'0')}`;if(status.textContent!==label)status.textContent=label;renderer.render(scene,camera);}
function buttons(){play.textContent=motion.matches?'Next':playing?'Pause':time>=duration?'Replay':time===0?'Grow':'Play';play.setAttribute('aria-label',motion.matches?'Next scene':playing?'Pause animation':time>=duration?'Replay animation':'Play animation');}
function pause(){playing=false;cancelAnimationFrame(raf);raf=0;last=null;buttons();}
function tick(now){raf=0;if(!playing||document.hidden){last=null;return;}const dt=last===null?0:(now-last)/1000;last=now;time=Math.min(duration,time+dt);draw();if(time===duration){pause();return;}raf=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{if(motion.matches){pause();time=[7,15,24,32,38].find(t=>t>time+.05)??0;draw();buttons();return;}if(playing){pause();return;}if(time===duration)time=0;playing=true;last=null;buttons();raf=requestAnimationFrame(tick);});
replay.addEventListener('click',()=>{pause();time=0;draw();buttons();});timeline.addEventListener('input',()=>{pause();time=Number(timeline.value);draw();buttons();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});motion.addEventListener('change',pause);
function resize(){const r=stage.getBoundingClientRect();aspect=r.width/r.height;renderer.setSize(r.width,r.height);draw();}
new ResizeObserver(resize).observe(stage);resize();buttons();for(const control of [play,replay,timeline])control.disabled=false;document.querySelector('#fallback').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();const f=document.querySelector('#fallback');f.hidden=false;f.textContent='The scene was interrupted. Refresh to return to Ricardo Junior.';});
