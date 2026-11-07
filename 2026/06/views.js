import { ease, mix, tau, planets, position, relativePosition, separation, galaxyAt } from './model.js';
import { globe, sun, surface } from './art.js';

function label(ctx, text, x, y) {
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillStyle = '#e9dbb8';
  ctx.fillText(text, x, y);
}

export function instrument(ctx, width, height, time) {
  const solar = ease(7, 11, time);
  const depart = ease(17, 22, time);
  const unit = Math.min(width / 9.8, height / 6.4) * Math.exp(-depart * 5);
  const cx = width * .5, cy = height * .46;
  const tilt = .65, angle = -.17;
  function project(x, y) {
    return [cx + unit * (x * Math.cos(angle) - y * tilt * Math.sin(angle)),
            cy + unit * (x * Math.sin(angle) + y * tilt * Math.cos(angle))];
  }
  function line(a, b) {
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  // Engraved brass limb and an inset enamel face.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(1, tilt);
  const rim = unit * 4.55;
  const enamel = ctx.createRadialGradient(0, 0, 0, 0, 0, rim);
  enamel.addColorStop(0, '#19383eac'); enamel.addColorStop(.88, '#132b32c2'); enamel.addColorStop(1, '#19282bd9');
  ctx.fillStyle = enamel;
  ctx.beginPath(); ctx.arc(0,0,rim,0,tau); ctx.fill();
  for (const [radius, color, weight] of [[1,'#b59a68',1.8],[.99,'#584a34',2],[.975,'#937e59',.7],[.90,'#806f4e',1],[.891,'#baa170',.6]]) {
    ctx.strokeStyle = color; ctx.lineWidth = weight * (1 - depart);
    ctx.beginPath(); ctx.arc(0,0,rim*radius,0,tau); ctx.stroke();
  }
  ctx.strokeStyle = '#cdb583af';
  ctx.lineWidth = .8;
  for (let i=0; i<180; i++) {
    const theta = i*tau/180;
    const inner = i%5 === 0 ? .91 : .951;
    line([rim*inner*Math.cos(theta),rim*inner*Math.sin(theta)],[rim*.971*Math.cos(theta),rim*.971*Math.sin(theta)]);
  }
  ctx.restore();
  ctx.save();
  ctx.translate(cx,cy); ctx.rotate(angle); ctx.scale(1,tilt);
  ctx.beginPath(); ctx.arc(0,0,rim*.89,0,tau); ctx.restore();
  ctx.save(); ctx.clip();
  const bodies = [];
  const earth = position(planets[2],time);
  for (const planet of planets) {
    // A moving observer's trail is the difference of the two positions at
    // each sample time. This produces the apparent retrograde loops.
    const span = mix(18, tau / planet.speed, solar);
    ctx.strokeStyle = planet.name === 'Earth' ? '#81b7ab8a' : '#b6a2746f';
    ctx.lineWidth = planet.name === 'Mars' ? 1.3 : .85;
    ctx.beginPath();
    for (let j=0; j<=240; j++) {
      const p = relativePosition(planet, time - span + span * j/240, solar);
      const xy = project(p.x,p.y);
      if (j) ctx.lineTo(...xy); else ctx.moveTo(...xy);
    }
    ctx.stroke();
    const p = relativePosition(planet,time,solar);
    const [x,y] = project(p.x,p.y);
    const r = unit * (planet.size + (planet.name === 'Earth' ? .16*(1-solar) : 0));
    bodies.push({planet,x,y,r,depth:p.y});
  }
  const [sx,sy] = project(-earth.x*(1-solar),-earth.y*(1-solar));
  for (const item of bodies) {
    ctx.strokeStyle = '#aa89513d'; ctx.lineWidth = 2.4;
    line(solar > .5 ? [sx,sy] : [cx,cy],[item.x,item.y]);
  }
  sun(ctx,sx,sy,unit*mix(.18,.26,solar));
  for (const {planet,x,y,r} of bodies.sort((a,b)=>a.depth-b.depth)) {
    globe(ctx,x,y,r,planet,time);
    if (planet.name === 'Jupiter' && solar > .8 && depart < .2) {
      // The four Galilean moons give the same instrument a second local centre.
      for (const [index, speed] of [2.6, 1.3, .65, .28].entries()) {
        const phase = time * speed + index * 1.7;
        const orbit = r * (1.45 + index * .64);
        globe(ctx, x + orbit * Math.cos(phase), y + orbit * .28 * Math.sin(phase),
          Math.max(1.3, r * .11), { name: 'Moon', color: '#e0d4b8' }, time);
      }
      label(ctx, 'Jupiter', x + r + 2, y - r - 6);
    }
    if (planet.name === 'Saturn') {
      ctx.strokeStyle='#d6be8c';ctx.lineWidth=Math.max(.6,r*.18);
      ctx.beginPath();ctx.ellipse(x,y,r*1.74,r*.46,-.30,0,tau);ctx.stroke();
    }
    if (planet.name==='Earth' && depart<.1) {
      label(ctx,'Earth',x+r+5,y-r*.6);
      const moonAngle = time*.92+2;
      globe(ctx,x+r*2.2*Math.cos(moonAngle),y+r*.98*Math.sin(moonAngle),r*.2,{name:'Moon',color:'#d3cdbc'},time);
    }
  }
  if (solar>.7 && depart<.1) label(ctx,'Sun',sx+unit*.28,sy+4);
  ctx.restore();
}

export function drawGalaxy(ctx, texture, x, y, radius, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.drawImage(texture,-radius,-radius,2*radius,2*radius);
  ctx.restore();
}

export function galaxyMap(ctx, width, height, time, observer, textures) {
  const unit = Math.min(width,height)*.53;
  const expansion = Math.exp((time-20)*.049);
  const cx=width*.5, cy=height*.45;
  const colRange=Math.ceil(width/(2*unit*expansion*.52))+2;
  const rowRange=Math.ceil(height/(unit*expansion*.5))+2;
  const visible=[];
  for (let row=observer.row-rowRange; row<=observer.row+rowRange; row++) {
    for (let col=observer.col-colRange; col<=observer.col+colRange; col++) {
      const galaxy=galaxyAt(col,row);
      const delta=separation(galaxy,observer,time);
      const x=cx+delta.x*unit, y=cy+delta.y*unit;
      const radius=unit*.14*galaxy.size;
      if (x < -radius || y < -radius || x > width+radius || y > height+radius) continue;
      drawGalaxy(ctx,textures[galaxy.texture],x,y,radius,galaxy.angle);
      if (!col && !row) label(ctx,'Milky Way',x+radius*.23,y+radius*.49);
      if (x>14 && y>48 && x<width-14 && y<height-115) visible.push({galaxy,x,y});
    }
  }
  // A small reticle marks the chosen observer, independent of the home label.
  ctx.strokeStyle='#dcc3979e'; ctx.lineWidth=1;
  for (let i=0;i<4;i++) {
    const a=i*Math.PI/2+.18;
    ctx.beginPath();ctx.arc(cx,cy,12,a,a+.4);ctx.stroke();
  }
  return visible;
}

// Backward ray mapping through a thin point-mass lens. In Einstein-radius
// units the source direction is beta = theta - theta / |theta|². Sampling
// the same extended galaxy twice produces the two images and the ring.
export function makeLens(sky, galaxy, target, einsteinRadius) {
  const scale=Math.min(1,1100/sky.width,850/sky.height);
  const source=surface(Math.round(sky.width*scale),Math.round(sky.height*scale));
  const ctx=source.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(sky,0,0,source.width,source.height);
  drawGalaxy(ctx,galaxy,target.x*scale,target.y*scale,einsteinRadius*.61*scale,-.43);
  const pixels=ctx.getImageData(0,0,source.width,source.height).data;
  const output=surface(source.width,source.height);
  const out=output.getContext('2d');
  const image=out.createImageData(source.width,source.height);
  const radius=einsteinRadius*scale;
  let lastX=NaN, lastY=NaN;
  function render(x,y) {
    x*=scale; y*=scale;
    if (x===lastX && y===lastY) return output;
    lastX=x;lastY=y;
    const w=source.width, h=source.height;
    image.data.set(pixels);
    const extent=radius*3.8;
    const left=Math.max(0,Math.floor(x-extent)),right=Math.min(w,Math.ceil(x+extent));
    const top=Math.max(0,Math.floor(y-extent)),bottom=Math.min(h,Math.ceil(y+extent));
    for(let j=top;j<bottom;j++) {
      for(let i=left;i<right;i++) {
        const dx=i-x,dy=j-y,dist=dx*dx+dy*dy;
        if(dist>=extent*extent) continue;
        const k=(j*w+i)*4;
        if(dist<radius*radius*.028) {
          image.data[k]=2; image.data[k+1]=4; image.data[k+2]=8;
          continue;
        }
        const bend=radius*radius/dist*(1-ease(radius*radius*7,extent*extent,dist));
        const u=Math.max(0,Math.min(w-1.001,i-dx*bend));
        const v=Math.max(0,Math.min(h-1.001,j-dy*bend));
        const a=Math.floor(u),b=Math.floor(v);
        const off=(b*w+a)*4, fx=u-a, fy=v-b;
        for(let c=0;c<3;c++) {
          const upper=mix(pixels[off+c],pixels[off+4+c],fx);
          const lower=mix(pixels[off+w*4+c],pixels[off+w*4+4+c],fx);
          image.data[k+c]=mix(upper,lower,fy);
        }
      }
    }
    out.putImageData(image,0,0);
    return output;
  }
  return render;
}
