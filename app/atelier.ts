import { animationStep } from './animation-time';
import { createSeatingStudy } from './ride-study';
import { ridePose } from './study-state';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Settings } from './experience';
import { scenarioFrame, parkingPose, local } from './scenarios';

// Supplemental design-study geometry. Dimensions are visual placements, not OEM engineering data.
export function createAtelier(scene: T.Scene) {
  const root = new T.Group();
  root.name = 'Atelier_supplemental_cabin';
  scene.add(root);
  const metal = new T.MeshPhysicalMaterial({
    color: 0xa9a39b,
    metalness: 0.88,
    roughness: 0.25,
    clearcoat: 0.3,
  });
  const dark = new T.MeshStandardMaterial({ color: 0x141a22, roughness: 0.56 });
  const glow = new T.MeshBasicMaterial({ color: 0xffc58e, toneMapped: false });
  const doorExtras: Record<string, T.Group> = {};
  function box(
    parent: T.Object3D,
    size: number[],
    pos: number[],
    mat: T.Material,
    r = 0.012,
  ) {
    const o = new T.Mesh(
      new RoundedBoxGeometry(size[0], size[1], size[2], 2, r),
      mat,
    );
    o.position.fromArray(pos);
    o.castShadow = true;
    parent.add(o);
    return o;
  }
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 512;
  woodCanvas.height = 256;
  const wc = woodCanvas.getContext('2d')!;
  wc.fillStyle = '#46372c';
  wc.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 145; i++) {
    wc.strokeStyle = `rgba(${i % 3 ? 116 : 31},${i % 3 ? 84 : 24},${i % 3 ? 58 : 20},.38)`;
    wc.lineWidth = i % 5 === 0 ? 2 : 0.7;
    wc.beginPath();
    for (let x = 0; x <= 512; x += 4) {
      const y =
        i * 1.85 +
        Math.sin(x * 0.023 + i * 0.12) * 2.8 +
        Math.sin(x * 0.065) * 0.6;
      if (x) wc.lineTo(x, y);
      else wc.moveTo(x, y);
    }
    wc.stroke();
  }
  const woodMap = new T.CanvasTexture(woodCanvas);
  woodMap.colorSpace = T.SRGBColorSpace;
  const wood = new T.MeshPhysicalMaterial({
    map: woodMap,
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.35,
  });
  const grilleCanvas = document.createElement('canvas');
  grilleCanvas.width = 128;
  grilleCanvas.height = 128;
  const gc = grilleCanvas.getContext('2d')!;
  gc.fillStyle = '#aaa';
  gc.fillRect(0, 0, 128, 128);
  gc.fillStyle = '#222';
  for (let y = 0; y < 128; y += 8)
    for (let x = 0; x < 128; x += 8) {
      gc.beginPath();
      gc.arc(x + (y % 16 ? 4 : 0), y, 1.7, 0, Math.PI * 2);
      gc.fill();
    }
  const grilleTex = new T.CanvasTexture(grilleCanvas);
  grilleTex.wrapS = grilleTex.wrapT = T.RepeatWrapping;
  const grille = new T.MeshPhysicalMaterial({
    color: 0xbdb2a2,
    metalness: 0.85,
    roughness: 0.32,
    bumpMap: grilleTex,
    bumpScale: 0.0008,
  });
  const cmfMeshes: T.Mesh[] = [];
  const rugMaterial = new T.MeshPhysicalMaterial({
    color: 0x373431,
    roughness: 0.95,
  });
  for (const x of [-0.4, 0.4])
    for (const z of [-0.3, 0.72]) {
      const rug = box(
        root,
        [0.48, 0.008, 0.5],
        [x, 0.425, z],
        rugMaterial,
        0.012,
      );
      rug.name = 'CMF_floor_covering_study';
      rug.userData.cmfZone = 'carpet';
      const pos = rug.geometry.getAttribute('position'),
        uv: number[] = [];
      for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i));
      rug.geometry.setAttribute('uv1', new T.Float32BufferAttribute(uv, 2));
      rug.geometry.setAttribute('cmfUv', new T.Float32BufferAttribute(uv, 2));
      cmfMeshes.push(rug);
    }
  const speakerPulses: T.Mesh[] = [];
  for (const [name, x, z] of [
    ['Door_LF', -0.84, -0.48],
    ['Door_RF', 0.84, -0.48],
    ['Door_LB', -0.84, 0.72],
    ['Door_RB', 0.84, 0.72],
  ] as const) {
    const g = new T.Group();
    g.name = name + '_detail';
    root.add(g);
    doorExtras[name] = g;
    const sign = Math.sign(x);
    const panel = box(g, [0.015, 0.055, 0.64], [x, 1.02, z], wood, 0.004);
    panel.userData.cmfZone = 'trim';
    const attr = panel.geometry.getAttribute('position'),
      uv: number[] = [];
    for (let i = 0; i < attr.count; i++) uv.push(attr.getZ(i), attr.getY(i));
    panel.geometry.setAttribute('uv1', new T.Float32BufferAttribute(uv, 2));
    panel.geometry.setAttribute('cmfUv', new T.Float32BufferAttribute(uv, 2));
    cmfMeshes.push(panel);
    box(g, [0.014, 0.0035, 0.66], [x - sign * 0.009, 0.982, z], glow, 0.001);
    const speaker = new T.Mesh(
      new T.CylinderGeometry(0.073, 0.073, 0.009, 48),
      grille,
    );
    speaker.rotation.z = Math.PI / 2;
    speaker.position.set(x - sign * 0.015, 0.89, z + 0.24);
    g.add(speaker);
    const trim = new T.Mesh(new T.TorusGeometry(0.076, 0.0035, 6, 48), metal);
    trim.rotation.y = Math.PI / 2;
    trim.position.copy(speaker.position);
    trim.position.x -= sign * 0.006;
    g.add(trim);
    const pulse = new T.Mesh(
      new T.RingGeometry(0.08, 0.085, 40),
      new T.MeshBasicMaterial({
        color: 0xeab986,
        transparent: true,
        opacity: 0.4,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    pulse.rotation.y = Math.PI / 2;
    pulse.position.copy(speaker.position);
    pulse.position.x -= sign * 0.015;
    g.add(pulse);
    speakerPulses.push(pulse);
    for (let j = 0; j < 3; j++)
      box(
        g,
        [0.016, 0.008, 0.026],
        [x - sign * 0.014, 0.825, z - 0.13 + j * 0.038],
        metal,
        0.003,
      );
  }
  const readingMat = new T.MeshStandardMaterial({
    color: 0xffe8c5,
    emissive: 0xffdfaf,
    emissiveIntensity: 2,
  });
  const reading: T.PointLight[] = [];
  for (const x of [-0.62, 0.62])
    for (const z of [0.38, 1.2]) {
      box(root, [0.09, 0.016, 0.14], [x, 1.7, z], dark, 0.02);
      box(root, [0.046, 0.004, 0.06], [x, 1.688, z], readingMat, 0.01);
      const l = new T.PointLight(0xffd6a3, 0.24, 1.15, 2);
      l.position.set(x, 1.64, z);
      root.add(l);
      reading.push(l);
    }
  const footlights: T.PointLight[] = [];
  for (const x of [-0.52, 0.52])
    for (const z of [-0.25, 0.9]) {
      const light = new T.PointLight(0xffc28c, 0.12, 1.2, 2);
      light.position.set(x, 0.38, z);
      root.add(light);
      footlights.push(light);
    }
  for (const x of [-0.3, 0.3])
    box(root, [0.025, 0.018, 0.96], [x, 1.72, 0.58], metal, 0.004);
  const screenPivot = new T.Group();
  screenPivot.position.set(0, 1.66, 0.65);
  root.add(screenPivot);
  box(screenPivot, [0.71, 0.4, 0.018], [0, -0.2, 0], dark, 0.016);
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 1024;
  displayCanvas.height = 512;
  const dc = displayCanvas.getContext('2d')!;
  const displayTex = new T.CanvasTexture(displayCanvas);
  displayTex.colorSpace = T.SRGBColorSpace;
  const displayMaterial = new T.MeshBasicMaterial({
    map: displayTex,
    toneMapped: false,
  });
  const display = new T.Mesh(new T.PlaneGeometry(0.67, 0.355), displayMaterial);
  display.position.set(0, -0.2, 0.012);
  screenPivot.add(display);
  const shade = box(
    root,
    [1.28, 0.012, 1.72],
    [0, 1.735, 0.56],
    new T.MeshStandardMaterial({ color: 0xc1b9a9, roughness: 1 }),
    0.01,
  );
  const seating = createSeatingStudy(root);
  const comfort = new T.Group();
  root.add(comfort);
  const flowMat = new T.MeshBasicMaterial({
    color: 0x89dce1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  for (const x of [-0.43, 0.43])
    for (let i = 0; i < 18; i++) {
      const m = new T.Mesh(new T.SphereGeometry(0.012, 6, 5), flowMat);
      m.userData = {
        x: x + ((i % 3) - 1) * 0.1,
        z: 0.64 + Math.floor(i / 3) * 0.07,
        i,
      };
      comfort.add(m);
    }
  const rainGeo = new T.BufferGeometry();
  const rainPositions = new Float32Array(650 * 6);
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPositions, 3));
  const rain = new T.LineSegments(
    rainGeo,
    new T.LineBasicMaterial({
      color: 0xc2d7df,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  scene.add(rain);
  const particlesGeo = new T.BufferGeometry();
  const pp = new Float32Array(650 * 3);
  let seed = 19;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < pp.length; i += 3) {
    pp[i] = (random() - 0.5) * 26;
    pp[i + 1] = random() * 10;
    pp[i + 2] = (random() - 0.5) * 30;
  }
  particlesGeo.setAttribute('position', new T.BufferAttribute(pp, 3));
  const particleMat = new T.PointsMaterial({
    color: 0xc9e4f1,
    size: 0.035,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const particles = new T.Points(particlesGeo, particleMat);
  scene.add(particles);
  const wind = new T.Group();
  scene.add(wind);
  for (let i = 0; i < 9; i++) {
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints([
        new T.Vector3(-3, i * 0.16 + 0.2, (i % 3) * 2 - 2),
        new T.Vector3(3, i * 0.16 + 0.2, (i % 3) * 2 - 2),
      ]),
      new T.LineBasicMaterial({
        color: 0xabc8c7,
        transparent: true,
        opacity: 0.4,
      }),
    );
    wind.add(line);
  }
  const parkingBay = new T.Group();
  scene.add(parkingBay);
  const bayLine = new T.Line(
    new T.BufferGeometry().setFromPoints(
      [
        [0, 0.035, 1.65],
        [6, 0.035, 1.65],
        [6, 0.035, 4.35],
        [0, 0.035, 4.35],
      ].map((p) => new T.Vector3(...(p as [number, number, number]))),
    ),
    new T.LineBasicMaterial({ color: 0x8bbda7 }),
  );
  parkingBay.add(bayLine);
  const parkingPath = new T.Line(
    new T.BufferGeometry().setFromPoints(
      Array.from({ length: 40 }, (_, i) => {
        const p = parkingPose('auto-parking', 0.5 + (i / 39) * 0.25);
        return new T.Vector3(p.x, 0.04, p.z);
      }),
    ),
    new T.LineDashedMaterial({ color: 0xe8bd83, dashSize: 0.2, gapSize: 0.12 }),
  );
  parkingPath.computeLineDistances();
  parkingBay.add(parkingPath);
  const protection = new T.Mesh(
    new T.BoxGeometry(1.8, 1.2, 3.3),
    new T.MeshBasicMaterial({
      color: 0x68bfae,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  protection.position.set(0, 1, 0.3);
  scene.add(protection);
  const charger = new T.Group();
  scene.add(charger);
  box(charger, [0.38, 1.1, 0.3], [2.7, 0.55, 1.8], dark);
  box(
    charger,
    [0.3, 0.35, 0.012],
    [2.7, 0.82, 1.639],
    new T.MeshBasicMaterial({ color: 0x66cfb1 }),
  );
  const cableCurve = new T.CatmullRomCurve3([
    new T.Vector3(2.6, 0.6, 1.8),
    new T.Vector3(1.7, 0.1, 1.8),
    new T.Vector3(0.93, 0.7, 1.8),
  ]);
  charger.add(
    new T.Mesh(new T.TubeGeometry(cableCurve, 32, 0.018, 6, false), dark),
  );
  const chargeDot = new T.Mesh(new T.SphereGeometry(0.055, 12, 8), glow);
  charger.add(chargeDot);
  const fog = new T.FogExp2(0xbac7c7, 0.065),
    rainFog = new T.FogExp2(0x84959e, 0.015);
  let screenAngle = -Math.PI / 2,
    lastDisplay = '',
    elapsed = 0;
  function update(
    s: Settings,
    dt: number,
    time: number,
    p: number,
    inside: boolean,
    doorTransforms: Record<string, T.Matrix4>,
    roadDistance = 0,
  ) {
    dt = animationStep(dt);
    elapsed += dt;
    const h = scenarioFrame(s.hmi, p),
      demo = s.section === 'safety',
      fx = demo ? h.scenario.effect : null;
    const activeRoad =
      s.roadEnabled && s.view !== 'underbody' && s.section !== 'structure';
    const parking = parkingPose(demo && !activeRoad ? s.hmi : '', p);
    root.position.set(parking.x, 0, parking.z);
    root.rotation.y = parking.yaw;
    parkingBay.visible = demo && s.hmi === 'auto-parking';
    root.rotation.x =
      demo && fx === 'offroad' ? Math.sin(p * Math.PI) * 0.07 : 0;
    if (activeRoad) {
      const ride = ridePose(s.roadType, roadDistance, s.roadSeverity);
      root.position.y = ride.heave;
      root.rotation.x = -ride.pitch;
      root.rotation.z = ride.roll;
    } else root.rotation.z = 0;
    root.visible =
      s.section !== 'structure' &&
      !s.hidden.includes('cabin') &&
      (!s.isolated || s.selected === 'cabin');
    for (const [name, g] of Object.entries(doorExtras)) {
      g.matrixAutoUpdate = false;
      g.matrix.copy(doorTransforms[name] ?? new T.Matrix4());
      g.matrixWorldNeedsUpdate = true;
      g.visible = !s.hidden.includes('doors');
    }
    const cinema = demo && fx === 'cinema' && h.active,
      screenOn =
        s.rearScreen ||
        (demo && ['rear', 'child', 'cinema'].includes(fx!) && h.active);
    screenAngle = T.MathUtils.damp(
      screenAngle,
      screenOn ? -0.06 : -Math.PI / 2,
      5,
      dt,
    );
    screenPivot.rotation.x = screenAngle;
    screenPivot.position.z = 0.65 + (screenOn ? 0.16 : 0);
    screenPivot.visible = screenAngle > -1.56;
    const cabinVisible = inside || s.doors.length > 0 || s.transparent;
    for (const light of reading) light.visible = !!cabinVisible && s.readingLights && !cinema;
    for (const light of footlights) light.visible = !!cabinVisible && s.ambientPower > 0;
    reading.forEach(
      (l) =>
        (l.intensity =
          s.readingLights && !cinema
            ? s.mode === 'night'
              ? 0.045
              : 0.018
            : 0),
    );
    glow.color.set(s.ambient).multiplyScalar(s.ambientPower / 60);
    readingMat.emissiveIntensity = s.readingLights && !cinema ? 2 : 0;
    readingMat.color.set(s.readingLights && !cinema ? 0xffe8c5 : 0x524d43);
    footlights.forEach((l) => {
      l.color.set(s.ambient);
      l.intensity =
        ((inside ? (cinema ? 0.015 : 0.035) : 0.035) * s.ambientPower) / 60;
    });
    shade.scale.z = Math.max(0.001, (cinema ? 100 : s.shade) / 100);
    shade.position.z = 1.42 - 0.86 * shade.scale.z;
    shade.visible = s.shade > 0 || cinema;
    seating.update(s, inside);
    const climate =
      demo && fx === 'climate'
        ? h.phase === 1
          ? 'vent'
          : h.phase === 2
            ? 'heat'
            : 'off'
        : s.climate;
    comfort.visible = climate !== 'off';
    flowMat.color.set(
      climate === 'vent' ? 0x89dce1 : climate === 'heat' ? 0xffa563 : 0xbda5ed,
    );
    comfort.children.forEach((o, i) => {
      const q = (elapsed * 0.4 + i * 0.07) % 1;
      o.position.set(o.userData.x, 0.6 + q * 0.48, o.userData.z);
      o.scale.setScalar(
        climate === 'massage' ? 1 + Math.sin(elapsed * 4 + i) * 0.6 : 1,
      );
    });
    speakerPulses.forEach((o, i) => {
      o.visible = demo && fx === 'music' && h.active;
      const a = (elapsed * 0.65 + i * 0.14) % 1;
      o.scale.setScalar(1 + a * 2);
      (o.material as T.MeshBasicMaterial).opacity = (1 - a) * 0.45;
    });
    const snowy = ['snow', 'blizzard'].includes(s.weather),
      rainy = ['rain', 'storm'].includes(s.weather),
      dusty = s.weather === 'sand',
      hailing = s.weather === 'hail',
      strong = ['storm', 'blizzard', 'sand'].includes(s.weather),
      strength = s.weatherIntensity / 100;
    rain.visible = rainy;
    particles.visible = snowy || dusty || hailing;
    particleMat.color.set(dusty ? 0xd2ac78 : 0xc9e4f1);
    particlesGeo.setDrawRange(0, Math.round(650 * strength));
    rainGeo.setDrawRange(0, Math.round(650 * strength) * 2);
    particleMat.size = snowy ? 0.05 : hailing ? 0.07 : 0.04;
    particleMat.opacity = dusty ? 0.5 : 0.8;
    if (particles.visible || rain.visible) {
      const pos = particlesGeo.attributes.position as T.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(
          i,
          (pos.getY(i) -
            dt *
              (snowy
                ? strong
                  ? 2.2
                  : 0.65
                : dusty
                  ? 0.3
                  : hailing
                    ? 14
                    : 10) +
            10) %
            10,
        );
        pos.setX(
          i,
          ((pos.getX(i) +
            dt * (strong ? 5 * strength : snowy ? 0.17 : 1.5) +
            13) %
            26) -
            13,
        );
      }
      // Precipitation remains outside the vehicle envelope.
      for (let i = 0; i < pos.count; i++)
        if (
          Math.abs(pos.getX(i) - root.position.x) < 1.08 &&
          Math.abs(pos.getZ(i) - root.position.z) < 2.8 &&
          pos.getY(i) < 1.92
        )
          pos.setY(i, 9.9);
      pos.needsUpdate = true;
      if (rain.visible) {
        for (let i = 0; i < pos.count; i++) {
          rainPositions[i * 6] = pos.getX(i);
          rainPositions[i * 6 + 1] = pos.getY(i);
          rainPositions[i * 6 + 2] = pos.getZ(i);
          rainPositions[i * 6 + 3] = pos.getX(i) + 0.04;
          rainPositions[i * 6 + 4] = pos.getY(i) - 0.28;
          rainPositions[i * 6 + 5] = pos.getZ(i);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
    }
    fog.color.set(s.mode === 'night' ? 0x15202b : 0xbac7c7);
    fog.density =
      (s.weather === 'fog' ? 0.09 : strong ? 0.065 : 0.02) * strength;
    fog.color.set(dusty ? 0x9f8865 : s.mode === 'night' ? 0x15202b : 0xbac7c7);
    scene.fog = s.weather === 'fog' || strong ? fog : rainy ? rainFog : null;
    wind.visible = ['wind', 'storm', 'blizzard', 'sand', 'heat'].includes(
      s.weather,
    );
    wind.children.forEach((o, i) => {
      o.position.x = ((elapsed * (strong ? 5 : 2) * strength + i) % 8) - 4;
      o.position.y =
        s.weather === 'heat' ? Math.sin(elapsed * 1.8 + i) * 0.06 : 0;
      ((o as T.Line).material as T.LineBasicMaterial).opacity =
        s.weather === 'heat' ? 0.08 : 0.15 + 0.35 * strength;
    });
    protection.visible = demo && fx === 'impact';
    (protection.material as T.MeshBasicMaterial).color.set(
      h.active ? 0xebac6e : 0x68bfae,
    );
    charger.visible = demo && fx === 'charge';
    chargeDot.position.copy(cableCurve.getPoint((elapsed * 0.4) % 1));
    chargeDot.visible = h.active;
    const key = demo
      ? `${s.hmi}-${h.phase}-${Math.floor(p * 20)}-${s.locale}`
      : `cabin-${s.seatStyle}-${s.cabinApp}-${s.temperature}-${s.fan}-${s.volume}`;
    if (lastDisplay !== key) {
      lastDisplay = key;
      dc.fillStyle = cinema ? '#0a1020' : '#141e28';
      dc.fillRect(0, 0, 1024, 512);
      const gradient = dc.createLinearGradient(0, 100, 1024, 400);
      gradient.addColorStop(0, '#285966');
      gradient.addColorStop(0.5, '#9b765c');
      gradient.addColorStop(1, '#252e48');
      dc.fillStyle = gradient;
      dc.beginPath();
      dc.moveTo(0, 280);
      for (let x = 0; x <= 1024; x += 8)
        dc.lineTo(x, 290 + Math.sin(x * 0.008 + p * 3) * 85);
      dc.lineTo(1024, 512);
      dc.lineTo(0, 512);
      dc.fill();
      dc.fillStyle = '#fff4df';
      dc.font = '24px sans-serif';
      dc.fillText('ZEEKR 9X   /   EXPERIENCE CONCEPT', 45, 55);
      dc.font = '42px sans-serif';
      dc.fillText(
        demo ? local(h.scenario.title, s.locale) : 'PRIVATE LOUNGE',
        45,
        160,
        940,
      );
      dc.font = '24px sans-serif';
      dc.fillText(
        demo
          ? local(h.step, s.locale)
          : `${s.temperature}°C     FAN ${s.fan}    /    ${s.cabinApp.toUpperCase()}`,
        45,
        215,
        940,
      );
      dc.fillStyle = '#f0c495';
      dc.fillRect(45, 460, 930 * (demo ? p : 0.78), 3);
      displayTex.needsUpdate = true;
    }
  }
  return {
    root,
    update,
    displayTex,
    cmfMeshes,
    dispose() {
      woodMap.dispose();
      grilleTex.dispose();
      displayTex.dispose();
    },
  };
}
