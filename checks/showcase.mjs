import assert from 'node:assert/strict';
import * as T from 'three';
import {
  exteriorFov,
  heroCameraPosition,
  showcasePose,
  showcaseDuration,
  showcaseCopy,
  entranceSettings,
} from '../app/entrance.ts';
import { defaults } from '../app/experience.ts';
const start = new T.Vector3(...showcasePose(0).position);
assert.ok(
  start.distanceTo(new T.Vector3(...heroCameraPosition)) < 1e-10,
  'no camera jump after arrival',
);
assert.ok(
  new T.Vector3(...showcasePose(showcaseDuration).position).distanceTo(start) <
    1e-10,
  'complete full circle',
);
let swept = 0,
  lastAngle = Math.atan2(start.x, start.z),
  previous = start;
const chapters = new Set();
for (let frame = 1; frame <= showcaseDuration * 60; frame++) {
  const p = showcasePose(frame / 60),
    position = new T.Vector3(...p.position);
  assert.ok(p.position.every(Number.isFinite));
  assert.ok(position.distanceTo(previous) < 0.08, 'bounded camera movement');
  let angle = Math.atan2(position.x, position.z),
    d = angle - lastAngle;
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  assert.ok(d <= 1e-10);
  swept += d;
  lastAngle = angle;
  previous = position;
  chapters.add(p.chapter);
  for (const aspect of [0.46, 0.75, 1.2, 1.7, 2.5]) {
    const camera = new T.PerspectiveCamera(
      exteriorFov(aspect),
      aspect,
      0.025,
      160,
    );
    camera.position.copy(position);
    camera.lookAt(0, 0.85, 0);
    camera.updateMatrixWorld();
    for (const x of [-1.05, 1.05])
      for (const y of [0.1, 1.95])
        for (const z of [-2.6, 2.6]) {
          const v = new T.Vector3(x, y, z).project(camera);
          assert.ok(
            Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1,
            'body framing during orbit',
          );
        }
  }
}
assert.ok(Math.abs(swept + Math.PI * 2) < 1e-9);
assert.equal(chapters.size, 4);
assert.equal(showcasePose(23.9).done, false);
assert.equal(showcasePose(24).done, true);
const deep = {
  ...defaults,
  section: 'safety',
  view: 'top',
  hmi: 'auto-parking',
  progress: 0.6,
};
const copy = structuredClone(deep);
entranceSettings(deep);
assert.deepEqual(deep, copy);
for (const locale of ['zh', 'en', 'de', 'ja', 'ar'])
  assert.equal(showcaseCopy[locale].chapters.length, 4);
console.log(
  'PASS: 1,440 orbit frames, full 360-degree sweep, arrival continuity, 4 chapters / 5 locales, 5 viewport ratios including portrait, original scene snapshot retained. No browser visual claim.',
);
