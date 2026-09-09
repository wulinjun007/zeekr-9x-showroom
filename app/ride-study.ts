import * as T from 'three';
import type { Settings } from './experience';
import { roadHeight, ridePose } from './study-state';
export { createRobotPassengers as createSeatingStudy } from './robot-passengers';
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
