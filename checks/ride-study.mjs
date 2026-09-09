import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  createSeatingStudy,
  createRoadStudy,
  createChassisStudy,
} from '../app/ride-study.ts';
import {
  seatPositions,
  roadTypes,
  ridePose,
  roadHeight,
  partCategory,
  partOffset,
} from '../app/study-state.ts';
import { weatherTypes } from '../app/lab-state.ts';
import { defaults, shareUrl, readSettings } from '../app/experience.ts';
import { splitCabinMesh } from '../app/cmf.ts';
import { createAtelier } from '../app/atelier.ts';
const ctx = new Proxy(
  { createLinearGradient: () => ({ addColorStop() {} }) },
  { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => ((o[k] = v), true) },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
};
globalThis.window = {
  location: { href: 'http://localhost:3001/', search: '' },
};
const scene = new T.Scene(),
  root = new T.Group();
scene.add(root);
const seating = createSeatingStudy(root);
let poses = 0;
for (const seatPosition of seatPositions)
  for (const height of [150, 165, 180, 195])
    for (const seatbelt of [false, true]) {
      const s = {
        ...defaults,
        seatPosition,
        height,
        seatbelt,
        occupant: true,
        view: 'seat-study',
      };
      seating.update(s, false);
      scene.updateMatrixWorld(true);
      assert.ok(seating.root.visible);
      const robot = seating.root.getObjectByName('robot_' + seatPosition);
      assert.ok(robot);
      assert.equal(!!robot.getObjectByName('robot_seatbelt'), seatbelt);
      assert.equal(
        Math.sign(robot.position.x),
        seatPosition.endsWith('left') ? -1 : 1,
      );
      const bounds = new T.Box3().setFromObject(robot);
      assert.ok(
        bounds.min.y > 0.48 && bounds.max.y < 1.68,
        'robot fits calibrated floor/roof envelope',
      );
      window.location.search = new URL(shareUrl(s)).search;
      assert.deepEqual(readSettings(), s);
      poses++;
    }
const road = createRoadStudy(scene),
  chassis = createChassisStudy(scene);
let surfaces = 0;
for (const roadType of roadTypes)
  for (const roadSeverity of [0, 50, 100])
    for (const d of [0, 1, 5, 11, 25]) {
      const s = {
        ...defaults,
        roadType,
        roadSeverity,
        roadEnabled: true,
        view: 'hero',
      };
      road.update(s, d);
      const p = ridePose(roadType, d, roadSeverity);
      assert.ok(Object.values(p).flat().every(Number.isFinite));
      assert.ok(
        Math.abs(p.heave) < 0.15 &&
          Math.abs(p.pitch) < 0.2 &&
          Math.abs(p.roll) < 0.2,
      );
      p.wheels.forEach((h, i) =>
        assert.equal(
          h,
          roadHeight(
            roadType,
            i % 2 ? 0.84 : -0.84,
            (i < 2 ? -1.66 : 1.54) - d,
            roadSeverity,
          ),
        ),
      );
      surfaces++;
    }
road.update({ ...defaults, roadEnabled: true, view: 'underbody' }, 0);
assert.equal(road.root.visible, false);
chassis.update({ ...defaults, chassisOverlay: false, view: 'underbody' }, 0);
assert.equal(chassis.root.visible, false);
chassis.update({ ...defaults, chassisOverlay: true, view: 'underbody' }, 0);
assert.equal(chassis.root.visible, true);
const atelier = createAtelier(scene);
let combinations = 0;
for (const weather of weatherTypes)
  for (const roadType of roadTypes) {
    atelier.update(
      {
        ...defaults,
        weather,
        roadType,
        roadEnabled: true,
        occupant: true,
        weatherIntensity: 100,
      },
      0.016,
      1000,
      0.5,
      false,
      {},
      5,
    );
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      assert.ok(o.matrixWorld.elements.every(Number.isFinite));
      if (o.geometry?.attributes.position)
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
    });
    combinations++;
  }
globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({
  width: 1,
  height: 1,
  close() {},
});
const b = fs.readFileSync('public/models/zeekr-9x.glb'),
  car = (
    await new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      '',
    )
  ).scene;
car.updateMatrixWorld(true);
const original = [];
car.traverse((o) => {
  if (o.isMesh) original.push(o);
});
const parts = {};
for (const m of original.flatMap(splitCabinMesh)) {
  let o = m,
    path = '';
  while (o) {
    path += '/' + o.name;
    o = o.parent;
  }
  const mats = (Array.isArray(m.material) ? m.material : [m.material])
    .map((m) => m.name)
    .join(' ');
  const id = partCategory(path, mats, m.userData.cmfZone);
  parts[id] = (parts[id] ?? 0) + 1;
  assert.ok(
    partOffset(
      id,
      new T.Box3().setFromObject(m).getCenter(new T.Vector3()),
    ).every(Number.isFinite),
  );
}
for (const id of [
  'tires',
  'rims',
  'brakes',
  'seats',
  'glass',
  'door-shell',
  'door-trim',
  'lights',
])
  assert.ok(parts[id] > 0, id);
const result = {
  seatingPoses: poses,
  roadSamples: surfaces,
  weatherRoadCombinations: combinations,
  parts,
  feetRemainAtStudyFloor: true,
  shareRoundTrip: true,
  browserRenderVerified: false,
  engineeringValidation: false,
};
fs.writeFileSync('checks/ride-study.json', JSON.stringify(result, null, 2));
console.log(result);
atelier.dispose();
