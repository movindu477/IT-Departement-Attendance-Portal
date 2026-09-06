import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * A friendly blue mascot bot: rounded head, dark face plate, two white eyes and
 * a smile, side ear pods and a ball antenna.
 *
 * It watches the cursor anywhere on the page — the listener is bound to the
 * window, not the canvas, so the head keeps following even while you are
 * working in the calendar on the other side of the dashboard.
 *
 * Built from primitives, so there is no runtime model fetch to fail.
 * Returns a handle; call dispose() on unmount or the GL context leaks.
 */

const COLORS = {
  shell: 0x3b82f6,      // body blue
  shellDeep: 0x1d4ed8,  // ears / antenna base
  shellLight: 0x93c5fd, // highlights
  face: 0x0b1f4b,       // face plate
  eye: 0xffffff,
  glow: 0x60a5fa,
  grid: 0x2f3a52,
  gridSub: 0x1b2233,
  fog: 0x000000,
};

const MAX_YAW = 0.62;    // ~35deg
const MAX_PITCH = 0.34;  // ~19deg
const MAX_ROLL = 0.10;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Maps normalised cursor position (-1..1 across the viewport) to head angles.
 * Pure, so the tracking behaviour is testable without a browser.
 */
export function computeLookAngles(
  nx,
  ny,
  { maxYaw = MAX_YAW, maxPitch = MAX_PITCH, maxRoll = MAX_ROLL } = {}
) {
  const x = clamp(nx, -1, 1);
  const y = clamp(ny, -1, 1);
  return {
    yaw: x * maxYaw,      // +x turns the face toward the viewer's right
    pitch: y * maxPitch,  // +y (cursor lower on screen) tips the face down
    roll: -x * maxRoll,   // slight sympathetic tilt
  };
}

