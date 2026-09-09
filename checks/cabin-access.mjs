import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { defaults, readSettings, shareUrl } from '../app/experience.ts';
import {
  readCabinAccess,
  passengerList,
  newPassenger,
} from '../app/cabin-access.ts';
import { seatPositions } from '../app/study-state.ts';
import { createRobotPassengers } from '../app/robot-passengers.ts';
import { openingKey, installWindowOpening } from '../app/window-opening.ts';
globalThis.window = {
  location: { href: 'http://localhost:3001/', search: '' },
};
const config = {
  ...defaults,
  occupant: true,
  passengers: seatPositions.map((seat, i) => ({
    ...newPassenger(seat),
    name: '乘员' + i,
    height: 150 + i * 9,
    offset: i - 3,
  })),
  windowLF: 100,
  windowRF: 50,
  windowLB: 25,
  windowRB: 0,
  panView: true,
};
assert.deepEqual(readSettings(new URL(shareUrl(config)).search), config);
const bad = readCabinAccess(
  new URLSearchParams({
    passengers: JSON.stringify([
      { seat: 'bad' },
      { seat: 'front-left', height: 999, offset: -900 },
      { seat: 'front-left' },
    ]),
    windowLF: 'NaN',
    windowRF: '-20',
  }),
);
assert.equal(bad.passengers.length, 1);
assert.equal(bad.passengers[0].height, 195);
assert.equal(bad.passengers[0].offset, -3);
assert.equal(bad.windowLF, 0);
assert.equal(bad.windowRF, 0);
const scene = new T.Scene(),
  parent = new T.Group();
scene.add(parent);
const robots = createRobotPassengers(parent);
robots.update(config, false);
assert.equal(robots.root.children.length, 6);
assert.equal(new Set(robots.root.children.map((o) => o.name)).size, 6);
for (const height of [150, 170, 195])
  for (const offset of [-3, 0, 3]) {
    robots.update(
      {
        ...config,
        passengers: config.passengers.map((p) => ({ ...p, height, offset })),
      },
      false,
    );
    scene.updateMatrixWorld(true);
    for (const g of robots.root.children) {
      const b = new T.Box3().setFromObject(g);
      assert.ok(b.max.y < 1.68, 'head stays below cabin roof envelope');
      assert.ok(b.min.y > 0.48, 'feet stay above sampled cabin floor');
      assert.ok(b.max.x - b.min.x < 0.6, 'robot fits a single seat width');
    }
  }
robots.update({ ...config, view: 'driver' }, true);
assert.equal(robots.root.getObjectByName('robot_front-left').visible, false);
assert.equal(robots.root.getObjectByName('robot_front-right').visible, true);
robots.update({ ...config, occupant: false }, false);
assert.equal(robots.root.visible, false);
assert.deepEqual(passengerList({ ...config, occupant: false }), []);
// Actual model geometry: only four movable window groups, never windscreen/quarter glass.
globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({
  width: 1,
  height: 1,
  close() {},
});
const b = fs.readFileSync('public/models/zeekr-9x.glb');
const car = (
  await new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    '',
  )
).scene;
car.updateMatrixWorld(true);
const glass = [];
car.traverse((m) => {
  if (!m.isMesh) return;
  let o = m,
    path = '';
  while (o) {
    path = '/' + o.name + path;
    o = o.parent;
  }
  const key = openingKey(path);
  if (!key) return;
  const base = m.matrixWorld.clone(),
    before = m.geometry.attributes.position.array.slice();
  const opening = installWindowOpening(
    m,
    base,
    Array.isArray(m.material) ? m.material : [m.material],
  );
  assert.deepEqual(m.geometry.attributes.position.array, before);
  assert.ok(opening.travel > 0.45 && opening.travel < 0.55);
  const ys = m.geometry.attributes.windowRestHeight.array;
  for (const n of [0, 0.5, 1]) {
    const threshold = opening.sill + opening.travel * n - 0.002;
    const visible = [...ys].filter((y) => y >= threshold).length;
    if (n === 0) assert.equal(visible, ys.length);
    if (n === 0.5) assert.ok(visible > 0 && visible < ys.length);
    if (n === 1) assert.equal(visible, 0);
  }
  glass.push(key);
});
assert.deepEqual([...new Set(glass)].sort(), [
  'windowLB',
  'windowLF',
  'windowRB',
  'windowRF',
]);
assert.equal(glass.length, 8);
console.log(
  JSON.stringify({
    configRoundtrip: true,
    invalidInput: true,
    independentRobots: 6,
    poses: 9,
    headFeetAndWidthEnvelope: true,
    selfCameraHidden: true,
    windowPrimitives: 8,
    openingLevels: [0, 50, 100],
    geometryUnchanged: true,
    note: 'Envelope checks do not certify full surface collision freedom.',
  }),
);
