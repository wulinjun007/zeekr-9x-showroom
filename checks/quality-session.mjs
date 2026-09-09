import assert from 'node:assert/strict';
import {
  AdaptiveQuality,
  readQualityMode,
  saveQualityMode,
} from '../app/render-quality.ts';
import { resetScene, saveScene, restoreScene } from '../app/scene-session.ts';
import { hmiDisplay } from '../app/hmi-display.ts';
import { defaults, readSettings } from '../app/experience.ts';
import { entranceSettings } from '../app/entrance.ts';
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, v),
};
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
assert.equal(readQualityMode(), 'auto');
saveQualityMode('high');
assert.equal(readQualityMode(), 'high');
function sample(q, from, to, interval, work) {
  for (let t = from; t < to; t += interval) q.sample(interval, work, t);
}
const q = new AdaptiveQuality('auto', 0);
sample(q, 0, 4900, 50, 20);
assert.equal(q.tier, 'balanced');
sample(q, 5000, 7200, 40, 20);
assert.equal(q.tier, 'balanced', 'one slow window does not oscillate');
sample(q, 7200, 9400, 40, 20);
assert.equal(q.tier, 'smooth', 'sustained slow work downgrades');
q.setMode('high', 10000);
sample(q, 15000, 30000, 100, 30);
assert.equal(q.tier, 'high', 'manual choice stays fixed');
const fast = new AdaptiveQuality('auto', 0);
sample(fast, 5000, 18000, 16.7, 3);
assert.equal(fast.tier, 'high', 'long stable headroom upgrades');
const stalled = new AdaptiveQuality('auto', 0);
sample(stalled, 5000, 28000, 300, 30);
assert.equal(
  stalled.tier,
  'smooth',
  'very slow foreground frames still downgrade',
);
assert.equal(readSettings('').paint, 'obsidian');
assert.equal(readSettings('').mode, 'night');
assert.equal(entranceSettings(defaults).mode, 'night');
assert.equal(entranceSettings(defaults).lights, true);
assert.equal(entranceSettings({ ...defaults, mode: 'day' }).mode, 'day');
const source = {
  ...defaults,
  paint: 'wine',
  wheelStyle: 'sport',
  seatMaterial: 'fabric',
  roofMaterial: 'suede',
  height: 185,
  weather: 'storm',
  roadEnabled: true,
  roadPlaying: true,
  playing: true,
  section: 'safety',
  view: 'third-right',
  progress: 0.57,
  doors: ['Door_LF'],
};
const reset = resetScene(source);
for (const key of [
  'paint',
  'wheelStyle',
  'seatMaterial',
  'roofMaterial',
  'height',
])
  assert.equal(reset[key], source[key]);
assert.equal(reset.roadEnabled, false);
assert.deepEqual(reset.doors, []);
assert.equal(source.weather, 'storm');
assert.equal(saveScene(source), true);
const restored = restoreScene();
assert.equal(restored.paint, 'wine');
assert.equal(restored.view, 'third-right');
assert.equal(restored.progress, 0.57);
assert.equal(restored.playing, false);
assert.equal(restored.roadPlaying, false);
localStorage.setItem('zeekr9x-scene-v1', 'broken');
assert.equal(restoreScene(), null);
localStorage.setItem(
  'zeekr9x-scene-v1',
  JSON.stringify({ version: 99, search: '?view=hero' }),
);
assert.equal(restoreScene(), null);
localStorage.setItem = () => {
  throw new Error('blocked');
};
assert.equal(saveScene(source), false);
assert.doesNotThrow(() => saveQualityMode('smooth'));
assert.equal(
  hmiDisplay({ ...defaults, hmi: 'startup', progress: 0 }).gear,
  'P',
);
const takeover = hmiDisplay({ ...defaults, hmi: 'takeover', progress: 0.5 });
// Validate every scenario below rather than assuming a name resolves.
import { scenarios } from '../app/scenarios.ts';
for (const sc of scenarios)
  for (const progress of [0, 0.3, 0.5, 0.9]) {
    const frame = hmiDisplay({ ...defaults, hmi: sc.id, progress });
    assert.ok(Number.isFinite(frame.speed));
    if (frame.countdown !== null) assert.equal(frame.tone, 'critical');
    if (sc.id === 'auto-parking' && progress === 0.5)
      assert.equal(frame.gear, 'R');
    if (!frame.alert) assert.equal(frame.tone, 'normal');
  }
console.log(
  'PASS: adaptive warmup/hysteresis/manual persistence/stalls; black-night defaults; scene reset preserves configuration; save/restore and corrupt/blocked storage; HMI state and alert hierarchy.',
);
