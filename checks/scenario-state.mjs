import assert from 'node:assert/strict';
import {
  scenarios,
  scenarioFrame,
  scenarioDistance,
  scenarioPreset,
} from '../app/scenarios.ts';
import { defaults, readSettings, shareUrl } from '../app/experience.ts';
import { labText, labWords } from '../app/lab-state.ts';
assert.equal(scenarios.length, 25);
assert.equal(new Set(scenarios.map((s) => s.id)).size, 25);
for (const s of scenarios) {
  assert.equal(s.steps.length, 4);
  const preset = scenarioPreset(s.id);
  assert.equal(preset.playing, false);
  assert.equal(preset.progress, 0);
  assert.equal(preset.hmi, s.id);
  for (let i = 0; i < 4; i++) {
    const f = scenarioFrame(s.id, i * 0.25 + 0.001);
    assert.equal(f.phase, i);
    assert.equal(f.step, s.steps[i]);
    assert.ok(Number.isFinite(f.speed));
  }
  if (s.family === 'iHMI') {
    assert.equal(s.speed, 0);
    assert.equal(s.journey, 'parked');
  }
}
for (const p of [0.3, 0.5, 0.8, 1]) {
  assert.equal(scenarioFrame('sensor', p).coverage, false);
  assert.equal(scenarioFrame('sensor', p).fault, true);
  assert.equal(scenarioFrame('sensor', p).alert, true);
}
assert.equal(scenarioFrame('collision', 0.8).speed, 0);
assert.equal(scenarioFrame('parking', 0.3).speed, 0);
assert.equal(scenarioFrame('takeover', 1).alert, true);
assert.equal(scenarioFrame('fatigue', 1).alert, true);
assert.equal(scenarioFrame('takeover', 0.5).countdown, 4);
assert.equal(scenarioFrame('unknown', 0).scenario.id, 'startup');
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
const state = {
  ...defaults,
  ...scenarioPreset('cinema'),
  weather: 'snow',
  height: 188,
  occupant: true,
  occupantRow: 'third',
  finish: 'satin',
  lightRig: 'strip',
  shade: 65,
  rearScreen: true,
  readingLights: false,
  climate: 'massage',
};
window.location.search = new URL(shareUrl(state)).search;
assert.deepEqual(readSettings(), state);
window.location.search = '?height=9999&shade=-100&weather=unknown&finish=unsafe';
const fallback = readSettings();
assert.equal(fallback.height, 195);
assert.equal(fallback.shade, 0);
assert.equal(fallback.weather, 'clear');
assert.equal(fallback.finish, 'gloss');
for (const key of Object.keys(labWords))
  for (const l of ['zh', 'en', 'de', 'ja', 'ar']) assert.ok(labText(l, key));
console.log(
  'PASS: 25 scenario states, parked entertainment, persistent faults, TOI boundaries, braking/parking stop, extended share links and locale controls.',
);

assert.equal(
  scenarioDistance('collision', 0.8),
  scenarioDistance('collision', 1),
);
assert.equal(scenarioDistance('parking', 0.4), scenarioDistance('parking', 1));

assert.equal(scenarioFrame('auto-parking', 0.6).speed, 5);
assert.equal(scenarioFrame('auto-parking', 0.8).speed, 0);
assert.equal(scenarioFrame('auto-parking', 0.6).alert, false);
assert.equal(
  scenarioDistance('auto-parking', 0.8),
  scenarioDistance('auto-parking', 1),
);
