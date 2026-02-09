---
name: img-wechat-svg
description: 微信公众号交互式SVG制作指南。用于创建可在微信公众号文章中使用的交互式SVG动画，包括点击交互、多步骤流程、动画效果等。适用场景：营销活动页面、互动游戏、抽奖转盘、信息展示卡片、教程引导等需要在微信内实现交互效果的SVG。
---

# 微信公众号 SVG 制作指南

本 skill 总结了在微信公众号环境中制作交互式 SVG 的实战经验，包括平台限制、可用技术和最佳实践。

## 核心限制

微信公众号对 SVG 有严格限制：

### ❌ 完全不支持

- JavaScript（任何 JS 代码）
- CSS 动画（`@keyframes`、`transition`）
- `foreignObject` 标签
- 外部 CSS 文件
- `localStorage` / `sessionStorage`
- `id.click` 引用触发动画（如 `begin="zone1.click"`）
- `pointer-events:none` 穿透点击

### ⚠️ 部分支持 / 不稳定

- 时间延迟动画（`begin="2s"` 在移动端不可靠）
- 动画链（`begin="id.end+0.5s"` 不稳定）
- 复杂的滚动动画
- 超长 SVG 高度（有渲染截断限制）
- `clipPath` 裁剪图片（圆角会失效）

### ✅ 完全支持

- 点击触发动画（`begin="click"` 或 `begin="mousedown"`）
- SMIL 基础动画（`animate`、`animateTransform`）
- `opacity` 透明度变化
- `transform` 位移/旋转
- `fill="freeze"` 保持最终状态
- `restart="never"` 防止重复触发
- `pattern` 填充（实现图片圆角）
- 微信图床图片（`image` 标签）
- 基础 SVG 元素（`text`、`rect`、`circle`、`path` 等）

## 交互实现方案

### 推荐方案：多层覆盖 + 点击移除

**必须使用 `mousedown`/`click` 直接在 `<g>` 上触发**，不能用 id 引用：

```xml
<svg viewBox="0 0 750 1000">
  <!-- 最底层：最终完成状态（始终存在） -->
  <g id="final-content">
    <text>完成！恭喜获得奖励</text>
  </g>

  <!-- 第2层：中间状态 -->
  <g>
    <animate attributeName="opacity" values="1;0" dur="0.01s"
             fill="freeze" begin="mousedown" restart="never"/>
    <animateTransform attributeName="transform" type="translate"
                      values="0 0;2000 0" dur="0.01s" fill="freeze"
                      begin="click+0.02s" restart="never"/>
    <rect width="750" height="1000" fill="#161b22"/>
    <text>点击继续...</text>
  </g>

  <!-- 最上层：初始状态 -->
  <g>
    <animate attributeName="opacity" values="1;0" dur="0.01s"
             fill="freeze" begin="mousedown" restart="never"/>
    <animateTransform attributeName="transform" type="translate"
                      values="0 0;2000 0" dur="0.01s" fill="freeze"
                      begin="click+0.02s" restart="never"/>
    <rect width="750" height="1000" fill="#161b22"/>
    <text>点击开始</text>
  </g>
</svg>
```

关键技术点：

- 用 `begin="mousedown"` 而非 `begin="id.click"`（后者微信不支持）
- 先用 `opacity` 隐藏，再用 `transform` 移出视野（双保险）
- `restart="never"` 防止用户误触重复触发
- `fill="freeze"` 保持动画结束状态
- 覆盖层必须有背景色填充，否则点击会穿透
- 不要使用 `pointer-events:none`，微信支持不稳定

错误示例（微信不支持）：

```xml
<!-- ❌ 错误：使用 id.click 引用 -->
<rect id="zone1" fill="transparent"/>
<g>
  <animate begin="zone1.click" .../>
</g>

<!-- ❌ 错误：依赖 pointer-events:none -->
<g style="pointer-events:none;">内容</g>
<rect fill="transparent"/>  <!-- 期望点击穿透到这里 -->
```

### 光标闪烁效果

```xml
<rect x="65" y="438" width="4" height="44" fill="#c9d1d9">
  <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
</rect>
```

### 进度条动画（单次播放）

```xml
<!-- 背景槽 -->
<rect x="40" y="585" width="610" height="24" rx="6" fill="#21262d"/>
<!-- 进度条 - 单次播放到100% -->
<rect x="44" y="589" width="0" height="16" rx="4" fill="#FF8B2C">
  <animate attributeName="width" from="0" to="602" dur="1.5s"
           fill="freeze" begin="0s" restart="never"/>
</rect>
```

## 图片处理

### 使用微信图床

必须使用微信图床 URL，格式例如：

```xml
<image x="40" y="1400" width="670" height="893"
       href="https://mmbiz.qpic.cn/mmbiz_png/xxx/0?wx_fmt=png&amp;from=appmsg"
       preserveAspectRatio="xMidYMid slice"/>
```

注意：URL 中的 `&` 必须转义为 `&amp;`。

### 圆角图片（重要）

