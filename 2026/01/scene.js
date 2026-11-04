import * as THREE from '../../assets/vendor/three.module.min.js';

// An original, stylized paper-fold choreography, not a physical origami solver.
// Every triangle belongs to one connected sheet; the shared fold vertices are
// evaluated identically so scrubbing never separates the paper into pieces.
const duration = 36;
const stage = document.querySelector('#stage');
const play = document.querySelector('#play');
const replay = document.querySelector('#replay');
const timeline = document.querySelector('#timeline');
const elapsed = document.querySelector('#elapsed');
const playLabel = document.querySelector('#play-label');
const playIcon = document.querySelector('#play-icon');
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
const environment = pmrem.fromScene(envScene, .02);
pmrem.dispose();
envScene.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
// Six connected-looking shell panels meet at zigzag seams. They first split,
// then unbend radially into a golden paper flower; no exploding fragments.
const egg = new THREE.Group();
egg.position.y = .035;
paper.add(egg);
const shellMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffc65b', metalness: .92, roughness: .25, envMap: environment.texture, envMapIntensity: 1.5, clearcoat: .3, side: THREE.DoubleSide });
const shellPanels = [];
const panelRows = 16, panelCols = 8, panelCount = 6;
for (let panel = 0; panel < panelCount; panel++) {
  const positions = [], indices = [];
  for (let row = 0; row <= panelRows; row++) for (let col = 0; col <= panelCols; col++) positions.push(0, 0, 0);
  for (let row = 0; row < panelRows; row++) for (let col = 0; col < panelCols; col++) {
    const a = row * (panelCols + 1) + col, b = a + panelCols + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const shape = new THREE.BufferGeometry();
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  shape.setIndex(indices);
  const mesh = new THREE.Mesh(shape, shellMaterial);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  egg.add(mesh);
  const seamGeometry = new THREE.BufferGeometry();
  seamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((panelRows + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const seam = new THREE.Line(seamGeometry, new THREE.LineBasicMaterial({ color: '#734811', transparent: true, opacity: 0 }));
  seam.frustumCulled = false;
  egg.add(seam);
  shellPanels.push({ shape, seam, seamGeometry });
}
function shellPoint(panel, row, col, split, opening) {
  const v = row / panelRows, phi = v * Math.PI;
  const centre = (panel + .5) * Math.PI / 3;
  const jag = (row % 2 ? .045 : -.045) * Math.sin(phi);
  const theta = (panel + col / panelCols) * Math.PI / 3 + jag;
  const y = -Math.cos(phi);
  const radius = .345 * Math.sin(phi) * (1 - .18 * y);
  const flatWidth = Math.sin(Math.PI * v) * .82 + .16;
  const flatAngle = centre + (theta - centre) * flatWidth;
  const flatRadius = v * 1.32;
  const crack = .045 * split * Math.sin(phi / 2) * (1 - opening);
  return [
    mix(radius * Math.cos(theta), flatRadius * Math.cos(flatAngle), opening) + Math.cos(centre) * crack,
    mix(.49 * (y + 1), .014 + Math.sin(phi) * .025, opening),
    mix(radius * Math.sin(theta), flatRadius * Math.sin(flatAngle), opening) + Math.sin(centre) * crack,
  ];
}
function animateShell(t) {
  const split = smooth(17.4, 19.1, t);
  const opening = smooth(19, 22.1, t);
  egg.visible = t >= 7.1;
  egg.scale.setScalar(smooth(7.1, 7.7, t));
  const wiggle = smooth(16.4, 17.2, t) * (1 - smooth(18.4, 19.1, t));
  egg.rotation.z = Math.sin(t * 21) * .065 * wiggle;
  egg.rotation.x = Math.cos(t * 16) * .035 * wiggle;
  shellPanels.forEach(({ shape, seam, seamGeometry }, panel) => {
    const unfurl = smooth(19 + panel * .09, 21.65 + panel * .09, t);
    const points = shape.attributes.position;
    for (let row = 0; row <= panelRows; row++) for (let col = 0; col <= panelCols; col++) {
      points.setXYZ(row * (panelCols + 1) + col, ...shellPoint(panel, row, col, split, unfurl));
    }
    points.needsUpdate = true; shape.computeVertexNormals();
    for (let row = 0; row <= panelRows; row++) {
      const point = shellPoint(panel, row, 0, split, unfurl);
      point[1] += .003;
      seamGeometry.attributes.position.setXYZ(row, ...point);
    }
    seamGeometry.attributes.position.needsUpdate = true;
    seam.material.opacity = .7 * split * (1 - .65 * opening);
  });
}
const glow = new THREE.PointLight('#ffcf73', 0, 2.5);
glow.position.set(0, .65, 0); paper.add(glow);

// Original 3D characters inspired by the reference's red pointed silhouettes,
// enormous white eyes and little patches of golden sweet-potato flesh.
// The reference photo itself is not used as an asset.
const white = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .65 });
const dark = new THREE.MeshStandardMaterial({ color: '#292027', roughness: .65 });
const flesh = new THREE.MeshStandardMaterial({ color: '#ffce51', roughness: .88, flatShading: true });
const limbMaterial = new THREE.MeshStandardMaterial({ color: '#75324b', roughness: .8 });
function ellipsoid(parent, material, position, scale) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
  mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true;
  parent.add(mesh); return mesh;
}
function makePotato(index) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); paper.add(root);
  const skin = new THREE.MeshStandardMaterial({ color: index ? '#b92552' : '#d2355d', roughness: .8, flatShading: true, bumpMap: fibre, bumpScale: .012 });
  const profile = [[0,.12],[.12,.14],[.20,.22],[.205,.34],[.17,.5],[.12,.65],[.065,.79],[.012,.91],[0,.94]];
  const shape = new THREE.LatheGeometry(profile.map(([r,y]) => new THREE.Vector2(r,y)), 24);
  const positions = shape.attributes.position;
  for (let n = 0; n < positions.count; n++) {
    const y = positions.getY(n);
    positions.setX(n, positions.getX(n) + .055 * Math.pow(y, 3));
  }
  shape.computeVertexNormals();
  const skinMesh = new THREE.Mesh(shape, skin); skinMesh.castShadow = true; body.add(skinMesh);
  const eyes = [];
  for (const x of [-.095,.095]) {
    const eye = ellipsoid(body, white, [x,.445,.173], [.102,.111,.045]);
    ellipsoid(body, dark, [x+.015,.443,.214], [.061,.071,.025]);
    ellipsoid(body, white, [x+.035,.474,.236], [.015,.018,.008]);
    eyes.push(eye);
  }
  // A wobbly golden patch and a smiling mouth, below the googly eyes.
  const patchShape = new THREE.Shape();
  for (let i = 0; i <= 20; i++) {
    const a = i / 20 * Math.PI * 2, jitter = i % 2 ? .94 : 1.06;
    const x = Math.cos(a) * .155 * jitter, y = Math.sin(a) * .065 * jitter;
    if (!i) patchShape.moveTo(x,y); else patchShape.lineTo(x,y);
  }
  const patch = new THREE.Mesh(new THREE.ShapeGeometry(patchShape), flesh);
  patch.position.set(0,.26,.205); body.add(patch);
  const smilePoints = Array.from({length:13},(_,i) => {
    const a = Math.PI + i / 12 * Math.PI;
    return new THREE.Vector3(Math.cos(a)*.042, .272+Math.sin(a)*.027,.213);
  });
  body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints),16,.008,6,false),dark));
  const arms = [], legs = [];
  for (const sign of [-1,1]) {
    const arm = new THREE.Group(); arm.position.set(sign*.18,.34,0); body.add(arm);
    ellipsoid(arm, limbMaterial,[sign*.045,-.05,0],[.035,.09,.035]);
    ellipsoid(arm, limbMaterial,[sign*.067,-.115,0],[.048,.045,.045]); arms.push(arm);
    const leg = new THREE.Group(); leg.position.set(sign*.085,.13,0); root.add(leg);
    ellipsoid(leg, limbMaterial,[0,-.055,0],[.026,.065,.026]);
    ellipsoid(leg, limbMaterial,[0,-.105,.035],[.055,.03,.09]); legs.push(leg);
  }
  return {root,body,arms,legs,size:index?.72:.8,index};
}
const babies = [makePotato(0),makePotato(1)];
function animateBabies(t) {
  babies.forEach(({root,body,arms,legs,size,index}) => {
    const birth = 21.1 + index*.48;
    const jump = clamp((t-birth)/1.35,0,1);
    const growth = smooth(birth,birth+.3,t);
    const run = Math.max(0,t-24);
    const stop = smooth(32.8,34.8,t);
    const braking = clamp(t-32.8,0,2);
    const speed = Math.min(run,8.8) + braking - braking**3/4 + braking**4/16;
    const angle = .45 + index*Math.PI + speed*1.35;
    const entry = smooth(23,24,t);
    const sign = index ? 1 : -1;
    const startX = sign*.72, startZ = .45;
    const orbitX = Math.cos(angle)*1.92, orbitZ = Math.sin(angle)*1.72;
    const finish = smooth(33,35,t);
    root.visible = t>=birth;
    root.scale.setScalar(size*growth);
    root.position.set(
      mix(mix(startX*jump,orbitX,entry),sign*.72,finish),
      .025 + Math.sin(jump*Math.PI)*.95 + Math.abs(Math.sin(run*11+index))* .065*entry*(1-stop),
      mix(mix(startZ*jump,orbitZ,entry),1.65,finish)
    );
    // Keep their expressions readable while their bodies lean into the chase.
    root.rotation.y = .72 + Math.sin(angle)*.42*entry*(1-finish);
    root.rotation.z = Math.sin(run*11+index)*.075*entry*(1-stop);
    body.rotation.x = -.08*entry*(1-stop);
    const gait = Math.sin(run*15+index*Math.PI)*.7*entry*(1-stop);
    legs[0].rotation.x=gait; legs[1].rotation.x=-gait;
    arms[0].rotation.x=-gait; arms[1].rotation.x=gait;
    arms[0].rotation.z=.3*(1-jump);
    arms[1].rotation.z=-.3*(1-jump)-smooth(34.2,35,t)*(.9+Math.sin(t*9)*.18);
  });
}

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
  animateShell(t);
  animateBabies(t);
  glow.intensity = .12 * smooth(11, 15, t) * (1 - smooth(22,24,t));
  const chapter = t < 1.5 ? 0 : t < 9.2 ? 1 : t < 17.4 ? 2 : t < 23 ? 3 : 4;
  const labels = ['Flat paper', 'Folding', 'Golden egg', 'Hatching', 'Running'];
  timeline.value = String(t);
  timeline.style.setProperty('--progress', `${100 * t / duration}%`);
  timeline.setAttribute('aria-valuetext', `${t.toFixed(1)} seconds of ${duration}, ${labels[chapter]}`);
  elapsed.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}`;
}
let time = 0;
let playing = false;
let lastFrame = null;
let frame = null;
function draw() {
  pose(time);
  camera.zoom = 1 + .18 * smooth(16.5,23,time);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
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
