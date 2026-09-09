import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetUrl } from './asset-url';
import {
  AdaptiveQuality,
  qualityRatio,
  readQualityMode,
  saveQualityMode,
  type QualityMode,
} from './render-quality';
import type { N90State, N90View } from './n90-state';
import { drawDrivingDisplay } from './driving-display';
const cameras: Record<N90View, { p: number[]; t: number[] }> = {
  hero: { p: [6, 2.5, 8], t: [0, 0.94, 0] },
  front: { p: [0, 1.55, 9], t: [0, 0.95, 0.3] },
  side: { p: [10, 1.8, 0], t: [0, 0.9, 0] },
  rear: { p: [-6, 2.7, -8], t: [0, 0.9, 0] },
  driver: { p: [0.49, 1.46, 0.37], t: [-0.06, 1.23, 0.95] },
  'rear-seat': { p: [0.05, 1.38, -1.1], t: [0.0, 1.2, 0.99] },
  top: { p: [0.001, 8, 0], t: [0, 0.6, 0] },
};
export async function createN90Viewer(
  host: HTMLDivElement,
  initial: N90State,
  onProgress: (n: number) => void,
  onDoor: (id: string) => void,
  onQuality: (v: string) => void,
) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute('aria-label', 'N90 Max 独立建模校准预览');
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(36, 1, 0.035, 70),
    controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 3.5;
  controls.maxDistance = 15;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 0.45;
  controls.enablePan = false;
  const q = new AdaptiveQuality(readQualityMode(), performance.now());
  const envScene = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const env = pmrem.fromScene(envScene, 0.055);
  envScene.dispose();
  pmrem.dispose();
  scene.environment = env.texture;
  const ambient = new T.HemisphereLight(0xd7e3ef, 0x292823, 1);
  scene.add(ambient);
  const sun = new T.DirectionalLight(0xe5edff, 3);
  sun.position.set(3, 7, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new T.DirectionalLight(0xb8d9e8, 1.5);
  fill.position.set(-5, 3, -5);
  scene.add(fill);
  const cabinLight = new T.PointLight(0xffd6ad, 3, 4);
  cabinLight.position.set(0, 1.55, -0.4);
  scene.add(cabinLight);
  const ground = new T.Mesh(
    new T.PlaneGeometry(160, 160),
    new T.MeshStandardMaterial({
      color: 0x303840,
      roughness: 0.88,
      metalness: 0.06,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.004;
  ground.receiveShadow = true;
  scene.add(ground);
  const materials = new Set<T.MeshStandardMaterial>(),
    geometries = new Set<T.BufferGeometry>(),
    textureSet = new Set<T.Texture>();
  let raf = 0,
    disposed = false,
    ready = false,
    state = initial,
    last = performance.now(),
    dirtyUntil = last + 3000;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(
      assetUrl('/models/n90-max-study.glb'),
      (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 25),
    );
  } catch (error) {
    controls.dispose();
    env.dispose();
    ground.geometry.dispose();
    (ground.material as T.Material).dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const model = gltf.scene;
  scene.add(model);
  model.updateMatrixWorld(true);
  const animatedNames = [
    'Door_LF',
    'Door_RF',
    'Door_LB',
    'Door_RB',
    'Tailgate',
    'Hood',
    'RoofLift',
    'SlidingIsland',
    'Table',
    'Seat_0_0',
    'Seat_0_1',
  ];
  const joints = new Map<string, T.Object3D>();
  for (const name of animatedNames) {
    const o = model.getObjectByName(name);
    if (o) joints.set(name, o);
  }
  // Batch static surfaces per material within each independently animated assembly.
  const buckets = new Map<
    string,
    { parent: T.Object3D; mat: T.MeshStandardMaterial; meshes: T.Mesh[] }
  >();
  model.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mat = o.material as T.MeshStandardMaterial;
    if (Array.isArray(mat)) return;
    materials.add(mat);
    geometries.add(o.geometry);
    for (const v of Object.values(mat))
      if (v instanceof T.Texture) textureSet.add(v);
    let parent: T.Object3D = model,
      ancestor: T.Object3D | null = o.parent;
    while (ancestor && ancestor !== model) {
      if (animatedNames.includes(ancestor.name)) {
        parent = ancestor;
        break;
      }
      ancestor = ancestor.parent;
    }
    const key = parent.uuid + mat.uuid;
    const b = buckets.get(key) || { parent, mat, meshes: [] };
    b.meshes.push(o);
    buckets.set(key, b);
  });
  for (const b of buckets.values()) {
    const inv = b.parent.matrixWorld.clone().invert();
    const parts = b.meshes.map((m) => {
      const geo = m.geometry.index
        ? m.geometry.toNonIndexed()
        : m.geometry.clone();
      for (const k of Object.keys(geo.attributes))
        if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      if (!geo.getAttribute('normal')) geo.computeVertexNormals();
      if (!geo.getAttribute('uv')) {
        const pos = geo.getAttribute('position');
        const uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          uv[i * 2] = pos.getX(i);
          uv[i * 2 + 1] = pos.getY(i);
        }
        geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      }
      geo.applyMatrix4(inv.clone().multiply(m.matrixWorld));
      return geo;
    });
    const g = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!g) continue;
    const merged = new T.Mesh(g, b.mat);
    merged.name = b.parent.name + '_' + b.mat.name;
    merged.castShadow = b.mat.name !== 'N90_Glass';
    merged.receiveShadow = true;
    merged.userData.action = animatedNames.includes(b.parent.name)
      ? b.parent.name
      : undefined;
    b.parent.add(merged);
    for (const m of b.meshes) m.removeFromParent();
    geometries.add(g);
  }
  // Fine grain uses a compact deterministic normal map, not a glossy colour noise layer.
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = grainCanvas.height = 256;
  const gc = grainCanvas.getContext('2d')!;
  const pixels = gc.createImageData(256, 256);
  let seed = 93;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels.data[i] = 120 + (seed % 17);
    pixels.data[i + 1] = 120 + ((seed >>> 8) % 17);
    pixels.data[i + 2] = 254;
    pixels.data[i + 3] = 255;
  }
  gc.putImageData(pixels, 0, 0);
  const grain = new T.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  grain.repeat.set(50, 50);
  grain.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  textureSet.add(grain);
  const display = document.createElement('canvas');
  display.width = 1920;
  display.height = 1080;
  const ctx = display.getContext('2d')!;
  drawDrivingDisplay(ctx, 1920, 1080, { phase: 0, alert: false, fault: false });
  ctx.fillStyle = '#e8f4fa';
  ctx.font = '48px sans-serif';
  ctx.fillText('P  ·  驻车预览', 90, 110);
  ctx.font = '25px sans-serif';
  ctx.fillText('N90 / INTERACTION STUDY', 90, 158);
  const displayTexture = new T.CanvasTexture(display);
  displayTexture.colorSpace = T.SRGBColorSpace;
  displayTexture.flipY = false;
  textureSet.add(displayTexture);
  for (const mat of materials) {
    if (mat.name === 'N90_Leather') {
      mat.roughness = 0.78;
      mat.metalness = 0;
      mat.normalMap = grain;
      mat.normalScale.set(0.22, 0.22);
    }
    if (mat.name === 'N90_Glass') {
      mat.transparent = true;
      mat.opacity = 0.74;
      mat.depthWrite = false;
      mat.metalness = 0.08;
      mat.roughness = 0.23;
      if (mat instanceof T.MeshPhysicalMaterial) mat.transmission = 0;
    }
    if (mat.name === 'N90_Screen') {
      mat.map = displayTexture;
      mat.emissiveMap = displayTexture;
      mat.emissive.set(0xffffff);
      mat.emissiveIntensity = 0.55;
      mat.roughness = 0.45;
    }
  }
  const base = new Map<T.Object3D, { p: T.Vector3; r: T.Euler }>();
  for (const o of joints.values())
    base.set(o, { p: o.position.clone(), r: o.rotation.clone() });
  const amounts: Record<string, number> = {};
  let tween = 0;
  const fromP = new T.Vector3(),
    fromT = new T.Vector3(),
    toP = new T.Vector3(),
    toT = new T.Vector3();
  const exploded = new Map<T.Object3D, { p: T.Vector3; offset: T.Vector3 }>();
  for (const child of [
    ...model.children.filter((o) => o instanceof T.Mesh),
    ...joints.values(),
  ]) {
    const box = new T.Box3().setFromObject(child);
    const center = box.getCenter(new T.Vector3());
    exploded.set(child, {
      p: child.position.clone(),
      offset: center
        .sub(new T.Vector3(0, 0.8, 0))
        .normalize()
        .multiplyScalar(1.4),
    });
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(qualityRatio(w, h, devicePixelRatio, q.tier));
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    dirtyUntil = performance.now() + 2000;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  const wake = () => {
    dirtyUntil = performance.now() + 2500;
  };
  controls.addEventListener('change', wake);
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    wake();
  });
  function apply(next: N90State, snap = false) {
    host.dataset.motionReady = 'false';
    const old = state;
    state = next;
    const inside = ['driver', 'rear-seat'].includes(next.view);
    const pose = cameras[next.view];
    if (snap || old.view !== next.view) {
      fromP.copy(camera.position);
      fromT.copy(controls.target);
      toP.fromArray(pose.p);
      toT.fromArray(pose.t);
      if (!inside && camera.aspect < 1.15)
        toP
          .sub(toT)
          .multiplyScalar(1.15 / Math.max(camera.aspect, 0.6))
          .add(toT);
      tween = 0;
      host.dataset.viewReady = 'false';
      if (snap) {
        camera.position.copy(toP);
        controls.target.copy(toT);
        tween = 1;
      }
    }
    camera.fov = inside ? 78 : 36;
    camera.updateProjectionMatrix();
    controls.minDistance = inside ? 0.2 : 3.5;
    controls.maxDistance = inside ? 3 : 25;
    controls.maxPolarAngle = inside ? Math.PI * 0.85 : Math.PI * 0.49;
    controls.autoRotate = next.orbit && !inside && !reduced;
    scene.background = new T.Color(next.mode === 'night' ? 0x0c1118 : 0x858e97);
    scene.fog = new T.Fog(scene.background, 20, 60);
    scene.environmentIntensity = next.mode === 'night' ? 0.6 : 0.75;
    renderer.toneMappingExposure = next.mode === 'night' ? 0.78 : 0.88;
    ambient.intensity = next.mode === 'night' ? 0.55 : 0.9;
    sun.intensity = next.mode === 'night' ? 2 : 2.7;
    cabinLight.intensity = inside ? 3.5 : 1.1;
    (ground.material as T.MeshStandardMaterial).color.set(
      next.mode === 'night' ? 0x1b242f : 0x68737d,
    );
    for (const m of materials) {
      if (m.name === 'N90_Paint') {
        m.color.set(next.paint);
        m.roughness = 0.34;
        m.envMapIntensity = 0.7;
      }
      if (m.name === 'N90_Glass') {
        m.opacity = inside ? 0.2 : 0.74;
        m.envMapIntensity = 0.08;
      }
      if (m.name === 'N90_Leather' || m.name === 'N90_Headliner')
        m.color.set(next.interior === 'sand' ? '#b9a48c' : '#866044');
      if (m.name === 'N90_WheelFace')
        m.color.set(next.wheel === 'black' ? '#252d34' : '#acb7bf');
      if (['N90_DRL', 'N90_Taillight', 'N90_Ambient'].includes(m.name))
        m.emissiveIntensity = next.lights ? 3 : 0;
    }
    const roof = joints.get('RoofLift');
    if (roof) roof.visible = !(next.section === 'space' && next.view === 'top');
    const table = joints.get('Table');
    if (table) table.visible = next.lounge;
    renderer.shadowMap.needsUpdate = true;
    wake();
  }
  apply(initial, true);
  ready = true;
  onProgress(100);
  onQuality(q.tier);
  const ray = new T.Raycaster();
  let press = { x: 0, y: 0 };
  const down = (e: PointerEvent) => {
    press = { x: e.clientX, y: e.clientY };
    wake();
  };
  const up = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    const hits = ray.intersectObject(model, true);
    const id = hits[0]?.object.userData.action;
    if (
      id &&
      ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB', 'Tailgate'].includes(id)
    )
      onDoor(id);
  };
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  function animate(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)),
      interval = now - last;
    last = now;
    if (document.hidden) return;
    let moving = false;
    for (const [id, o] of joints) {
      const target =
        id === 'RoofLift'
          ? Number(state.roof)
          : id === 'Table'
            ? Number(state.lounge)
            : id.startsWith('Seat_0') || id === 'SlidingIsland'
              ? Number(state.lounge)
              : Number(state.doors.includes(id));
      const a = T.MathUtils.damp(amounts[id] || 0, target, 6, dt);
      amounts[id] = a;
      moving ||= Math.abs(a - target) > 0.0001;
      const b = base.get(o)!;
      o.position.copy(b.p);
      o.rotation.copy(b.r);
      if (id.startsWith('Door_'))
        o.rotateY(a * (id.includes('_L') ? -1 : 1) * 1.15);
      else if (id === 'Tailgate') o.rotateX(a * 1.12);
      else if (id === 'RoofLift') o.position.y += a * 0.48;
      else if (id.startsWith('Seat_0')) o.rotateY(a * Math.PI);
      else if (id === 'SlidingIsland') o.position.z -= a * 0.65;
    }
    if (tween < 1) {
      tween = Math.min(1, tween + dt * 1.6);
      const k = tween * tween * (3 - 2 * tween);
      camera.position.lerpVectors(fromP, toP, k);
      controls.target.lerpVectors(fromT, toT, k);
      moving = true;
    }
    for (const [o, b] of exploded) {
      if (!joints.has(o.name)) o.position.copy(b.p);
      o.position.addScaledVector(b.offset, state.explode / 100);
    }
    host.dataset.motionReady = String(!moving);
    if (!moving && !controls.autoRotate && now > dirtyUntil) return;
    const start = performance.now();
    if (tween < 1) camera.lookAt(controls.target);
    else {
      controls.update();
      host.dataset.viewReady = state.view;
    }
    if (moving) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (q.sample(interval, performance.now() - start, now)) {
      resize();
      onQuality(q.tier);
    }
  }
  raf = requestAnimationFrame(animate);
  return {
    apply,
    quality(mode: QualityMode) {
      q.setMode(mode, performance.now());
      saveQualityMode(mode);
      resize();
      onQuality(q.tier);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', up);
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textureSet) t.dispose();
      env.dispose();
      ground.geometry.dispose();
      (ground.material as T.Material).dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
    get ready() {
      return ready;
    },
  };
}
