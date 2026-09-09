import assert from 'node:assert/strict';
import * as T from 'three';
import { createAtelier } from '../app/atelier.ts';
import { defaults } from '../app/experience.ts';
import { scenarios, scenarioPreset } from '../app/scenarios.ts';
const context = new Proxy(
  { createLinearGradient: () => ({ addColorStop() {} }) },
  {
    get(o, k) {
      return o[k] ?? (() => {});
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => context }),
};
const scene = new T.Scene(),
  atelier = createAtelier(scene);
let rendered = 0;
for (const sc of scenarios)
  for (const p of [0, 0.26, 0.51, 0.76, 1]) {
    const s = { ...defaults, ...scenarioPreset(sc.id) };
    atelier.update(
      s,
      0.016,
      1000,
      p,
      ['driver', 'second', 'third'].includes(s.view),
      {},
    );
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      assert.ok(o.matrixWorld.elements.every(Number.isFinite));
      if (o.geometry) {
        const a = o.geometry.attributes.position;
        if (a) assert.ok(Array.from(a.array).every(Number.isFinite));
      }
    });
    rendered++;
  }
for (const weather of ['clear', 'rain', 'snow', 'fog', 'wind'])
  for (const height of [150, 170, 195])
    atelier.update(
      { ...defaults, weather, height, occupant: true },
      0.05,
      1100,
      0.5,
      false,
      {},
    );
assert.ok(scene.getObjectByName('Atelier_supplemental_cabin'));
atelier.dispose();
console.log(
  `PASS: ${rendered} supplemental geometry/state combinations; weather and stature bounds; no WebGL or visual quality claim.`,
);