必须使用 `pattern` 方式，`clipPath` 在微信中图片会溢出圆角：

```xml
<!-- ✅ 正确：使用 pattern 填充圆角 rect -->
<defs>
  <pattern id="imgPattern" patternUnits="userSpaceOnUse" x="45" y="1390" width="660" height="880">
    <image href="https://mmbiz.qpic.cn/mmbiz_png/xxx/0?wx_fmt=png&amp;from=appmsg"
           width="660" height="880" preserveAspectRatio="xMidYMid slice"/>
  </pattern>
</defs>

<rect x="45" y="1390" width="660" height="880" rx="18" fill="url(#imgPattern)"/>
<rect x="45" y="1390" width="660" height="880" rx="18" fill="none" stroke="#30363d" stroke-width="2"/>
```

```xml
<!-- ❌ 错误：clipPath 在微信中图片会溢出圆角 -->
<clipPath id="imgClip">
  <rect x="40" y="1400" width="670" height="893" rx="18"/>
</clipPath>
<image clip-path="url(#imgClip)" ... />
```

## 尺寸与布局

推荐 viewBox：

- `750 x 1000` → 3:4 比例，适合单屏展示
- `750 x 1500` → 1:2 比例，适合需要滚动的长内容
- `750 x 2400` → 扩展高度，注意底部可能被截断

字体大小建议：

- 主标题 / 重要提示：36–48px
- 正文内容：22–26px
- 辅助信息：18–20px
- 提示文字（如“往上滑”）：36–42px（需要醒目）

移动端阅读，字号宁大勿小。

### 长页面提示文字位置

提示用户操作的文字应放在首屏之外，避免干扰主内容：

```xml
<!-- y 坐标设为 1400+，确保在首屏下方 -->
<text y="1400" font-size="48">↑</text>
<text y="1450" font-size="42">往上滑，在终端里继续</text>
<text y="1520" font-size="36">滑到这里了？没关系，返回上面就好</text>
```

### 背景与内容分层

创建视觉层次感，用边框区分背景和内容区：

```xml
<!-- 深色背景 -->
<rect width="750" height="2400" rx="24" fill="#0d1117"/>
<rect x="15" y="15" width="720" height="2370" rx="20" fill="#161b22" stroke="#30363d" stroke-width="2"/>
```

## 生成预览页面

生成 SVG 后，建议嵌入预览模板进行测试和交付。

使用脚本生成预览页面：

```bash
python scripts/generate_preview_page.py my-svg.svg -o preview.html
```

参数说明：

- `my-svg.svg`：要嵌入的 SVG 文件路径
- `-o preview.html`：输出的 HTML 文件路径（可选，默认 `./wechat-svg-preview.html`）

## 输出规范

生成的预览页面基于 `assets/preview-template.html` 模板，脚本会自动替换模板中的 SVG 占位符。

用户使用流程：

1. 下载生成的 HTML 文件到本地
2. 用浏览器打开，预览 SVG 效果
3. 点击「复制 SVG」按钮（以富文本格式复制）
4. 直接粘贴到微信公众号编辑器，渲染为图形

技术说明：

- 模板使用 Clipboard API（并带回退）以 `text/html` 格式复制
- 无需维护两份代码，复制逻辑从 DOM 读取
- 支持交互式 SVG 的完整测试

## 操作步骤

### 标准流程

#### 方式一：使用模板快速预览

1. 准备 SVG 文件
   - 使用本 Skill 中的指南创建 SVG 文件，或使用 `assets/interactive-template.svg` 作为模板
2. 生成预览网页
   - 调用 `scripts/generate_preview_page.py` 生成预览网页：
   ```bash
   python scripts/generate_preview_page.py <svg文件路径>
   ```
   可选参数 `-o` 指定输出路径：
   ```bash
   python scripts/generate_preview_page.py <svg文件路径> -o <输出html路径>
   ```
3. 预览和复制
   - 在浏览器中打开生成的 HTML 文件
   - 查看 SVG 预览效果
   - 点击「复制 SVG 代码」按钮
   - 3 秒后会显示「已复制！可以粘贴到微信公众号编辑器」的提示
   - 在微信公众号编辑器中粘贴使用

#### 方式二：使用智能体指导创建

1. 描述需求：告诉智能体你想要创建的 SVG 效果和功能
2. 智能体创建：智能体将根据本 Skill 中的指南创建 SVG 代码，并自动生成预览网页
3. 预览和复制：按照网页提示操作

## 资源索引

- 必要脚本：`scripts/generate_preview_page.py`（生成带复制功能的预览网页）
- 模板资产：`assets/interactive-template.svg`（可直接使用的交互式 SVG 模板）

## 注意事项

- 仅在需要时读取参考，保持上下文简洁。
- 当操作脆弱或需强一致性时，优先调用脚本执行并进行结果校验。
- 重要：复制的是 SVG 源代码（作为富文本 HTML），不是网页中的 DOM 节点；可以直接粘贴到微信公众号编辑器使用。
