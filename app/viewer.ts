import { createStaticBatches } from './static-batches';
import { continuousScene } from './render-policy';
import {
  AdaptiveQuality,
  qualityRatio,
  qualityProfiles,
  readQualityMode,
  saveQualityMode,
  type QualityMode,
  type QualityStatus,
} from './render-quality';
import {
  calibrateCabinSurface,
  loadCabinDetail,
  cabinLighting,
} from './cabin-surface';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  buildExplosionLayout,
  explosionCameraDistance,
} from './explosion-layout';
import { animationStep } from './animation-time';
import {
  exteriorFov,
  heroCameraPosition,
  entrancePose,
  entranceDuration,
  showcasePose,
  entranceSettings,
  entranceCameraPosition,
} from './entrance';
import { createRoadStudy, createChassisStudy } from './ride-study';
import {
  partCategory,
  ridePose,
  seatPosition,
  type PartType,
} from './study-state';
import { splitCabinMesh, createCmfManager, cmfOptions } from './cmf';
import { createCockpitScreens } from './cockpit';
import { createAtelier } from './atelier';
import {
  scenarioFrame,
  scenarioDistance,
  parkingPose,
  local,
} from './scenarios';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { paints, type Settings, type PartGroup, type View } from './experience';
export type Hotspot = { id: string; x: number; y: number; visible: boolean };
export type Viewer = {
  apply: (s: Settings) => void;
  skipEntrance: () => void;
  replayEntrance: () => void;
  dispose: () => void;
  zoom: (factor: number) => void;
  capture: () => string;
  quality: (mode: QualityMode) => void;
};
type Piece = {
  mesh: T.Mesh;
  base: T.Matrix4;
  center: T.Vector3;
  offset: T.Vector3;
  assemblyOffset?: T.Vector3;
  bounds?: T.Box3;
  group: PartGroup;
  door: string | null;
  materials: T.MeshStandardMaterial[];
  variant?: string;
};
const cameras: Record<View, { position: number[]; target: number[] }> = {
  'wheel-detail': {
    position: [-2.8, 0.95, -2.5],
    target: [-0.85, 0.43, -1.65],
  },
  'light-detail': {
    position: [-2.25, 1.35, -4.15],
    target: [-0.65, 1.05, -2.5],
  },
  hero: { position: heroCameraPosition, target: [0, 0.85, 0] },
  front: { position: [0, 1.65, -9], target: [0, 0.9, 0] },
  side: { position: [-9, 1.8, 0], target: [0, 0.8, 0] },
  rear: { position: [5.8, 2.6, 7.8], target: [0, 0.85, 0] },
  passenger: { position: [0.4, 1.38, -0.06], target: [0.12, 1.15, -0.78] },
  underbody: { position: [4, -3.5, 5.2], target: [0, 0.3, 0] },
  'seat-study': { position: [-3, 1.6, 1.8], target: [-0.43, 1.1, 0.98] },
  'second-left': { position: [-0.43, 1.43, 1.1], target: [-0.43, 1.3, -1.7] },
  'second-right': { position: [0.43, 1.43, 1.1], target: [0.43, 1.3, -1.7] },
  'third-left': { position: [-0.43, 1.39, 1.98], target: [-0.43, 1.2, -0.7] },
  'third-right': { position: [0.43, 1.39, 1.98], target: [0.43, 1.2, -0.7] },
  top: { position: [0.001, 12, 0.001], target: [0, 0, 0] },
  driver: { position: [-0.42, 1.38, -0.12], target: [-0.4, 1.28, -2.1] },
  second: { position: [0.18, 1.43, 1.1], target: [0.15, 1.2, -1.8] },
  third: { position: [0.05, 1.39, 1.96], target: [0.08, 1.2, -0.7] },
};
const doors = ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB', 'Trunk_up', 'Hood'];
function ancestry(o: T.Object3D) {
  const names = [];
  while (o) {
    names.push(o.name);
    if (!o.parent) break;
    o = o.parent;
  }
  return names.join('/');
}
export async function createViewer(
  host: HTMLElement,
  initial: Settings,
  onProgress: (n: number) => void,
  onHotspots: (h: Hotspot[]) => void,
  onPick: (id: string) => void,
  onCount: (n: number, parts: Partial<Record<PartType, number>>) => void,
  onTimeline: (p: number) => void,
  opening?: {
    reducedMotion: boolean;
    onChange: (active: boolean) => void;
    onChapter?: (chapter: number) => void;
    onExplore?: (settings: Settings) => void;
    onQuality?: (status: QualityStatus) => void;
  },
): Promise<Viewer> {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const quality = new AdaptiveQuality(
    readQualityMode(),
    performance.now(),
    navigator.hardwareConcurrency <= 4 || (memory !== undefined && memory <= 4),
  );
  renderer.setPixelRatio(
    qualityRatio(
      host.clientWidth,
      host.clientHeight,
      devicePixelRatio,
      quality.tier,
    ),
  );
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let shadowMotionUntil = 0;
  let renderUntil = performance.now() + 2500;
  const invalidate = () => {
    renderUntil = performance.now() + 250;
  };
  const resume = () => {
    if (!document.hidden) {
      invalidate();
      quality.reset(performance.now());
    }
  };
  document.addEventListener('visibilitychange', resume);
  let longTasks: PerformanceObserver | undefined;
  let longFrames: PerformanceObserver | undefined;
  if (process.env.NODE_ENV !== 'production') {
    const gl = renderer.getContext(),
      debug = gl.getExtension('WEBGL_debug_renderer_info');
    console.info(
      '[viewer-device]',
      debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
    );
    if (
      PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')
    ) {
      const started = performance.now();
      let count = 0;
      longFrames = new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (
            entry.startTime > started + 10000 &&
            entry.duration > 80 &&
            count++ < 3
          )
            console.info('[viewer-longframe]', JSON.stringify(entry.toJSON()));
      });
      longFrames.observe({ entryTypes: ['long-animation-frame'] });
    }
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      let logged = 0;
      longTasks = new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (entry.duration > 80 && logged++ < 5)
            console.info(
              '[viewer-longtask]',
              JSON.stringify({
                duration: entry.duration,
                start: entry.startTime,
              }),
            );
      });
      longTasks.observe({ entryTypes: ['longtask'] });
    }
  }
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive ZEEKR 9X 3D scene',
  );
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(38, 1, 0.025, 160);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', invalidate);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3.2;
  controls.maxDistance = 21;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 0.5;
  controls.enablePan = false;
  const environment = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  function reflectionRig(strip: boolean) {
    const r = new T.Scene();
    r.background = new T.Color(0x24272b);
    const shell = new T.Mesh(
      new T.BoxGeometry(28, 20, 28),
      new T.MeshStandardMaterial({
        color: 0x73777b,
        side: T.BackSide,
        roughness: 1,
      }),
    );
    r.add(shell);
    for (const [pos, size, power] of [
      [[-5, 5, -2], [strip ? 1 : 5, 7, 1], 8],
      [[5, 4, 2], [strip ? 0.6 : 3, 6, 1], 5],
      [[0, 7, -4], [7, 1, 4], 6],
    ] as [number[], number[], number][]) {
      const c = new T.Mesh(
        new T.BoxGeometry(...(size as [number, number, number])),
        new T.MeshBasicMaterial({
          color: new T.Color(1, 0.94, 0.86).multiplyScalar(power),
        }),
      );
      c.position.fromArray(pos);
      c.lookAt(0, 0, 0);
      r.add(c);
    }
    const t = pmrem.fromScene(r, 0.035);
    r.traverse((o) => {
      if ((o as T.Mesh).isMesh) {
        (o as T.Mesh).geometry.dispose();
        ((o as T.Mesh).material as T.Material).dispose();
      }
    });
    return t;
  }
  const env = reflectionRig(false),
    stripEnv = reflectionRig(true);
  scene.environment = env.texture;
  environment.dispose();
  pmrem.dispose();
  const hemi = new T.HemisphereLight(0xe7efff, 0x5a4c43, 2.0);
  scene.add(hemi);
  const key = new T.DirectionalLight(0xffe7d1, 4.5);
  key.position.set(-3, 7, -5);
  key.castShadow = true;
  key.shadow.mapSize.set(
    qualityProfiles[quality.tier].shadow,
    qualityProfiles[quality.tier].shadow,
  );
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.0003;
  scene.add(key);
  const rim = new T.DirectionalLight(0xc8defc, 2.7);
  rim.position.set(5, 4, 4);
  scene.add(rim);
  const floorMat = new T.MeshStandardMaterial({
    color: 0xc9c5be,
    roughness: 0.65,
    metalness: 0.1,
  });
  const floor = new T.Mesh(new T.PlaneGeometry(180, 180), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.018;
  floor.receiveShadow = true;
  scene.add(floor);
  const ring = new T.Mesh(
    new T.RingGeometry(4.12, 4.135, 160),
    new T.MeshBasicMaterial({
      color: 0x8d8579,
      transparent: true,
      opacity: 0.35,
      side: T.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);
  let settings = initial,
    disposed = false,
    lastView = '',
    tween = 1,
    interior = false,
    frame = 0,
    lastTime = performance.now(),
    progress = initial.progress,
    frameCount = 0;
  let entering =
    !!opening &&
    !opening.reducedMotion &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let entranceTime = 0,
    showcasing = false,
    showcaseChapter = -1;
  let requestedSettings = initial;
  const entranceMatrix = new T.Matrix4();
  const entranceCamera = new T.Vector3(...entranceCameraPosition);
  const pieces: Piece[] = [],
    doorPivots: Record<string, T.Vector3> = {},
    fromPos = new T.Vector3(),
    fromTarget = new T.Vector3(),
    toPos = new T.Vector3(),
    toTarget = new T.Vector3();
  const gltf = await new GLTFLoader().loadAsync('/models/zeekr-9x.glb', (e) =>
    onProgress(e.total ? Math.round((100 * e.loaded) / e.total) : 0),
  );
  const cabinDetail = await loadCabinDetail(
    Math.min(16, renderer.capabilities.getMaxAnisotropy()),
  );
  host.dataset.cabinDetail = cabinDetail.ready ? 'ready' : 'fallback';
  const car = gltf.scene;
  scene.add(car);
  car.updateMatrixWorld(true);
  const wheelCenters: T.Vector3[] = [];
  car.traverse((o) => {
    if (o.name.startsWith('Tire_dabing'))
      wheelCenters.push(
        new T.Box3().setFromObject(o).getCenter(new T.Vector3()),
      );
  });
  doors.forEach((name) => {
    const o = car.getObjectByName(name);
    if (o) doorPivots[name] = o.getWorldPosition(new T.Vector3());
  });
  const variant = await new GLTFLoader().loadAsync('/models/seat-layout-a.glb');
  scene.add(variant.scene);
  variant.scene.updateMatrixWorld(true);
  const meshes: T.Mesh[] = [];
  variant.scene.traverse((o) => {
    if ((o as T.Mesh).isMesh) meshes.push(o as T.Mesh);
  });
  car.traverse((o) => {
    if ((o as T.Mesh).isMesh) meshes.push(o as T.Mesh);
  });
  const leatherCanvas = document.createElement('canvas');
  leatherCanvas.width = 256;
  leatherCanvas.height = 256;
  const lctx = leatherCanvas.getContext('2d')!;
  const data = lctx.createImageData(256, 256);
  let seed = 173;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = 116 + (seed % 35);
    data.data.set([v, v, v, 255], i);
  }
  lctx.putImageData(data, 0, 0);
  const grain = new T.CanvasTexture(leatherCanvas);
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  grain.repeat.set(70, 70);
  for (const mesh of meshes.flatMap(splitCabinMesh)) {
    const path = ancestry(mesh);
    if (['roof', 'door'].includes(mesh.userData.cmfZone)) {
      const positions = mesh.geometry.getAttribute('position');
      const mask = new Float32Array(positions.count);
      const point = new T.Vector3();
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
        mask[i] =
          mesh.userData.cmfZone === 'roof'
            ? 1
            : T.MathUtils.smoothstep(point.y, 1.22, 1.32);
      }
      mesh.geometry.setAttribute(
        'headlinerMask',
        new T.BufferAttribute(mask, 1),
      );
    }
    if (['seat', 'door', 'roof'].includes(mesh.userData.cmfZone))
      mesh.geometry = toCreasedNormals(mesh.geometry, Math.PI / 4);

    const mats = (
      Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    ).map((m) => {
      const physical = new T.MeshPhysicalMaterial();
      T.MeshStandardMaterial.prototype.copy.call(physical, m);
      physical.clearcoat = m.name.startsWith('car_paint') ? 1 : 0;
      physical.clearcoatRoughness = 0.08;
      return physical;
    });
    mesh.material = mats.length === 1 ? mats[0] : mats;
    const materialNames = mats.map((m) => m.name).join(' ');
    const door = doors.find((d) => path.split('/').includes(d)) ?? null;
    const group: PartGroup = door
      ? 'doors'
      : /9X_INT|Car_INT|Carbody_INT|Seat_Layout_A/.test(path)
        ? 'cabin'
        : /Tire_|Rims_|Calipers|brake_disc/.test(path)
          ? 'wheels'
          : /lamp|DLP|DRL|Light_|Light_logo/.test(path)
            ? 'lights'
            : /Glass/.test(materialNames) &&
                mats.every((m) => m.name.startsWith('Glass'))
              ? 'glass'
              : 'body';
    for (const mat of mats) {
      mat.userData = {
        baseOpacity: mat.opacity,
        baseTransparent: mat.transparent,
        baseEmissive: mat.emissive?.clone() ?? new T.Color(0),
        baseColor: mat.color.clone(),
      };
      if (mat.name.startsWith('car_paint')) {
        mat.roughness = 0.23;
        mat.metalness = 0.72;
        mat.envMapIntensity = 1.15;
      }
      if (/Chrome|Molding|lungujinshu|Grille/.test(mat.name)) {
        mat.roughness = 0.2;
        mat.metalness = 0.95;
        mat.envMapIntensity = 1.2;
      }
      if (mat.name.startsWith('Glass')) {
        mat.transparent = true;
        mat.opacity = /Black/.test(mat.name) ? 0.42 : 0.22;
        mat.depthWrite = false;
        mat.roughness = 0.07;
        mat.envMapIntensity = 1.8;
        mat.side = T.DoubleSide;
        mat.userData.baseOpacity = mat.opacity;
        mat.userData.baseTransparent = true;
      }
      if (mat.name.startsWith('INT')) {
        mat.userData.tint = { value: new T.Color(1, 1, 1) };
        mat.userData.tintMix = { value: 0 };
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.cabinTint = mat.userData.tint;
          shader.uniforms.cabinTintMix = mat.userData.tintMix;
          shader.fragmentShader =
            'uniform vec3 cabinTint; uniform float cabinTintMix;\n' +
            shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            '#include <map_fragment>\nfloat leatherLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));\nfloat leatherMask=smoothstep(0.12,0.48,leatherLuma); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(leatherLuma)*cabinTint,cabinTintMix*leatherMask);',
          );
        };
        mat.customProgramCacheKey = () => 'leather-tint-v2';
        (mat as T.MeshPhysicalMaterial).sheen = 0.16;
        (mat as T.MeshPhysicalMaterial).sheenRoughness = 0.8;
        (mat as T.MeshPhysicalMaterial).sheenColor.set(0xc8b6a1);
        mat.roughness = 0.74;
        mat.metalness = 0;
        mat.bumpMap = grain;
        mat.bumpScale = 0.0007;
        mat.normalScale?.set(0.85, 0.85);
        mat.envMapIntensity = 0.65;
        calibrateCabinSurface(
          mat,
          mesh.userData.cmfZone ?? 'original',
          ['roof', 'carpet'].includes(mesh.userData.cmfZone)
            ? cabinDetail.fabric
            : cabinDetail.leather,
          cabinDetail.fabric,
        );
      }
      if (/luntai|Rubber/.test(mat.name)) {
        mat.roughness = 0.87;
        mat.metalness = 0;
      }
      for (const t of [
        mat.map,
        mat.normalMap,
        mat.roughnessMap,
        mat.metalnessMap,
      ])
        if (t)
          t.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      if (mat.name === 'screen') mat.userData.originalScreen = mat.map;
      if (mat.emissive) mat.emissiveIntensity = 0;
    }
    const center = new T.Box3().setFromObject(mesh).getCenter(new T.Vector3());
    const offset = center.clone().sub(new T.Vector3(0, 0.6, 0));
    if (offset.length() < 0.1) offset.set(0, 1, 0);
    offset.normalize().multiplyScalar(group === 'lights' ? 0.9 : 1.35);
    if (group === 'cabin') offset.y += 0.7;
    if (group === 'glass') offset.y += 0.65;
    scene.attach(mesh);
    mesh.castShadow = group !== 'glass';
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    pieces.push({
      mesh,
      base: mesh.matrix.clone(),
      center,
      offset,
      group,
      door,
      materials: mats,
      variant: path.includes('Seat_Layout_A')
        ? 'seatA'
        : path.includes('Carbody_INT_seat_B')
          ? 'seatB'
          : /lunguhei|lungujinshu/.test(materialNames)
            ? 'originalRim'
            : undefined,
    });
    mesh.userData.partCategory = partCategory(
      path,
      materialNames,
      mesh.userData.cmfZone,
    );
    mesh.userData.group = group;
    mesh.userData.door = door;
  }
  scene.remove(car);
  scene.remove(variant.scene);
  const rimMaterials: T.MeshStandardMaterial[] = [];
  wheelCenters.forEach((center) => {
    const g = new T.Group();
    const sign = Math.sign(center.x);
    g.position.copy(center);
    g.position.x += sign * 0.129;
    const mat = new T.MeshStandardMaterial({
      color: 0x9da8af,
      metalness: 0.95,
      roughness: 0.23,
    });
    mat.userData = { baseOpacity: 1, baseTransparent: false };
    rimMaterials.push(mat);
    const lip = new T.Mesh(new T.TorusGeometry(0.279, 0.019, 10, 56), mat);
    lip.rotation.y = Math.PI / 2;
    g.add(lip);
    const hub = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.06, 32), mat);
    hub.rotation.z = Math.PI / 2;
    g.add(hub);
    for (let i = 0; i < 10; i++) {
      const spoke = new T.Mesh(new T.BoxGeometry(0.025, 0.22, 0.035), mat);
      const a = (i * Math.PI) / 5;
      spoke.position.set(0, Math.cos(a) * 0.16, Math.sin(a) * 0.16);
      spoke.rotation.x = a;
      spoke.userData.spoke = i;
      g.add(spoke);
    }
    scene.add(g);
    g.updateMatrixWorld(true);
    const originalChildren = [...g.children] as T.Mesh[];
    for (const mesh of originalChildren) {
      scene.attach(mesh);
      mesh.matrixAutoUpdate = false;
      mesh.castShadow = true;
      pieces.push({
        mesh,
        base: mesh.matrix.clone(),
        center: center.clone(),
        offset: new T.Vector3(sign * 1.7, 0.25, center.z * 0.18),
        group: 'wheels',
        door: null,
        materials: [mat],
        variant: 'customRim',
      });
    }
    scene.remove(g);
  });
  const tireCanvas = document.createElement('canvas');
  tireCanvas.width = 256;
  tireCanvas.height = 256;
  const tc = tireCanvas.getContext('2d')!;
  tc.fillStyle = '#999';
  tc.fillRect(0, 0, 256, 256);
  tc.strokeStyle = '#333';
  tc.lineWidth = 4;
  for (let y = 0; y < 256; y += 20) {
    tc.beginPath();
    tc.moveTo(0, y);
    tc.lineTo(128, y + 18);
    tc.lineTo(256, y);
    tc.stroke();
  }
  const tread = new T.CanvasTexture(tireCanvas);
  tread.wrapS = tread.wrapT = T.RepeatWrapping;
  tread.repeat.set(4, 4);
  const partCounts: Partial<Record<PartType, number>> = {};
  for (const p of pieces) {
    p.mesh.userData.partCategory ??= p.group === 'wheels' ? 'rims' : 'body';
    if (p.variant !== 'customRim' && p.variant !== 'seatA') {
      const id = p.mesh.userData.partCategory as PartType;
      partCounts[id] = (partCounts[id] ?? 0) + 1;
    }
  }
  const assemblyLayout = buildExplosionLayout(
    pieces.map((p, i) => {
      p.bounds = new T.Box3().setFromObject(p.mesh);
      return {
        id: String(i),
        category: p.mesh.userData.partCategory as PartType,
        door: p.door,
        bounds: p.bounds,
      };
    }),
  );
  pieces.forEach((p, i) => {
    p.assemblyOffset = assemblyLayout.get(String(i))!;
  });
  function explodedOffset(p: Piece, mode: Settings['explodeMode']) {
    return mode === 'assemblies'
      ? p.assemblyOffset!
      : p.assemblyOffset!.clone().addScaledVector(p.offset, 1.5);
  }
  onCount(
    pieces.filter((p) => p.variant !== 'customRim' && p.variant !== 'seatA')
      .length,
    partCounts,
  );
  const hudCanvas = document.createElement('canvas');
  hudCanvas.width = 768;
  hudCanvas.height = 384;
  const hc = hudCanvas.getContext('2d')!;
  hc.clearRect(0, 0, 768, 384);
  hc.fillStyle = '#b4fff1';
  hc.font = '500 100px sans-serif';
  hc.fillText('48', 65, 155);
  hc.font = '24px sans-serif';
  hc.fillText('km/h', 75, 190);
  hc.font = '70px sans-serif';
  hc.fillText('↱', 320, 150);
  hc.font = '30px sans-serif';
  hc.fillText('300 m', 435, 135);
  hc.strokeStyle = '#b4fff1';
  hc.lineWidth = 5;
  hc.beginPath();
  hc.moveTo(260, 310);
  hc.lineTo(335, 210);
  hc.moveTo(530, 310);
  hc.lineTo(455, 210);
  hc.stroke();
  hc.font = '18px sans-serif';
  hc.fillText('HUD / CONCEPT', 75, 345);
  const hudTexture = new T.CanvasTexture(hudCanvas);
  const hud = new T.Mesh(
    new T.PlaneGeometry(0.64, 0.32),
    new T.MeshBasicMaterial({
      map: hudTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
    }),
  );
  hud.position.set(-0.42, 1.28, -1.37);
  hud.rotation.x = -0.14;
  scene.add(hud);
  const ambientMat = new T.MeshBasicMaterial({
    color: initial.ambient,
    toneMapped: false,
  });
  const ambient = new T.Group();
  const curve = new T.CatmullRomCurve3([
    new T.Vector3(-0.74, 1.02, -0.92),
    new T.Vector3(-0.4, 1.06, -1.02),
    new T.Vector3(0.35, 1.06, -1.02),
    new T.Vector3(0.75, 1.02, -0.92),
  ]);
  ambient.add(
    new T.Mesh(new T.TubeGeometry(curve, 44, 0.0035, 5, false), ambientMat),
  );
  scene.add(ambient);
  const cabinLight = new T.PointLight(initial.ambient, 0.6, 3, 2);
  cabinLight.position.set(0, 1.5, 0.1);
  scene.add(cabinLight);
  const beam = new T.Group();
  for (const x of [-0.7, 0.7]) {
    const light = new T.SpotLight(0xe4f0ff, 0, 13, 0.43, 0.65, 1.1);
    light.position.set(x, 0.65, -2.35);
    light.target.position.set(x, 0.02, -10);
    beam.add(light, light.target);
  }
  scene.add(beam);
  const road = new T.Group();
  for (const x of [-1.9, 1.9]) {
    for (let z = -18; z < 20; z += 3) {
      const line = new T.Mesh(
        new T.PlaneGeometry(0.055, 1.4),
        new T.MeshBasicMaterial({ color: 0xe2dace }),
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.003, z);
      road.add(line);
    }
  }
  scene.add(road);
  const sensors = new T.Group();
  function fan(
    x: number,
    z: number,
    rotation: number,
    radius: number,
    angle: number,
  ) {
    const g = new T.Group();
    for (let i = 1; i <= 3; i++) {
      const arc = new T.Mesh(
        new T.RingGeometry(
          (radius * i) / 3 - 0.013,
          (radius * i) / 3 + 0.013,
          70,
          1,
          -angle / 2,
          angle,
        ),
        new T.MeshBasicMaterial({
          color: 0x68cdbb,
          transparent: true,
          opacity: 0.55,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      arc.rotation.x = -Math.PI / 2;
      arc.rotation.z = rotation;
      g.add(arc);
    }
    const fill = new T.Mesh(
      new T.CircleGeometry(radius, 70, -angle / 2, angle),
      new T.MeshBasicMaterial({
        color: 0x68cdbb,
        transparent: true,
        opacity: 0.055,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.rotation.z = rotation;
    g.add(fill);
    g.position.set(x, 0.035, z);
    sensors.add(g);
    return g;
  }
  const frontFan = fan(0, -2.3, Math.PI / 2, 6, Math.PI * 0.55);
  const sideFan = fan(-0.9, 0.7, Math.PI, 4.5, Math.PI * 0.6);
  const backFan = fan(0, 2.3, -Math.PI / 2, 3.4, Math.PI * 0.75);
  scene.add(sensors);
  const actors = new T.Group();
  const actorMat = new T.MeshStandardMaterial({
    color: 0x709eaf,
    roughness: 0.45,
    metalness: 0.25,
  });
  const other = new T.Group();
  const otherBody = new T.Mesh(new T.BoxGeometry(1.45, 0.5, 3), actorMat);
  otherBody.position.y = 0.55;
  other.add(otherBody);
  const otherTop = new T.Mesh(
    new T.BoxGeometry(1.2, 0.45, 1.45),
    new T.MeshStandardMaterial({ color: 0x253c48, roughness: 0.3 }),
  );
  otherTop.position.set(0, 1, -0.05);
  other.add(otherTop);
  for (const x of [-0.72, 0.72])
    for (const z of [-1, 1]) {
      const wheel = new T.Mesh(
        new T.CylinderGeometry(0.28, 0.28, 0.13, 20),
        new T.MeshStandardMaterial({ color: 0x161a1c, roughness: 0.8 }),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.28, z);
      other.add(wheel);
    }
  actors.add(other);
  const pedestrian = new T.Group();
  const torso = new T.Mesh(
    new T.CapsuleGeometry(0.19, 0.55, 5, 10),
    new T.MeshStandardMaterial({ color: 0xc4a37e }),
  );
  torso.position.y = 1;
  pedestrian.add(torso);
  const head = new T.Mesh(
    new T.SphereGeometry(0.16, 14, 10),
    new T.MeshStandardMaterial({ color: 0xe1c5a2 }),
  );
  head.position.y = 1.6;
  pedestrian.add(head);
  for (const x of [-0.12, 0.12]) {
    const leg = new T.Mesh(
      new T.CapsuleGeometry(0.07, 0.5, 4, 8),
      new T.MeshStandardMaterial({ color: 0x3a4149 }),
    );
    leg.position.set(x, 0.38, 0);
    pedestrian.add(leg);
  }
  actors.add(pedestrian);
  const cycle = new T.Group();
  for (const z of [-0.52, 0.52]) {
    const wheel = new T.Mesh(
      new T.TorusGeometry(0.31, 0.035, 7, 24),
      new T.MeshStandardMaterial({ color: 0x333a40 }),
    );
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.33, z);
    cycle.add(wheel);
  }
  const frameGeo = new T.BufferGeometry().setFromPoints([
    new T.Vector3(0, 0.33, -0.52),
    new T.Vector3(0, 0.8, 0),
    new T.Vector3(0, 0.33, 0.52),
    new T.Vector3(0, 0.33, -0.52),
  ]);
  cycle.add(new T.Line(frameGeo, new T.LineBasicMaterial({ color: 0xe2b37e })));
  const rider = pedestrian.clone();
  rider.position.y = 0.35;
  cycle.add(rider);
  actors.add(cycle);
  scene.add(actors);
  const ringRisk = new T.Mesh(
    new T.RingGeometry(0.7, 0.735, 70),
    new T.MeshBasicMaterial({
      color: 0xffa64d,
      transparent: true,
      opacity: 0.85,
      side: T.DoubleSide,
    }),
  );
  ringRisk.rotation.x = -Math.PI / 2;
  ringRisk.position.y = 0.045;
  scene.add(ringRisk);
  const anchorList = [
    { id: 'Door_LF', p: new T.Vector3(-1.05, 1.05, -0.55), inside: false },
    { id: 'Door_RF', p: new T.Vector3(1.05, 1.05, -0.55), inside: false },
    { id: 'lights', p: new T.Vector3(-0.72, 0.9, -2.3), inside: false },
    { id: 'driver', p: new T.Vector3(-0.4, 1.65, -0.1), inside: false },
    { id: 'screen', p: new T.Vector3(0, 1.48, 0.8), inside: true },
    { id: 'readingLights', p: new T.Vector3(-0.62, 1.66, 0.38), inside: true },
    { id: 'seat', p: new T.Vector3(0.45, 0.85, 0.65), inside: true },
    { id: 'ambient', p: new T.Vector3(0.65, 1.07, -0.86), inside: true },
  ];
  const raycaster = new T.Raycaster();
  raycaster.layers.enable(1);
  let pointerStart = { x: 0, y: 0 };
  function down(e: PointerEvent) {
    pointerStart = { x: e.clientX, y: e.clientY };
    if (interior) {
      const dir = new T.Vector3();
      camera.getWorldDirection(dir);
      lookYaw = Math.atan2(dir.x, -dir.z);
      lookPitch = Math.asin(dir.y);
    }
  }
  let lookYaw = 0,
    lookPitch = 0;
  function move(e: PointerEvent) {
    if (entering || !interior || !e.buttons) return;
    lookYaw -= (e.clientX - pointerStart.x) * 0.004;
    lookPitch = T.MathUtils.clamp(
      lookPitch + (e.clientY - pointerStart.y) * 0.003,
      -1.15,
      1.15,
    );
    pointerStart = { x: e.clientX, y: e.clientY };
    const d = new T.Vector3(
      Math.sin(lookYaw) * Math.cos(lookPitch),
      Math.sin(lookPitch),
      -Math.cos(lookYaw) * Math.cos(lookPitch),
    );
    camera.lookAt(camera.position.clone().add(d));
    invalidate();
  }
  let pressStart = { x: 0, y: 0 };
  const clickDown = (e: PointerEvent) => {
    if (entering) return;
    pressStart = { x: e.clientX, y: e.clientY };
    down(e);
    renderer.domElement.setPointerCapture(e.pointerId);
  };
  function up(e: PointerEvent) {
    if (entering) return;
    if (
      Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 5 ||
      interior
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(
      pieces.filter((p) => p.mesh.visible).map((p) => p.mesh),
      false,
    )[0];
    if (hit)
      onPick(
        settings.section === 'structure'
          ? 'part:' + hit.object.userData.partCategory
          : (hit.object.userData.door ??
              'part:' + hit.object.userData.partCategory),
      );
  }
  renderer.domElement.addEventListener('pointerdown', clickDown);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  function resize() {
    invalidate();
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setPixelRatio(qualityRatio(w, h, devicePixelRatio, quality.tier));
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    if (!interior) camera.fov = exteriorFov(camera.aspect);
    camera.updateProjectionMatrix();
    if (frame && settings.section === 'structure') {
      lastView = '';
      applyScene(settings);
    }
  }
  function applyQuality() {
    const size = qualityProfiles[quality.tier].shadow;
    if (key.shadow.mapSize.x !== size) {
      key.shadow.map?.dispose();
      key.shadow.map = null;
      key.shadow.mapSize.set(size, size);
      renderer.shadowMap.needsUpdate = true;
    }
    resize();
    opening?.onQuality?.({ mode: quality.mode, tier: quality.tier });
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  const cmf = createCmfManager((state) => {
    invalidate();
    host.dataset.materialStatus = state;
    window.dispatchEvent(new CustomEvent('cmf-status', { detail: state }));
  });
  let cmfKey = '';
  const retryCmf = () => {
    void cmf.apply(
      [...pieces.map((p) => p.mesh), ...atelier.cmfMeshes],
      settings,
    );
  };
  window.addEventListener('cmf-retry', retryCmf);
  function applyScene(s: Settings) {
    renderer.shadowMap.needsUpdate = true;
    shadowMotionUntil = performance.now() + 2000;
    renderUntil = shadowMotionUntil;
    if (s.progress !== settings.progress) progress = s.progress;
    const sceneChanged = s.mode !== settings.mode;
    const materialsChanged =
      !frame ||
      [
        'partFilter',
        'partIsolate',
        'paint',
        'finish',
        'weather',
        'lightRig',
        'transparent',
        'hidden',
        'isolated',
        'selected',
        'section',
        'wheelStyle',
        'tireStyle',
        'seatStyle',
        'backrest',
      ].some(
        (k) =>
          (s as unknown as Record<string, unknown>)[k] !==
          (settings as unknown as Record<string, unknown>)[k],
      );
    const nextCmfKey =
      Object.keys(cmfOptions)
        .map((k) => s[k as keyof typeof cmfOptions])
        .join('|') + s.seatStyle;
    if (cmfKey !== nextCmfKey) {
      cmfKey = nextCmfKey;
      void cmf.apply([...pieces.map((p) => p.mesh), ...atelier.cmfMeshes], s);
    }
    settings = s;
    const cv =
      s.section +
      s.view +
      s.seatPosition +
      ([
        'driver',
        'passenger',
        'second',
        'third',
        'second-left',
        'second-right',
        'third-left',
        'third-right',
      ].includes(s.view)
        ? s.height
        : '') +
      (s.section === 'structure' ? `${s.explode}:${s.explodeMode}` : '');
    if (lastView !== cv) {
      lastView = cv;
      interior = [
        'driver',
        'passenger',
        'second',
        'third',
        'second-left',
        'second-right',
        'third-left',
        'third-right',
      ].includes(s.view);
      fromPos.copy(camera.position);
      fromTarget.copy(controls.target);
      const seat = seatPosition(s.seatPosition);
      const c =
        s.view === 'seat-study'
          ? {
              position: [Math.sign(seat[0]) * 3, 1.65, seat[2] + 0.8],
              target: [seat[0], 1.1, seat[2] - 0.15],
            }
          : s.section === 'safety' && s.view === 'hero'
            ? { position: [-9, 9, -12], target: [0, 0.2, 0] }
            : cameras[s.view];
      if (s.view === 'wheel-detail' && wheelCenters.length) {
        const wheel = wheelCenters.reduce((best, p) =>
          p.x + p.z < best.x + best.z ? p : best,
        );
        c.target = wheel.toArray();
        c.position = wheel
          .clone()
          .add(new T.Vector3(-1.9, 0.52, -0.85))
          .toArray();
      }
      toPos.fromArray(c.position);
      if (interior) toPos.y += (s.height - 170) * 0.004;
      toTarget.fromArray(c.target);
      if (s.section === 'structure' && s.explode > 0) {
        const bounds = new T.Box3();
        for (const p of pieces)
          bounds.union(
            p.bounds!.clone().translate(
              explodedOffset(p, s.explodeMode)
                .clone()
                .multiplyScalar(s.explode / 100),
            ),
          );
        const direction = toPos.clone().sub(toTarget).normalize();
        const distance = Math.max(
          toPos.distanceTo(toTarget),
          explosionCameraDistance(bounds, 38, camera.aspect),
        );
        bounds.getCenter(toTarget);
        toPos.copy(toTarget).addScaledVector(direction, distance);
      }
      if (!frame) {
        fromPos.copy(toPos);
        fromTarget.copy(toTarget);
      }
      tween = 0;
      camera.fov = interior ? 78 : exteriorFov(camera.aspect);
      camera.updateProjectionMatrix();
      controls.enabled = !interior;
    }
    controls.maxPolarAngle =
      s.view === 'underbody' ? Math.PI * 0.96 : Math.PI * 0.49;
    controls.maxDistance = s.section === 'structure' ? 350 : 21;
    camera.far = s.section === 'structure' ? 1000 : 160;
    camera.updateProjectionMatrix();
    controls.minDistance = s.view.endsWith('-detail')
      ? 0.7
      : s.view === 'underbody'
        ? 1.5
        : s.view === 'seat-study'
          ? 1.2
          : 3.2;
    floor.visible = !s.roadEnabled && s.view !== 'underbody';
    undersideLight.visible = s.view === 'underbody';
    controls.autoRotate = s.orbit && !interior && s.section !== 'safety';
    const night = s.mode === 'night',
      day = s.mode === 'day';
    scene.background = new T.Color(
      night ? 0x080a0e : day ? 0xd5dfdf : 0xd8d4cc,
    );
    floorMat.color.set(night ? 0x14171d : day ? 0xbdc9c4 : 0xc8c3bb);
    hemi.intensity = night ? 0.55 : day ? 3.2 : 1.7;
    key.intensity = night ? 0.9 : day ? 4.5 : 3.3;
    rim.intensity = night ? 2.7 : 2.3;
    renderer.toneMappingExposure = night ? 1.05 : 1.25;
    scene.environment = s.lightRig === 'strip' ? stripEnv.texture : env.texture;
    scene.environmentIntensity = night ? 0.4 : 0.85;
    floorMat.envMapIntensity = night ? 0.12 : 0.55;
    floorMat.roughness = ['rain', 'storm'].includes(s.weather)
      ? 0.16
      : night
        ? 0.92
        : 0.7;
    floorMat.metalness = ['rain', 'storm'].includes(s.weather) ? 0.35 : 0;
    if (['snow', 'blizzard'].includes(s.weather)) floorMat.color.set(0xd9e0e0);
    if (['overcast', 'storm', 'blizzard', 'sand'].includes(s.weather)) {
      key.intensity *= 0.8 - (0.5 * s.weatherIntensity) / 100;
      hemi.intensity *= 0.9 - (0.25 * s.weatherIntensity) / 100;
    }
    if (s.weather === 'heat') key.color.set(0xffd09b);
    else key.color.set(0xffe7d1);
    ambientMat.color.set(s.ambient);
    cabinLight.color.set(s.ambient);
    cabinLight.visible =
      (interior || s.doors.length > 0 || s.transparent) && s.ambientPower > 0;
    cabinLight.intensity = (0.12 * s.ambientPower) / 60;
    if (interior) {
      const lighting = cabinLighting(s.mode);
      hemi.intensity = lighting.hemi;
      key.intensity = lighting.key;
      rim.intensity = lighting.rim;
      renderer.toneMappingExposure = lighting.exposure;
      scene.environmentIntensity = lighting.environment;
      cabinLight.intensity = (lighting.practical * s.ambientPower) / 60;
    }
    hud.visible = s.hud && interior;
    ambient.visible = interior;
    road.visible = s.section === 'safety';
    actors.visible = s.section === 'safety';
    ring.visible =
      !night &&
      s.section !== 'safety' &&
      !interior &&
      s.view !== 'underbody' &&
      !s.roadEnabled;
    beam.children.forEach((o) => {
      if ((o as T.SpotLight).isSpotLight) {
        o.visible = s.lights && night;
        (o as T.SpotLight).intensity = s.lights && night ? 16 : 0;
      }
    });
    if (materialsChanged)
      for (const p of pieces) {
        p.mesh.visible =
          !(
            s.section === 'structure' &&
            s.partIsolate &&
            s.partFilter !== 'all' &&
            p.mesh.userData.partCategory !== s.partFilter
          ) &&
          !s.hidden.includes(p.group) &&
          (!s.isolated || p.group === s.selected) &&
          (p.variant !== 'seatA' || s.backrest === 'A') &&
          (p.variant !== 'seatB' || s.backrest === 'B') &&
          (p.variant !== 'originalRim' || s.wheelStyle === 'mirror') &&
          (p.variant !== 'customRim' || s.wheelStyle !== 'mirror');
        for (const m of p.materials) {
          if (m.userData.tint) {
            m.userData.tint.value.set(
              s.seatStyle === 'cognac'
                ? '#b67f54'
                : s.seatStyle === 'ivory'
                  ? '#ffebce'
                  : '#ffffff',
            );
            m.userData.tintMix.value = s.seatStyle === 'blue' ? 0 : 1;
          }
          if (m.name === 'luntai') {
            m.bumpMap = s.tireStyle === 'touring' ? tread : null;
            m.bumpScale = 0.009;
            m.roughness = s.tireStyle === 'touring' ? 0.92 : 0.82;
          }
          if (p.variant === 'customRim') {
            m.color.set(s.wheelStyle === 'turbine' ? 0x73868e : 0xb5b7b9);
            const index = p.mesh.userData.spoke;
            if (index !== undefined) {
              const scale = s.wheelStyle === 'turbine' ? 1.9 : 1;
              p.base.decompose(
                p.mesh.position,
                p.mesh.quaternion,
                p.mesh.scale,
              );
              p.mesh.scale.z = scale;
              p.base.compose(p.mesh.position, p.mesh.quaternion, p.mesh.scale);
            }
          }
          if (m.name.startsWith('car_paint')) {
            const pm = m as T.MeshPhysicalMaterial;
            pm.roughness =
              s.finish === 'satin'
                ? 0.48
                : ['rain', 'storm'].includes(s.weather)
                  ? 0.14
                  : 0.23;
            pm.clearcoat = s.finish === 'satin' ? 0.35 : 1;
            pm.clearcoatRoughness = s.finish === 'satin' ? 0.38 : 0.075;
          }
          if (m.name.startsWith('car_paint'))
            m.color.set(
              paints.find((p) => p.id === s.paint)?.hex ?? paints[0].hex,
            );
          const xray =
            s.transparent && ['body', 'doors', 'glass'].includes(p.group);
          m.opacity = xray ? 0.13 : m.userData.baseOpacity;
          m.transparent = xray || m.userData.baseTransparent;
          m.depthWrite = !xray && !m.name.startsWith('Glass');
          if (m.emissive) {
            m.emissive.set(0);
            m.emissiveIntensity = 0;
            if (
              s.section === 'structure' &&
              (p.group === s.selected ||
                (s.partFilter !== 'all' &&
                  p.mesh.userData.partCategory === s.partFilter))
            ) {
              m.emissive.set(0xac743c);
              m.emissiveIntensity = 0.14;
            }
          }
          m.needsUpdate = true;
        }
      }
    if (sceneChanged) renderer.shadowMap.needsUpdate = true;
  }
  const atelier = createAtelier(scene);
  const roadStudy = createRoadStudy(scene),
    chassis = createChassisStudy(scene);
  const undersideLight = new T.PointLight(0xd2e6ff, 45, 12);
  undersideLight.position.set(0, -2, 0);
  scene.add(undersideLight);
  let roadTravel = 0;
  const screenSource = pieces
    .flatMap((p) => p.materials)
    .find((m) => m.name === 'screen')?.userData.originalScreen as
    | T.Texture
    | undefined;
  const cockpit = screenSource ? createCockpitScreens(screenSource) : null;
  const doorTransforms: Record<string, T.Matrix4> = {};
  let hudStamp = '';
  const translation = new T.Matrix4(),
    rotation = new T.Matrix4(),
    back = new T.Matrix4(),
    delta = new T.Matrix4();
  const doorAmounts: Record<string, number> = {};
  let explosion = 0;
  let staticBatches: ReturnType<typeof createStaticBatches> | undefined;
  const perfSamples: { interval: number; work: number }[] = [];
  let perfStart = performance.now(),
    perfReports = 0,
    perfLast = 0,
    reportedIdle = false;
  function animate(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = animationStep((now - lastTime) / 1000);
    lastTime = now;
    if (document.hidden) {
      perfLast = 0;
      return;
    }
    const continuous = continuousScene(
      settings,
      entering,
      tween < 1,
      controls.autoRotate,
    );
    if (!continuous && now > renderUntil) {
      if (!reportedIdle && process.env.NODE_ENV !== 'production')
        console.info(
          '[viewer-idle]',
          'Rendering paused until the next interaction',
        );
      reportedIdle = true;
      perfLast = 0;
      return;
    }
    reportedIdle = false;
    const workStart = performance.now();
    const frameInterval = perfLast ? now - perfLast : 0;
    perfLast = now;
    if (entering) {
      entranceTime += dt;
      if (entrancePose(entranceTime).done) {
        if (!showcasing) applyScene({ ...settings, lights: true });
        showcasing = true;
        controls.enabled = true;
        const tour = showcasePose(entranceTime - entranceDuration);
        if (tour.chapter !== showcaseChapter) {
          showcaseChapter = tour.chapter;
          opening?.onChapter?.(tour.chapter);
        }
        if (tour.done) finishEntrance(false);
      }
    }
    const arrival = entrancePose(entranceTime);
    const activeRoad =
      settings.roadEnabled &&
      settings.view !== 'underbody' &&
      settings.section !== 'structure';
    if (activeRoad && settings.roadPlaying)
      roadTravel += (dt * settings.roadSpeed) / 3.6;
    const ride = ridePose(settings.roadType, roadTravel, settings.roadSeverity);
    const rideMatrix = new T.Matrix4().compose(
      new T.Vector3(0, ride.heave, 0),
      new T.Quaternion().setFromEuler(new T.Euler(-ride.pitch, 0, ride.roll)),
      new T.Vector3(1, 1, 1),
    );
    roadStudy.update(settings, roadTravel);
    chassis.update(settings, roadTravel);
    const ease = 1 - Math.exp(-dt * 7);
    if (entering) {
      if (showcasing)
        camera.position.fromArray(
          showcasePose(entranceTime - entranceDuration).position,
        );
      else
        camera.position.lerpVectors(entranceCamera, toPos, arrival.cameraMix);
      controls.target.copy(toTarget);
      camera.lookAt(controls.target);
      if (showcasing) controls.update();
    } else if (tween < 1) {
      tween = Math.min(1, tween + dt * 1.2);
      const t = tween * tween * (3 - 2 * tween);
      camera.position.lerpVectors(fromPos, toPos, t);
      controls.target.lerpVectors(fromTarget, toTarget, t);
      camera.lookAt(controls.target);
    } else if (!interior) controls.update();
    explosion = T.MathUtils.lerp(
      explosion,
      settings.section === 'structure' ? settings.explode / 100 : 0,
      ease,
    );
    doors.forEach((d) => {
      doorAmounts[d] = T.MathUtils.lerp(
        doorAmounts[d] ?? 0,
        settings.doors.includes(d) ? 1 : 0,
        ease,
      );
    });
    const hf = scenarioFrame(settings.hmi, progress),
      demo = settings.section === 'safety',
      effect = hf.scenario.effect;
    const parking = parkingPose(demo ? settings.hmi : '', progress),
      parkingMatrix = new T.Matrix4()
        .makeTranslation(parking.x, 0, parking.z)
        .multiply(new T.Matrix4().makeRotationY(parking.yaw));
    const travel = entering
      ? arrival.travel
      : activeRoad
        ? roadTravel
        : demo
          ? scenarioDistance(settings.hmi, progress)
          : 0;
    const demoOpen =
      demo &&
      effect === 'welcome' &&
      settings.hmi === 'welcome' &&
      hf.phase >= 2;
    for (const d of doors) {
      if (demoOpen && d.startsWith('Door_'))
        doorAmounts[d] = T.MathUtils.damp(doorAmounts[d], 1, 7, dt);
      const pivot = doorPivots[d];
      if (!pivot) continue;
      const a = doorAmounts[d];
      const rot =
        d === 'Trunk_up'
          ? new T.Matrix4().makeRotationX(-a * 1.05)
          : d === 'Hood'
            ? new T.Matrix4().makeRotationX(a * 0.64)
            : new T.Matrix4().makeRotationY(
                a * (d.includes('_L') ? -1 : 1) * 1.06,
              );
      doorTransforms[d] = new T.Matrix4()
        .makeTranslation(pivot.x, pivot.y, pivot.z)
        .multiply(rot)
        .multiply(
          new T.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z),
        );
    }
    const blink = Math.floor(now / 450) % 2 === 0;
    for (const p of pieces) {
      p.mesh.matrix.copy(p.base);
      if (
        (entering || demo || activeRoad) &&
        hf.speed >= 0 &&
        p.group === 'wheels' &&
        !p.materials.some((m) => /Caliper|Brake Caliper/.test(m.name))
      ) {
        const center = wheelCenters.reduce(
          (best, c) =>
            c.distanceToSquared(p.center) < best.distanceToSquared(p.center)
              ? c
              : best,
          wheelCenters[0],
        );
        if (center) {
          delta
            .makeTranslation(center.x, center.y, center.z)
            .multiply(rotation.makeRotationX(-travel / 0.409))
            .multiply(back.makeTranslation(-center.x, -center.y, -center.z));
          p.mesh.matrix.premultiply(delta);
        }
      }

      if (p.door && doorPivots[p.door] && doorAmounts[p.door] > 0.0001) {
        const pivot = doorPivots[p.door],
          amount = doorAmounts[p.door];
        if (p.door === 'Trunk_up') rotation.makeRotationX(-amount * 1.05);
        else if (p.door === 'Hood') rotation.makeRotationX(amount * 0.64);
        else
          rotation.makeRotationY(
            amount * (p.door.includes('_L') ? -1 : 1) * 1.06,
          );
        translation.makeTranslation(pivot.x, pivot.y, pivot.z);
        back.makeTranslation(-pivot.x, -pivot.y, -pivot.z);
        delta.copy(translation).multiply(rotation).multiply(back);
        p.mesh.matrix.premultiply(delta);
      }
      if (explosion > 0.0001) {
        const offset = explodedOffset(p, settings.explodeMode);
        p.mesh.matrix.elements[12] += offset.x * explosion;
        p.mesh.matrix.elements[13] += offset.y * explosion;
        p.mesh.matrix.elements[14] += offset.z * explosion;
      }
      if (activeRoad) {
        if (p.group === 'wheels') {
          const ix = (p.center.z > 0 ? 2 : 0) + (p.center.x > 0 ? 1 : 0);
          p.mesh.matrix.elements[13] += ride.wheels[ix];
        } else p.mesh.matrix.premultiply(rideMatrix);
      }
      if (demo && !activeRoad && effect === 'offroad') {
        p.mesh.matrix.premultiply(
          new T.Matrix4().makeRotationX(Math.sin(progress * Math.PI) * 0.07),
        );
      }
      if (demo && !activeRoad && settings.hmi === 'auto-parking')
        p.mesh.matrix.premultiply(parkingMatrix);
      p.mesh.matrixWorldNeedsUpdate = true;
      for (const m of p.materials) {
        if (/lamp_|Light_LOGO|TopLight|starlit/.test(m.name)) {
          m.emissive.set(
            /lamp_B|TopLight|Trunk/.test(m.name) ? 0xff1f0d : 0xd4edff,
          );
          m.emissiveIntensity =
            settings.lights || (demo && effect === 'welcome' && hf.phase > 0)
              ? 2.2
              : 0;
        }
        if (/Mirro_Turn/.test(m.name)) {
          m.emissive.set(0xff9a23);
          m.emissiveIntensity =
            (settings.hazards ||
              (demo && hf.alert && ['brake', 'door'].includes(effect))) &&
            blink
              ? 4
              : 0;
        }
        if (m.name === 'screen') {
          if (cockpit && (demo || interior)) m.map = cockpit.texture;
          else if (m.userData.originalScreen) m.map = m.userData.originalScreen;
          m.emissiveMap = m.map;
          m.emissive.set(0xffffff);
          m.emissiveIntensity = interior ? 0.7 : 0.18;
        }
      }
    }
    if (settings.section === 'safety') {
      if (settings.playing && progress < 1) {
        progress = Math.min(1, progress + dt / 16);
        if (frameCount % 6 === 0 || progress === 1) onTimeline(progress);
      }
      const f = scenarioFrame(settings.hmi, progress),
        fx = f.scenario.effect;
      sensors.visible = settings.radar && f.coverage;
      sensors.position.set(parking.x, 0, parking.z);
      sensors.rotation.y = parking.yaw;
      frontFan.visible = !['blindspot', 'door'].includes(fx);
      sideFan.visible = ['blindspot', 'door'].includes(fx);
      backFan.visible = fx === 'park';
      sensors.traverse((o) => {
        if ((o as T.Mesh).isMesh)
          ((o as T.Mesh).material as T.MeshBasicMaterial).color.set(
            f.alert ? 0xecaa68 : 0x68cdbb,
          );
      });
      actors.visible = !f.fault;
      other.visible = [
        'blindspot',
        'brake',
        'perception',
        'route',
        'takeover',
      ].includes(fx);
      other.position.set(
        fx === 'blindspot' ? -3.25 : 0,
        0,
        fx === 'blindspot'
          ? 8 - progress * 15
          : fx === 'brake'
            ? -9 + Math.min(progress, 0.55) * 7
            : -10 + Math.sin(progress * Math.PI) * 2,
      );
      pedestrian.visible = fx === 'park' && settings.hmi !== 'auto-parking';
      pedestrian.position.set(4 - progress * 8, 0, -4.2);
      cycle.visible = fx === 'door';
      cycle.position.set(-1.65, 0, 6 - progress * 13);
      ringRisk.visible =
        f.alert &&
        !f.fault &&
        ['brake', 'blindspot', 'door', 'park'].includes(fx);
      const actor = fx === 'park' ? pedestrian : fx === 'door' ? cycle : other;
      ringRisk.position.set(actor.position.x, 0.045, actor.position.z);
      ringRisk.scale.setScalar(1 + Math.sin(now * 0.004) * 0.08);
      road.visible = hf.scenario.journey === 'driving' || fx === 'park';
      for (const o of road.children)
        o.position.z =
          (((o.userData.baseZ ??= o.position.z) +
            (settings.hmi === 'auto-parking'
              ? 0
              : scenarioDistance(settings.hmi, progress)) +
            18) %
            38) -
          18;
      const stamp =
        settings.hmi +
        '-' +
        f.phase +
        '-' +
        Math.round(f.p * 100) +
        '-' +
        settings.locale;
      if (hudStamp !== stamp) {
        hudStamp = stamp;
        hc.clearRect(0, 0, 768, 384);
        hc.fillStyle = f.alert ? '#ffd094' : '#b4fff1';
        hc.font = '500 94px sans-serif';
        hc.fillText(String(f.speed), 45, 135);
        hc.font = '22px sans-serif';
        hc.fillText('km/h  ·  DEMO', 50, 174);
        hc.font = '28px sans-serif';
        hc.fillText(local(f.step, settings.locale), 45, 242, 680);
        hc.font = '20px sans-serif';
        hc.fillText(
          f.fault
            ? 'PERCEPTION UNAVAILABLE'
            : f.countdown !== null
              ? 'TOI · ' + f.countdown + 's / ILLUSTRATIVE'
              : 'DRIVER / SCENARIO STUDY',
          45,
          305,
        );
        if (f.coverage) {
          hc.strokeStyle = hc.fillStyle;
          hc.lineWidth = 4;
          hc.beginPath();
          hc.moveTo(360, 180);
          hc.lineTo(420, 60);
          hc.moveTo(610, 180);
          hc.lineTo(550, 60);
          hc.stroke();
        }
        hudTexture.needsUpdate = true;
      }
    } else {
      sensors.visible = false;
      ringRisk.visible = false;
    }
    cockpit?.draw(settings, progress);
    atelier.update(
      settings,
      dt,
      now,
      progress,
      interior,
      doorTransforms,
      roadTravel,
    );
    if (settings.roadEnabled || settings.view === 'underbody')
      road.visible = false;
    if (entering) {
      entranceMatrix.makeTranslation(0, 0, arrival.z);
      for (const p of pieces) {
        p.mesh.matrix.premultiply(entranceMatrix);
        p.mesh.matrixWorldNeedsUpdate = true;
      }
      atelier.root.position.z += arrival.z;
    }
    const batched =
      (!entering || showcasing) &&
      !demo &&
      !activeRoad &&
      explosion < 0.0001 &&
      settings.section !== 'structure' &&
      settings.wheelStyle === 'mirror' &&
      settings.backrest === 'B' &&
      !settings.transparent &&
      !settings.isolated &&
      settings.hidden.length === 0 &&
      settings.doors.length === 0 &&
      doors.every((d) => (doorAmounts[d] ?? 0) < 0.0001) &&
      Object.keys(cmfOptions).every(
        (k) => settings[k as keyof typeof cmfOptions] === 'original',
      );
    if (staticBatches?.setEnabled(batched))
      renderer.shadowMap.needsUpdate = true;
    if (
      (entering && !showcasing) ||
      now < shadowMotionUntil ||
      (activeRoad && settings.roadPlaying) ||
      (demo && settings.playing)
    )
      renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (quality.sample(frameInterval, performance.now() - workStart, now))
      applyQuality();
    if (
      process.env.NODE_ENV !== 'production' &&
      perfReports < 3 &&
      frameInterval > 0 &&
      (!entering || showcasing)
    ) {
      perfSamples.push({
        interval: frameInterval,
        work: performance.now() - workStart,
      });
      if (now - perfStart > 4000 && perfSamples.length >= 20) {
        const intervals = perfSamples
          .map((v) => v.interval)
          .sort((a, b) => a - b);
        console.info(
          '[viewer-performance]',
          JSON.stringify({
            version: 'adaptive-v5',
            view: settings.view,
            section: settings.section,
            entering,
            showcasing,
            samples: intervals.length,
            medianMs: intervals[Math.floor(intervals.length * 0.5)],
            p95Ms: intervals[Math.floor(intervals.length * 0.95)],
            meanWorkMs:
              perfSamples.reduce((a, v) => a + v.work, 0) / perfSamples.length,
            quality: quality.tier,
            qualityMode: quality.mode,
            batched,
            batchCount: staticBatches?.batchCount,
            originalBatchCount: staticBatches?.originalCount,
            width: host.clientWidth,
            height: host.clientHeight,
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            textures: renderer.info.memory.textures,
            geometries: renderer.info.memory.geometries,
            programs: renderer.info.programs?.length,
            pixelRatio: renderer.getPixelRatio(),
          }),
        );
        perfSamples.length = 0;
        perfStart = now;
        perfReports++;
      }
    }
    if (!entering && frameCount++ % 5 === 0) {
      const rect = host.getBoundingClientRect();
      const out = anchorList.map((a) => {
        const p = a.p.clone().project(camera);
        const delta = a.p.clone().sub(camera.position);
        const nearSide =
          interior ||
          !(
            (a.id === 'Door_LF' && camera.position.x > 0) ||
            (a.id === 'Door_RF' && camera.position.x < 0) ||
            (a.id === 'lights' && camera.position.z > 0)
          );
        const visible =
          nearSide &&
          settings.hotspots &&
          a.inside === interior &&
          settings.section !== 'structure' &&
          settings.section !== 'safety' &&
          p.z < 1 &&
          p.z > -1 &&
          Math.abs(p.x) < 0.94 &&
          Math.abs(p.y) < 0.85 &&
          delta.dot(camera.getWorldDirection(new T.Vector3())) > 0;
        return {
          id: a.id,
          x: (p.x * 0.5 + 0.5) * rect.width,
          y: (-0.5 * p.y + 0.5) * rect.height,
          visible,
        };
      });
      onHotspots(out);
    }
  }
  function apply(s: Settings) {
    const changed = s !== requestedSettings;
    requestedSettings = s;
    if (showcasing && changed) finishEntrance(false);
    else if (!entering) applyScene(s);
  }
  let returnCamera: {
    position: T.Vector3;
    target: T.Vector3;
    fov: number;
  } | null = null;
  function finishEntrance(snap: boolean) {
    if (!entering || disposed) return;
    entering = false;
    showcasing = false;
    // Force camera reconfiguration even when the requested view is also "hero".
    lastView = '';
    applyScene(requestedSettings);
    if (returnCamera) {
      toPos.copy(returnCamera.position);
      toTarget.copy(returnCamera.target);
      camera.fov = returnCamera.fov;
      camera.updateProjectionMatrix();
      returnCamera = null;
    }
    if (snap) {
      tween = 1;
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      camera.lookAt(controls.target);
    }
    opening?.onChange(false);
  }
  function takeControl() {
    if (disposed) return;
    if (!entering) {
      tween = 1;
      invalidate();
      return;
    }
    if (!showcasing) return;
    returnCamera = null;
    const position = camera.position.clone(),
      target = controls.target.clone();
    entering = showcasing = false;
    requestedSettings = { ...settings, hotspots: true, orbit: false };
    lastView = '';
    applyScene(requestedSettings);
    tween = 1;
    camera.position.copy(position);
    controls.target.copy(target);
    camera.lookAt(target);
    opening?.onExplore?.(requestedSettings);
    opening?.onChange(false);
  }
  controls.addEventListener('start', takeControl);
  const motionPreference = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );
  const motionChange = () => {
    if (motionPreference.matches) finishEntrance(true);
  };
  motionPreference.addEventListener('change', motionChange);
  applyScene(entering ? entranceSettings(initial) : initial);
  if (entering) {
    controls.enabled = false;
    camera.position.copy(entranceCamera);
    controls.target.copy(toTarget);
    camera.lookAt(controls.target);
  } else if (opening?.reducedMotion || motionPreference.matches) {
    tween = 1;
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    camera.lookAt(controls.target);
  }
  // Build from the unanimated, assembled matrices before the entry motion begins.
  if (
    initial.wheelStyle === 'mirror' &&
    initial.backrest === 'B' &&
    !initial.transparent &&
    !initial.isolated &&
    initial.hidden.length === 0
  )
    staticBatches = createStaticBatches(scene, pieces);
  // Warm shaders while the loading state is still visible, before the moving intro.
  await renderer.compileAsync(scene, camera);
  opening?.onChange(entering);
  opening?.onQuality?.({ mode: quality.mode, tier: quality.tier });
  quality.reset(performance.now());
  lastTime = performance.now();
  frame = requestAnimationFrame(animate);
  return {
    apply,
    replayEntrance() {
      if (disposed || motionPreference.matches) return;
      returnCamera = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        fov: camera.fov,
      };
      entering = true;
      showcasing = false;
      entranceTime = 0;
      showcaseChapter = -1;
      explosion = 0;
      doors.forEach((d) => {
        doorAmounts[d] = 0;
      });
      lastView = '';
      applyScene(entranceSettings(requestedSettings));
      controls.enabled = false;
      camera.position.copy(entranceCamera);
      controls.target.copy(toTarget);
      camera.lookAt(controls.target);
      quality.reset(performance.now());
      lastTime = performance.now();
      perfLast = 0;
      opening?.onChapter?.(-1);
      opening?.onChange(true);
      invalidate();
    },
    skipEntrance() {
      finishEntrance(true);
    },
    zoom(factor) {
      takeControl();
      invalidate();
      if (interior) {
        camera.fov = T.MathUtils.clamp(camera.fov * factor, 48, 94);
        camera.updateProjectionMatrix();
      } else {
        camera.position
          .sub(controls.target)
          .multiplyScalar(factor)
          .add(controls.target);
      }
    },
    capture() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    quality(mode) {
      quality.setMode(mode, performance.now());
      saveQualityMode(mode);
      applyQuality();
    },
    dispose() {
      disposed = true;
      longTasks?.disconnect();
      longFrames?.disconnect();
      motionPreference.removeEventListener('change', motionChange);
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.removeEventListener('start', takeControl);
      controls.removeEventListener('change', invalidate);
      document.removeEventListener('visibilitychange', resume);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', clickDown);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      const textures = new Set<T.Texture>();
      scene.traverse((o) => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material)
          for (const mat of Array.isArray(m.material)
            ? m.material
            : [m.material]) {
            for (const value of Object.values(mat))
              if (value instanceof T.Texture) textures.add(value);
            if (mat.userData.originalScreen)
              textures.add(mat.userData.originalScreen);
            mat.dispose();
          }
      });
      textures.forEach((t) => t.dispose());
      env.dispose();
      stripEnv.dispose();
      window.removeEventListener('cmf-retry', retryCmf);
      cmf.dispose();
      cabinDetail.dispose();
      atelier.dispose();
      cockpit?.dispose();
      grain.dispose();
      tread.dispose();
      hudTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
