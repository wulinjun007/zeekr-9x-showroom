import * as T from 'three';
import { windowKeys } from './cabin-access';
export type WindowKey = (typeof windowKeys)[number];
export function openingKey(path: string): WindowKey | null {
  const match = path.match(/(?:^|\/)Glass_(LF|RF|LB|RB)1?(?:\/|$)/);
  return match ? (('window' + match[1]) as WindowKey) : null;
}
export function installWindowOpening(
  mesh: T.Mesh,
  base: T.Matrix4,
  materials: T.MeshStandardMaterial[],
) {
  const g = mesh.geometry.clone(),
    p = g.getAttribute('position'),
    heights = new Float32Array(p.count),
    v = new T.Vector3();
  let sill = Infinity,
    top = -Infinity;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(base);
    heights[i] = v.y;
    sill = Math.min(sill, v.y);
    top = Math.max(top, v.y);
  }
  g.setAttribute('windowRestHeight', new T.BufferAttribute(heights, 1));
  mesh.geometry = g;
  const threshold = { value: sill - 0.002 };
  for (const m of materials) {
    const previous = m.onBeforeCompile.bind(m),
      cache = m.customProgramCacheKey();
    m.onBeforeCompile = (shader, renderer) => {
      previous.call(m, shader, renderer);
      shader.uniforms.windowSill = threshold;
      shader.vertexShader =
        'attribute float windowRestHeight; varying float vWindowHeight;\n' +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWindowHeight=windowRestHeight;',
      );
      shader.fragmentShader =
        'uniform float windowSill; varying float vWindowHeight;\n' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif(vWindowHeight<windowSill) discard;',
      );
    };
    m.customProgramCacheKey = () => cache + '-window-opening-v1';
    m.needsUpdate = true;
  }
  return { sill, travel: top - sill + 0.012, threshold };
}
