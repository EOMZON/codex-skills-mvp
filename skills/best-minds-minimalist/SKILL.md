---
name: best-minds-minimalist
description: Combine “best-minds” research synthesis (谁最懂这个？TA 会怎么说？) with a black/white minimalist report layout (极简黑白/Modern Minimalist). Use for 调研、研究报告、方案对比、路线规划、决策梳理 when you want expert-simulated viewpoints + synthesis, presented in a clean monochrome format, and automatically generate a printable HTML report in the workspace.
---

# Best Minds Minimalist

## Overview

用“最佳专家视角模拟（best-minds）”产出调研结论，并以黑白极简排版交付。默认会在 workspace 自动落一份可打印的 HTML 报告文件（无需你在 prompt 里额外说明）。

## Workflow Decision Tree

1. 明确交付物
   - 受众是谁？（自己/团队/老板/外部）
   - 目的是什么？（学习/决策/说服/立项/避坑）
   - 时间预算与深度？（15min/2h/1d）
   - 输出偏好：`Markdown`（默认）或 `HTML`（可打印）
2. 选择 “best minds”（1–5 位）
   - 一个人能定调就 1 位；需要碰撞观点再加人
   - 只选真正最懂的：领域奠基者/长期一线实践者/关键论文作者/标准制定者
3. 逐位模拟与归纳
   - 对每位专家输出：核心立场（thesis）→ 关键论据 → 反例/限制 → 适用边界
   - 引用规则：只在**高度确定**时给“原话 + 来源链接”；否则标注为“paraphrase”
4. 合成可执行结论
   - 把一致点/分歧点写清楚，指出分歧的“关键变量（crux）”
   - 给出 2–4 个可选方案：适用场景、收益、代价、主要风险、第一步
5. 黑白极简呈现
   - 无表情符号、少装饰、留白、细分隔线、少量加粗
   - 默认输出 Markdown + 自动生成 HTML（见下方“Auto HTML”）

## Style Spec (Zon Minimal Editorial · Light)

- Tokens：`--black #0a0a0a`，`--white #fafafa`，`--gray-100 #f5f5f5`，`--gray-200 #e8e8e8`，`--gray-400 #999`，`--gray-600 #666`，`--gray-800 #333`
- Typography：系统 UI 字体栈（含中文系统字体）；正文 `16px/1.8`；标题轻字重 + 细字距；标签使用大写 + 高 tracking
- Layout：窄阅读宽度（`max-width: 860px`），sticky header + 细分割线，内容优先、留白克制

**默认增强（你要求的）：**

- 报告末尾必须有“Closing Summary”（结尾总结 + One next action）
- 默认内置 SVG（流程图 / 时序图 / 轻动画 dash），**默认中文**；SVG 文案尽量复用报告里的同一组字段（如 `{{TITLE}}` / `{{ABSTRACT}}` / 关键结论短句），避免“SVG 还停留在模板文案”
- 页面内所有图片/图表（`<img>` / `<svg>` / `<canvas>`）必须支持点击打开**全屏浮窗**（拖拽移动、滚轮/双指缩放、双击重置、`ESC` 关闭；不依赖外部库）
- 尽可能把关键信息做成数据可视化：优先用模板自带的 `timeline` block（里程碑）/ `.kpi-grid` / `.barlist`；复杂图解再用 `<figure class="figure"><svg>...</svg></figure>`
- 有操作步骤必须给 Step-by-step（面向新手、通俗易懂）
- 遵循奥卡姆剃刀：主页面只放必要内容；复杂推导/长表格/补充材料放二级页面

## UI Primitives（kit 内置组件 · 推荐优先用）

这些组件由 `zon-report-kit` 的 `zon-report.css` / `zon-report.js` 提供：你只需要在 report 的 `blocks` 或 `html` 里使用对应结构即可。

### 1) `timeline`（里程碑时间轴）

- 用途：产品里程碑、阶段演进、路线图关键节点
- 形式：自动在横向/纵向之间择优（可强制）

数据示例：

```js
{ id: "milestones", nav: "Milestones", type: "timeline", data: {
  title: "Milestones",
  orientation: "auto", // auto | horizontal | vertical
  items: [
    { label: "Launch", time: "2016-08-11", note: "Hacker News 发布（对外起量）" },
    { label: "Acquired", time: "2017-04-11", note: "Stripe 收购（战略并入）" }
  ]
}}
```

### 2) `.kpi-grid`（KPI 卡片网格）

