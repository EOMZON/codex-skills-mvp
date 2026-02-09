# 通用 · 跑画风（风格锁定）SOP（Nano Banana / OLDLIFEASSONG 适配版）

用于为角色/项目快速确认并锁定稳定画风（Style Lock），再扩展到 IP 设定图（比例、三视图、表情、动作、服装等）。

核心目标：

- **尽量省 token / 省钱**：先用最少的图确定画风与角色“可复现性”，再扩展。
- **控制变量**：一次只改一个因素（描述/构图/参考图/模型），避免“改完不知道是哪一项生效”。

## 0. 你最终要拿到什么（交付物）

- `style-test-01.png`：一张可复用的“画风基准图”（后续所有图都向它对齐）
- `STYLE_ANCHOR`：一小段可复制粘贴的“画风锚点短语”（后续每个 prompt 都带上）
- 角色设定组图（按需）：
  - `proportion-01.png`（比例）
  - `turnaround-01.png`（三视图）
  - `expressions-01.png`（表情）
  - `poses-01.png`（动作）
  - `outfits-01.png`（服装）

## 1. 通用跑画风流程（与工具无关）

### 1.1 准备输入（越短越好）

- 角色一句话：年龄/体型/气质/关键特征（发型、眼睛、服装关键词）
- 画风 3–7 个关键词：例如「彩色漫画风、线条干净、低噪点、简化背景、柔和光影」
- 固定构图约束（建议固定一套）：`3:4` 竖幅、全身站立、纯色/简单背景、视角平视
- 可选参考图：1 张即可（能代表你要对齐的“画风”或“角色比例”）

### 1.2 第 1 张：style-test（只出 1 张）

把所有注意力放在“是否像你要的那种作品”，不要追求复杂剧情/场景：

- 只画单角色
- 背景尽量简单
- 姿势简单（站立/正面 3/4 角）

验收清单（不满足就重跑，仍然 1 张）：

- 角色剪影是否稳定（头身比例/发型轮廓/服装大形）
- 线条与上色是否符合目标（线稿干净？阴影复杂度？）
- 面部是否“可复现”（眼睛大小、鼻口简化程度）

### 1.3 第 2 张：稳定性验证（可选但很值）

在不改画风关键词的前提下，只改一个“轻微变量”验证是否还能保持画风：

- 换一个简单表情或手势（微笑/挥手）
- 或改成半身/全身（但比例保持一致）

如果第 2 张完全跑偏，说明你的 prompt 里“画风锚点”还不够硬：补强风格关键词/减少冲突描述，再回到 1.2。

### 1.4 锁定 STYLE_ANCHOR（后续全部复用）

把稳定的画风总结成一段短语（尽量 ≤ 30–60 token），后续每张图都复制粘贴：

- 画风：媒介/风格/线条/上色/质感
- 画面：简洁背景/干净构图/低噪点
- 统一项：镜头、比例、色彩倾向

示例（仅示意，按你项目改）：

> `STYLE_ANCHOR="clean colored comic style, crisp lineart, simplified shading, low noise, simple background, consistent character proportions, 3:4 vertical"`

### 1.5 扩展到设定组图（每次仍从 1 张开始）

保持 `STYLE_ANCHOR` 不变，只追加“阶段指令”：

- proportion：标注头身比例/站姿规范
- turnaround：同一张图里正/侧/背三视图
- expressions：6 格表情（或指定 4 格）
- poses：3–6 个基础动作
- outfits：3 套服装（或指定主题套装）

## 2. OLDLIFEASSONG · Nano Banana（Grsai）落地方式

### 2.1 基本信息

- 服务商：Grsai
- API Host：`https://grsai.dakka.com.cn`
- 绘图接口：`POST /v1/draw/nano-banana`
- 认证方式：`Authorization: Bearer <API_KEY>`

细节与踩坑：`TOOLS/shot/nano-banana-SOP.md`（这里不重复）。

### 2.2 本地脚本位置

- 项目根目录：`OLDLIFEASSONG`
- IP 设定目录：
  - ROYA：`TOOLS/cartoon/IP/ROYA`
  - KEKE：`TOOLS/cartoon/IP/KEKE`
- IP 出图脚本：`TOOLS/cartoon/generate-ip.js`

脚本会自动根据角色和阶段生成提示词，默认只调用一次或少量几次（省 token）。

### 2.3 环境变量

必需：

- `API_KEY`：你的 Grsai API Key
  - 如果项目根目录有 `.env` 且包含 `API_KEY=...`，脚本会自动读取，无需手动 `export`。

常用可选：

- `IMAGE_MODEL`：覆盖默认模型
  - 默认：`nano-banana-fast`（便宜版）
  - 可改为：`nano-banana-pro`（确认画风后再用）
- `IMAGE_API_BASE_URL`：默认 `https://grsai.dakka.com.cn`
- `IMAGE_DRAW_PATH`：默认 `v1/draw/nano-banana`
- `IMAGE_ASPECT_RATIO`：默认 `3:4`（IP 设定图使用 3:4 彩色竖幅构图）

