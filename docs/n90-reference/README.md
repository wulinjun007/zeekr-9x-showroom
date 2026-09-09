# N90 Max 探索版：独立建模校准稿

当前状态：**一比一复刻未完成，尚未达到官网展示质量。**

本地入口：<http://localhost:3001/?vehicle=n90>。左上角切换至 ZEEKR 9X，原展厅独立保留。N90 是独立模型，不是把极氪换标。

## 参考与资产来源

- 用户指定配置器：<https://www.xiaomiev.com/configurator/select?goodsId=900020450&itemId=500042050&ssuId=600147082&type=3d>
- 产品介绍：<https://www.xiaomiev.com/skynomad/n90>
- 当前页面实测展示名称为 N90 Max 探索版；四种车漆、两种探索版内饰、车外/车内/空间分类作为交互参考。
- 几何由 `scripts/blender/build_n90.py` 在 Blender 5.2.1 LTS 中独立创建。未提取官网 GLB、纹理或商业收费模型；没有下载限制绕过。
- 车标、名称与产品设计归相应权利人。本稿不代表获得小米官方授权，不宣称官方工程数据。生成几何没有套用第三方素材许可证；仓库本身也未因此获得车辆品牌授权。
- 发现的付费模型仅作候选，未购买：<https://www.artstation.com/marketplace/p/8Lmz3/2026-xiaomi-skynomad-n90-max-3d-model>。取得素材后仍需核对网页可下载交互展示的许可范围。

## 可编辑交付

- `assets-source/n90/N90_Max_校准中.blend`：编辑源文件，皮革程序节点、曲线缝线、独立车门/座椅/轮组/顶舱及摄影机灯光。
- `public/models/n90-max-study.glb`：网页模型，约 5.13 MB；671 个 Mesh，235,096 个三角面。
- 网页按材质和活动组件合批；展示页明确标记“校准预览”。分件展开是建模组件示意，不是真实汽车工程拆解。
- Blender 中保留程序材质，GLB 网页使用微法线补充材质；两者不属于完全一致的离线/实时渲染结果。

## 已接入的交互

- 四种参考车色、两种内饰配色、银/黑轮毂表面、昼夜灯光、旋转缩放与自动环绕。
- 四扇侧门和尾门独立开合；模型点击与面板操作。
- 主驾、后排及车外镜头；独立顶舱开合、剖顶对坐会客示意。
- 建模组件展开、质量自动/手动设置、配置分享参数往返。
- 按车型分离代码和 GLB 下载；生产构建的预加载只选择当前车型。

## 对照差异与下一轮验收

| 部位 | 当前差距 | 通过标准 |
|---|---|---|
| 车身外形 | 前脸与侧面过于平直，转角和曲面连续性不足 | 同机位透视、前/侧/后视轮廓叠图校准；不能靠面数证明一致 |
| 灯组/窗框 | 灯壳比例和内构、玻璃边缘与柱面连接仍不准确 | 近景对照灯组、A/C柱和四角过渡，消除空隙与粗管式边缘 |
| 轮毂 | 当前仅研究型分叉多辐造型，没有官网全套轮型 | 各轮型独立几何与正视参考逐项一致 |
| 座舱 | 座椅型面、屏幕、门板、饰件和微表面细节不足 | 主驾/副驾/后排近景对照，真实皮革层次、完整按键和设备布置 |
| 空间机构 | 旋转/升顶仅机构示意，未校准真实行程和干涉 | 与官网动作逐帧对照，座椅、车门、桌板不互穿 |
| 网站体验 | N90 仅中文研究版，尚未迁移极氪全部 HMI/天气/乘员能力 | 分车型能力表、语言与移动端、质量性能实机验收 |

不声称一比一、工程仿真、安全性能、官方同款车机或真实碰撞能力。当前不覆盖线上极氪版本。

## 重建与检查

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python scripts/blender/build_n90.py -- outputs/n90
cp outputs/n90/n90-max-study.glb public/models/n90-max-study.glb
cp outputs/n90/N90_Max_校准中.blend assets-source/n90/N90_Max_校准中.blend
npm run assets:prepare
node checks/n90-model.mjs
npx tsc --noEmit
npm run build:vercel
```

检查产物保存在 `outputs/n90/`：Blender 重开渲染、网页各视角截图、几何和配置验证 JSON。结构检查通过不代表外形验收通过。
