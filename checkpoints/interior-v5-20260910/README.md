# 极氪 9X 内饰 V5 存档 · 2026-09-10

本分支保存当前网页工程代码（基于 feature/n90-reference-study / 6d70e6b）及本轮 Blender 精修、自检记录。属于工作版本，包含尚未完成验收的 N90 参考研究。

## 完整模型下载与恢复

[下载本版本模型附件](https://github.com/wulinjun007/zeekr-9x-showroom/releases/tag/checkpoint-interior-v5-20260910)

下载 zeekr-interior-v5-20260910.zip 后校验 SHA256SUMS.txt，解压，使用 Blender 5.2.1 打开 `outputs/内饰自检修复V5/ZEEKR_9X_内饰自检修复V5.blend`。当前模型使用的贴图已打包入 Blend。保留解压目录结构，脚本依赖的 V4 审计工具和旧材质来源 Blend 也已包含。

附件还包含自检前备份、修改器中间版本、最终三张预览、脚本、贴图和报告。逐文件大小与 SHA-256 见 manifest.json。未重复保存 .blend1 自动备份和旧 verified 预览。

## 状态边界

当前为离线高精度建模存档，约 100 万四边面；不是网页优化 GLB，也未同步或发布到生产网站。报告如实保留：UV、旧 1K 图集、完整倒角、部分真实几何和全局穿模检查仍未全部通过。参见 `outputs/内饰自检修复V5/8项自检报告.md`。

模型仅随现有私有仓库存档；本次不新增模型再分发许可。程序化占位贴图随工程保存；原有第三方资产权利不因本次备份改变。
