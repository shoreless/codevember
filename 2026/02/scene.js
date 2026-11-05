import { clamp, createShards, projectShard, randomSource } from './fracture.js';

const canvas=document.querySelector('#shell'), ctx=canvas.getContext('2d');
const texture=document.createElement('canvas'), paint=texture.getContext('2d');
const trigger=document.querySelector('#break'), restore=document.querySelector('#restore');
const garden=document.querySelector('#garden'), secret=document.querySelector('#secret');
const status=document.querySelector('#status'), stage=document.querySelector('#experiment');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let width=0,height=0,ratio=1,shards=[],edges=[],origin={x:.5,y:.48};
let time=0,direction=0,frame=0,last=null,ready=false,failed=false;
const duration=4;

function ellipsePath(c,x,y,rx,ry) {
  c.beginPath();
  // Slightly narrow at the top; the page remembers the egg from Fold.
  c.moveTo(x,y-ry);
  c.bezierCurveTo(x+rx*.64,y-ry,x+rx*1.14,y+ry*.18,x+rx*.8,y+ry*.69);
  c.bezierCurveTo(x+rx*.49,y+ry*1.13,x-rx*.49,y+ry*1.13,x-rx*.8,y+ry*.69);
  c.bezierCurveTo(x-rx*1.14,y+ry*.18,x-rx*.64,y-ry,x,y-ry);
  c.closePath();
}
function makeTexture() {
  texture.width=Math.round(width*ratio);texture.height=Math.round(height*ratio);
  paint.setTransform(ratio,0,0,ratio,0,0);
  const wash=paint.createRadialGradient(width*.47,height*.42,10,width*.5,height*.5,Math.max(width,height)*.8);
  wash.addColorStop(0,'#f7f0e1');wash.addColorStop(.6,'#eee5d3');wash.addColorStop(1,'#d9ceb7');
  paint.fillStyle=wash;paint.fillRect(0,0,width,height);
  const rand=randomSource(11);
  for(let i=0;i<width*height/210;i++) {
    paint.fillStyle=rand()>.15?'#91775a16':'#7150482b';
    const r=.3+rand()*.8;paint.beginPath();paint.ellipse(rand()*width,rand()*height,r,r*.62,rand()*3,0,Math.PI*2);paint.fill();
  }
  const margin=width*.05,headerY=width<600?40:45;
  paint.fillStyle='#173b3b';paint.font=`italic ${width<600?18:21}px Georgia`;
  paint.textAlign='left';paint.fillText('↖ Codevember',margin,headerY);
  paint.font='12px "Courier New", monospace';paint.textAlign='right';paint.fillText('02',width-margin,headerY-2);
  paint.strokeStyle='#78887970';paint.lineWidth=.7;
  paint.beginPath();paint.moveTo(margin,headerY+25);paint.lineTo(width-margin,headerY+25);paint.stroke();
  const cx=width*.5,cy=height*.49,ry=Math.min(height*.29,width*.39),rx=ry*.69;
  paint.strokeStyle='#ad935c65';paint.lineWidth=1;ellipsePath(paint,cx,cy,rx,ry);paint.stroke();
  paint.strokeStyle='#ad935c20';ellipsePath(paint,cx,cy,rx+6,ry+6);paint.stroke();
  paint.fillStyle='#173b3b';paint.textAlign='center';paint.textBaseline='middle';
  paint.font=`italic ${Math.min(width*.17,height*.19,160)}px Georgia`;
  paint.fillText('Shatter',cx,cy-3);
  paint.fillStyle='#9d7d40';paint.font='20px Georgia';paint.fillText('✧',cx,cy-ry-23);
  paint.font='11px "Courier New", monospace';paint.fillStyle='#657365';
  paint.fillText(failed?'Try again':ready?'Tap anywhere':'Preparing…',cx,height-66);
  paint.textBaseline='alphabetic';
  // A fine double edge makes this a brittle page rather than a floating egg.
  paint.strokeStyle='#b79f7040';paint.strokeRect(12,12,width-24,height-24);
  paint.strokeRect(17,17,width-34,height-34);
}
function prepareShards() {
  const center={x:origin.x*width,y:origin.y*height};
  shards=createShards(width,height,center);
  const found=new Map();
  for(const shard of shards)for(let i=0;i<3;i++) {
    const a=shard.vertices[i],b=shard.vertices[(i+1)%3];
    const key=[`${a.x},${a.y}`,`${b.x},${b.y}`].sort().join('|');
    if(!found.has(key))found.set(key,{a,b,distance:Math.min(Math.hypot(a.x-center.x,a.y-center.y),Math.hypot(b.x-center.x,b.y-center.y))});
  }
  edges=[...found.values()];
}
function path(c,points) {c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
function paintShard(shard,pose) {
  if(pose.opacity<.002)return;
  const [a,b,c]=shard.vertices,[u,v,w]=pose.points;
  const denominator=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  if(Math.abs(denominator)<1e-6)return;
  const A=((v.x-u.x)*(c.y-a.y)-(w.x-u.x)*(b.y-a.y))/denominator;
  const C=((w.x-u.x)*(b.x-a.x)-(v.x-u.x)*(c.x-a.x))/denominator;
  const B=((v.y-u.y)*(c.y-a.y)-(w.y-u.y)*(b.y-a.y))/denominator;
  const D=((w.y-u.y)*(b.x-a.x)-(v.y-u.y)*(c.x-a.x))/denominator;
  ctx.save();ctx.globalAlpha=pose.opacity;
  // A dark underside and an ivory rim give the thin fragments shell thickness.
  ctx.fillStyle='#716047';ctx.strokeStyle='#8a7659';ctx.lineWidth=2.6;
  path(ctx,pose.points.map(p=>({x:p.x,y:p.y+2})));ctx.fill();ctx.stroke();
  path(ctx,pose.points);ctx.clip();
  ctx.transform(A,B,C,D,u.x-A*a.x-C*a.y,u.y-B*a.x-D*a.y);
  const left=Math.min(a.x,b.x,c.x),top=Math.min(a.y,b.y,c.y);
  const boxWidth=Math.max(a.x,b.x,c.x)-left,boxHeight=Math.max(a.y,b.y,c.y)-top;
  ctx.drawImage(texture,left*ratio,top*ratio,boxWidth*ratio,boxHeight*ratio,left,top,boxWidth,boxHeight);
  if(pose.light){ctx.fillStyle=`rgba(66,42,20,${pose.light})`;ctx.fillRect(left,top,boxWidth,boxHeight);}
  ctx.restore();
}
function draw() {
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  garden.style.transform=motion.matches?'none':`scale(${1.06-.06*clamp(time/duration)})`;
  if(motion.matches) {
    ctx.globalAlpha=1-clamp(time/duration);ctx.drawImage(texture,0,0,width,height);ctx.globalAlpha=1;return;
  }
  if(time<.72) {
    ctx.drawImage(texture,0,0,width,height);
    if(time>0) {
      ctx.lineWidth=1;ctx.strokeStyle='#5b4637';
      for(const e of edges) {
        const progress=clamp((time-.1-e.distance/Math.hypot(width,height)*.43)/.17);
        if(!progress)continue;
        const originPx={x:origin.x*width,y:origin.y*height};
        const reverse=Math.hypot(e.a.x-originPx.x,e.a.y-originPx.y)>Math.hypot(e.b.x-originPx.x,e.b.y-originPx.y);
        const a=reverse?e.b:e.a,b=reverse?e.a:e.b;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+(b.x-a.x)*progress,a.y+(b.y-a.y)*progress);ctx.stroke();
      }
    }
  } else {
    for(const shard of shards)paintShard(shard,projectShard(shard,time,width,height));
  }
}
function finish(open) {
  direction=0;frame=0;last=null;
  time=open?duration:0;draw();
  document.body.classList.remove('busy');document.body.classList.toggle('open',open);
  trigger.hidden=open;trigger.disabled=!ready;
  secret.setAttribute('aria-hidden',String(!open));
  restore.hidden=!open;restore.disabled=false;
  document.querySelector('meta[name="theme-color"]').content=open?'#100905':'#eee5d3';
  status.textContent=open?'A chocolate garden was hidden behind the page. Restore the page to try again.':'Page restored. Tap anywhere to shatter it.';
  (open?restore:trigger).focus({preventScroll:true});
}
function tick(now) {
  frame=0;
  if(!direction||document.hidden){last=null;return;}
  const dt=last===null?0:Math.max(0,(now-last)/1000);last=now;
  time=clamp(time+dt*direction*(motion.matches?10:1),0,duration);draw();
  if(direction>0&&time>=duration){finish(true);return;}
  if(direction<0&&time<=0){finish(false);return;}
  frame=requestAnimationFrame(tick);
}
function animate(nextDirection) {
  direction=nextDirection;last=null;
  document.body.classList.add('busy');document.body.classList.remove('open');
  trigger.disabled=true;restore.disabled=true;restore.hidden=true;
  secret.setAttribute('aria-hidden','true');
  if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);
}
trigger.addEventListener('click',event=>{
  if(failed){loadImage();return;}
  if(!ready||direction)return;
  const rect=stage.getBoundingClientRect();
  origin=event.detail?{x:clamp((event.clientX-rect.left)/width,.02,.98),y:clamp((event.clientY-rect.top)/height,.02,.98)}:{x:.5,y:.48};
  prepareShards();status.textContent='The page is cracking.';animate(1);
});
restore.addEventListener('click',()=>{if(direction)return;status.textContent='Restoring the page.';animate(-1);});
function resize() {
  const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
  ratio=Math.min(devicePixelRatio||1,1.6);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  makeTexture();prepareShards();draw();
}
new ResizeObserver(resize).observe(stage);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(frame);frame=0;last=null;}
  else if(direction&&!frame)frame=requestAnimationFrame(tick);
});
motion.addEventListener('change',()=>{if(direction){cancelAnimationFrame(frame);finish(direction>0);}else draw();});
async function loadImage() {
  failed=false;trigger.disabled=true;makeTexture();draw();
  try {
    if(!garden.complete||!garden.naturalWidth)await garden.decode();
    ready=true;trigger.disabled=false;status.textContent='Tap anywhere to shatter the page. Keyboard: press Enter or Space on the page.';
  } catch {
    failed=true;status.textContent='The hidden image could not load. Tap to retry.';trigger.disabled=false;
    garden.src='chocolate-garden.webp';
  }
  makeTexture();draw();
}
resize();loadImage();
