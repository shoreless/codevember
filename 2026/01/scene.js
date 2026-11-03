import * as THREE from '../../assets/vendor/three.module.min.js';

// An original, stylized paper-fold choreography, not a physical origami solver.
// Every triangle belongs to one connected sheet; the shared fold vertices are
// evaluated identically so scrubbing never separates the paper into pieces.
const duration = 18;
const stage = document.querySelector('#stage');
const play = document.querySelector('#play');
const replay = document.querySelector('#replay');
const timeline = document.querySelector('#timeline');
const elapsed = document.querySelector('#elapsed');
const playLabel = document.querySelector('#play-label');
const playIcon = document.querySelector('#play-icon');
const sceneNumber = document.querySelector('#scene-number');
const sceneLabel = document.querySelector('#scene-label');
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a, b, t) => { const v = clamp((t - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f2f0e9');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
stage.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-hidden', 'true');
const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, .1, 60);
camera.position.set(6.2, 8.8, 11);
camera.lookAt(0, .35, 0);
scene.add(new THREE.HemisphereLight('#fff8e9', '#8d7786', 2.4));
const key = new THREE.DirectionalLight('#fff1d6', 4.5);
key.position.set(-3, 8, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 25 });
key.shadow.normalBias = .035;
key.shadow.bias = -.00015;
key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight('#eedbff', 1.8);
fill.position.set(5, 4, -5);
scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#75606b', opacity: .16 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -.035;
floor.receiveShadow = true;
scene.add(floor);
const paper = new THREE.Group();
paper.rotation.y = -.21;
paper.position.set(.35, .08, .1);
scene.add(paper);

// A deterministic fibre texture makes the facets read as matte paper.
const textureCanvas = document.createElement('canvas');
textureCanvas.width = textureCanvas.height = 512;
const ctx = textureCanvas.getContext('2d');
ctx.fillStyle = '#bbb6b0'; ctx.fillRect(0, 0, 512, 512);
let seed = 19;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let i = 0; i < 20000; i++) {
  const shade = Math.floor(120 + random() * 110);
  ctx.fillStyle = `rgba(${shade},${shade},${shade},.22)`;
  ctx.fillRect(random() * 512, random() * 512, .5 + random() * 2.5, .5);
}
const fibre = new THREE.CanvasTexture(textureCanvas);
fibre.wrapS = fibre.wrapT = THREE.RepeatWrapping;
fibre.repeat.set(2, 2);
const outside = new THREE.MeshStandardMaterial({ color: '#71334f', roughness: .86, side: THREE.BackSide, flatShading: true, vertexColors: true, bumpMap: fibre, bumpScale: .018 });
const inside = new THREE.MeshStandardMaterial({ color: '#bb8494', roughness: .94, side: THREE.FrontSide, flatShading: true, vertexColors: true, bumpMap: fibre, bumpScale: .012 });
const xs = [-2.56, -2.23, -1.64, -.85, 0, .85, 1.64, 2.23, 2.56];
const radii = [.045, .40, .78, .98, 1, .93, .69, .29, .035];
const vertices = [];
const uvs = [];
const colors = [];
const triangles = [];
for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
  const a = [i, j], b = [i + 1, j], c = [i + 1, j + 1], d = [i, j + 1];
  const faces = (i + j) % 2 ? [[a, d, b], [b, d, c]] : [[a, c, b], [a, d, c]];
  for (const face of faces) {
    const shade = .89 + random() * .11;
    for (const [row, col] of face) {
      triangles.push([row, col]); vertices.push(0, 0, 0);
      uvs.push(row / 8, col / 8); colors.push(shade, shade, shade);
    }
  }
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const outerMesh = new THREE.Mesh(geometry, outside);
const innerMesh = new THREE.Mesh(geometry, inside);
outerMesh.castShadow = innerMesh.castShadow = true;
outerMesh.receiveShadow = innerMesh.receiveShadow = true;
// Deformation is larger than the initial plane's bounds.
outerMesh.frustumCulled = innerMesh.frustumCulled = false;
paper.add(outerMesh, innerMesh);

const edgePairs = [];
for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) edgePairs.push([[i, j], [i, j + 1]]);
for (let i = 0; i < 8; i++) for (let j = 0; j < 9; j++) edgePairs.push([[i, j], [i + 1, j]]);
const creaseGeometry = new THREE.BufferGeometry();
creaseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(edgePairs.length * 6), 3).setUsage(THREE.DynamicDrawUsage));
const creases = new THREE.LineSegments(creaseGeometry, new THREE.LineBasicMaterial({ color: '#653249', transparent: true, opacity: .17, depthWrite: false }));
creases.frustumCulled = false;
paper.add(creases);

// A small environment made from luminous panels gives the gold real reflections.
const envScene = new THREE.Scene();
envScene.background = new THREE.Color('#bdb4a0');
for (const [position, size, color, intensity] of [
  [[-4, 6, 3], [4, 7], '#fff4d6', 5],
  [[4, 3, -3], [2, 6], '#fff9eb', 3],
  [[0, 7, -1], [5, 5], '#ffffff', 2],
]) {
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
  panel.position.set(...position); panel.lookAt(0, 0, 0); envScene.add(panel);
}
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(envScene, .08);
pmrem.dispose();
envScene.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
const eggGeometry = new THREE.SphereGeometry(1, 48, 32);
const eggPositions = eggGeometry.attributes.position;
for (let i = 0; i < eggPositions.count; i++) {
  const y = eggPositions.getY(i);
  const taper = 1 - .18 * y;
  eggPositions.setXYZ(i, eggPositions.getX(i) * .245 * taper, y * .355, eggPositions.getZ(i) * .245 * taper);
}
eggGeometry.computeVertexNormals();
const egg = new THREE.Mesh(eggGeometry, new THREE.MeshPhysicalMaterial({ color: '#ffc65b', metalness: 1, roughness: .2, envMap: environment.texture, envMapIntensity: 1.5, clearcoat: .35 }));
egg.position.set(0, .43, 0);
egg.rotation.z = -.13;
egg.castShadow = true;
paper.add(egg);
const glow = new THREE.PointLight('#ffcf73', 0, 2.5);
glow.position.set(0, .65, 0);
paper.add(glow);