- 约定：KPI 内部字段请用 `.k`（label）与 `.v`（value），注释用 `.muted`

HTML 片段示例：

```html
<div class="kpi-grid">
  <div class="kpi">
    <div class="k">Newsletter</div>
    <div class="v">100K+</div>
    <div class="muted">增长里程碑</div>
  </div>
</div>
```

### 3) `.barlist`（对比条形图）

- 约定：`.barfill` 的宽度用 `style="--pct: 68%"`



## Content-Driven Layout（核心）

目标：**保持同一视觉系统（Zon Minimal Editorial · Light）**，但让每份报告根据内容选择更合适的展现形式（cards / grid / table / figure / stepper），避免“永远同一套章节 + 同一套版式”。

**硬规则：**

- 先选一个 `LAYOUT`（写入 HTML 模板的 `data-layout`）：`memo / compare / roadmap / playbook / audit`（五选一；不要留空）
- 主内容必须用 `{{BLOCKS_HTML}}` 组装（每个 block 用一个 `<section>`），而不是机械填固定 TLDR_1/2/3 那种字段
- 每个 `<section>` 必须同时具备：
  - `id="..."`（用于锚点）
  - `data-nav="..."`（用于自动生成 TOC / 顶部导航）
- 不要输出“空 section / 空表格 / 空图解”：没内容就不生成该 block

**最低 UX 保底（每篇都要有）：**

- 一个“结论/要点”block（可以是 bullets，也可以是 cards）
- 一个“一个下一步动作（One next action）”block（最好用 `.callout` 或 `.card`）
- Sources block（可用 list 或 table）
- 至少两个图解：① 结构图（流程/时序/架构）② 数据图（对比条形图/矩阵/热力图/时间线/评分图），都用 `<figure class="figure">...</figure>`

**常见内容 → 推荐版式（示例，不是硬模板）：**

- `compare`（A vs B / 方案对比）：双列卡片 + 对比表 + 风险/代价清单 + 最终推荐（callout）
- `roadmap`（路线图 / 计划）：时间线（列表或表格）+ 里程碑卡片 + 依赖/风险 + 第一周行动（stepper）
- `playbook`（执行指南）：stepper + checklist + “常见坑/反例”（details 折叠）
- `audit`（评估/复盘/体检）：评分表 + 证据链（table）+ 缺口清单 + 修复顺序（roadmap mini）
- `memo`（通用决策备忘）：开场摘要 + 关键洞见（cards 或 numbered list）+ 选项/权衡 + 下一步

## Output Template (Markdown)

默认按下列结构输出（必要时可删减）：

```md
# {Title}
{One-line subtitle}
{Date} · {Audience} · {Scope}

---

## TL;DR
- ...

## Key Insights
1. ...

## Expert Views
### {Expert 1 — credential}
- Thesis: ...
- Arguments: ...
- Limits: ...
- Quote (if certain): “...” — {Source}

### {Expert 2 — credential}
...

## Options
| Option | Best for | Upside | Downside | Key risk | First step |
|---|---|---|---|---|---|
| A |  |  |  |  |  |

## Evidence & Confidence
| Claim | Evidence | Confidence | Source |
|---|---|---|---|
|  |  | Low/Med/High |  |

## Next Steps
- ...

## Sources
- ...
```

## Output Template (HTML)

## Auto HTML (默认行为 · Zon Report)

除非用户明确说“只要 Markdown / 不要生成文件”，否则每次调用本 skill 都自动生成一份「数据源 + 极薄 HTML」的报告：

- **强全局统一**：样式/交互从 `zon-report-kit` 加载（改一次全生效）
- **数据只存一次**：正文只写进数据文件；HTML 只做渲染壳（不再混杂长 CSS/内容）
- **本地 `file://` 兼容优先**：默认用 **JS 数据源**（避免浏览器禁止 `fetch(file://...)` 读取 JSON）

> Kit 基址默认：`https://zon-report-kit.zondev.top`（如用户提供 `ZON_REPORT_KIT_BASE`，优先用它）。

**硬性要求（不要跳过）：**

1. **先落盘，再回复。** 在组织回答内容前，先创建/更新 `docs/report.html`（最差也要先写入占位版，随后再覆盖为最终版），保证用户永远有一个“最新入口”。
2. 确保 `docs/reports/` 存在（不存在则创建）。
3. 每次都创建**全新文件**（不要覆盖旧文件），使用时间戳命名：
   - 数据：`docs/reports/report-YYYYMMDD-HHMMSS.data.js`
   - 壳：`docs/reports/report-YYYYMMDD-HHMMSS.html`
   - 若同一秒内冲突：在末尾追加 `-2`、`-3`… 直到不冲突
