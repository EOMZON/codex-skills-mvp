---
name: vercel-deploy
description: Deploy a new or existing project to Vercel via CLI, enable Vercel Web Analytics, and (optionally) connect a custom domain/subdomain like skills.zondev.top.
---

# Vercel Deploy

把「一个文件夹」变成一个可访问的线上站点（Vercel），并把流程固化成可复用的动作：创建 → 部署 → 分配域名 → 验证。

## 0) 先问 4 个问题（必须）

1. **要部署的本地路径**：是已有项目，还是要新建一个？
2. **项目类型**：静态 HTML（无构建）还是框架（Next.js/React 等）？
3. **目标**：预览（preview）还是生产（prod）？
4. **域名**：是否要绑定自定义域名（例如 `skills.zondev.top`）？

## 1) 最短路径（静态站点，推荐）

适合：个人页面、目录页、单页/多页静态站。

### A) 生成一个全新静态站点（可选）

使用本 skill 自带脚手架（不依赖外部模板）：

```bash
node ~/.codex/skills/vercel-deploy/scripts/new-static-site.mjs --out ./my-site --title "My Site" --subtitle "Minimal · Black/White"
```

它会生成：
- `index.html`（含 Web Analytics snippet）
- `vercel.json`（`trailingSlash: true`）
- `.gitignore`（忽略 `.vercel`）

### B) 部署（Vercel CLI）

在项目目录内执行：

```bash
vercel
```

生产发布：

```bash
vercel --prod
```

## 2) 现有项目（框架/Monorepo）部署要点

### A) Root Directory

Vercel 部署“吃的是一个目录”。在 monorepo 里要确认 root directory：
- 用 CLI：在那个目录里执行 `vercel`
- 或用 `vercel --cwd path/to/project`

### B) Analytics（两种常见方式）

**静态站点**：在 HTML `<head>` 添加（多页站点：每个 `*.html` 都要有）：

```html
<script defer src="/_vercel/insights/script.js"></script>
```

**Next.js**：安装并在 `app/layout.tsx` 引入：

```bash
npm i @vercel/analytics
```

```tsx
import { Analytics } from "@vercel/analytics/react";
// ... in layout
<Analytics />
```

## 3) 绑定自定义域名（例如 skills.zondev.top）

最稳路径：先把域名加到项目，再按 Vercel 给的提示配 DNS。

```bash
vercel domains add skills.zondev.top <project-name>
```

常见 DNS（子域名）配置方式：
- **CNAME**：`skills` → `cname.vercel-dns.com`

注意：
- DNS 需要在你的域名服务商/Cloudflare 里配置；Vercel 无法替你改第三方 DNS（除非你把 NS 改成 Vercel DNS）。
- DNS 生效有延迟（几分钟到数小时）。

## 4) 验证与交付

你应该输出给用户（或自己记录）：
- Vercel Project 名称
- Production URL（`*.vercel.app`）
- 自定义域名是否已验证（如绑定）

## 5) 常见坑（快速排查）

- 打不开 `*.vercel.app`：某些网络环境会阻断/重置该域名访问；可用 `vercel inspect <url>` 确认部署状态。
- 子页面 404：检查是否需要 `trailingSlash`，以及目录结构是否是 `.../x/index.html` 形式。
- Analytics 没数据：确认 Vercel 项目里 Web Analytics 已开启，并等待数据回传（有延迟）。
