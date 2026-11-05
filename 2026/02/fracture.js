// Deterministic Delaunay shards: the convex hull is exactly the page rectangle.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function randomSource(seed = 27) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function circle(a, b, c) {
  const d = 2 * (a.x * (b.y-c.y) + b.x * (c.y-a.y) + c.x * (a.y-b.y));
  if (Math.abs(d) < 1e-8) return null;
  const aa = a.x*a.x+a.y*a.y, bb = b.x*b.x+b.y*b.y, cc = c.x*c.x+c.y*c.y;
  const x = (aa*(b.y-c.y)+bb*(c.y-a.y)+cc*(a.y-b.y))/d;
  const y = (aa*(c.x-b.x)+bb*(a.x-c.x)+cc*(b.x-a.x))/d;
  return { x, y, r2: (x-a.x)**2+(y-a.y)**2 };
}
export function triangulate(points) {
  const m = Math.max(...points.flatMap(p => [Math.abs(p.x), Math.abs(p.y)])) * 8 + 100;
  const n = points.length, all = [...points, {x:-m,y:-m}, {x:3*m,y:-m}, {x:-m,y:3*m}];
  const make = ids => ({ids, c:circle(...ids.map(i=>all[i]))});
  let triangles = [make([n,n+1,n+2])];
  for (let i=0; i<n; i++) {
    const p = all[i], edges = new Map(), kept = [];
    for (const t of triangles) {
      if (t.c && (p.x-t.c.x)**2+(p.y-t.c.y)**2 <= t.c.r2+1e-6) {
        for (let j=0;j<3;j++) {
          const pair=[t.ids[j],t.ids[(j+1)%3]], key=[...pair].sort((a,b)=>a-b).join(',');
          if(edges.has(key)) edges.delete(key); else edges.set(key,pair);
        }
      } else kept.push(t);
    }
    for (const edge of edges.values()) { const t=make([...edge,i]); if(t.c) kept.push(t); }
    triangles=kept;
  }
  return triangles.filter(t=>t.ids.every(i=>i<n)).map(t=>t.ids.map(i=>all[i]));
}
export function createShards(width, height, origin) {
  const random=randomSource(29), points=[], diagonal=Math.hypot(width,height);
  const add=(x,y)=>{if(!points.some(p=>Math.hypot(p.x-x,p.y-y)<2))points.push({x,y});};
  // Edge points guarantee coverage, even for impacts close to a corner.
  for(let i=0;i<=5;i++){add(width*i/5,0);add(width*i/5,height);}
  for(let i=1;i<5;i++){add(0,height*i/5);add(width,height*i/5);}
  add(origin.x,origin.y);
  for(const radius of [.09,.22,.43,.7]) for(let i=0;i<12;i++) {
    const a=i*Math.PI/6+(random()-.5)*.23, r=diagonal*radius*(.8+random()*.35);
    const x=origin.x+Math.cos(a)*r,y=origin.y+Math.sin(a)*r;
    if(x>3&&x<width-3&&y>3&&y<height-3)add(x,y);
  }
  return triangulate(points).map(vertices=>{
    const cx=vertices.reduce((s,p)=>s+p.x,0)/3,cy=vertices.reduce((s,p)=>s+p.y,0)/3;
    const distance=Math.hypot(cx-origin.x,cy-origin.y),angle=Math.atan2(cy-origin.y,cx-origin.x);
    return { vertices, cx, cy, distance, angle, delay:.72+distance/diagonal*.52,
      rx:(random()-.5)*5, ry:(random()-.5)*6, rz:(random()-.5)*3,
      push:.7+random()*.6, shade:random() };
  });
}
export function projectShard(shard, time, width, height) {
  const p=clamp((time-shard.delay)/2.25), kick=p*p*(3-2*p), fall=p*p;
  const ax=shard.rx*p, ay=shard.ry*p, az=shard.rz*p;
  const dx=Math.cos(shard.angle)*width*.72*kick*shard.push;
  const dy=Math.sin(shard.angle)*height*.4*kick+height*2.2*fall;
  const dz=Math.sin(p*Math.PI)*160, perspective=Math.max(width,height)*1.2;
  const points=shard.vertices.map(v=>{
    let x=v.x-shard.cx,y=v.y-shard.cy,z=0;
    [y,z]=[y*Math.cos(ax),y*Math.sin(ax)];
    [x,z]=[x*Math.cos(ay)+z*Math.sin(ay),-x*Math.sin(ay)+z*Math.cos(ay)];
    [x,y]=[x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az)];
    const scale=perspective/(perspective-z-dz);
    return {x:shard.cx+dx+x*scale,y:shard.cy+dy+y*scale};
  });
  return {points,p,opacity:1-p**8,light:Math.abs(Math.sin(ay))*.3};
}
