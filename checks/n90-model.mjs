import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
import ts from 'typescript';
globalThis.ProgressEvent = class {};
fs.mkdirSync('outputs/n90', { recursive: true });
const b = fs.readFileSync('public/models/n90-max-study.glb');
const g = await new GLTFLoader().parseAsync(
  b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
  '',
);
let vertices = 0,
  meshes = 0;
g.scene.traverse((o) => {
  if (!o.isMesh) return;
  meshes++;
  const a = o.geometry.attributes.position;
  vertices += a.count;
  assert([...a.array].every(Number.isFinite));
});
for (const id of [
  'Door_LF',
  'Door_RF',
  'Door_LB',
  'Door_RB',
  'Tailgate',
  'RoofLift',
  'Seat_0_0',
])
  assert(g.scene.getObjectByName(id), id);
const code = ts.transpileModule(fs.readFileSync('app/n90-state.ts', 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { readN90, n90Link, n90Default } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);
globalThis.window = { location: { href: 'http://localhost:3001/' } };
const expected = {
  ...n90Default,
  mode: 'day',
  paint: '#555b60',
  interior: 'sand',
  section: 'parts',
  view: 'rear',
  lights: false,
  orbit: false,
  doors: ['Door_LB', 'Tailgate'],
  roof: true,
  lounge: true,
  explode: 74,
  wheel: 'black',
};
assert.deepEqual(readN90(new URL(n90Link(expected)).search), expected);
assert.equal(readN90('?mode=day').mode, 'night');
assert.equal(readN90('?explode=NaN').explode, 0);
const report = {
  finiteGeometry: true,
  meshes,
  vertices,
  bytes: b.length,
  bounds: new Box3().setFromObject(g.scene).getSize(new Vector3()).toArray(),
  configRoundtrip: true,
  visualAcceptance: false,
};
fs.writeFileSync(
  'outputs/n90/validation.json',
  JSON.stringify(report, null, 2),
);
console.log(report);
