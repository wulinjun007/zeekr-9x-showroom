# ZEEKR 9X — Experience Atelier

独立汽车交互设计演示版。包含极氪 9X 原有 Blender 工程的网页转换、暖调座舱、换装、场景、部件拆解和 HMI 风险可视化。

## 运行

Node.js 22.13+，推荐 24。

```sh
npm ci
npm run dev -- --port 3001
```

## 已实现

- 中文、英文、德文、日文、阿拉伯文；阿拉伯文从右向左布局。
- 旋转、缩放、自动环绕、昼夜／影棚、全屏、保存画面、配置链接、体验卡。
- 五种创意车漆；原始镜面轮组与原创涡轮／十辐轮毂；两种胎面视觉纹理。
- 四门、上尾门、前舱盖的原始分件转轴动画；车灯和后视镜转向灯双闪演示。
- 三排座舱位置、拖动环顾、空间热点、暖调氛围灯、HUD 概念投影。
- 原版蓝白、暖米白、温润棕内饰材质；副驾局部靠背 A/B 几何。
- 分组选择、隐藏、隔离、按已有网格展开的爆炸视图。
- 25 种 aHMI / iHMI 场景、六段出行旅程筛选；透明车身、感知范围、进度播放／暂停／重播。

## 范围与来源

完整来源和权利边界见 public/credits.txt。项目所有者在本次任务中确认有模型公开展示／再发布授权，未独立核验。不将模型标记为开源或可任意再销售。

源模型为已有极氪官网配置器几何的 Blender 重建工程，未达一比一外观验收。原始 313 个网格对象导入网页后按材质拆为 394 个渲染网格，161,105 个三角面；不是 394 个真实工程零件。

副驾靠背 A/B 是局部替换，不改变座位数；没有提供整车五座／六座／七座切换或独立座椅折叠。两种胎面是视觉纹理变化，原创轮毂不是官方选装或适配声明。HUD、雷达覆盖和道路场景均为交互设计概念。

不连接实车、传感器、支付或咨询收集。页面不是极氪官方网站。

## 检查

```sh
node checks/model-integrity.mjs
node --import ./checks/ts-resolver.mjs checks/config-roundtrip.mjs
npx tsc --noEmit
npm run build
```

已验证模型完整性、转轴方向、坐标保留、配置分享往返、关键多语言文本及构建。尚未完成逐项浏览器交互、移动端真实设备性能、门机构碰撞和多视图外观验收。上述检查不能作为实车功能、安全、人因或工程验证。

## 2026-09-09 refinement

- Two reflection environments (large softbox / long strip), physical clearcoat and satin finish. Original UVs and normal maps remain; cabin tint now reduces recolouring of dark trim.
- Added supplemental cabin geometry: wood-style door inlays, perforated speaker grilles, metallic controls, roof rails, reading lamps, footwell lighting, and a hinged rear display. These are video-informed visual additions, not OEM CAD.
- Rear display deploy/stow, roof shade travel, reading-light control, seat ventilation/heating/massage feedback, speaker-field animation and linked screen content.
- Clear/rain/snow/fog/crosswind; rain streaks, snow particles, fog visibility, wet-ground material and wind traces. These are visual environments, not tyre grip or weather sensor simulations.
- Proportional seated avatar from 150–195 cm, three row placements, transparent body view and eye-height adjustment. No measured ergonomic clearance is claimed.
- 25 scenarios across aHMI/iHMI, six journey filters, four phases per scenario, timeline scrub/play/pause/replay, HUD/status displays, risk targets and source links.
- Scene categories cover startup/status, navigation, ADAS, warnings, parking, media, comfort, communications, passenger zones and parked experiences. Individual subfeatures such as real phone connection, all sensor classes, OTA installation, remote/valet parking and an engineering 360 camera stitch are not implemented.
- Core controls have five languages. The expanded scenario narratives and video labels are Chinese/English, with English fallback for German/Japanese/Arabic. Full narrative translation is outstanding.
- Official clips are loaded only on user selection from their original public URLs. Local research copies are not redistributed. Visual descriptions are included; full audio captions are not available.

### Additional checks

```sh
node --import ./checks/ts-resolver.mjs checks/config-roundtrip.mjs
node --import ./checks/ts-resolver.mjs checks/scenario-state.mjs
node --import ./checks/ts-resolver.mjs checks/atelier-geometry.mjs
```

The scenario tests cover persistent sensor failure, unverified takeover, parking stop, illustrative braking, all 25 scenario phases and share-link boundaries. Supplemental geometry checks exercise 125 state combinations without WebGL. They do not verify rendered appearance, collision avoidance, road safety or physical vehicle performance.

### Remaining visual / modeling work

Independent seat rotation/recline rigging is still incomplete because the source merges much of the cabin geometry. Supplemental additions have not passed a full multi-view alignment or mobile browser visual acceptance. Do not claim material quality equal to the Xiaomi or Huawei references yet. Side-impact view is a cabin-region diagram with an official-source link, not a finite-element crash solver or a verified crashworthiness rating.

