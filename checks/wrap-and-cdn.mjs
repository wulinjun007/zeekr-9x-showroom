import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { defaults, readSettings, shareUrl } from '../app/experience.ts';
import { ipReferences } from '../app/wrap-library.ts';
import { attachWrapCoordinates } from '../app/body-wrap.ts';
import { createStaticBatches } from '../app/static-batches.ts';
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
assert.equal(ipReferences.length, 20);
for (const p of ipReferences) {
  const s = {
    ...defaults,
    wrapTheme: p.id,
    wrapPattern: 'contour',
    wrapPlacement: 'all',
    wrapScale: 130,
    wrapOffset: -20,
    wrapHeight: 12,
    wrapOpacity: 74,
  };
  const r = readSettings(new URL(shareUrl(s)).search);
  for (const k of [
    'wrapTheme',
    'wrapPattern',
    'wrapPlacement',
    'wrapScale',
    'wrapOffset',
    'wrapHeight',
    'wrapOpacity',
  ])
    assert.equal(r[k], s[k]);
}
const shared = shareUrl({
  ...defaults,
  wrapTheme: 'custom',
  wrapImage: 'data:image/png;base64,PRIVATE_IMAGE',
});
assert.ok(!shared.includes('PRIVATE_IMAGE'));
assert.equal(readSettings(new URL(shared).search).wrapTheme, 'none');
assert.equal(
  readSettings('?wrapScale=NaN&wrapOpacity=999&wrapOffset=-999').wrapScale,
  100,
);
assert.equal(readSettings('?wrapOpacity=999').wrapOpacity, 100);
assert.equal(readSettings('?wrapOffset=-999').wrapOffset, -100);
const scene = new T.Scene(),
  pieces = [];
for (let i = 0; i < 2; i++) {
  const m = new T.Mesh(
    new T.BoxGeometry(1, 1, 1),
    new T.MeshStandardMaterial(),
  );
  m.material.name = 'car_paint';
  m.position.set(i, 1, 0);
  scene.add(m);
  m.updateMatrixWorld(true);
  attachWrapCoordinates(m);
  const before = m.geometry.getAttribute('wrapPosition').array.slice();
  m.rotation.y = 0.7;
  m.updateMatrixWorld(true);
  assert.deepEqual(
    m.geometry.getAttribute('wrapPosition').array,
    before,
    'decal stays in part rest coordinates when door opens',
  );
  pieces.push({ mesh: m, materials: [m.material], group: 'body' });
}
const batch = createStaticBatches(scene, pieces);
assert.equal(batch.batchCount, 1);
assert.ok(
  batch.root.children[0].geometry.getAttribute('wrapPosition'),
  'batch preserves projection coordinates',
);
const manifest = JSON.parse(fs.readFileSync('app/asset-manifest.json', 'utf8'));
for (const [source, entry] of Object.entries(manifest)) {
  const src = fs.readFileSync('public' + source),
    cdn = fs.readFileSync('public' + entry.url);
  assert.deepEqual(cdn, src, 'no model or texture quality reduction');
  assert.equal(createHash('sha256').update(cdn).digest('hex'), entry.sha256);
  assert.ok(entry.url.includes(entry.sha256.slice(0, 16)));
}
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
assert.ok(
  config.headers
    .find((h) => h.source === '/cdn/(.*)')
    .headers.some((h) => h.value.includes('immutable')),
);
console.log(
  'PASS: 20 reference configurations; local artwork excluded from sharing; door and batch coordinates; 14 byte-identical CDN resources and content hashes.',
);