4. **数据只能写一次**：禁止把正文再复制进 HTML。HTML 里只保留 title/少量 meta；正文放在 `.data.js` 的 `window.zonReportData`。
5. HTML 必须是“极薄壳”（只负责 mount + 引入 kit）：

```html
<div data-zon-report data-var="zonReportData"></div>
<script src="report-YYYYMMDD-HHMMSS.data.js"></script>
<script src="https://zon-report-kit.zondev.top/zon-report.js"></script>
```

6. 同时引入 kit 样式：`<link rel="stylesheet" href="https://zon-report-kit.zondev.top/zon-report.css" />`
7. 更新 `docs/report.html` → 重定向到最新壳：`reports/report-YYYYMMDD-HHMMSS.html`
8. 回复末尾必须包含两个可点击路径：
   - `docs/reports/report-YYYYMMDD-HHMMSS.html`
   - `docs/reports/report-YYYYMMDD-HHMMSS.data.js`

**数据结构（zon-report@v1）**

`.data.js` 必须输出：

```js
window.zonReportData = {
  version: "zon-report@v1",
  meta: {
    id: "report-YYYYMMDD-HHMMSS",
    title: "...",
    subtitle: "...",
    abstract: "...",
    label: "Report",
    layout: "memo|compare|roadmap|playbook|audit",
    theme: "light",
    date: "YYYY-MM-DD HH:MM",
    audience: "Zon",
    scope: "...",
    tags: ["..."],
    generated_at: "YYYY-MM-DD HH:MM",
    links: { }
  },
  blocks: [
    { id: "tldr", nav: "TL;DR", type: "html", data: { html: "<h2>TL;DR</h2>..." } },
    { id: "next", nav: "Next", type: "callout", data: { variant: "info", title: "One next action", bullets: ["..."] } },
    { id: "sources", nav: "Sources", type: "html", data: { html: "<h2>Sources</h2><ul>...</ul>" } }
  ]
};
```

- `blocks[].type="html"`：`data.html` 里只写 **section 内部** HTML（如 `h2 + card + list`），不要再包一层 `<section>`。
- 必须保证每个 block 都有：`id`（锚点）+ `nav`（TOC 显示名）。
- **最低保底**：至少包含 `TL;DR / Key Insights / Options / Next Steps / Sources / Closing Summary`（可拆成多个 block）。

**降级策略（当工具写文件不可用/失败时）：**

- 仍然要生成报告内容，并明确说明“本次无法写入文件”；同时输出：
  - 一份 `.data.js`（`window.zonReportData=...`）
  - 一份极薄 `.html` 壳（引用 `.data.js` + kit）
## Safety & Integrity

- 不要编造“原话”；不确定就用 paraphrase 并标注不确定性
- 把 sources 放在末尾，优先给可验证链接；没网就说明“无法在线核验”
- 不在未确认的情况下建议执行破坏性命令；所有文件写入先说明写到哪里、写什么


## Link Retrieval Fallback（Playwright CLI）

当用户提供链接（尤其 `mp.weixin.qq.com`）但你无法直接获取正文/内容时，不要空口总结：

1. **优先用 Playwright CLI 抓取原文并落盘**（本仓库已有脚本）：  
   - `python scripts/fetch_wechat_article.py --url "..." --out "tmp/wechat/<ts>"`
2. **如果需要“展示正文”**，直接生成一份新的 HTML：  
   - `python scripts/fetch_wechat_article.py --url "..." --out "tmp/wechat/<ts>" --render-html`
3. **遇到“环境异常 / 去验证”**：改用可见窗口过一次验证并保存登录态，再复用 cookie：  
   - `python scripts/fetch_wechat_article.py --url "..." --headed --storage-state "tmp/wechat/storage.json"`  
   - 然后 `python scripts/fetch_wechat_article.py --url "..." --storage-state "tmp/wechat/storage.json"`

使用抓取结果写报告时：

- Sources 必须包含 `meta.json` 的 `final_url`（或 `requested_url`）与抓取时间
- 引用只来自抓取到的 `article.txt` / `article.html`；找不到出处就标 `paraphrase` / `low confidence`

## Example Triggers

- “$best-minds 帮我调研 X，并用黑白极简风格输出”
- “做个对比报告：A vs B，给 3 个方案和结论”
- “帮我做路线规划，按专家观点拆分，然后合成决策建议”
