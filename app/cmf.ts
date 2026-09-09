import { upholstery } from './cabin-surface';
import * as T from 'three';
import type { LabSettings } from './lab-state';
export const cmfOptions = {
  seatMaterial: ['original', 'leather', 'fabric', 'suede', 'pu'],
  doorMaterial: ['original', 'leather', 'suede', 'pu'],
  dashMaterial: ['original', 'soft', 'abs'],
  roofMaterial: ['original', 'fabric', 'suede'],
  carpetMaterial: ['original', 'fabric', 'rubber'],
  trimMaterial: ['original', 'wood', 'aluminium', 'carbon'],
} as const;
export type CmfKey = keyof typeof cmfOptions;
export type Zone = 'seat' | 'door' | 'dash' | 'roof' | 'carpet' | 'trim';
export const cmfReset = Object.fromEntries(
  Object.keys(cmfOptions).map((k) => [k, 'original']),
) as Pick<LabSettings, CmfKey>;
export const cmfRecipes: Record<string, Partial<LabSettings>> = {
  warm: {
    seatMaterial: 'leather',
    doorMaterial: 'leather',
    dashMaterial: 'soft',
    roofMaterial: 'suede',
    carpetMaterial: 'fabric',
    trimMaterial: 'wood',
  },
  nordic: {
    seatMaterial: 'fabric',
    doorMaterial: 'pu',
    dashMaterial: 'soft',
    roofMaterial: 'fabric',
    carpetMaterial: 'fabric',
    trimMaterial: 'wood',
  },
  sport: {
    seatMaterial: 'suede',
    doorMaterial: 'suede',
    dashMaterial: 'abs',
    roofMaterial: 'suede',
    carpetMaterial: 'rubber',
    trimMaterial: 'carbon',
  },
};
export const cmfAssets: Record<string, string> = {
  leather: 'leather_white',
  fabric: 'fabric_pattern_07',
  suede: 'scuba_suede',
  wood: 'wood_table_001',
};
// Semantic names take priority. Remaining INT polygons are a visual region study,
// not a reconstructed OEM bill of materials. World units are calibrated metres.
export function classifyCmf(path: string, p: T.Vector3): Zone | null {
  const x = p.x,
    y = -p.z,
    z = p.y;
  if (/fangxiangpan/.test(path)) return 'seat';
  if (/Door_/.test(path)) return z > 0.95 && z < 1.035 ? 'trim' : 'door';
  if (/ROOF|sunshade/.test(path) || z > 1.54) return 'roof';
  if (z < 0.48) return 'carpet';
  if (y > 0.48) return 'dash';
  if (Math.abs(x) > 0.12 && z > 0.48 && z < 1.49 && y > -2.05 && y < 0.48)
    return 'seat';
  return null;
}
export function splitCabinMesh(mesh: T.Mesh): T.Mesh[] {
  if (Array.isArray(mesh.material) || !mesh.material.name.startsWith('INT'))
    return [mesh];
  let o: T.Object3D | null = mesh;
  const names: string[] = [];
  while (o) {
    names.push(o.name);
    o = o.parent;
  }
  const path = names.join('/');
  const g = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry.clone();
  const pos = g.getAttribute('position'),
    groups = new Map<string, number[]>();
  const count = pos.count / 3,
    parent = Array.from({ length: count }, (_, i) => i),
    vertices = new Map<string, number>();
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  const centers: T.Vector3[] = [];
  const raw: string[] = [],
    areas: number[] = [];
  for (let i = 0; i < count; i++) {
    const vs = [0, 1, 2].map((j) =>
      new T.Vector3()
        .fromBufferAttribute(pos, i * 3 + j)
        .applyMatrix4(mesh.matrixWorld),
    );
    for (const v of vs) {
      const key = [v.x, v.y, v.z].map((x) => Math.round(x * 100000)).join(',');
      const other = vertices.get(key);
      if (other === undefined) vertices.set(key, i);
      else parent[find(i)] = find(other);
    }
    const center = vs[0].clone().add(vs[1]).add(vs[2]).divideScalar(3);
    centers.push(center);
    raw.push(classifyCmf(path, center) ?? 'original');
    areas.push(
      vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0])).length() / 2,
    );
  }
  const votes = new Map<number, Map<string, number>>();
  for (let i = 0; i < count; i++) {
    const root = find(i);
    if (!votes.has(root)) votes.set(root, new Map());
    const v = votes.get(root)!;
    v.set(raw[i], (v.get(raw[i]) ?? 0) + areas[i]);
  }
  const zones = new Map(
    [...votes].map(([id, v]) => [id, [...v].sort((a, b) => b[1] - a[1])[0][0]]),
  );
  const assemblyCenters = new Map<number, { point: T.Vector3; area: number }>();
  for (let i = 0; i < count; i++) {
    const id = find(i);
    if (!assemblyCenters.has(id))
      assemblyCenters.set(id, { point: new T.Vector3(), area: 0 });
    const c = assemblyCenters.get(id)!;
    c.point.addScaledVector(centers[i], areas[i]);
    c.area += areas[i];
  }
  const assemblyKeys = new Map<number, string>();
  for (const [id, zone] of zones) {
    let key = zone;
    if (zone === 'seat' && !/fangxiangpan/.test(path)) {
      const c = assemblyCenters.get(id)!;
      c.point.divideScalar(Math.max(c.area, 1e-12));
      const row =
        c.point.z < 0.55 ? 'front' : c.point.z < 1.5 ? 'second' : 'third';
      key += ':' + row + ':' + (c.point.x < 0 ? 'left' : 'right');
    }
    assemblyKeys.set(id, key);
  }
  for (let i = 0; i < count; i++) {
    const key = assemblyKeys.get(find(i))!;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i * 3, i * 3 + 1, i * 3 + 2);
  }
  const result: T.Mesh[] = [];
  for (const [assembly, indices] of groups) {
    const zone = assembly.split(':')[0];
    const geo = new T.BufferGeometry();
    for (const [name, attr] of Object.entries(g.attributes)) {
      const values: number[] = [];
      for (const i of indices)
        for (let c = 0; c < attr.itemSize; c++)
          values.push(attr.getComponent(i, c));
      geo.setAttribute(
        name,
        new T.Float32BufferAttribute(values, attr.itemSize),
      );
    }
    const uv: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const vs = indices
        .slice(i, i + 3)
        .map((j) =>
          new T.Vector3()
            .fromBufferAttribute(pos, j)
            .applyMatrix4(mesh.matrixWorld),
        );
      const normal = vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0]));
      const axes =
        Math.abs(normal.y) > Math.max(Math.abs(normal.x), Math.abs(normal.z))
          ? ['x', 'z']
          : Math.abs(normal.x) > Math.abs(normal.z)
            ? ['z', 'y']
            : ['x', 'y'];
      for (const v of vs) uv.push(v[axes[0] as 'x'], v[axes[1] as 'y']);
    }
    geo.setAttribute('uv1', new T.Float32BufferAttribute(uv, 2));
    geo.setAttribute('cmfUv', new T.Float32BufferAttribute(uv, 2));
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    const part = new T.Mesh(geo, mesh.material);
    part.name = mesh.name + '__' + assembly;
    part.position.copy(mesh.position);
    part.quaternion.copy(mesh.quaternion);
    part.scale.copy(mesh.scale);
    part.userData = { ...mesh.userData, cmfZone: zone, seatAssembly: assembly };
    mesh.parent?.add(part);
    part.updateMatrixWorld(true);
    result.push(part);
  }
  mesh.removeFromParent();
  g.dispose();
  return result;
}
type Saved = {
  map: T.Texture | null;
  normalMap: T.Texture | null;
  roughnessMap: T.Texture | null;
  bumpMap: T.Texture | null;
  color: T.Color;
  roughness: number;
  metalness: number;
  normalScale: T.Vector2;
  sheen: number;
  clearcoat: number;
  specularIntensity: number;
  sheenRoughness: number;
  envMapIntensity: number;
  onBeforeCompile: T.Material['onBeforeCompile'];
  customProgramCacheKey: T.Material['customProgramCacheKey'];
};
export function createCmfManager(
  onStatus: (state: 'loading' | 'ready' | 'error') => void,
) {
  const loader = new T.TextureLoader(),
    cache = new Map<string, Promise<T.Texture[]>>(),
    saved = new Map<T.MeshPhysicalMaterial, Saved>();
  let request = 0,
    disposed = false;
  function maps(asset: string) {
    if (!cache.has(asset)) {
      const pending = Promise.allSettled(
        ['color', 'normal', 'roughness'].map(async (key) => {
          const t = await loader.loadAsync(
            `/materials/${asset}/${key}.jpg?v=cmf2k-matte1`,
          );
          t.colorSpace = key === 'color' ? T.SRGBColorSpace : T.NoColorSpace;
          t.wrapS = t.wrapT = T.RepeatWrapping;
          t.channel = 1;
          t.anisotropy = 16;
          t.repeat.setScalar(
            asset === 'wood_table_001'
              ? 1
              : asset === 'fabric_pattern_07'
                ? 10
                : asset === 'leather_white'
                  ? 8
                  : 4,
          );
          if (disposed) t.dispose();
          return t;
        }),
      ).then((results) => {
        if (results.some((r) => r.status === 'rejected')) {
          for (const r of results)
            if (r.status === 'fulfilled') r.value.dispose();
          throw new Error('CMF texture load failed');
        }
        return results.map(
          (r) => (r as PromiseFulfilledResult<T.Texture>).value,
        );
      });
      cache.set(asset, pending);
      pending.catch(() => cache.delete(asset));
    }
    return cache.get(asset)!;
  }
  function remember(m: T.MeshPhysicalMaterial) {
    if (saved.has(m)) return;
    saved.set(m, {
      map: m.map,
      normalMap: m.normalMap,
      roughnessMap: m.roughnessMap,
      bumpMap: m.bumpMap,
      color: m.color.clone(),
      roughness: m.roughness,
      metalness: m.metalness,
      normalScale: m.normalScale.clone(),
      sheen: m.sheen,
      clearcoat: m.clearcoat,
      specularIntensity: m.specularIntensity,
      sheenRoughness: m.sheenRoughness,
      envMapIntensity: m.envMapIntensity,
      onBeforeCompile: m.onBeforeCompile.bind(m),
      customProgramCacheKey: m.customProgramCacheKey.bind(m),
    });
  }
  function restore(m: T.MeshPhysicalMaterial) {
    const b = saved.get(m)!;
    Object.assign(m, b, {
      color: b.color.clone(),
      normalScale: b.normalScale.clone(),
    });
    m.needsUpdate = true;
  }
  return {
    async apply(meshes: T.Mesh[], s: LabSettings & { seatStyle?: string }) {
      const ticket = ++request;
      const targets = meshes.filter(
        (m) => m.userData.cmfZone && m.userData.cmfZone !== 'original',
      );
      const assets = [
        ...new Set(
          targets
            .map(
              (m) => cmfAssets[s[(m.userData.cmfZone + 'Material') as CmfKey]],
            )
            .filter(Boolean),
        ),
      ];
      onStatus(assets.length ? 'loading' : 'ready');
      try {
        const texturesByAsset = new Map(
          await Promise.all(
            assets.map(async (asset) => [asset, await maps(asset)] as const),
          ),
        );
        if (disposed || ticket !== request) return;
        for (const mesh of targets) {
          const m = mesh.material as T.MeshPhysicalMaterial;
          remember(m);
          restore(m);
          const zone = mesh.userData.cmfZone as Zone,
            choice = s[(zone + 'Material') as CmfKey];
          if (choice === 'original') continue;
          const asset = cmfAssets[choice];
          m.map = m.normalMap = m.roughnessMap = m.bumpMap = null;
          m.metalness = choice === 'aluminium' ? 1 : 0;
          m.roughness =
            choice === 'aluminium'
              ? 0.29
              : choice === 'wood'
                ? 0.4
                : choice === 'abs'
                  ? 0.38
                  : 0.8;
          m.sheen = ['fabric', 'suede'].includes(choice)
            ? 0.5
            : choice === 'leather'
              ? 0.18
              : 0;
          m.clearcoat = choice === 'wood' ? 0.25 : 0;
          m.normalScale.setScalar(
            choice === 'wood' || choice === 'leather' ? 0.13 : 0.22,
          );
          const surface = upholstery[choice as keyof typeof upholstery];
          if (surface) {
            m.roughness = surface.roughness;
            m.sheen = surface.sheen;
            m.sheenRoughness = 0.92;
            m.specularIntensity = surface.specular;
            m.clearcoat = 0;
            m.envMapIntensity = 0.5;
            m.normalScale.setScalar(surface.normal);
          }
          const palette: Record<string, string> = {
            seat:
              s.seatStyle === 'cognac'
                ? '#ba8d61'
                : s.seatStyle === 'blue'
                  ? '#4c6170'
                  : '#dac7ad',
            door: '#a48d71',
            dash: '#37342f',
            roof: '#d8cfc0',
            carpet: '#494641',
            trim: '#e5cbb0',
          };
          m.color.set(
            choice === 'carbon'
              ? '#24282b'
              : choice === 'rubber'
                ? '#272a2c'
                : choice === 'aluminium'
                  ? '#c4c5c3'
                  : palette[zone],
          );
          if (asset) {
            const textures = texturesByAsset.get(asset)!;
            if (disposed || ticket !== request) return;
            [m.map, m.normalMap, m.roughnessMap] = textures;
          }
          m.onBeforeCompile = (shader) => {
            shader.vertexShader =
              'attribute vec2 cmfUv; varying vec2 vCmfUv;\n' +
              shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\nvCmfUv=cmfUv;',
            );
            shader.fragmentShader =
              'varying vec2 vCmfUv;\n' + shader.fragmentShader;
            if (surface)
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <roughnessmap_fragment>',
                `#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor, ${surface.floor.toFixed(2)}, .99);`,
              );
            if (!asset) {
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <roughnessmap_fragment>',
                `#include <roughnessmap_fragment>\nfloat cmfGrain=fract(sin(dot(floor(vCmfUv*1800.0),vec2(12.9898,78.233)))*43758.5453); roughnessFactor=clamp(roughnessFactor+(cmfGrain-0.5)*0.12,0.05,1.0);`,
              );
              if (choice === 'carbon')
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <color_fragment>',
                  '#include <color_fragment>\nvec2 weave=floor(vCmfUv*320.0); float checker=mod(weave.x+weave.y,2.0); diffuseColor.rgb*=mix(0.6,1.4,checker);',
                );
              if (choice === 'aluminium')
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <roughnessmap_fragment>',
                  '#include <roughnessmap_fragment>\nroughnessFactor*=0.88+0.12*sin(vCmfUv.y*18000.0);',
                );
            }
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `#include <map_fragment>\n${['fabric', 'suede', 'leather'].includes(choice) ? 'diffuseColor.rgb = diffuse * mix(0.65,1.1, dot(sampledDiffuseColor.rgb,vec3(0.2126,0.7152,0.0722)));' : ''}`,
            );
          };
          m.customProgramCacheKey = () => `cmf-matte-v2-${choice}`;
          m.needsUpdate = true;
        }
        onStatus('ready');
      } catch {
        if (!disposed && ticket === request) onStatus('error');
      }
    },
    dispose() {
      disposed = true;
      request++;
      for (const p of cache.values())
        p.then((ts) => ts.forEach((t) => t.dispose())).catch(() => {});
      saved.clear();
    },
  };
}
