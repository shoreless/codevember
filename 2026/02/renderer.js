import * as T from '../../assets/vendor/three.module.min.js';
// The same 3D scene can be projected in Canvas when WebGL is unavailable.
// This keeps the narrative accessible on restricted or older devices.
export function createRenderer(){
 const canvas=document.createElement('canvas');
 let gl=null;try{gl=canvas.getContext('webgl2',{antialias:true,alpha:false});}catch{}
 if(gl){const renderer=new T.WebGLRenderer({canvas,context:gl,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.software=false;return renderer;}
 return new Painter();
}
class Painter{
 constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d');this.software=true;this.width=1;this.height=1;}
 setSize(w,h){this.width=w;this.height=h;this.domElement.width=w;this.domElement.height=h;}
 render(scene,camera){
  const c=this.ctx,w=this.width,h=this.height;c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle='#'+scene.background.getHexString();c.fillRect(0,0,w,h);
  scene.updateMatrixWorld();camera.updateMatrixWorld();const view=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];
  const light=new T.Vector3(-.5,1,.7).normalize(),eye=camera.position,frustum=new T.Frustum().setFromProjectionMatrix(view);
  scene.traverseVisible(mesh=>{
   if(!mesh.isMesh||!frustum.intersectsObject(mesh))return;
   const g=mesh.geometry,a=g.attributes.position;if(!a)return;const material=mesh.material;if(Array.isArray(material)||material.opacity===0)return;
   if(!g.boundingSphere)g.computeBoundingSphere();const center=g.boundingSphere.center.clone().applyMatrix4(mesh.matrixWorld),cp=center.clone().applyMatrix4(view);
   if(cp.z>1.05||cp.z< -1.1)return;
   const proj=new T.Matrix4().multiplyMatrices(view,mesh.matrixWorld),world=mesh.matrixWorld;
   const vertices=[],worlds=[],uv=g.attributes.uv;
   for(let i=0;i<a.count;i++){const p=new T.Vector3(a.getX(i),a.getY(i),a.getZ(i));worlds.push(p.clone().applyMatrix4(world));p.applyMatrix4(proj);vertices.push({x:(p.x*.5+.5)*w,y:(-.5*p.y+.5)*h,z:p.z});}
   const idx=g.index,count=idx?idx.count:a.count;
   for(let i=0;i<count;i+=3){const indices=[0,1,2].map(j=>idx?idx.getX(i+j):i+j),p=indices.map(j=>vertices[j]);
    if(p.some(v=>v.z< -1||v.z>1))continue;
    if(p.every(v=>v.x<0)||p.every(v=>v.x>w)||p.every(v=>v.y<0)||p.every(v=>v.y>h))continue;
    const area=(p[1].x-p[0].x)*(p[2].y-p[0].y)-(p[1].y-p[0].y)*(p[2].x-p[0].x);
    if(Math.abs(area)<.12||(material.side===T.FrontSide&&area>0)||(material.side===T.BackSide&&area<0))continue;
    const [aa,bb,cc]=indices.map(j=>worlds[j]),normal=bb.clone().sub(aa).cross(cc.clone().sub(aa)).normalize();if(normal.dot(eye.clone().sub(aa))<0)normal.negate();
    const color=material.color?.clone()||new T.Color('#ffffff');
    if(!material.isMeshBasicMaterial){const shade=.55+Math.max(0,normal.dot(light))*.7; color.multiplyScalar(shade);const spec=Math.max(0,normal.dot(light.clone().add(eye.clone().sub(aa).normalize()).normalize()))**24*(material.metalness||0)*.6;color.addScalar(spec);}
    if(scene.fog){const dist=center.distanceTo(camera.position),f=T.MathUtils.smoothstep(dist,scene.fog.near,scene.fog.far);color.lerp(scene.fog.color,f);}
    faces.push({order:mesh.userData.ground||0,p,color:'#'+color.getHexString(),alpha:material.opacity,depth:(p[0].z+p[1].z+p[2].z)/3,map:material.map?.image,uv:uv?indices.map(j=>[uv.getX(j),uv.getY(j)]):null});
   }
  });
  faces.sort((a,b)=>a.order-b.order||b.depth-a.depth);
  for(const f of faces){c.globalAlpha=f.alpha;c.beginPath();c.moveTo(f.p[0].x,f.p[0].y);c.lineTo(f.p[1].x,f.p[1].y);c.lineTo(f.p[2].x,f.p[2].y);c.closePath();
   if(f.map&&f.uv){c.save();c.clip();const src=f.uv.map(([u,v])=>({x:u*f.map.width,y:(1-v)*f.map.height})),[a,b,d]=src,[u,v,e]=f.p;const det=(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y);if(Math.abs(det)>1e-9){const A=((v.x-u.x)*(d.y-a.y)-(e.x-u.x)*(b.y-a.y))/det,C=((e.x-u.x)*(b.x-a.x)-(v.x-u.x)*(d.x-a.x))/det,B=((v.y-u.y)*(d.y-a.y)-(e.y-u.y)*(b.y-a.y))/det,D=((e.y-u.y)*(b.x-a.x)-(v.y-u.y)*(d.x-a.x))/det;c.transform(A,B,C,D,u.x-A*a.x-C*a.y,u.y-B*a.x-D*a.y);c.drawImage(f.map,0,0);}c.restore();}
   else{c.fillStyle=f.color;c.fill();if(f.alpha===1){c.strokeStyle=f.color;c.lineWidth=.45;c.stroke();}}
  }
  c.globalAlpha=1;
 }
}