IP 专用变量：

- `IP_CHAR`：角色代号 / 名称（默认 `ROYA`）
- `IP_DESC`：角色文字描述（可为空，脚本会只用名字）
- `IP_PROMPT`：直接覆盖脚本生成的提示词（可选）
  - 适用：群像/多角色、非标准阶段、或你想完全手写 prompt 的情况
  - 支持：单条字符串；或用 `\n---\n` 分隔多条；或传 JSON 数组（`["prompt1","prompt2"]`）
- `IP_PHASE`：当前要生成的设定阶段
  - `style-test`（默认）、`proportion`、`turnaround`、`expressions`、`poses`、`outfits`
- `IP_LIMIT`：本次最多生成几张图（默认 `1`，强烈建议先保持 1）
- `IP_REF_URL` / `IP_REF_URLS`：可选参考图 URL（图生图/风格参考，对应请求体里的 `urls`）
  - 单个链接或逗号分隔多个链接
  - 必须是 HTTP/HTTPS，本地路径如 `/Users/...` 无法直接使用
  - 未显式设置时，脚本会尝试读取 `${IP_CHAR}_REF_URL` / `${IP_CHAR}_REF_URLS`（例如 `ROYA_REF_URL=...`）
- `IP_REF_FROM`：基于已下载本地图的「间接图生图」
  - 值是一个或多个本地文件路径（逗号分隔），例如：
    - `IP_REF_FROM="TOOLS/cartoon/IP/ROYA/style-test-01.png"`
    - 或直接指向旁边生成的 json：`IP_REF_FROM="TOOLS/cartoon/IP/ROYA/style-test-01.json"`
  - 脚本会读取对应 `*.json` 元数据，从中取出远程 `url` 自动回填到请求体 `urls`

输出目录与命名：

- 默认输出：`TOOLS/cartoon/IP/${IP_CHAR}`
- 文件命名：`${IP_PHASE}-01.png`、`${IP_PHASE}-02.png` …

### 2.4 跑一个基础画风（style-test）——推荐起步

以 ROYA 为例，只出 1 张 `style-test`，使用 `nano-banana-fast`：

```bash
cd /path/to/OLDLIFEASSONG  # 项目根目录

export API_KEY="你的 Grsai API Key"
export IP_CHAR="ROYA"
export IP_DESC="（一句话描述 ROYA 的外形和气质）"
export IP_PHASE="style-test"
export IP_LIMIT=1

unset IMAGE_MODEL  # 用默认 nano-banana-fast

node TOOLS/cartoon/generate-ip.js
```

预期结果：

- 输出文件：`TOOLS/cartoon/IP/ROYA/style-test-01.png`
- 构图：单角色全身站立，彩色漫画风，3:4 竖幅；作为后续“画风基准图”。

如果画风太写实 / 太复杂 / 不像漫画：只改 `IP_DESC` 关键词重跑（仍然 `IP_LIMIT=1`）。

### 2.5 为 KEKE 跑基础画风（建议先文字，不急着图生图）

先用一句话概括参考图的核心特征，再交给模型：

```bash
cd /path/to/OLDLIFEASSONG  # 项目根目录

export API_KEY="你的 Grsai API Key"
export IP_CHAR="KEKE"
export IP_DESC="（用文字概括 KEKE：例如，大头小身体、眼睛很大、呆萌、剪影清晰）"
export IP_PHASE="style-test"
export IP_LIMIT=1

unset IMAGE_MODEL  # 继续用 nano-banana-fast

node TOOLS/cartoon/generate-ip.js
```

### 2.6 后续扩展：比例 / 三视图 / 表情 / 动作 / 服装

确认 `style-test` OK 后，再逐步补齐（每次仍从 `IP_LIMIT=1` 开始）：

```bash
export IP_PHASE="proportion"   # or turnaround / expressions / poses / outfits
export IP_LIMIT=1
node TOOLS/cartoon/generate-ip.js
```

输出示例：

- `TOOLS/cartoon/IP/ROYA/proportion-01.png`：可在 `IP_DESC` 里要求“标注头身比例”
- `TOOLS/cartoon/IP/ROYA/turnaround-01.png`：同图正/侧/背三视图
- `TOOLS/cartoon/IP/ROYA/expressions-01.png`：默认 6 格表情（可在描述里指定 4 格）
- `TOOLS/cartoon/IP/ROYA/poses-01.png`：基础动作（可强调某些动作关键词）
- `TOOLS/cartoon/IP/ROYA/outfits-01.png`：默认 3 套服装（可指定方向）

## 3. 省 token 小技巧（通用）

- 每次只出 1 张（`IP_LIMIT=1`），满意后再加图或切换更贵模型。
- 风格跑偏时优先“减法”：减少场景/道具/镜头语言，把画面收敛到角色本身。
- 如果总是太写实：在描述里明确「简洁漫画线稿 / 风格化 / Q 版 / 大头身 / 低噪点 / 简化阴影」。
- 统一规范：固定 `3:4` 竖幅、简单背景、同一镜头距离，能显著提高稳定性。

