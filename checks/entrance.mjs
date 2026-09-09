import assert from 'node:assert/strict';
import * as T from 'three';
import { defaults } from '../app/experience.ts';
import {
  entrancePose,
  entranceDuration,
  entranceDistance,
  entranceCameraPosition,
  entranceSettings,
  entranceCopy,
} from '../app/entrance.ts';

// Entry and arrival framing across narrow and wide viewports, without a browser.
for (const aspect of [0.65, 1, 1.5, 2, 2.5]) {
  const camera = new T.PerspectiveCamera(38, aspect, 0.025, 160);
  camera.position.set(...entranceCameraPosition);
  camera.lookAt(0, 0.85, 0);
  camera.updateMatrixWorld();
  for (const x of [-1.15, 1.15])
    for (const y of [0, 2.1])
      for (const z of [-2.7, 2.7]) {
        const projected = new T.Vector3(x, y, z + entranceDistance).project(
          camera,
        );
        assert.ok(
          projected.x > 1,
          `car starts outside frame at aspect ${aspect}`,
        );
      }
}
let previous = entranceDistance,
  previousSpeed = Infinity;
for (let i = 0; i <= 264; i++) {
  const time = i / 60,
    p = entrancePose(time);
  assert.ok(p.z >= 0 && p.z <= previous + 1e-9, 'no reverse or overshoot');
  const speed = (previous - p.z) * 60;
  if (i > 1) assert.ok(speed <= previousSpeed + 1e-7, 'smooth deceleration');
  if (i) previousSpeed = speed;
  previous = p.z;
}
assert.equal(entrancePose(3.8).z, 0);
assert.equal(entrancePose(entranceDuration).done, true);
assert.equal(entrancePose(4.3).done, false);
const endRotation = new T.Matrix4().makeRotationX(
  -entrancePose(entranceDuration).travel / 0.409,
);
const identity = new T.Matrix4();
endRotation.elements.forEach((v, i) =>
  assert.ok(
    Math.abs(v - identity.elements[i]) < 1e-12,
    'wheels settle at original orientation',
  ),
);
for (const section of ['exterior', 'interior', 'safety', 'structure']) {
  const requested = {
    ...defaults,
    section,
    view: 'top',
    hmi: 'auto-parking',
    progress: 0.65,
    playing: true,
    roadEnabled: true,
    doors: ['Door_LF'],
    hidden: ['body'],
    explode: 80,
    transparent: true,
  };
  const before = structuredClone(requested);
  const opening = entranceSettings(requested);
  assert.equal(opening.section, 'exterior');
  assert.equal(opening.view, 'hero');
  assert.equal(opening.playing, false);
  assert.equal(opening.roadEnabled, false);
  assert.deepEqual(opening.doors, []);
  assert.deepEqual(opening.hidden, []);
  assert.equal(opening.paint, requested.paint);
  assert.equal(opening.progress, requested.progress);
  assert.deepEqual(requested, before, 'deep-linked scene remains untouched');
}
for (const locale of ['zh', 'en', 'de', 'ja', 'ar'])
  assert.ok(entranceCopy[locale].skip);
console.log(
  'PASS: entry framing at 5 aspect ratios; 265 motion samples; wheel continuity; 4 scene snapshots; 5 languages. No browser visual verification.',
);
