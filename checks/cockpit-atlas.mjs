import assert from 'node:assert/strict';
import * as T from 'three';
import { createCockpitScreens, screenRegions } from '../app/cockpit.ts';
import { defaults, shareUrl, readSettings } from '../app/experience.ts';
import { scenarios, scenarioPreset, parkingPose } from '../app/scenarios.ts';
let calls = [];
const c = new Proxy(
  { createLinearGradient: () => ({ addColorStop() {} }) },
  {
    get(o, k) {
      return (
        o[k] ??
        ((...args) => {
          assert.ok(
            args.filter((x) => typeof x === 'number').every(Number.isFinite),
          );
          calls.push([k, ...args]);
        })
      );
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => c }),
};
const source = new T.Texture({ width: 512, height: 512 });
source.flipY = false;
const screens = createCockpitScreens(source);
assert.equal(screens.texture.flipY, false);
for (const r of Object.values(screenRegions)) {
  assert.ok(r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= 512 && r[1] + r[3] <= 512);
}
for (const scene of scenarios)
  for (const p of [0, 0.26, 0.51, 0.76])
    screens.draw({ ...defaults, ...scenarioPreset(scene.id) }, p);
calls = [];
screens.draw(
  {
    ...defaults,
    section: 'interior',
    cabinApp: 'comfort',
    temperature: 26,
    fan: 4,
  },
  0,
);
assert.ok(calls.some((c) => c[0] === 'fillText' && c[1] === '26°'));
assert.ok(calls.some((c) => c[0] === 'fillText' && c[1].includes('FAN 4')));
assert.deepEqual(parkingPose('auto-parking', 0.5), {
  x: 0,
  z: 0,
  yaw: 0,
  t: 0,
});
assert.deepEqual(parkingPose('auto-parking', 0.75), {
  x: 3,
  z: 3,
  yaw: Math.PI / 2,
  t: 1,
});
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
const conf = {
  ...defaults,
  view: 'passenger',
  cabinApp: 'comfort',
  temperature: 26,
  fan: 4,
  volume: 65,
  ambientPower: 34,
};
window.location.search = new URL(shareUrl(conf)).search;
assert.deepEqual(readSettings(), conf);
window.location.search = '?temperature=99&fan=-3&ambientPower=999';
const safe = readSettings();
assert.equal(safe.temperature, 28);
assert.equal(safe.fan, 0);
assert.equal(safe.ambientPower, 100);
// Parked previews must not show stale hazards from an inactive driving scenario.
calls = [];
screens.draw(
  { ...defaults, section: 'interior', hmi: 'takeover', cabinApp: 'navigation' },
  0.4,
);
assert.ok(calls.some((c) => c[0] === 'fillText' && c[1] === '驻车预览'));
assert.ok(
  !calls.some((c) => c[0] === 'fillText' && /请接管|注意前方风险/.test(c[1])),
);
calls = [];
screens.draw(
  { ...defaults, section: 'interior', hmi: 'takeover', cabinApp: 'navigation' },
  0.6,
);
assert.equal(calls.length, 0, 'stationary screens do not re-upload the atlas');
screens.draw({ ...defaults, section: 'safety', hmi: 'navigation' }, 0.4);
assert.ok(calls.some((c) => c[0] === 'fillText' && c[1] === '48'));
screens.dispose();
console.log(
  'PASS: original atlas orientation/regions; 100 scenario screen states; controls reflected in screen text; parked-pose endpoints; configuration round-trip.',
);
