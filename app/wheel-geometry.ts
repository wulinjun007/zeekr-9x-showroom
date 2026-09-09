import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { wheelPolygons, type WheelStyle } from './wheel-styles';
export type WheelGeometrySet = {
  face: T.BufferGeometry;
  dark: T.BufferGeometry;
  trim: T.BufferGeometry;
};
function merge(parts: T.BufferGeometry[]) {
  const normalized = parts.map((p) => (p.index ? p.toNonIndexed() : p.clone()));
  const g = mergeGeometries(normalized, false)!;
  for (const p of [...parts, ...normalized]) p.dispose();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}
function cylinder(
  radius: number,
  depth: number,
  z: number,
  segments = 32,
  open = false,
) {
  return new T.CylinderGeometry(radius, radius, depth, segments, 1, open)
    .rotateX(Math.PI / 2)
    .translate(0, 0, z);
}
export function buildWheelGeometry(
  style: Exclude<WheelStyle, 'mirror'>,
): WheelGeometrySet {
  const face: T.BufferGeometry[] = [],
    dark: T.BufferGeometry[] = [],
    trim: T.BufferGeometry[] = [];
  for (const polygon of wheelPolygons(style)) {
    const shape = new T.Shape(polygon.map(([x, y]) => new T.Vector2(x, y)));
    shape.closePath();
    for (const [list, depth, inset, z] of [
      [dark, 0.022, 1, 0],
      [face, 0.003, 0.94, 0.025],
    ] as const) {
      const g = new T.ExtrudeGeometry(shape, {
        depth,
        steps: 1,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.0015,
        bevelThickness: 0.0012,
        curveSegments: 1,
      });
      const positions = g.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) * inset,
          y = positions.getY(i) * inset;
        const dish =
          (style === 'forged' ? 0.06 : 0.035) *
          Math.max(0, 1 - Math.hypot(x, y) / 0.27);
        positions.setXYZ(i, x, y, positions.getZ(i) + z - dish);
      }
      g.computeVertexNormals();
      list.push(g);
    }
  }
  dark.push(cylinder(0.272, 0.145, -0.058, 48, true));
  dark.push(cylinder(0.057, 0.038, -0.026));
  face.push(cylinder(0.029, 0.008, -0.002));
  trim.push(new T.TorusGeometry(0.28, 0.007, 8, 64).translate(0, 0, 0.018));
  dark.push(new T.TorusGeometry(0.266, 0.007, 8, 64).translate(0, 0, -0.004));
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    trim.push(
      cylinder(0.005, 0.012, 0.001, 6).translate(
        Math.cos(a) * 0.042,
        Math.sin(a) * 0.042,
        0,
      ),
    );
  }
  return { face: merge(face), dark: merge(dark), trim: merge(trim) };
}
