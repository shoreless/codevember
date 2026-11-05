export const duration=46;
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
export function track(keys,t){
 if(t<=keys[0][0])return keys[0].slice(1);
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const p=smooth(keys[i-1][0],keys[i][0],t);return keys[i].slice(1).map((v,j)=>mix(keys[i-1][j+1],v,p));}
 return keys.at(-1).slice(1);
}
export function story(t){
 t=clamp(t,0,duration);
 const camera=track([[0,0,2.5,9],[11,0,2.5,9],[16,0,2.2,3],[19,0,1.8,-2.6],[25,-.15,1.7,-3.5],[28,.15,1.8,-7.8],[32,.1,1.9,-9.4],[36,0,2.0,-13],[40,0,2.05,-17.5],[46,0,1.8,-18.6]],t);
 const look=track([[0,0,2.5,0],[11,0,2.5,0],[17,0,1,-5],[24,-.55,1,-7],[29,.5,1,-12],[33,.4,1.2,-14],[37,0,1,-20],[41,0,1.3,-23],[46,-.15,1.3,-23]],t);
 const guide=track([[0,0,1.65,.4],[11,0,1.65,.4],[17,0,0,-4.1],[20,0,0,-6.3],[24.6,0,0,-6.3],[27,0,0,-11.2],[30,0,0,-11.2],[33,0,0,-15.6],[35,0,0,-15.6],[39,0,.55,-22.4],[46,0,.55,-22.4]],t);
 return {t,camera,look,guide,eggCrack:smooth(.6,8,t),eggOpen:smooth(8,15,t),page:smooth(10,16,t),scale:mix(.36,1.15,smooth(11,17,t)),
  pinch:smooth(20.2,21.2,t)*(1-smooth(24,25,t)),stretch:smooth(21.5,23.4,t),bite:smooth(23.4,24.3,t),
  snap:smooth(27.5,28.2,t),sugarEat:smooth(28.6,29.8,t),sit:smooth(37.4,39,t),offer:smooth(41,45,t),
  phase:t<8?'The golden egg':t<16?'The page is a shell':t<20?'Into the forest':t<26?'Fondant mushrooms':t<31?'Sugar ferns':t<37?'Praline branches':'A small offering'};
}

export function framing(s,aspect){
 const camera=s.camera.slice(),look=s.look.slice();
 const snackShot=smooth(17,20,s.t)*(1-smooth(35,39,s.t));
 camera[2]+=snackShot*1.25;
 if(s.t>15)camera[2]+=Math.max(0,1/aspect-1)*2.6*smooth(15,19,s.t);
 look[0]*=Math.min(1,aspect);look[1]-=snackShot*.2;
 return {camera,look};
}
