import * as T from 'three';
import { partOffset, type PartType } from './study-state';
export type ExplosionPart = {
  id: string;
  category: PartType;
  door: string | null;
  bounds: T.Box3;
};
export function assemblyKey(p: ExplosionPart): string {
  const c = p.bounds.getCenter(new T.Vector3());
  const side = Math.abs(c.x) < 0.15 ? 'center' : c.x < 0 ? 'left' : 'right';
  if (p.category === 'body') return 'body';
  if (p.door) return `${p.category}:${p.door}`;
  const row =
    p.category === 'seats'
      ? c.z < 0.35
        ? 'front'
        : c.z < 1.5
          ? 'second'
          : 'third'
      : c.z < 0
        ? 'front'
        : 'rear';
  return `${p.category}:${side}:${row}`;
}
/** Keep related render meshes together, then separate assembly bounding volumes. */
export function buildExplosionLayout(parts: ExplosionPart[]) {
  const groups = new Map<
    string,
    {
      key: string;
      category: PartType;
      bounds: T.Box3;
      ids: string[];
      offset: T.Vector3;
    }
  >();
  for (const p of parts) {
    const key = assemblyKey(p);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        category: p.category,
        bounds: new T.Box3(),
        ids: [],
        offset: new T.Vector3(),
      };
      groups.set(key, g);
    }
    g.bounds.union(p.bounds);
    g.ids.push(p.id);
  }
  const ordered = [...groups.values()].sort((a, b) =>
    a.category === 'body'
      ? -1
      : b.category === 'body'
        ? 1
        : b.bounds.getSize(new T.Vector3()).lengthSq() -
            a.bounds.getSize(new T.Vector3()).lengthSq() ||
          a.key.localeCompare(b.key),
  );
  const occupied: T.Box3[] = [];
  for (const g of ordered) {
    const c = g.bounds.getCenter(new T.Vector3());
    g.offset.fromArray(partOffset(g.category, c)).multiplyScalar(2.2);
    if (g.category === 'body') g.offset.set(0, 0, 0);
    const direction = g.offset.clone().normalize();
    if (!direction.lengthSq()) direction.set(0, 1, 0);
    // A ray exits each occupied interval once. Resolve whole assemblies, not
    // individual material submeshes such as seams and seat upholstery.
    for (let pass = 0; pass <= occupied.length; pass++) {
      const box = g.bounds.clone().translate(g.offset).expandByScalar(0.18);
      const overlaps = occupied.filter((b) => b.intersectsBox(box));
      if (!overlaps.length) break;
      let advance = 0;
      for (const b of overlaps) {
        let exit = Infinity;
        for (const axis of ['x', 'y', 'z'] as const) {
          const d = direction[axis];
          if (Math.abs(d) > 1e-6)
            exit = Math.min(
              exit,
              d > 0
                ? (b.max[axis] - box.min[axis]) / d
                : (b.min[axis] - box.max[axis]) / d,
            );
        }
        advance = Math.max(advance, exit + 0.01);
      }
      g.offset.addScaledVector(direction, advance);
    }
    occupied.push(g.bounds.clone().translate(g.offset).expandByScalar(0.18));
  }
  return new Map(
    ordered.flatMap((g) => g.ids.map((id) => [id, g.offset.clone()] as const)),
  );
}
export function explosionCameraDistance(
  bounds: T.Box3,
  fov: number,
  aspect: number,
) {
  const v = T.MathUtils.degToRad(fov) / 2;
  const halfAngle = Math.min(v, Math.atan(Math.tan(v) * Math.max(0.1, aspect)));
  return (
    (bounds.getSize(new T.Vector3()).length() * 0.56) / Math.sin(halfAngle)
  );
}
