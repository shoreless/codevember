export const duration=34;
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,t)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
// Every attached surface uses the same world-space field: no detached windows
// or rigid pipework remains behind as the factory liquefies.
export function deform(x,y,z,t){
 const top=clamp(y/11.5),p=smooth(8+(1-top)*3,26+(1-top)*3,t);
 const sag=Math.sin(p*Math.PI),soft=smooth(5,12,t)*(1-smooth(24,29,t));
 return [x*(1+.18*p)+Math.sin(y*.45+z*.65)*y*.105*sag+x*y*.045*p,
 Math.max(.025,y*(1-p)**2+Math.sin(x*.8+z*.6)*.16*sag)+.014*soft*Math.sin(x*2+z),
 z*(1+.25*p)+Math.sin(y*.55+x*.4)*y*.07*sag+z*y*.045*p];
}
export function state(t){t=clamp(t,0,duration);return {t,heat:smooth(4,12,t),chocolate:smooth(7,23,t),pool:smooth(10,29,t),quiet:smooth(27,33,t),phase:t<6?'The factory':t<13?'Something is softening':t<23?'Chocolate machinery':t<30?'The last chimney':'Still chocolate'};}
export function cameraFrame(aspect,t){
 const orbit=smooth(0,26,t),angle=.68+orbit*.2;
 return {position:[Math.sin(angle)*23,mix(12,16,smooth(18,32,t)),Math.cos(angle)*23],target:[0,mix(4.9,.6,smooth(8,30,t)),0],halfHeight:Math.max(mix(8.2,6.9,smooth(20,34,t)),7.7/aspect)};
}
