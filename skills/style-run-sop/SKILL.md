---
name: img-style-run-sop
description: 通用跑画风/画风确认/风格锁定（Style Lock）工作流与提示词框架；用于角色 IP 设定图（比例、三视图 turnaround、表情表、动作表、服装设定）以及任何需要“先跑最少图片确认画风，再逐步扩展”的出图任务；当用户提到“跑画风”“画风锁定”“画风确认”“IP设定图”“角色设定”“三视图”“turnaround”“表情设定”“动作设定”“服装设定”或需要省 token/省钱的出图流程时使用。
---

# 跑画风（Style Lock）SOP

优先目标：用最少图片把画风锁定到“可复现”，再扩展设定图；全过程保持“控制变量”。

## 快速开始

- 先读取 `references/nano-banana-IP-SOP.md` 的「1. 通用跑画风流程」拿到通用流程与验收清单。
- 如果当前 workspace 里存在 `TOOLS/cartoon/generate-ip.js`（OLDLIFEASSONG 适配），再读取同文件的「2. …落地方式」按环境变量/脚本直接跑。

## 交互要点（缺信息就问）

- 角色一句话：年龄/体型/气质/关键特征（发型、眼睛、服装关键词）
- 目标画风关键词：3–7 个（媒介/线条/上色/阴影复杂度/背景复杂度）
- 画面约束：比例、镜头距离（全身/半身）、背景复杂度
- 是否有参考图（可选 1 张即可）；是否允许图生图

## 输出要求（交付物）

- `style-test-01`：作为后续全部出图的“画风基准图”
- `STYLE_ANCHOR`：后续每张 prompt 都复用的画风锚点短语
- 扩展图（按需）：`proportion` / `turnaround` / `expressions` / `poses` / `outfits`