export function createRobotScene(container, { reducedMotion = false } = {}) {
  // ---------------------------------------------------------------- renderer
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null; // caller renders the CSS fallback
  }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  // ------------------------------------------------------------------- scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.fog, 5.0, 12.0); // matches the black card behind the canvas

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 1.30, 3.9);
  camera.lookAt(0, 1.16, 0);

  // Image-based lighting: a glossy blue shell needs real reflections to read as
  // moulded plastic rather than flat colour.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.35;
  roomEnv.traverse((o) => {
    if (o.isMesh) { o.geometry?.dispose?.(); o.material?.dispose?.(); }
  });
  pmrem.dispose();

  // ------------------------------------------------------------------ lights
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0a0a0a, 0.45));

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2.2, 4.2, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -2.2;
  key.shadow.camera.right = 2.2;
  key.shadow.camera.top = 2.8;
  key.shadow.camera.bottom = -0.4;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(COLORS.glow, 2.2);
  rim.position.set(-3.2, 1.8, -2.4);
  scene.add(rim);

  const fill = new THREE.PointLight(COLORS.shellLight, 4, 8, 2);
  fill.position.set(-1.4, 1.4, 2.2);
  scene.add(fill);

  // ------------------------------------------------------------------- floor
  const GRID_STEP = 0.5;
  const grid = new THREE.GridHelper(20, 40, COLORS.grid, COLORS.gridSub);
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  scene.add(grid);

  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.5 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.001;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // --------------------------------------------------------------- materials
  const geometries = [];
  const materials = [];
  const geo = (g) => { geometries.push(g); return g; };
  const mat = (m) => { materials.push(m); return m; };

  const matShell = mat(new THREE.MeshPhysicalMaterial({
    color: COLORS.shell, roughness: 0.28, metalness: 0.08,
    clearcoat: 1.0, clearcoatRoughness: 0.12,
  }));
  const matDeep = mat(new THREE.MeshPhysicalMaterial({
    color: COLORS.shellDeep, roughness: 0.34, metalness: 0.12, clearcoat: 0.8,
  }));
  const matFace = mat(new THREE.MeshPhysicalMaterial({
    color: COLORS.face, roughness: 0.08, metalness: 0.3,
    clearcoat: 1.0, clearcoatRoughness: 0.04,
  }));
  const matEye = mat(new THREE.MeshStandardMaterial({
    color: COLORS.eye, roughness: 0.25, metalness: 0.0,
    emissive: 0xffffff, emissiveIntensity: 0.5,
  }));
  const matGlow = mat(new THREE.MeshStandardMaterial({
    color: COLORS.glow, roughness: 0.3, metalness: 0.3,
    emissive: COLORS.glow, emissiveIntensity: 0.9,
  }));
  const matMetal = mat(new THREE.MeshStandardMaterial({
    color: 0xc3cfe4, roughness: 0.3, metalness: 1.0,
  }));

  const addMesh = (parent, g, m, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = {}) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ------------------------------------------------------------------- robot
  const robot = new THREE.Group();   // idle float / sway
  robot.position.y = 1.18;
  scene.add(robot);

  const head = new THREE.Group();    // cursor tracking happens here
  robot.add(head);

  // Skull: a wide rounded cube, matching the reference silhouette.
  addMesh(head, geo(new RoundedBoxGeometry(1.42, 1.2, 0.92, 6, 0.34)), matShell);

  // Face plate: dark rounded rectangle, sitting proud of the front face.
  addMesh(head, geo(new RoundedBoxGeometry(1.06, 0.86, 0.1, 5, 0.26)), matFace, { z: 0.44 });

  // Eyes: shallow domes. Grouped so they blink and drift together.
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.08, 0.5);
  head.add(eyes);

  const eyeGeo = geo(new THREE.SphereGeometry(0.105, 24, 18));
  const eyeL = addMesh(eyes, eyeGeo, matEye, { x: -0.235 });
  const eyeR = addMesh(eyes, eyeGeo, matEye, { x: 0.235 });
  eyeL.scale.z = 0.45;
  eyeR.scale.z = 0.45;

  // Smile: the lower half of a disc reads as a mouth at this scale.
  addMesh(head, geo(new THREE.CircleGeometry(0.2, 40, Math.PI, Math.PI)), matEye,
    { y: -0.16, z: 0.5 });

  // Ear pods
  const earGeo = geo(new RoundedBoxGeometry(0.2, 0.44, 0.38, 5, 0.12));
  addMesh(head, earGeo, matDeep, { x: -0.79 });
  addMesh(head, earGeo, matDeep, { x: 0.79 });

  // Antenna: stalk plus the glowing ring-ball from the reference.
  addMesh(head, geo(new THREE.CylinderGeometry(0.026, 0.026, 0.34, 12)), matMetal, { y: 0.76 });
  const bulb = addMesh(head, geo(new THREE.TorusGeometry(0.115, 0.045, 14, 28)), matGlow, { y: 1.02 });

  // ---------------------------------------------------------------- particles
  const COUNT = 60;
  const pPos = new Float32Array(COUNT * 3);
  const pSeed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 6.5;
    pPos[i * 3 + 1] = Math.random() * 3.0;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 4.5 - 0.5;
    pSeed[i] = Math.random();
  }
  const pGeo = geo(new THREE.BufferGeometry());
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = mat(new THREE.PointsMaterial({
    color: COLORS.glow, size: 0.032, transparent: true,
    opacity: 0.5, sizeAttenuation: true, depthWrite: false,
  }));
  scene.add(new THREE.Points(pGeo, pMat));

  // -------------------------------------------------------- cursor tracking
  // Bound to the window, not the canvas, so the bot follows the cursor across
  // the whole page rather than only while it is over the panel.
  const look = { nx: 0, ny: 0, yaw: 0, pitch: 0, roll: 0 };

  const onPointerMove = (e) => {
    look.nx = (e.clientX / window.innerWidth) * 2 - 1;
    look.ny = (e.clientY / window.innerHeight) * 2 - 1;
  };
  // Cursor left the document entirely -> ease back to centre.
  const onPointerOut = (e) => {
    if (!e.relatedTarget) { look.nx = 0; look.ny = 0; }
  };
  const onBlur = () => { look.nx = 0; look.ny = 0; };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerout', onPointerOut, { passive: true });
  window.addEventListener('blur', onBlur);

  // ------------------------------------------------------------------ blink
  let nextBlink = 2.5;
  let blinkT = -1;

  // -------------------------------------------------------------------- pose
  function pose(t, dt = 1 / 60) {
    const target = computeLookAngles(look.nx, look.ny);

    // Ease toward the target so a fast cursor move reads as a turn, not a snap.
    look.yaw += (target.yaw - look.yaw) * 0.1;
    look.pitch += (target.pitch - look.pitch) * 0.1;
    look.roll += (target.roll - look.roll) * 0.1;

    head.rotation.y = look.yaw;
    head.rotation.x = look.pitch;
    head.rotation.z = look.roll;

    // Eyes drift a little further than the head, which is what sells the gaze.
    eyes.position.x = look.nx * 0.035;
    eyes.position.y = 0.08 - look.ny * 0.022;

    // Idle float, plus a gentle body lean following the head.
    robot.position.y = 1.18 + Math.sin(t * 1.5) * 0.045;
    robot.rotation.y = Math.sin(t * 0.35) * 0.06;
    robot.position.x = look.nx * 0.09;

    // Blink: a quick squash of the eye domes.
    if (blinkT < 0 && t > nextBlink) blinkT = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const k = Math.min(blinkT / 0.16, 1);
      const squash = 1 - Math.sin(k * Math.PI) * 0.92;
      eyeL.scale.y = squash;
      eyeR.scale.y = squash;
      if (k >= 1) {
        blinkT = -1;
        eyeL.scale.y = 1;
        eyeR.scale.y = 1;
        nextBlink = t + 2.4 + Math.random() * 3.2;
      }
    }

    bulb.material.emissiveIntensity = 0.55 + (Math.sin(t * 3.2) * 0.5 + 0.5) * 0.9;
    bulb.rotation.z = t * 0.6;

    grid.position.z = (t * 0.28) % GRID_STEP;

    const pa = pGeo.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const y = pa.array[i * 3 + 1] + 0.0018 + pSeed[i] * 0.0018;
      pa.array[i * 3 + 1] = y > 3.2 ? 0 : y;
      pa.array[i * 3] += Math.sin(t * 0.5 + pSeed[i] * 9) * 0.0008;
    }
    pa.needsUpdate = true;
  }

  // ------------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  let frame = null;
  let paused = false;
  let visible = true;

  const renderFrame = () => renderer.render(scene, camera);

  function tick() {
    frame = requestAnimationFrame(tick);
    if (paused || !visible) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    pose(clock.elapsedTime, dt);
    renderFrame();
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderFrame();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Don't burn GPU on a panel nobody is looking at.
  const io = new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { threshold: 0.01 }
  );
  io.observe(container);

  const onVisibility = () => { paused = document.hidden; };
  document.addEventListener('visibilitychange', onVisibility);

  if (reducedMotion) {
    pose(0);
    renderFrame();
  } else {
    tick();
  }

  // ---------------------------------------------------------------- teardown
  function dispose() {
    if (frame !== null) cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerout', onPointerOut);
    window.removeEventListener('blur', onBlur);

    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    grid.geometry.dispose();
    grid.material.dispose();
    shadowCatcher.geometry.dispose();
    shadowCatcher.material.dispose();
    envRT.dispose();
    scene.environment = null;

    renderer.dispose();
    renderer.forceContextLoss?.();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, resize, setPaused: (v) => { paused = v; } };
}