// Strip hinges close from the outside inward. Tip pleats tuck into a tapered
// envelope. Shared vertices keep the two skins and their crease lines aligned.
function paperPoint(row, col, t) {
  const opening = smooth(9.2, 14.8, t);
  const pinch = smooth(3.6, 6.8, t) * (1 - smooth(10.5, 14.1, t));
  const side = col < 4 ? -1 : 1;
  const count = Math.abs(col - 4);
  const delay = side < 0 ? .38 : 0;
  let angle = 0, y = 0, z = 0;
  for (let segment = 0; segment < count; segment++) {
    const start = 1.25 + (3 - segment) * .78 + delay;
    const hinge = smooth(start, start + 1.65, t) * (1 - opening);
    angle += (segment === 0 ? Math.PI / 8 : Math.PI / 4) * hinge;
    const length = .64 * mix(1, radii[row], pinch);
    y += Math.sin(angle) * length;
    z += Math.cos(angle) * length;
  }
  const end = Math.pow(Math.abs(xs[row]) / 2.56, 3);
  const warp = Math.sin(row * 1.7 + col * 1.1) * .036 * pinch * Math.sin(count * Math.PI / 4);
  const x = xs[row] - Math.sign(xs[row]) * end * (count / 4) * .16 * pinch;
  return [x, y + end * .17 * pinch + warp, side * z + Math.sin(row * .7) * .08 * pinch];
}
function pose(t) {
  const points = xs.map((_, row) => Array.from({ length: 9 }, (_, col) => paperPoint(row, col, t)));
  const attribute = geometry.attributes.position;
  for (let n = 0; n < triangles.length; n++) {
    const [row, col] = triangles[n]; attribute.setXYZ(n, ...points[row][col]);
  }
  attribute.needsUpdate = true;
  geometry.computeVertexNormals();
  const lines = creaseGeometry.attributes.position;
  edgePairs.forEach((pair, n) => pair.forEach(([row, col], endpoint) => lines.setXYZ(n * 2 + endpoint, ...points[row][col])));
  lines.needsUpdate = true;
  // The egg appears only while the fully closed, opaque potato hides it.
  // It stays at its full size through the entire opening and reveal.
  egg.visible = t >= 7.1;
  const emergence = smooth(7.1, 7.7, t);
  egg.scale.setScalar(emergence);
  egg.rotation.y = smooth(12.5, 17, t) * .5;
  glow.intensity = .12 * smooth(11, 15, t);
  const chapter = t < 1.5 ? 0 : t < 9.2 ? 1 : 2;
  const labels = ['A sheet of possibility', 'An ordinary sweet potato', 'A little wonder inside'];
  sceneNumber.textContent = String(chapter + 1).padStart(2, '0');
  sceneLabel.textContent = labels[chapter];
  timeline.value = String(t);
  timeline.style.setProperty('--progress', `${100 * t / duration}%`);
  timeline.setAttribute('aria-valuetext', `${t.toFixed(1)} seconds of 18, ${labels[chapter]}`);
  elapsed.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}`;
}
let time = 0;
let playing = false;
let lastFrame = null;
let frame = null;
function draw() { pose(time); renderer.render(scene, camera); }
function updateButton() {
  playLabel.textContent = playing ? 'Pause' : time >= duration ? 'Replay' : 'Play';
  play.setAttribute('aria-label', playing ? 'Pause animation' : time >= duration ? 'Replay animation' : 'Play animation');
  playIcon.innerHTML = playing ? '<path d="M7 5h4v14H7zm7 0h4v14h-4z"/>' : '<path d="m9 5 11 7-11 7Z"/>';
}
function tick(now) {
  frame = null;
  if (!playing) return;
  if (lastFrame !== null) time = Math.min(duration, time + Math.min((now - lastFrame) / 1000, .1));
  lastFrame = now;
  draw();
  if (time >= duration) { playing = false; lastFrame = null; updateButton(); }
  else frame = requestAnimationFrame(tick);
}
function setPlaying(value) {
  playing = value; lastFrame = null;
  if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
  updateButton();
  if (playing) frame = requestAnimationFrame(tick);
}
play.addEventListener('click', () => {
  if (time >= duration) { time = 0; draw(); }
  setPlaying(!playing);
});
replay.addEventListener('click', () => { time = 0; draw(); setPlaying(true); });
timeline.addEventListener('input', () => { setPlaying(false); time = Number(timeline.value); draw(); updateButton(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault(); setPlaying(false);
  document.querySelector('#fallback').hidden = false;
  document.querySelector('#fallback').textContent = 'The graphics context was interrupted. Refresh to fold again.';
  play.disabled = replay.disabled = timeline.disabled = true;
});
function resize() {
  const { width, height } = stage.getBoundingClientRect();
  const aspect = width / height;
  const halfWidth = Math.max(4.2, aspect * 3.6);
  camera.left = -halfWidth; camera.right = halfWidth;
  camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height); draw();
}
new ResizeObserver(resize).observe(stage);
play.disabled = replay.disabled = timeline.disabled = false;
document.querySelector('#fallback').hidden = true;
resize();
