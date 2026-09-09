import * as T from 'three';
import type { Settings } from './experience';
import { seatPosition, roadHeight, ridePose } from './study-state';
export function createSeatingStudy(parent: T.Group) {
  const root = new T.Group();
  root.name = 'Seating_and_belt_study';
  parent.add(root);
  const person = new T.Group();
  root.add(person);
  const skin = new T.MeshStandardMaterial({ color: 0xcbb69c, roughness: 0.82 });
  const clothes = new T.MeshStandardMaterial({
    color: 0x637783,
    roughness: 0.92,
  });
  const beltMat = new T.MeshStandardMaterial({
    color: 0xd8a665,
    roughness: 0.92,
    side: T.DoubleSide,
  });
  const belt = new T.Mesh(new T.BufferGeometry(), beltMat);
  belt.name = 'Three_point_belt_visual_study';
  root.add(belt);
  const buckle = new T.Mesh(
    new T.BoxGeometry(0.042, 0.061, 0.028),
    new T.MeshStandardMaterial({ color: 0x303237, roughness: 0.6 }),
  );
  root.add(buckle);
  const release = new T.Mesh(
    new T.BoxGeometry(0.03, 0.02, 0.008),
    new T.MeshStandardMaterial({ color: 0xc25346 }),
  );
  buckle.add(release);
  release.position.set(0, 0.012, -0.018);
  let last = '';
  function update(s: Settings, inside: boolean) {
    root.visible = s.occupant && !inside;
    const key = s.height + '|' + s.seatPosition + '|' + s.seatbelt;
    if (key === last) return;
    last = key;
    person.children.forEach((o) => (o as T.Mesh).geometry.dispose());
    person.clear();
    const origin = seatPosition(s.seatPosition);
    origin[1] = s.seatPosition.startsWith('third') ? 0.77 : 0.75;
    root.position.fromArray(origin);
    const scale = s.height / 170,
      side = s.seatPosition.endsWith('left') ? -1 : 1;
    function joint(
      a: number[],
      b: number[],
      r: number,
      mat: T.Material = clothes,
    ) {
      const av = new T.Vector3(...a),
        bv = new T.Vector3(...b),
        len = av.distanceTo(bv);
      const m = new T.Mesh(new T.CapsuleGeometry(r, len * 0.8, 4, 10), mat);
      m.position.copy(av).add(bv).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        bv.sub(av).normalize(),
      );
      person.add(m);
    }
    joint([0, 0.04, 0], [0, 0.43 * scale, 0.025], 0.135 * scale);
    const head = new T.Mesh(new T.SphereGeometry(0.1, 20, 12), skin);
    head.scale.set(1, 1.18, 1);
    head.position.set(0, 0.64 * scale, 0.025);
    person.add(head);
    for (const side of [-1, 1]) {
      const x = side * 0.105 * scale,
        knee = [x, -0.055, -0.36 * scale],
        ankle = [x, 0.4 - origin[1], -0.43 * scale];
      joint([x, 0, 0], knee, 0.069 * scale);
      joint(knee, ankle, 0.05 * scale);
      const foot = new T.Mesh(new T.BoxGeometry(0.095, 0.04, 0.2), clothes);
      foot.position.set(x, 0.375 - origin[1], -0.49 * scale);
      person.add(foot);
      joint(
        [side * 0.18 * scale, 0.39 * scale, 0.025],
        [side * 0.2 * scale, 0.18 * scale, -0.13],
        0.043 * scale,
      );
      joint(
        [side * 0.2 * scale, 0.18 * scale, -0.13],
        [side * 0.15 * scale, 0.07, -0.27],
        0.035 * scale,
        skin,
      );
    }
    const outer = side * 0.25,
      bucklePoint = new T.Vector3(-side * 0.18, 0.04, -0.14),
      anchor = new T.Vector3(outer, 0.7, 0.09);
    const points = s.seatbelt
      ? [
          anchor,
          new T.Vector3(side * 0.165 * scale, 0.445 * scale, -0.13),
          new T.Vector3(side * 0.065 * scale, 0.28 * scale, -0.16),
          bucklePoint,
          new T.Vector3(side * 0.11, 0.015, -0.19),
          new T.Vector3(outer, -0.03, 0.05),
        ]
      : [
          anchor,
          new T.Vector3(outer, 0.18, 0.08),
          new T.Vector3(outer, -0.1, 0.05),
        ];
    const vertices: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        width = b
          .clone()
          .sub(a)
          .cross(new T.Vector3(0, 0, -1))
          .normalize()
          .multiplyScalar(0.0225);
      const q = [
        a.clone().add(width),
        a.clone().sub(width),
        b.clone().add(width),
        b.clone().sub(width),
      ];
      for (const j of [0, 1, 2, 2, 1, 3]) vertices.push(q[j].x, q[j].y, q[j].z);
    }
    belt.geometry.dispose();
    belt.geometry = new T.BufferGeometry();
    belt.geometry.setAttribute(
      'position',
      new T.Float32BufferAttribute(vertices, 3),
    );
    belt.geometry.computeVertexNormals();
    buckle.position.copy(bucklePoint);
    beltMat.color.set(s.seatbelt ? 0xd8a665 : 0x7b8084);
    root.userData = {
      height: s.height,
      seat: s.seatPosition,
      belt: s.seatbelt,
      anchor: anchor.toArray(),
      floor: 0.355,
    };
  }
  return { root, update };
}
export function createRoadStudy(scene: T.Scene) {
  const root = new T.Group();
  root.name = 'Road_surface_study';
  scene.add(root);
  const g = new T.PlaneGeometry(7, 48, 32, 240);
  g.rotateX(-Math.PI / 2);
  const material = new T.MeshPhysicalMaterial({
    color: 0x444c51,
    roughness: 0.9,
  });
  const mesh = new T.Mesh(g, material);
  mesh.receiveShadow = true;
  root.add(mesh);
  const pos = g.getAttribute('position'),
    base = Array.from(pos.array),
    water = new T.Mesh(
      new T.PlaneGeometry(6.8, 48),
      new T.MeshPhysicalMaterial({
        color: 0x556b70,
        transparent: true,
        opacity: 0.5,
        metalness: 0.35,
        roughness: 0.1,
        depthWrite: false,
      }),
    );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.016;
  root.add(water);
  let frame = 0,
    last = '';
  function update(s: Settings, distance: number) {
    root.visible =
      s.roadEnabled && s.view !== 'underbody' && s.section !== 'structure';
    if (!root.visible) return;
    const key =
      s.roadType +
      '|' +
      s.roadSeverity +
      '|' +
      s.weather +
      '|' +
      s.weatherIntensity;
    if (key !== last) {
      last = key;
      material.color.set(
        (
          {
            mud: 0x605340,
            gravel: 0x847968,
            ice: 0xa3b3bd,
            water: 0x515f64,
          } as Record<string, number>
        )[s.roadType] ?? 0x444c51,
      );
      material.roughness =
        ['ice', 'water'].includes(s.roadType) ||
        ['rain', 'storm'].includes(s.weather)
          ? 0.18
          : 0.9;
      material.metalness = s.roadType === 'ice' ? 0.25 : 0;
      if (['snow', 'blizzard'].includes(s.weather))
        material.color.lerp(new T.Color(0xd0d9dc), s.weatherIntensity / 140);
    }
    for (let i = 0; i < pos.count; i++)
      pos.setY(
        i,
        roadHeight(
          s.roadType,
          base[i * 3],
          base[i * 3 + 2] - distance,
          s.roadSeverity,
        ),
      );
    pos.needsUpdate = true;
    if (frame++ % 5 === 0) g.computeVertexNormals();
    water.visible = s.roadType === 'water';
    root.userData.distance = distance;
  }
  return { root, update };
}
export function createChassisStudy(scene: T.Scene) {
  const root = new T.Group();
  root.name = 'Chassis_layout_concept';
  scene.add(root);
  const alloy = new T.MeshStandardMaterial({
      color: 0x738b92,
      metalness: 0.7,
      roughness: 0.35,
    }),
    accent = new T.MeshStandardMaterial({
      color: 0xe1ac66,
      metalness: 0.5,
      roughness: 0.4,
    });
  const panel = new T.Mesh(
    new T.BoxGeometry(1.45, 0.09, 2.45),
    new T.MeshStandardMaterial({
      color: 0x334a58,
      metalness: 0.6,
      roughness: 0.45,
      transparent: true,
      opacity: 0.82,
    }),
  );
  panel.position.y = 0.22;
  root.add(panel);
  const crossbars: T.Mesh[] = [];
  for (const z of [-1.66, 1.54]) {
    const bar = new T.Mesh(
      new T.CylinderGeometry(0.035, 0.035, 1.62, 12),
      alloy,
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.32, z);
    root.add(bar);
    crossbars.push(bar);
    for (const x of [-0.65, 0.65]) {
      const spring = new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(
            Array.from({ length: 100 }, (_, i) => {
              const t = i / 99;
              return new T.Vector3(
                x + 0.055 * Math.cos(t * Math.PI * 14),
                0.23 + t * 0.28,
                z + 0.055 * Math.sin(t * Math.PI * 14),
              );
            }),
          ),
          90,
          0.008,
          6,
          false,
        ),
        accent,
      );
      root.add(spring);
      const link = new T.Mesh(new T.BoxGeometry(0.32, 0.025, 0.055), accent);
      link.position.set(x, 0.28, z);
      root.add(link);
    }
  }
  return {
    root,
    update(s: Settings, distance: number) {
      root.visible =
        s.chassisOverlay &&
        (s.view === 'underbody' || s.section === 'structure');
      panel.position.y =
        0.22 - (s.section === 'structure' ? (s.explode / 100) * 0.6 : 0);
      const p = ridePose(s.roadType, distance, s.roadSeverity);
      crossbars.forEach((m) => (m.rotation.x = s.roadEnabled ? p.roll : 0));
    },
  };
}
