import * as T from '../../assets/vendor/three.module.min.js';
// Combine static scenery by material to keep mobile draw calls modest.
export function batchScenery(root,excluded){
 root.updateMatrixWorld(true);const groups=new Map();
 function visit(object){if(excluded.has(object))return;if(object.isMesh){const m=object.material,key=[m.type,m.color.getHex(),m.roughness,m.metalness,m.opacity,m.side].join(':');if(!groups.has(key))groups.set(key,{material:m,meshes:[]});groups.get(key).meshes.push(object);}for(const child of object.children)visit(child);}
 visit(root);
 for(const {material,meshes}of groups.values()){
  const positions=[],normals=[],indices=[];let offset=0;
  for(const mesh of meshes){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);positions.push(v.x,v.y,v.z);const normal=new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();normals.push(normal.x,normal.y,normal.z);}if(g.index)for(const index of g.index.array)indices.push(offset+index);else for(let i=0;i<p.count;i++)indices.push(offset+i);offset+=p.count;mesh.removeFromParent();}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 }
}
