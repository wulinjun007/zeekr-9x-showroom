import * as T from 'three';
import { wrapDefaults, wrapPalette, type WrapSettings } from './wrap-library';
/** Rest-pose coordinates survive door hinges, explosion transforms and static batching. */
export function attachWrapCoordinates(mesh: T.Mesh) {
  mesh.geometry = mesh.geometry.clone();
  const pos = mesh.geometry.getAttribute('position');
  const normal = mesh.geometry.getAttribute('normal');
  const rp = new Float32Array(pos.count * 3),
    rn = new Float32Array(pos.count * 3);
  const nmat = new T.Matrix3().getNormalMatrix(mesh.matrixWorld),
    v = new T.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(rp, i * 3);
    v.fromBufferAttribute(normal, i)
      .applyNormalMatrix(nmat)
      .toArray(rn, i * 3);
  }
  mesh.geometry.setAttribute('wrapPosition', new T.BufferAttribute(rp, 3));
  mesh.geometry.setAttribute('wrapNormal', new T.BufferAttribute(rn, 3));
}
export function createBodyWrap(invalidate: () => void, anisotropy: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = Math.min(8, anisotropy);
  const uniforms = {
    wrapMap: { value: texture },
    wrapEnabled: { value: 0 },
    wrapAlpha: { value: 1 },
    wrapSize: { value: 1 },
    wrapShift: { value: new T.Vector2() },
    wrapRegion: { value: 0 },
    wrapArtwork: { value: 0 },
  };
  let current = { ...wrapDefaults },
    stamp = '',
    image: CanvasImageSource | null = null,
    imageSource = '',
    disposed = false,
    request = 0;
  function draw() {
    if (current.wrapTheme === 'none') return;
    if (canvas.width !== 2048) {
      canvas.width = 2048;
      canvas.height = 1024;
    }
    ctx.clearRect(0, 0, 2048, 1024);
    const [a, b] = wrapPalette(current.wrapTheme);
    if (current.wrapTheme === 'custom') {
      if (image) {
        const img = image as HTMLImageElement;
        const f = Math.min(1800 / img.width, 920 / img.height);
        ctx.drawImage(
          img,
          (2048 - img.width * f) / 2,
          (1024 - img.height * f) / 2,
          img.width * f,
          img.height * f,
        );
      }
    } else {
      // Original abstract layouts, never substitutes for character artwork.
      if (current.wrapPattern === 'ribbon') {
        ctx.fillStyle = a;
        ctx.beginPath();
        ctx.moveTo(30, 830);
        ctx.bezierCurveTo(590, 760, 1040, 200, 2018, 180);
        ctx.lineTo(2018, 410);
        ctx.bezierCurveTo(1100, 300, 630, 990, 30, 955);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = b;
        ctx.lineWidth = 32;
        ctx.beginPath();
        ctx.moveTo(30, 720);
        ctx.bezierCurveTo(810, 620, 1100, 110, 2018, 100);
        ctx.stroke();
      } else if (current.wrapPattern === 'contour') {
        for (let i = 0; i < 15; i++) {
          ctx.strokeStyle = i % 3 === 0 ? b : a;
          ctx.lineWidth = i % 3 === 0 ? 13 : 5;
          ctx.beginPath();
          ctx.ellipse(
            1024,
            540,
            180 + i * 61,
            65 + i * 27,
            -0.23,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      } else if (current.wrapPattern === 'pixel') {
        for (let y = 0; y < 11; y++)
          for (let x = 0; x < 25; x++) {
            const n = (x * 17 + y * 31) % 19;
            if (n < Math.abs(x - 12) * 0.8) continue;
            ctx.fillStyle = (x + y) % 4 === 0 ? b : a;
            ctx.globalAlpha = 0.4 + ((x * 7 + y * 3) % 6) / 10;
            ctx.fillRect(70 + x * 76, 95 + y * 76, 60, 60);
          }
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = a;
        ctx.beginPath();
        ctx.moveTo(30, 180);
        ctx.lineTo(1430, 180);
        ctx.lineTo(930, 900);
        ctx.lineTo(30, 900);
        ctx.fill();
        ctx.fillStyle = b;
        ctx.beginPath();
        ctx.moveTo(1510, 180);
        ctx.lineTo(2018, 180);
        ctx.lineTo(2018, 900);
        ctx.lineTo(1010, 900);
        ctx.fill();
      }
    }
    texture.needsUpdate = true;
    invalidate();
  }
  return {
    install(mat: T.MeshStandardMaterial) {
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader =
          'attribute vec3 wrapPosition; attribute vec3 wrapNormal; varying vec3 vWrapPosition; varying vec3 vWrapNormal;\n' +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvWrapPosition=wrapPosition; vWrapNormal=wrapNormal;',
        );
        shader.fragmentShader =
          'uniform sampler2D wrapMap; uniform float wrapEnabled; uniform float wrapAlpha; uniform float wrapSize; uniform vec2 wrapShift; uniform float wrapRegion; uniform float wrapArtwork; varying vec3 vWrapPosition; varying vec3 vWrapNormal;\n' +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float wrapMask=0.0;
          vec4 wrapPixel=vec4(0.0);
          if(wrapEnabled>0.5){
            vec3 wn=normalize(vWrapNormal);
            bool hood=wrapRegion>0.5 && wn.y>0.65 && vWrapPosition.z<-1.35 && vWrapPosition.y>0.85;
            bool side=(wrapRegion<0.5 || wrapRegion>1.5) && abs(wn.x)>0.65 && abs(vWrapPosition.x)>0.65;
            vec2 wuv;
            if(hood){ wuv=vec2(vWrapPosition.x/1.35,(-vWrapPosition.z-1.95)/1.1); }
            else { wuv=vec2(vWrapPosition.z*(vWrapPosition.x<0.0?1.0:-1.0)/2.8,(vWrapPosition.y-0.83)/0.85); }
            vec2 shift=wrapShift;
            if(!hood) shift.x *= vWrapPosition.x<0.0?1.0:-1.0;
            wuv-=shift;
            if(wrapArtwork>0.5) wuv.x *= hood ? (1.35/1.1)/2.0 : (2.8/0.85)/2.0;
            wuv=wuv/wrapSize+0.5;
            if((hood||side) && all(greaterThanEqual(wuv,vec2(0.0))) && all(lessThanEqual(wuv,vec2(1.0)))){
              wrapPixel=texture2D(wrapMap,wuv);
              wrapMask=wrapPixel.a*wrapAlpha;
              diffuseColor.rgb=mix(diffuseColor.rgb,wrapPixel.rgb,wrapMask);
            }
          }`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,0.08,wrapMask);',
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,0.38,wrapMask);',
        );
      };
      mat.customProgramCacheKey = () => 'body-wrap-rest-pose-v1';
    },
    apply(s: WrapSettings) {
      current = s;
      uniforms.wrapEnabled.value = s.wrapTheme === 'none' ? 0 : 1;
      uniforms.wrapArtwork.value = s.wrapTheme === 'custom' ? 1 : 0;
      uniforms.wrapAlpha.value = s.wrapOpacity / 100;
      uniforms.wrapSize.value = s.wrapScale / 100;
      uniforms.wrapShift.value.set(s.wrapOffset / 100, s.wrapHeight / 100);
      uniforms.wrapRegion.value =
        s.wrapPlacement === 'sides' ? 0 : s.wrapPlacement === 'hood' ? 1 : 2;
      const next = s.wrapTheme + '|' + s.wrapPattern + '|' + s.wrapImage;
      if (next === stamp) return;
      stamp = next;
      if (s.wrapTheme === 'custom' && s.wrapImage !== imageSource) {
        image = null;
        imageSource = s.wrapImage;
        const token = ++request;
        if (/^data:image\/(png|jpeg|webp);base64,/.test(s.wrapImage)) {
          const img = new Image();
          img.onload = () => {
            if (!disposed && token === request) {
              image = img;
              if (current.wrapTheme === 'custom') draw();
            }
          };
          img.onerror = () => {
            if (!disposed && token === request) {
              image = null;
              draw();
            }
          };
          img.src = s.wrapImage;
        }
      }
      draw();
    },
    dispose() {
      disposed = true;
      request++;
      image = null;
      imageSource = '';
      texture.dispose();
      canvas.width = canvas.height = 1;
    },
  };
}
