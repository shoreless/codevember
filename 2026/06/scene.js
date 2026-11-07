import { duration, ease, galaxyAt } from './model.js';
import { makeSky, makeGalaxy } from './art.js';
import { instrument, galaxyMap, makeLens } from './views.js';

const canvas = document.querySelector('#sky');
const ctx = canvas.getContext('2d');
const play = document.querySelector('#play');
const timeline = document.querySelector('#time');
const clock = document.querySelector('#clock');
const hint = document.querySelector('#hint');
const align = document.querySelector('#align');
const status = document.querySelector('#status');
const chapters = Array.from(document.querySelectorAll('[data-time]'));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const textures = ['#9fcfd2','#b0a8da','#edc399'].map((color,i) => makeGalaxy(610+i,color));
document.body.classList.toggle('poster',new URLSearchParams(location.search).has('poster'));

let width, height, sky, lens, radius, target;
let time = 0, playing = false, frame = 0, last = null;
let observer = null, visibleGalaxies = [];
let lensOffset = null, dragging = false;
const names = ['Earth','Sun','Galaxies','Black hole'];
function chapter() {
  if (time >= 32) return 3;
  if (time >= 21) return 2;
  if (time >= 9) return 1;
  return 0;
}
function mapObserver() {
  if (observer) return observer;
  const next = galaxyAt(1,-1);
  const travel = ease(25,29,time);
  return { ...next, col: Math.round(next.col*travel), row: Math.round(next.row*travel),
    x: next.x*travel, y: next.y*travel };
}
function lensPosition() {
  if (lensOffset) return {x:target.x+lensOffset.x*radius,y:target.y+lensOffset.y*radius};
  const distance = (1-ease(32,43,time))*2.65;
  return {x:target.x+distance*radius*.93,y:target.y-distance*radius*.36};
}
function draw() {
  const galaxies = ease(18.5,22,time);
  const bent = ease(30,33,time);
  ctx.globalAlpha = 1;
  ctx.drawImage(sky,0,0,width,height);
  if (galaxies < 1) {
    ctx.globalAlpha = 1-galaxies;
    instrument(ctx,width,height,time);
  }
  if (galaxies > 0 && bent < 1) {
    ctx.globalAlpha = galaxies*(1-bent);
    visibleGalaxies = galaxyMap(ctx,width,height,time,mapObserver(),textures);
  }
  if (bent > 0) {
    ctx.globalAlpha = bent;
    const hole=lensPosition();
    ctx.drawImage(lens(hole.x,hole.y),0,0,width,height);
    // Follow the brighter image as the source and lens approach alignment.
    const dx=target.x-hole.x, dy=target.y-hole.y;
    const separation=Math.hypot(dx,dy);
    const angle=separation>.2 ? Math.atan2(dy,dx) : -.55;
    const imageDistance=(separation+Math.sqrt(separation**2+4*radius**2))/2;
    const x=hole.x+Math.cos(angle)*imageDistance, y=hole.y+Math.sin(angle)*imageDistance;
    const side=x>width*.7 ? -1 : 1;
    ctx.strokeStyle='#cfbc9077';
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*15,y-18);ctx.lineTo(x+side*43,y-18);ctx.stroke();
    ctx.font='italic 14px Georgia, serif';ctx.fillStyle='#e9ddbe';
    ctx.textAlign=side===1?'left':'right';ctx.fillText('Milky Way',x+side*20,y-24);ctx.textAlign='left';
  }
  ctx.globalAlpha=1;
  const view=chapter();
  chapters.forEach((b,i)=>b.setAttribute('aria-current',i===view?'step':'false'));
  timeline.value=String(time);
  clock.value='00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:44';
  timeline.setAttribute('aria-valuetext',time.toFixed(1)+' seconds, '+names[view]);
  const stageHint=['','Copernicus’ Sun · Galileo’s moons', 'Choose a galaxy', 'Drag the black hole'][view];
  if (hint.textContent!==stageHint) hint.textContent=stageHint;
  align.hidden=view!==3;
  canvas.tabIndex=view>=2?0:-1;
  canvas.dataset.interactive=String(view>=2);
  canvas.setAttribute('aria-label',[
    'Earth-centred view. The planets trace their apparent paths around the observer.',
    'Sun-centred view. Earth is one planet moving around the Sun.',
    'Expanding galaxy field. Select a galaxy or use the arrow keys to change viewpoint.',
    'The distant Milky Way seen through a black hole. Drag or use arrow keys to move the lens. Align lens forms an Einstein ring.'
  ][view]);
  if (status.textContent!==names[view]) status.textContent=names[view];
  const nextLabel=reduced.matches?'Next':playing?'Pause':time===duration?'Replay':'Play';
  play.textContent=nextLabel;
}
function pause() {
  playing=false;
  cancelAnimationFrame(frame);
  last=null;
}
function seek(value) {
  pause();
  time=Math.max(0,Math.min(duration,value));
  lensOffset=null;
  observer=null;
  draw();
}
function tick(now) {
  if (!playing) return;
  if (last!==null) time=Math.min(duration,time+(now-last)/1000);
  last=now;
  if (time===duration) pause();
  draw();
  if (playing) frame=requestAnimationFrame(tick);
}
play.addEventListener('click',()=>{
  if (reduced.matches) {
    seek([11,23,34,44].find(t=>t>time+.01)??0);
  } else if (playing) {
    pause();draw();
  } else {
    if (time===duration) seek(0);
    playing=true;last=null;draw();frame=requestAnimationFrame(tick);
  }
});
chapters.forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.time))));
document.querySelector('#reset').addEventListener('click',()=>seek(0));
timeline.addEventListener('input',()=>seek(Number(timeline.value)));
align.addEventListener('click',()=>{pause();lensOffset={x:0,y:0};draw();});
function moveLens(x,y) {
  pause();
  lensOffset={x:(Math.max(0,Math.min(width,x))-target.x)/radius,y:(Math.max(0,Math.min(height,y))-target.y)/radius};
  draw();
}
function pointer(event) {
  const box=canvas.getBoundingClientRect();
  return {x:event.clientX-box.left,y:event.clientY-box.top};
}
canvas.addEventListener('pointerdown',event=>{
  const p=pointer(event);
  if (chapter()===3) {
    canvas.setPointerCapture(event.pointerId);
    dragging=true;moveLens(p.x,p.y);
  } else if (chapter()===2) {
    const closest=visibleGalaxies.reduce((best,g)=>Math.hypot(g.x-p.x,g.y-p.y)<best.distance
      ? {galaxy:g.galaxy,distance:Math.hypot(g.x-p.x,g.y-p.y)} : best,{distance:Infinity});
    if (closest.distance<Math.max(32,Math.min(width,height)*.09)) {
      observer=closest.galaxy;draw();
    }
  }
});
canvas.addEventListener('pointermove',event=>{
  if (dragging) {const p=pointer(event);moveLens(p.x,p.y);}
});
canvas.addEventListener('lostpointercapture',()=>{dragging=false;});
canvas.addEventListener('keydown',event=>{
  const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  const delta=directions[event.key];
  if (!delta || chapter()<2) return;
  event.preventDefault();
  if (chapter()===3) {
    const p=lensPosition();
    moveLens(p.x+delta[0]*radius*.09,p.y+delta[1]*radius*.09);
  } else {
    const here=mapObserver();
    observer=galaxyAt(here.col+delta[0],here.row+delta[1]);draw();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();draw();}});
reduced.addEventListener('change',()=>{pause();draw();});
function resize() {
  const box=canvas.getBoundingClientRect();
  width=Math.max(1,Math.round(box.width));
  height=Math.max(1,Math.round(box.height));
  const ratio=Math.min(devicePixelRatio,1.6);
  canvas.width=Math.round(width*ratio);
  canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  target={x:width*.50,y:height*.445};
  radius=Math.min(width*.235,height*.19);
  sky=makeSky(width,height);
  lens=makeLens(sky,textures[0],target,radius);
  draw();
}
resize();
new ResizeObserver(resize).observe(canvas);
play.disabled=false;
