import * as T from 'three';
import type { Settings } from './experience';

/** Original, static exhibition architecture. No extra render pass, lights or downloads. */
export function createShowroomStage(
  scene: T.Scene,
  floor: T.Mesh<T.PlaneGeometry, T.MeshStandardMaterial>,
) {
  const root = new T.Group();
  root.name = 'Atelier architectural stage';
  scene.add(root);
  const uniforms = {
    uNight: { value: 1 },
    uInk: { value: new T.Color('#111820') },
    uMist: { value: new T.Color('#35454e') },
    uWarm: { value: new T.Color('#8c7658') },
  };
  // The tall closed backdrop removes the abrupt infinite-plane horizon at every orbit angle.
  const backdropMat = new T.ShaderMaterial({
    side: T.BackSide,
    uniforms,
    vertexShader: `varying vec3 vStage;
      void main(){vStage=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vStage;
      uniform float uNight; uniform vec3 uInk,uMist,uWarm;
      void main(){
        float h=vStage.y;
        float angle=atan(vStage.z,vStage.x);
        float horizon=exp(-pow((h-0.8)/7.5,2.));
        float wash=pow(max(0.,cos(angle-0.45)),10.);
        float opposite=pow(max(0.,cos(angle+2.1)),14.);
        vec3 c=mix(uInk,uMist,horizon*.6);
        c+=uWarm*wash*exp(-pow((h-3.)/8.,2.))*.24;
        c+=vec3(.025,.045,.06)*opposite*horizon*uNight;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const backdrop = new T.Mesh(
    new T.CylinderGeometry(70, 70, 80, 96, 1, true),
    backdropMat,
  );
  backdrop.name = 'Continuous curved horizon';
  root.add(backdrop);

  // Small, tileable surface normal. Deterministic and shared; avoids large image/network costs.
  const size = 256,
    pixels = new Uint8Array(size * size * 4);
  let seed = 731;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const n = (seed >>> 24) / 255;
    pixels[i] = 124 + Math.round(n * 8);
    pixels[i + 1] = 124 + Math.round((1 - n) * 8);
    pixels[i + 2] = 255;
    pixels[i + 3] = 255;
  }
  const grain = new T.DataTexture(pixels, size, size, T.RGBAFormat);
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  grain.repeat.set(180, 180);
  grain.generateMipmaps = true;
  grain.minFilter = T.LinearMipmapLinearFilter;
  grain.magFilter = T.LinearFilter;
  grain.needsUpdate = true;
  floor.material.normalMap = grain;
  floor.material.normalScale.set(0.18, 0.18);
  const floorUniforms = {
    uStageEnabled: { value: 1 },
    uStageNight: { value: 1 },
  };
  floor.material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, floorUniforms, uniforms);
    shader.vertexShader = 'varying vec3 vStageWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvStageWorld=(modelMatrix*vec4(position,1.)).xyz;',
    );
    shader.fragmentShader =
      'varying vec3 vStageWorld; uniform float uStageEnabled,uStageNight; uniform vec3 uInk,uMist,uWarm;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 p=vStageWorld.xz;
      float radius=length(p);
      float podium=1.-smoothstep(4.68,4.70,radius);
      vec2 cells=abs(fract((p+vec2(.7,.3))/vec2(2.4,1.2))-.5);
      vec2 aa=max(fwidth(p)/vec2(2.4,1.2),vec2(.0002));
      vec2 seam=smoothstep(vec2(.499)-aa,vec2(.5),cells);
      float joint=max(seam.x,seam.y)*(1.-podium);
      float halo=exp(-pow((radius-4.9)/1.1,2.));
      float pool=exp(-dot(p,p)/48.);
      diffuseColor.rgb*=mix(1.,(.78+.22*pool+.18*podium)*(1.-joint*.20),uStageEnabled);
      diffuseColor.rgb+=uStageEnabled*halo*vec3(.006,.005,.003)*uStageNight;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor=mix(roughnessFactor,mix(roughnessFactor,.54,podium),uStageEnabled);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      float aStage=atan(vStageWorld.z,vStageWorld.x);
      float hStage=exp(-pow(.8/7.5,2.));
      vec3 distant=mix(uInk,uMist,hStage*.6);
      distant+=uWarm*pow(max(0.,cos(aStage-.45)),10.)*exp(-pow(3./8.,2.))*.24;
      distant+=vec3(.025,.045,.06)*pow(max(0.,cos(aStage+2.1)),14.)*hStage*uStageNight;
      outgoingLight*=mix(1.,mix(.65,.34,uStageNight),uStageEnabled);
      outgoingLight=mix(outgoingLight,distant,smoothstep(8.,32.,length(vStageWorld.xz))*uStageEnabled);
      #include <opaque_fragment>`,
    );
  };
  floor.material.customProgramCacheKey = () => 'atelier-stone-v1';
  const metal = new T.MeshStandardMaterial({
    color: '#9b8b71',
    metalness: 0.72,
    roughness: 0.36,
  });
  const edge = new T.MeshBasicMaterial({
    color: '#bba279',
    transparent: true,
    opacity: 0.24,
    side: T.DoubleSide,
  });
  const dark = new T.MeshBasicMaterial({
    color: '#637079',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const glow = new T.MeshBasicMaterial({
    color: '#dac6a2',
    transparent: true,
    opacity: 0.3,
  });
  function ring(
    inner: number,
    outer: number,
    mat: T.Material,
    y: number,
    start = 0,
    length = Math.PI * 2,
  ) {
    const mesh = new T.Mesh(
      new T.RingGeometry(inner, outer, 128, 1, start, length),
      mat,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    root.add(mesh);
    return mesh;
  }
  ring(4.69, 4.73, metal, -0.013);
  ring(4.89, 4.9, edge, -0.012);
  ring(5.1, 5.108, metal, -0.013);
  // A second layer of architecture gives parallax and a scale reference behind the vehicle.
  const ribs = new T.InstancedMesh(new T.BoxGeometry(0.1, 5.2, 0.16), dark, 12);
  const strips = new T.InstancedMesh(
    new T.BoxGeometry(0.022, 4.7, 0.025),
    glow,
    12,
  );
  const transform = new T.Object3D();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + 0.15;
    transform.position.set(Math.sin(a) * 18, 2.58, Math.cos(a) * 18);
    transform.rotation.y = a;
    transform.updateMatrix();
    ribs.setMatrixAt(i, transform.matrix);
    transform.position.set(Math.sin(a) * 17.86, 2.65, Math.cos(a) * 17.86);
    transform.updateMatrix();
    strips.setMatrixAt(i, transform.matrix);
  }
  root.add(ribs, strips);
  ring(17.75, 17.79, edge, 0.006);
  ring(17.8, 17.84, edge, 5.18);
  // Broad soft architectural reflection on the floor, baked into an inexpensive gradient plane.
  const poolMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uNight: uniforms.uNight },
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv; uniform float uNight;
      void main(){vec2 q=(vUv-.5)*2.; float a=exp(-dot(q*vec2(1.,1.6),q*vec2(1.,1.6))*4.);
        a*=(1.-smoothstep(.55,1.,abs(q.x)))*(1.-smoothstep(.55,1.,abs(q.y)));
        gl_FragColor=vec4(mix(vec3(.55,.57,.59),vec3(.70,.58,.40),uNight),a*.035);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const pool = new T.Mesh(new T.PlaneGeometry(12, 5), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, -0.011, 6.8);
  root.add(pool);
  const contactMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;
      void main(){vec2 p=(vUv-.5)*vec2(4.4,7.);
        float chassis=exp(-pow(p.x/.90,4.)-pow(p.y/2.32,6.))*.31;
        float tyres=0.;
        for(int i=0;i<4;i++){
          vec2 c=vec2(i<2?-.88:.88,mod(float(i),2.)<.5?-1.66:1.55);
          vec2 q=(p-c)/vec2(.23,.36); tyres+=exp(-dot(q,q)*2.)*.42;
        }
        gl_FragColor=vec4(0.,0.,0.,min(.62,chassis+tyres));
      }`,
  });
  const contact = new T.Mesh(new T.PlaneGeometry(4.4, 7), contactMat);
  contact.name = 'Soft vehicle contact shadow';
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.009;
  root.add(contact);
  function apply(s: Settings, interior: boolean) {
    const night = s.mode === 'night';
    const studio =
      !s.roadEnabled &&
      s.section !== 'safety' &&
      s.section !== 'structure' &&
      s.view !== 'underbody' &&
      !interior &&
      ['clear', 'overcast'].includes(s.weather);
    root.visible = studio;
    uniforms.uNight.value = night ? 1 : 0;
    uniforms.uInk.value.set(night ? '#090d14' : '#535d65');
    uniforms.uMist.value.set(night ? '#3b4e5b' : '#8c959a');
    uniforms.uWarm.value.set(night ? '#8c7658' : '#a09b91');
    floorUniforms.uStageEnabled.value = studio ? 1 : 0;
    floorUniforms.uStageNight.value = night ? 1 : 0;
    edge.color.set(night ? '#bba279' : '#77766f');
    glow.color.set(night ? '#dac6a2' : '#b7c2c7');
    glow.opacity = night ? 0.3 : 0.15;
    if (studio) {
      floor.material.color.set(night ? '#252d36' : '#626970');
      floor.material.envMapIntensity = night ? 0.16 : 0.12;
      if (!['rain', 'storm', 'snow', 'blizzard'].includes(s.weather)) {
        floor.material.roughness = 0.62;
        floor.material.metalness = 0.16;
      }
    }
  }
  // All geometries/materials/textures belong to the scene and use the viewer's existing disposer.
  return {
    apply,
    root,
    moveVehicle(z: number) {
      contact.position.z = z;
    },
  };
}
