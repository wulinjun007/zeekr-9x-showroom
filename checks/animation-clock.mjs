import { animationStep } from '../app/animation-time.ts';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createAtelier } from '../app/atelier.ts';
import { defaults } from '../app/experience.ts';
const ctx = new Proxy(
  { createLinearGradient: () => ({ addColorStop() {} }) },
  {
    get: (o, k) => o[k] ?? (() => {}),
    set: (o, k, v) => ((o[k] = v), true),
  },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
};
let samples = 0;
for (const s of [
  defaults,
  { ...defaults, section: 'safety', hmi: 'auto-parking' },
  { ...defaults, section: 'safety', hmi: 'charge' },
]) {
  const scene = new T.Scene(),
    atelier = createAtelier(scene);
  // RAF's shared frame timestamp may precede a performance.now() initialization.
  for (const dt of [-0.004, 0, 0.016, NaN, Infinity, -Infinity, 900, 0.016]) {
    assert.doesNotThrow(
      () => atelier.update(s, dt, 1000, 0.5, false, {}),
      `hmi=${s.hmi}, dt=${dt}`,
    );
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      assert.ok(
        o.matrixWorld.elements.every(Number.isFinite),
        `finite pose: ${o.name}`,
      );
      const position = o.geometry?.attributes.position;
      if (position)
        assert.ok(Array.from(position.array).every(Number.isFinite));
    });
    samples++;
  }
  atelier.dispose();
}
console.log(
  `PASS: ${samples} animation-clock recovery samples, including first-frame negative time and continued charging/parking playback.`,
);

for (const value of [-0.004, 0, NaN, Infinity, -Infinity])
  assert.equal(animationStep(value), 0);
assert.equal(animationStep(0.016), 0.016);
assert.equal(animationStep(900), 0.05);
// A negative first delta is discarded; subsequent valid frames still advance.
let elapsed = 0;
for (const delta of [-0.004, 0.016, 0.016]) elapsed += animationStep(delta);
assert.equal(elapsed, 0.032);
