import fs from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRobotPassengers } from '../app/robot-passengers.ts';
import { defaults } from '../app/experience.ts';
import { seatPositions } from '../app/study-state.ts';
import { newPassenger } from '../app/cabin-access.ts';
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
function data(m) {
  const p = m.geometry.attributes.position,
    v = new T.Vector3(),
    vs = [];
  for (let i = 0; i < p.count; i++)
    vs.push(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).toArray());
  const a =
    m.geometry.index?.array ?? Array.from({ length: p.count }, (_, i) => i);
  return {
    name: m.name,
    vertices: vs,
    faces: Array.from({ length: a.length / 3 }, (_, i) => [
      a[i * 3],
      a[i * 3 + 1],
      a[i * 3 + 2],
    ]),
  };
}
const cars = [];
car.traverse((o) => {
  if (o.isMesh) cars.push(data(o));
});
const group = new T.Group(),
  study = createRobotPassengers(group),
  poses = [];
for (const height of [150, 170, 195])
  for (const offset of [-3, 0, 3]) {
    study.update(
      {
        ...defaults,
        occupant: true,
        passengers: seatPositions.map((seat) => ({
          ...newPassenger(seat),
          height,
          offset,
        })),
      },
      false,
    );
    group.updateMatrixWorld(true);
    const robots = [];
    study.root.children.forEach((g) =>
      g.children.forEach((m, i) => {
        if (m.isMesh && m.name !== 'robot_seatbelt')
          robots.push({
            ...data(m),
            name: g.name + '_' + i + '_' + m.geometry.type,
          });
      }),
    );
    poses.push({ height, offset, robots });
  }
fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(
  'outputs/robot-contact-geometry.json',
  JSON.stringify({ cars, poses }),
);
