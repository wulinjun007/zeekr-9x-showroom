import { assetUrl } from './asset-url';
import * as T from 'three';
import type { Mode } from './experience';

export const upholstery = {
  leather: {
    roughness: 0.82,
    floor: 0.55,
    sheen: 0.16,
    specular: 0.38,
    normal: 0.1,
  },
  fabric: {
    roughness: 0.98,
    floor: 0.84,
    sheen: 0.5,
    specular: 0.13,
    normal: 0.17,
  },
  suede: {
    roughness: 0.98,
    floor: 0.9,
    sheen: 0.65,
    specular: 0.1,
    normal: 0.12,
  },
  pu: {
    roughness: 0.76,
    floor: 0.52,
    sheen: 0.09,
    specular: 0.35,
    normal: 0.08,
  },
} as const;

export function loadCabinDetail(anisotropy: number) {
  const neutral = document.createElement('canvas');
  neutral.width = neutral.height = 1;
  const ctx = neutral.getContext('2d')!;
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 1, 1);
  const leather = new T.Texture(neutral),
    fabric = new T.Texture(neutral);
  for (const t of [leather, fabric]) {
    t.colorSpace = T.NoColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
  }
  let ready = false,
    disposed = false,
    pending: Promise<void> | null = null,
    retryAt = 0;
  async function load(asset: string, target: T.Texture) {
    const t = await new T.TextureLoader().loadAsync(
      assetUrl(`/materials/${asset}/normal.jpg`),
    );
    if (!disposed) {
      target.image = t.image;
      target.needsUpdate = true;
    }
    t.dispose();
  }
  return {
    leather,
    fabric,
    get ready() {
      return ready;
    },
    ensure() {
      if (disposed || ready || Date.now() < retryAt) return Promise.resolve();
      if (!pending)
        pending = Promise.allSettled([
          load('leather_white', leather),
          load('scuba_suede', fabric),
        ]).then((results) => {
          ready = !disposed && results.every((r) => r.status === 'fulfilled');
          if (!ready) retryAt = Date.now() + 5000;
          pending = null;
        });
      return pending;
    },
    dispose() {
      disposed = true;
      leather.dispose();
      fabric.dispose();
    },
  };
}

/** Preserve the original atlas markings and large seams; layer independent micrograin. */
export function calibrateCabinSurface(
  m: T.MeshPhysicalMaterial,
  zone: string,
  detail: T.Texture,
  fabricDetail: T.Texture = detail,
) {
  const fabric = zone === 'roof' || zone === 'carpet';
  const headliner = zone === 'roof' || zone === 'door';
  const floor = fabric ? 0.86 : zone === 'trim' ? 0.38 : 0.55;
  m.roughness = 0.85;
  m.clearcoat = 0;
  m.metalness = 0;
  m.specularIntensity = fabric ? 0.14 : 0.4;
  m.sheen = fabric ? 0.45 : 0.14;
  m.sheenRoughness = 0.9;
  m.envMapIntensity = 0.48;
  m.color.multiplyScalar(0.78);
  m.normalScale.setScalar(zone === 'roof' ? 0.035 : fabric ? 0.16 : 0.3);
  m.bumpMap = null;
  const previous = m.onBeforeCompile.bind(m),
    previousKey = m.customProgramCacheKey();
  m.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.cabinDetailNormal = { value: detail };
    shader.uniforms.cabinFabricNormal = { value: fabricDetail };
    if (headliner) {
      shader.vertexShader =
        'attribute float headlinerMask; varying float vHeadlinerMask;\n' +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvHeadlinerMask = headlinerMask;',
      );
      shader.fragmentShader =
        'varying float vHeadlinerMask;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        // Only replace pale headliner cloth; retain dark vents and switches.
        float roofLuma = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722));
        float roofCloth = vHeadlinerMask * smoothstep(.22,.48,roofLuma);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.46,.42,.36),roofCloth * .92);`,
      );
    }
    shader.vertexShader =
      'attribute vec2 cmfUv; varying vec2 vCabinDetailUv;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvCabinDetailUv = cmfUv;',
    );
    shader.fragmentShader =
      'uniform sampler2D cabinDetailNormal; uniform sampler2D cabinFabricNormal; varying vec2 vCabinDetailUv;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>\nroughnessFactor = clamp(${floor.toFixed(2)} + roughnessFactor * 0.20, ${floor.toFixed(2)}, 0.98);${headliner ? '\nroughnessFactor = mix(roughnessFactor, .94, roofCloth);' : ''}`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
#ifdef USE_NORMALMAP_TANGENTSPACE
  ${headliner ? 'normal = normalize(mix(normal, nonPerturbedNormal, roofCloth * .92));' : ''}
  vec2 cabinUv = vCabinDetailUv * ${zone === 'roof' ? '18.0' : fabric ? '7.0' : '9.0'};
  vec3 cabinMicro = texture2D(cabinDetailNormal, cabinUv).xyz * 2.0 - 1.0;
  ${headliner ? 'cabinMicro = mix(cabinMicro, texture2D(cabinFabricNormal, vCabinDetailUv * 18.0).xyz * 2.0 - 1.0, roofCloth);' : ''}
  mat3 cabinFrame = getTangentFrame(-vViewPosition, normal, cabinUv);
  normal = normalize(normal + cabinFrame * vec3(cabinMicro.xy * ${fabric ? '.12' : '.10'}, 0.0));
#endif`,
    );
  };
  m.customProgramCacheKey = () => previousKey + ':cabin-matte-v2:' + zone;
  m.needsUpdate = true;
}

export function cabinLighting(mode: Mode) {
  return mode === 'night'
    ? {
        hemi: 0.38,
        key: 0.4,
        rim: 0.3,
        exposure: 0.92,
        environment: 0.32,
        practical: 0.12,
      }
    : {
        hemi: 0.9,
        key: 1.0,
        rim: 0.45,
        exposure: 0.95,
        environment: 0.42,
        practical: 0.035,
      };
}
