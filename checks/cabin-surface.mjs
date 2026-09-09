import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  calibrateCabinSurface,
  cabinLighting,
  upholstery,
} from '../app/cabin-surface.ts';
import { splitCabinMesh, createCmfManager } from '../app/cmf.ts';
import { labDefaults } from '../app/lab-state.ts';
for (const zone of [
  'seat',
  'door',
  'roof',
  'dash',
  'carpet',
  'trim',
  'original',
]) {
  const atlas = new T.Texture(),
    bakedNormal = new T.Texture(),
    detail = new T.Texture();
  const m = new T.MeshPhysicalMaterial({
    map: atlas,
    normalMap: bakedNormal,
    roughnessMap: new T.Texture(),
  });
  calibrateCabinSurface(m, zone, detail);
  assert.equal(
    m.map,
    atlas,
    'button artwork and original upholstery colors retained',
  );
  assert.equal(m.normalMap, bakedNormal, 'original seams retained');
  assert.equal(m.clearcoat, 0);
  assert.ok(m.specularIntensity <= 0.4);
  assert.ok(m.normalScale.x <= 0.3);
  const shader = {
    uniforms: {},
    vertexShader: T.ShaderLib.physical.vertexShader,
    fragmentShader: T.ShaderLib.physical.fragmentShader,
  };
  m.onBeforeCompile(shader, {});
  assert.equal(shader.uniforms.cabinDetailNormal.value, detail);
  assert.ok(shader.fragmentShader.includes('roughnessFactor = clamp('));
  assert.ok(
    shader.fragmentShader.includes(
      'getTangentFrame(-vViewPosition, normal, cabinUv)',
    ),
  );
  assert.equal(
    (shader.vertexShader.match(/attribute vec2 cmfUv/g) || []).length,
    1,
  );
}
assert.ok(upholstery.fabric.floor > upholstery.leather.floor);
assert.ok(upholstery.fabric.specular < upholstery.leather.specular);
for (const mode of ['day', 'night']) {
  const l = cabinLighting(mode);
  assert.ok(
    l.key <= 1.5 && l.rim <= 0.6 && l.exposure <= 1 && l.practical <= 0.12,
  );
}
// Material changes remain reversible after adding specular and environment controls.
const oldLoader = T.TextureLoader.prototype.loadAsync;
T.TextureLoader.prototype.loadAsync = async () => new T.Texture();
const m = new T.MeshPhysicalMaterial({
  specularIntensity: 0.4,
  sheenRoughness: 0.9,
  envMapIntensity: 0.48,
});
const mesh = new T.Mesh(new T.BoxGeometry(), m);
mesh.userData.cmfZone = 'seat';
const manager = createCmfManager(() => {});
for (const choice of ['leather', 'fabric', 'suede', 'pu']) {
  await manager.apply([mesh], { ...labDefaults, seatMaterial: choice });
  assert.equal(m.specularIntensity, upholstery[choice].specular);
  const shader = {
    uniforms: {},
    vertexShader: T.ShaderLib.physical.vertexShader,
    fragmentShader: T.ShaderLib.physical.fragmentShader,
  };
  m.onBeforeCompile(shader, {});
  assert.ok(
    shader.fragmentShader.includes(upholstery[choice].floor.toFixed(2)),
  );
  await manager.apply([mesh], labDefaults);
  assert.equal(m.specularIntensity, 0.4);
  assert.equal(m.envMapIntensity, 0.48);
  assert.equal(m.sheenRoughness, 0.9);
}
manager.dispose();
T.TextureLoader.prototype.loadAsync = oldLoader;
globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({
  width: 1,
  height: 1,
  close() {},
});
const b = fs.readFileSync('public/models/zeekr-9x.glb');
const car = (
  await new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    '',
  )
).scene;
car.updateMatrixWorld(true);
const meshes = [];
car.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
let refined = 0;
for (const mesh of meshes.flatMap(splitCabinMesh))
  if (['seat', 'door', 'roof'].includes(mesh.userData.cmfZone)) {
    const g = mesh.geometry,
      positions = g.attributes.position.array.slice(),
      uv = g.attributes.uv.array.slice();
    const smooth = toCreasedNormals(g, Math.PI / 4);
    assert.deepEqual(smooth.attributes.position.array, positions);
    assert.deepEqual(smooth.attributes.uv.array, uv);
    assert.ok(
      Array.from(smooth.attributes.normal.array).every(Number.isFinite),
    );
    refined++;
  }
for (const entry of JSON.parse(
  fs.readFileSync('public/materials/manifest.json'),
)) {
  assert.equal(entry.resolution, '2k');
  for (const file of Object.values(entry.maps))
    assert.equal(
      crypto
        .createHash('md5')
        .update(fs.readFileSync('public' + file.url))
        .digest('hex'),
      file.md5,
    );
}
console.log(
  `PASS: 7 native surface zones, 4 material switches/restores, 2 lighting presets, ${refined} normals-only mesh refinements, 12 verified 2K textures. GPU/visual acceptance not performed.`,
);
