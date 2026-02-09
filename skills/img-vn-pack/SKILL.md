---
name: img-vn-pack
description: Produce product-grade RGBA PNG assets for visual novels (立绘/表情/UI) from AI output, using Grsai Nano Banana “one-call green-screen sheet” + local chroma-key keyout (decontaminate + edge bleed) and wire them into an HTML VN demo. Use when making VN/文字游戏素材包、抠图出透明 PNG、绿幕 keyout、nano-banana 资产图集拆分与接入。
---

# IMG · VN Pack (Chroma Key)

## Quick Start（最省 token：1 次出图）

目标：用 1 张 1:1「资产拼图」一次生成 BG + 主角立绘 + 4 表情 + UI（全部在 #00ff00 绿幕上）→ 本地 keyout → 得到可进游戏的透明 PNG。

1) 生成绿幕图集（联网；需要 `API_KEY`）

日系二次元 / 彩漫示例：

```bash
node tools/shot/nano-banana-vn-pack.mjs \
  --out-name jp04 \
  --only color \
  --model nano-banana-fast \
  --aspect 1:1 \
  --size 2K \
  --color-prompt-file docs/games/prompts/vn-pack-jp03-chroma-color.txt
```

```bash
node tools/shot/nano-banana-vn-pack.mjs \
  --out-name cm04 \
  --only color \
  --model nano-banana-fast \
  --aspect 1:1 \
  --size 2K \
  --color-prompt-file docs/games/prompts/vn-pack-comic03-chroma-color.txt
```

输出会写入：`tmp/vn-packs/<out-name>-<timestamp>/<out-name>-color.png`

2) 拆分 + 抠图（离线；商品级参数默认值）

```bash
python scripts/vn_asset_pack_keyout_from_sheet.py \
  --sheet tmp/vn-packs/<...>/jp04-color.png \
  --out docs/games/assets/generated/jp \
  --prefix jp04 \
  --bg 00ff00 \
  --decontaminate \
  --bleed 4 \
  --alpha-floor 10 \
  --edge-width 10 \
  --edge-dark 120
```

产物（例）：
- `docs/games/assets/generated/jp/jp04-bg.png`
- `docs/games/assets/generated/jp/jp04-char_a-alpha.png`
- `docs/games/assets/generated/jp/jp04-char_b-alpha.png`
- `docs/games/assets/generated/jp/jp04-expr-{1..4}-alpha.png`
- `docs/games/assets/generated/jp/jp04-ui-alpha.png`
- `docs/games/assets/generated/jp/jp04-manifest.json`

3) 接入到 Demo（HTML）

把 `docs/games/chengguang-immersive.html` 里的 `ASSET_PACKS` 指向新文件即可（参考 `jp03/cm03`）。

## Prompt 规范（关键，不然会抠不干净）

- 绿幕：明确要求 **纯色** `#00ff00`（不要渐变、不要纹理、不要阴影、不要地面接触阴影）
- 留白：角色四周要留安全边（避免贴边导致 floodfill/裁切困难）
- 分割线：尽量不要画黑框/相框；如果模型硬加了，`--edge-width/--edge-dark` 用来清掉
- 表情：做成 2×2 格子（大脸/半身优先），方便做对话头像

## 常见问题（直接用这几条修）

- **日漫扣完有“黑色外框/图片框”**：加/调高 `--edge-width 10 --edge-dark 120`（必要时 `edge-dark 140`）
- **发灰/绿溢色**：确保 `--decontaminate`；必要时把 `--feather` 提高到 `120`（保边缘）
- **边缘糊/锯齿**：把 `--feather` 下调（如 `64`），或把 `--gamma` 提高一点（如 `1.35`）
- **人物头被切掉**：图集被加了留白/边框时，保持默认自动版式识别；别用 `--no-auto-layout`

## Repo 相关资料（需要时再读）

- 流水线说明：`docs/games/vn-png-pipeline.md`
- 绿幕 prompt 示例：`docs/games/prompts/vn-pack-jp03-chroma-color.txt`、`docs/games/prompts/vn-pack-comic03-chroma-color.txt`
- 生成脚本：`tools/shot/nano-banana-vn-pack.mjs`
- keyout 脚本：`scripts/vn_asset_pack_keyout_from_sheet.py`