## Cockpit / parking follow-up

- Fixed the original combined screen atlas: preserve its UV orientation and render instrument, central and passenger regions separately. The previous full-atlas replacement with the rear-screen image was removed.
- Six cockpit application views, temperature/fan/media level controls, ambient intensity, passenger close-up and top view. Values update the 3D screen artwork; no production OS binary or real service connection is used.
- Reverse parking uses a curved path with tangent-aligned body orientation, bay outline, reverse wheel rotation, R/P indication and end-state hold. This is a motion illustration, not a vehicle-kinematics or collision solver.
- Reading lamp emitters now darken with their light switches; rain and snow particles are kept outside the vehicle envelope.
- User-triggered speech and device vibration are capability-checked. Neither is represented as an actual steering-wheel/seat actuator.
- `node --import ./checks/ts-resolver.mjs checks/cockpit-atlas.mjs` validates atlas regions/orientation, 100 screen states, cabin control feedback, parking endpoints and link persistence.

## Interior material workshop — 2026-09-09

Cabin controls now include six region selections, three recipes (warm leather / Nordic textile / sport suede), original-material reset, and texture loading/error feedback. Material choices are encoded in share links. Scanned textures load only when selected, and old requests cannot overwrite newer choices.

INT surfaces are grouped by connected geometry before applying region labels. Original positions, normals and atlas UVs are preserved; a second UV set carries microdetail. The original 161105 triangles remain intact. Four supplementary floor coverings and door decor use the same selection controls. Procedural material labels denote visual studies, not OEM specifications or chemistry certification.

Texture origins and CC0: `public/credits.txt`, `public/materials/manifest.json`.

Checks: `checks/cmf-regions.mjs` validates original-geometry conservation and URL round trips; `checks/cmf-switching.mjs` validates independent selection, lazy loading, reset, failed-load retry and race handling. Tests use Node and mocked texture loading; they do not establish WebGL appearance. Blender CPU renders are separate from browser rendering.

## Seating, parts and terrain study — 2026-09-09

Six left/right seat positions, 150–195 cm posture, three-point belt routing and unfastened reminder are under Cabin. Structure adds 14 available mesh categories, isolation, assembly-directed explosion, and an underside camera. A separately labelled generic chassis overlay is optional. Road study offers 11 weather profiles × 11 surface profiles, independent playback, severity and speed; terrain heights drive wheel contacts and illustrative body pose. All controls serialize to the existing share URL.

Seat surfaces remain connected when grouped by seat position; the original 161105 triangles and atlas UVs remain intact. Render-mesh counts must not be presented as engineering part counts. New model primitives are authored in `app/ride-study.ts`; portable GLB samples can be regenerated by `checks/export-study-assets.mjs`.

`checks/ride-study.mjs` covers 48 seating states, 165 road samples, and 121 weather/surface combinations. This is geometry and state validation, not browser visual acceptance or vehicle safety simulation. Native Blender merging of the new GLBs is pending manual Mac unlock. New panel copy is Chinese/English, with English fallback for other locales.

## 版本备份

当前保存版本：`v0.2.0-20260909`。恢复方法、Blender 附件与同步边界见 [版本说明](docs/VERSION-2026-09-09.md)。最新功能覆盖见 [需求对照](docs/2026-09-09-需求对照与交付.md)。

## Vercel 发布

正式网站：https://zeekr-9x-showroom.vercel.app

控制台：https://vercel.com/007-0728/zeekr-9x-showroom

已于 2026-09-10 关联 `wulinjun007/zeekr-9x-showroom`，生产分支为 `main`。发布与资源校验见 [上线记录](docs/DEPLOYMENT-2026-09-10.md)。

Vercel 使用 `vercel.json` 中的 `npm run build:vercel`，输出 `dist-vercel`。同一套 React/Three.js 源码通过 `web/main.tsx` 挂载；当前展厅不依赖服务端接口，模型和贴图从 Vercel CDN 读取。原 `npm run dev` 本地预览流程保留。

```sh
npm ci
npm run build:vercel
npm run preview:vercel
```

GitHub 主分支 `main` 关联生产环境；其他分支用于预览。不要将 Blender 源工程压缩包放进网站的 `public/`，源工程继续保存在私有 GitHub Release 附件中。

### Wheel design workshop

Exterior → More options now offers the original wheel plus six procedural concepts: swept turbine, ten-spoke, split Y, cross mesh, aero disc and concave six-spoke. Concepts support diamond silver, graphite and satin bronze surfaces. Selection opens the wheel close-up; `wheelStyle` and `wheelFinish` survive saved configurations and shared URLs. Existing tire patterns remain independent.

These are original visual concepts using the retained tire envelope, not official fitment or aerodynamic claims. Three merged material buckets per wheel share cached geometry across all four wheels (3,336–5,160 triangles per wheel); no external model downloads are added. Geometry and sharing validation:

```sh
node --import ./checks/ts-resolver.mjs checks/wheel-designs.mjs
```
