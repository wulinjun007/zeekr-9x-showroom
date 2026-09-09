import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Piece = {
  mesh: T.Mesh;
  materials: T.MeshStandardMaterial[];
  group: string;
  variant?: string;
};
/** Render-only batching. Original geometry remains available to picking and animations. */
export function createStaticBatches(scene: T.Scene, pieces: Piece[]) {
  const root = new T.Group();
  root.name = 'Assembled_render_batches';
  root.visible = false;
  const originals: T.Mesh[] = [];
  const groups = new Map<string, Piece[]>();
  for (const p of pieces) {
    const m = p.materials[0];
    if (
      !p.mesh.visible ||
      p.materials.length !== 1 ||
      m.transparent ||
      p.group === 'glass' ||
      m.name === 'screen'
    )
      continue;
    const attrs = Object.entries(p.mesh.geometry.attributes)
      .map(([k, a]) => `${k}:${a.itemSize}:${a.normalized}`)
      .sort()
      .join(',');
    const key = [
      p.group,
      p.variant,
      p.mesh.userData.cmfZone,
      m.name,
      attrs,
      m.customProgramCacheKey(),
      m.color.getHexString(),
      m.roughness,
      m.metalness,
      m.map?.uuid,
      m.normalMap?.uuid,
      m.roughnessMap?.uuid,
      m.side,
      p.mesh.castShadow,
      p.mesh.receiveShadow,
    ].join('|');
    const group = groups.get(key) ?? [];
    group.push(p);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const geometries = group.map((p) => {
      const g = p.mesh.geometry.index
        ? p.mesh.geometry.toNonIndexed()
        : p.mesh.geometry.clone();
      return g.applyMatrix4(p.mesh.matrix);
    });
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, group[0].materials[0]);
    mesh.castShadow = group[0].mesh.castShadow;
    mesh.receiveShadow = group[0].mesh.receiveShadow;
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
    originals.push(...group.map((p) => p.mesh));
  }
  scene.add(root);
  let enabled = false;
  return {
    root,
    originalCount: originals.length,
    batchCount: root.children.length,
    setEnabled(value: boolean) {
      if (enabled === value) return false;
      enabled = value;
      root.visible = value;
      // Layer 1 stays pickable but is not drawn by the display camera (layer 0).
      for (const m of originals) {
        m.layers.set(value ? 1 : 0);
      }
      return true;
    },
  };
}
