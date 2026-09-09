import assert from 'node:assert/strict';
import * as T from 'three';
import { createShowroomStage } from '../app/showroom-stage.ts';
import { defaults } from '../app/experience.ts';
const scene = new T.Scene();
const floor = new T.Mesh(
  new T.PlaneGeometry(180, 180),
  new T.MeshStandardMaterial(),
);
scene.add(floor);
const stage = createShowroomStage(scene, floor);
let calls = 0,
  triangles = 0,
  lights = 0;
stage.root.traverse((o) => {
  if (o.isLight) lights++;
  if (o.isMesh) {
    calls++;
    triangles +=
      ((o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3) *
      (o.isInstancedMesh ? o.count : 1);
  }
});
assert.equal(lights, 0);
assert.ok(calls <= 10);
assert.ok(triangles < 2000);
assert.equal(floor.material.normalMap.image.width, 256);
for (const mode of ['day', 'night']) {
  stage.apply(
    { ...defaults, mode, section: 'exterior', weather: 'clear' },
    false,
  );
  assert.equal(stage.root.visible, true);
}
for (const patch of [
  { section: 'safety' },
  { section: 'structure' },
  { view: 'underbody' },
  { roadEnabled: true },
  { weather: 'rain' },
  { weather: 'snow' },
]) {
  stage.apply({ ...defaults, ...patch }, false);
  assert.equal(stage.root.visible, false);
}
stage.apply(defaults, true);
assert.equal(stage.root.visible, false);
stage.moveVehicle(12);
assert.equal(
  stage.root.getObjectByName('Soft vehicle contact shadow').position.z,
  12,
);
stage.moveVehicle(0);
assert.equal(
  stage.root.getObjectByName('Soft vehicle contact shadow').position.z,
  0,
);
console.log(
  JSON.stringify({
    calls,
    triangles,
    additionalLights: lights,
    grain: '256² RGBA + mipmaps',
    modeAndSceneIsolation: 'PASS',
    arrivalShadow: 'PASS',
  }),
);
