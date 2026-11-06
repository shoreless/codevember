export const duration=38;
export const clamp=v=>Math.max(0,Math.min(1,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,t)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
export const phase=t=>t<3?'Ricardo Junior':t<9?'A first shoot':t<17?'Finding the light':t<28?'Getting tangled':t<35?'One leaf at a time':'Ricardo Junior, all grown up';
export function cameraFrame(aspect,t){
 const p=smooth(3,31,t),angle=.18+smooth(7,35,t)*.13;
 return {position:[Math.sin(angle)*22,mix(6,9.8,p),Math.cos(angle)*22],target:[mix(0,-.7,smooth(3,18,t)),mix(1.05,5.8,p),0],halfHeight:Math.max(mix(2.9,7,p),mix(2.5,4.1,smooth(3,18,t))/aspect)};
}
