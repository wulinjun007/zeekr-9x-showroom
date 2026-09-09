import assert from 'node:assert/strict';
import { buildWheelGeometry } from '../app/wheel-geometry.ts';
import { wheelStyles, wheelFinishes } from '../app/wheel-styles.ts';
import { defaults, readSettings, shareUrl } from '../app/experience.ts';
globalThis.window = { location: { href: 'https://example.test/', search: '' } };
const counts = [];
for (const style of wheelStyles) {
  for (const wheelFinish of wheelFinishes) {
    const s = { ...defaults, wheelStyle: style, wheelFinish };
    const restored = readSettings(new URL(shareUrl(s)).search);
    assert.equal(restored.wheelStyle, style);
    assert.equal(restored.wheelFinish, wheelFinish);
  }
  if (style === 'mirror') continue;
  const set = buildWheelGeometry(style);
  let triangles = 0;
  for (const g of Object.values(set)) {
    const pos = g.getAttribute('position');
    assert.ok([...pos.array].every(Number.isFinite), 'finite geometry');
    assert.ok(g.getAttribute('normal') && g.getAttribute('uv'));
    for (let i = 0; i < pos.count; i++)
      assert.ok(
        Math.hypot(pos.getX(i), pos.getY(i)) < 0.3,
        'fits retained tire opening',
      );
    triangles += pos.count / 3;
    g.dispose();
  }
  assert.ok(triangles < 6000, 'bounded geometry per wheel');
  counts.push({ style, triangles });
}
assert.equal(
  readSettings('?wheelStyle=bad&wheelFinish=bad').wheelStyle,
  'mirror',
);
assert.equal(readSettings('?wheelFinish=bad').wheelFinish, 'diamond');
console.log(
  'PASS: seven styles × three finishes share correctly; all six concept geometries finite and fit retained tire radius.',
  counts,
);
