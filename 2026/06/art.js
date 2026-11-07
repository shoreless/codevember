import { random, tau } from './model.js';

export function surface(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function halo(ctx, x, y, radius, stops) {
  const paint = ctx.createRadialGradient(x, y, 0, x, y, radius);
  for (const [offset, color] of stops) paint.addColorStop(offset, color);
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  ctx.fill();
}
export function makeSky(width, height, seed = 604) {
  const canvas = surface(width, height);
  const ctx = canvas.getContext('2d');
  const dice = random(seed);
  ctx.fillStyle = '#08131c';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 100; i++) {
    const u = dice();
    const x = width * u;
    const y = height * (.77 - .52 * u + .12 * Math.sin(u * 7) + (dice() - .5) * .4);
    const r = Math.min(width, height) * (.035 + .19 * dice());
    const tint = i % 4 ? 'rgba(22,84,85,.09)' : 'rgba(134,77,108,.11)';
    halo(ctx, x, y, r, [[0, tint], [1, 'transparent']]);
  }
  const count = Math.max(600, width * height / 490);
  for (let i = 0; i < count; i++) {
    const x = dice() * width, y = dice() * height;
    const energy = dice() ** 4;
    ctx.globalAlpha = .12 + energy * .65;
    ctx.fillStyle = ['#e3deb9', '#bbdfe6', '#e5b998'][i % 3];
    ctx.beginPath();
    ctx.arc(x, y, .25 + energy * 1.1, 0, tau);
    ctx.fill();
    if (energy > .96) {
      halo(ctx, x, y, 7, [[0, '#e4dbac66'], [1, 'transparent']]);
      ctx.fillRect(x - 3.8, y - .25, 7.6, .5);
      ctx.fillRect(x - .25, y - 3.8, .5, 7.6);
    }
  }
  return canvas;
}
export function makeGalaxy(seed, hue) {
  const canvas = surface(300);
  const ctx = canvas.getContext('2d');
  const dice = random(seed);
  ctx.translate(150, 150);
  ctx.scale(1, .58);
  halo(ctx, 0, 0, 140, [[0, '#efc29b99'], [.25, '#dbb59539'], [.72, hue + '1c'], [1, 'transparent']]);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6500; i++) {
    const r = 2 + 128 * dice() ** .76;
    const angle = (i % 3) * tau / 3 + 2.5 * Math.log(1 + r / 12) + (dice() + dice() - 1) * (.62 + r / 180);
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    ctx.globalAlpha = (.06 + .48 * dice()) * (1 - r / 145);
    ctx.fillStyle = i % 5 ? hue : '#f2c2a2';
    const size = .5 + dice() ** 3 * 2.2;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  halo(ctx, 0, 0, 45, [[0, '#ffffe8'], [.065, '#fff2d9'], [.22, '#efc8a6c9'], [.60, '#d1a99350'], [1, 'transparent']]);
  return canvas;
}
export function globe(ctx, x, y, r, body, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, tau);
  ctx.clip();
  ctx.fillStyle = body.color;
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  if (body.name === 'Earth') {
    for (let lat = -1.42; lat < 1.43; lat += .072) {
      for (let lon = -1.55; lon < 1.56; lon += .056) {
        const a = lon + .035 * time;
        const land = Math.sin(2*a + 1.6*lat) + .6*Math.cos(3*a - 3*lat) + .38*Math.sin(6*a + lat) + .18*Math.cos(9*a - 4*lat);
        if (land < .37 && Math.abs(lat) < 1.24) continue;
        ctx.fillStyle = Math.abs(lat) > 1.24 ? '#c4d3ba' : '#a5a66c';
        ctx.fillRect(r*Math.cos(lat)*Math.sin(lon), -r*Math.sin(lat), Math.max(1,r*.061*Math.cos(lon)), Math.max(1,r*.079*Math.cos(lat)));
      }
    }
  } else if (body.name === 'Jupiter' || body.name === 'Saturn') {
    ctx.strokeStyle = '#79504388';
    ctx.lineWidth = Math.max(.7, r*.12);
    for (let j = -2; j < 3; j++) {
      ctx.beginPath();
      ctx.moveTo(-r,j*r*.36);
      ctx.quadraticCurveTo(0,(j*.36+.18)*r,r,j*r*.36);
      ctx.stroke();
    }
  }
  const shade = ctx.createRadialGradient(-r*.4,-r*.42,r*.06,r*.13,r*.14,r*1.13);
  shade.addColorStop(0,'#fff2d451');
  shade.addColorStop(.52,'#12212a08');
  shade.addColorStop(.94,'#07121bcd');
  shade.addColorStop(1,'#09151c');
  ctx.fillStyle = shade;
  ctx.fillRect(-r,-r,2*r,2*r);
  ctx.restore();
}
export function sun(ctx,x,y,radius) {
  halo(ctx,x,y,radius*4,[[0,'#ffe3a8'],[.23,'#f4b661db'],[.36,'#f7ac4d49'],[1,'transparent']]);
  halo(ctx,x,y,radius,[[0,'#fff9ce'],[.65,'#ffdf87'],[.95,'#ed9a48'],[1,'#c66d31']]);
}
