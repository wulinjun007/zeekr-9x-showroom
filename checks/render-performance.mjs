import assert from 'node:assert/strict';
import * as T from 'three';
import { createStaticBatches } from '../app/static-batches.ts';
import { continuousScene } from '../app/render-policy.ts';
import { qualityRatio, qualityProfiles } from '../app/render-quality.ts';
import { defaults } from '../app/experience.ts';
// Fullscreen/Retina never exceeds the declared framebuffer budget.
for (const [w, h, dpr] of [
  [733, 532, 2],
  [1920, 1080, 2],
  [3840, 2160, 3],
  [320, 640, 1],
]) {
  for (const tier of Object.keys(qualityProfiles)) {
    const ratio = qualityRatio(w, h, dpr, tier);
    assert.ok(ratio > 0 && ratio <= dpr);
    assert.ok(w * h * ratio * ratio <= qualityProfiles[tier].pixels + 1);
  }
}
assert.equal(continuousScene(defaults, false, false, false), false);
assert.equal(continuousScene(defaults, false, true, false), true);
assert.equal(
  continuousScene({ ...defaults, weather: 'rain' }, false, false, false),
  true,
);
assert.equal(
  continuousScene(
    { ...defaults, section: 'safety', playing: false },
    false,
    false,
    false,
  ),
  true,
);
assert.equal(
  continuousScene(
    { ...defaults, roadEnabled: true, roadPlaying: true, view: 'underbody' },
    false,
    false,
    false,
  ),
  false,
);
// A merged display must retain exactly the original triangles, locations and pick targets.
const scene = new T.Scene(),
  material = new T.MeshStandardMaterial({ color: 'red' });
material.name = 'body';
const pieces = [];
for (let i = 0; i < 12; i++) {
  const mesh = new T.Mesh(new T.BoxGeometry(), material.clone());
  mesh.position.x = i * 2;
  mesh.updateMatrix();
  scene.add(mesh);
  pieces.push({ mesh, materials: [mesh.material], group: 'body' });
}
const glass = new T.Mesh(
  new T.BoxGeometry(),
  new T.MeshStandardMaterial({ transparent: true, opacity: 0.2 }),
);
scene.add(glass);
pieces.push({ mesh: glass, materials: [glass.material], group: 'glass' });
const batches = createStaticBatches(scene, pieces);
assert.equal(batches.originalCount, 12);
assert.equal(batches.batchCount, 1);
const geometry = batches.root.children[0].geometry;
assert.equal(geometry.attributes.position.count / 3, 12 * 12);
geometry.computeBoundingBox();
assert.equal(geometry.boundingBox.min.x, -0.5);
assert.equal(geometry.boundingBox.max.x, 22.5);
batches.setEnabled(true);
assert.equal(glass.layers.mask, 1);
const raycaster = new T.Raycaster(
  new T.Vector3(4, 0, 3),
  new T.Vector3(0, 0, -1),
);
raycaster.layers.enable(1);
scene.updateMatrixWorld(true);
assert.equal(
  raycaster.intersectObjects(
    pieces.map((p) => p.mesh),
    false,
  )[0].object,
  pieces[2].mesh,
);
batches.setEnabled(false);
assert.ok(pieces.every((p) => p.mesh.layers.mask === 1));
assert.equal(batches.root.visible, false);
console.log(
  'PASS: pixel budgets, idle/moving scene scheduling, 12:1 render batches with unchanged triangle count/bounds, original part picking and restoration for animation.',
);
