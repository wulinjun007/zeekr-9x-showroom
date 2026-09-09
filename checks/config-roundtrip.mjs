import assert from 'node:assert/strict';
import {
  defaults,
  shareUrl,
  readSettings,
  text,
  locales,
} from '../app/experience.ts';
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
const original = {
  ...defaults,
  locale: 'ar',
  section: 'structure',
  view: 'rear',
  paint: 'forest',
  wheelStyle: 'turbine',
  tireStyle: 'touring',
  seatStyle: 'cognac',
  backrest: 'A',
  glassTint: 'bronze',
  glassFront: 86,
  glassRear: 12,
  glassRoof: 25,
  doors: ['Door_LF', 'Hood'],
  hidden: ['glass'],
  selected: 'doors',
  isolated: true,
  explode: 75,
  lights: true,
  radar: false,
  hotspots: false,
  transparent: true,
};
const url = shareUrl(original);
window.location.search = new URL(url).search;
assert.deepEqual(readSettings(), original);
window.location.search =
  '?view=unknown&explode=9999&ambient=javascript:x&doors=unknown';
const safe = readSettings();
assert.equal(safe.view, 'hero');
assert.equal(safe.explode, 200);
assert.deepEqual(safe.doors, []);
assert.equal(safe.ambient, defaults.ambient);
for (const locale of Object.keys(locales))
  for (const key of [
    'safety',
    'parkingAction',
    'sourceText',
    'wheelStyle',
    'backrestNote',
    'error',
  ])
    assert.notEqual(text(locale, key), key);
console.log(
  'Configuration round-trip, invalid-input fallback and primary localization checks: PASS',
);

assert.equal(
  readSettings('?mode=studio').mode,
  'day',
  'legacy studio links migrate to the neutral daylight scene',
);

const glassSafe = readSettings(
  '?glassTint=bad&glassFront=NaN&glassRear=-9&glassRoof=500',
);
assert.equal(glassSafe.glassTint, 'original');
assert.equal(glassSafe.glassFront, defaults.glassFront);
assert.equal(glassSafe.glassRear, 0);
assert.equal(glassSafe.glassRoof, 100);
const { glassZone, glassPresets, glassCabinLight } =
  await import('../app/glass.ts');
assert.equal(glassZone('Glass_Light'), null);
assert.equal(glassZone('Glass_Clear_B'), 'glassFront');
assert.equal(glassZone('Glass_Black'), 'glassRear');
assert.equal(glassZone('Glass_ROOF_B'), 'glassRoof');
assert.equal(glassPresets.privacy.glassFront, defaults.glassFront);
assert.ok(
  glassCabinLight(glassPresets.privacy) < glassCabinLight(glassPresets.clear),
);
console.log(
  'Glazing sharing, ranges, zones, lamp-cover exclusion and privacy presets: PASS',
);

const stored = new Map();
globalThis.localStorage = {
  getItem: (k) => stored.get(k) ?? null,
  setItem: (k, v) => stored.set(k, v),
};
const { saveScene, restoreScene, resetScene } =
  await import('../app/scene-session.ts');
assert.ok(saveScene(original));
for (const k of ['glassTint', 'glassFront', 'glassRear', 'glassRoof']) {
  assert.equal(restoreScene()[k], original[k]);
  assert.equal(resetScene(original)[k], original[k]);
}
console.log('Custom glass survives saved setups and scene-only reset: PASS');
