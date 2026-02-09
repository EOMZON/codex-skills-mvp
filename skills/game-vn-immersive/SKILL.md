---
name: game-vn-immersive
description: Scaffold and iterate on an immersive single-file HTML visual novel / text game (文字游/橙光-like) with full-screen stage, character sprites, dialogue box, choices, save/load, and switchable asset packs. Use when user asks to “做一个文字游/视觉小说/橙光游戏/互动小说/剧情选择游戏” and wants a reusable HTML framework instead of using Ren’Py/Twine/Ink directly.
---

# GAME · VN Immersive (Single-file HTML)

## Best-Minds View (Is this “professional”?)

- **Emily Short（Interactive Fiction / Choice Design）**：专业不等于“分支很多”，而是“选择有意义且可维护”。大规模剧情要用“折返/汇合（foldback）+ 状态变量”控制爆炸式分支。
- **Jon Ingold（Ink / Inkle）**：专业写作流水线把“内容”从“引擎/UI”里拆出来（Ink/Yarn/Twine）。你现在的方式适合快速原型，但剧情一长会被 JS 函数式分支拖累协作与版本控制。
- **Tom Rothamel（Ren’Py）**：真正上生产通常用成熟引擎（Ren’Py/Unity/Godot）做资产管理、脚本语言、发布与本地化；但如果你的目标是“可分享的 HTML 原型”，单文件 HTML 也是合理的工程选择。

结论：**当前框架是“原型级专业”（prototype-grade）**。要更接近“生产级专业”，核心改进是：  
1) 内容数据化（JSON/Ink），2) 分支靠条件/效果 DSL，而不是 JS 回调，3) 有校验工具（死链/不可达/缺字段）。

## Quick Start

1) 生成一个新游戏（复制模板 → 写到 `docs/games/<slug>.html`）：

```bash
node ~/.codex/skills/game-vn-immersive/scripts/new-game.mjs \
  --slug rainy-apartment \
  --title "雨夜公寓" \
  --title-en "Rainy Apartment"
```

打开：`docs/games/rainy-apartment.html`（直接 `file://` 即可）。

2) 改剧情：在文件里找到 `<script id="GAME_DATA" type="application/json">`，只改 JSON 数据即可（不需要写 JS 函数）。

3) 校验分支（死链/不可达）：

```bash
node ~/.codex/skills/game-vn-immersive/scripts/validate-game.mjs docs/games/rainy-apartment.html
```

## Integrate Images / Art Packs

- 默认模板自带 `svg/jp/comic` 三套 pack（`jp03/cm03`），可立刻看到“背景全屏 + 立绘 + 表情头像”。
- 需要你自己产出新 pack 时，直接用已安装的流水线：`$img-vn-pack`（nano-banana 绿幕图集 → 本地 keyout → RGBA PNG）。

## Authoring Rules (Keep Branching Maintainable)

- 用 **scene graph + flags/stats**（而不是“每条分支都写一长串新场景”）。
- 重要选择要 **汇合**（foldback），把差异放到变量里（例如 `flags.metLin`、`stats.clue`）。
- 每个 choice 都写清楚：`requires`（条件） + `effects`（结果） + `lockedHint`（不给选时提示）。

## Resources

- Template: `assets/game-vn-immersive.template.html`
- Scaffold script: `scripts/new-game.mjs`
- Validator: `scripts/validate-game.mjs`
