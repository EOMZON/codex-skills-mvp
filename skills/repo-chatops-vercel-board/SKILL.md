---
name: repo-chatops-vercel-board
description: Scaffold a repo-agnostic ChatOps pipeline (Issue/Comment → AI run → commit/PR + HTML report) with optional Vercel deploy and optional aggregation into a central Best Minds Board.
---

# Repo ChatOps + Vercel + Board

## When to use

当用户想在**任意仓库**实现「手机/网页聊天式入口（Issue/Comment）→ CI 执行（AI）→ 回写仓库/产出报告 → 一键可浏览链接（Vercel）」时使用。

## What you scaffold（默认交付）

- `.github/ISSUE_TEMPLATE/chatops.yml`：一个通用表单入口（Intent/Options/Text）。
- `.github/workflows/chatops.yml`：统一触发器与权限（issues / issue_comment / workflow_dispatch）。
- `scripts/chatops/entry.mjs`：事件解析 + 权限门禁 + 幂等（comment marker）+ 调用“repo handler”。
- `scripts/chatops/handlers/README.md`：说明如何为不同仓库实现自己的 handler（不在本 skill 内实现具体业务）。
- `docs/reports/`：产物目录（静态 HTML 报告）。
- `docs/report.html`：报告索引页（给 Vercel 作为入口）。

> 可选：如果用户明确需要“让 AI 改代码”，默认走 **PR 模式**（branch + PR），不要直接 push main。

## Core architecture（固定模块边界）

### 1) Chat入口层（GitHub）

- Issue/Comment 只负责“输入”与“触发”。
- 约定指令：评论以 `/ai` 开头（例如 `/ai research: ...` / `/ai operate: ...`）。

### 2) 执行层（GitHub Actions Runner）

- 只做三件事：
  1) 拉仓库代码
  2) 跑 `node scripts/chatops/entry.mjs`
  3)（可选）部署 `docs/` 到 Vercel

### 3) Repo handler（仓库自定义能力）

`entry.mjs` 只负责标准化输入/输出；真正的“做什么”由 handler 决定。

handler 最小约定（建议）：

- 输入：`{ intent, issue, comment, repo, workspace }`
- 输出：`{ summary, artifacts: [{ kind, path, title? }], git: { mode: "none"|"commit"|"pr", branch?, title?, body? } }`

## Security baseline（默认必须做）

- 触发者限制：仅处理 `OWNER/MEMBER/COLLABORATOR`（或 repo owner）。
- 幂等：对 comment 事件写入 `ingested_comment_id: <id>` marker，重复 comment 不重复执行。
- 权限最小化：
  - “只产报告、不改代码”：`contents: write`（写 docs） + `issues: write`（回评）
  - “开 PR 改代码”：还需要 `pull-requests: write`
- Secrets 红线：日志中禁止输出 token；脚本应做简单 redaction。

## AI config（与 myObsidian 兼容的约定）

统一用环境变量，优先让 workflow 从 repo secrets 注入：

- Provider 选择：`AI_PROVIDER=auto|anthropic|openai`
- Anthropic：
  - `ANTHROPIC_BASE_URL`（可空）
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL / ..._SONNET_MODEL / ..._OPUS_MODEL`
- OpenAI-compatible：
  - `OPENAI_BASE_URL`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL_FAST`
  - `OPENAI_MODEL_STRONG`
  - `OPENAI_WIRE_API=auto|chat|responses`（网关兼容）
  - `OPENAI_REASONING_EFFORT`（可选）

## Vercel deploy（可选模块）

### 目标

把 `docs/`（或 `docs/public/`）作为静态站点部署，得到稳定可访问链接（可绑定子域名）。

### Secrets（建议）

- `VERCEL_TOKEN`
- `VERCEL_SCOPE`（team/账号 scope；可空）
- `VERCEL_PROJECT_NAME`
- （可选）`VERCEL_DOMAIN`（如 `diary.zondev.top`；用于 actions 里自动绑定）

### 策略

- 默认部署 `docs/`，入口页是 `docs/report.html`
- 若用户要“看板聚合”，建议每个 repo 输出到 `docs/best-minds-board/`，并由“中央看板仓库”统一部署（见下）。

## Aggregation into a central board（可选模块）

目标：多个 repo 的 report 都能出现在 `zondev.top` 的一个 board/tab 下。

推荐做法：

1) 每个 repo 都把内容写到自己 repo 内的 `docs/best-minds-board/`（只需要 commit 到仓库）。
2) 新建一个“中央看板仓库”（或复用现有），Actions 定时跑：
   - checkout 多个 source repos 到 `_sources/<repo>/`
   - 读取每个 repo 的 `_sources/<repo>/.best-minds-board.json`
   - 运行聚合脚本把 `topics/**` 复制进中央 `docs/best-minds-board/`
   - 部署中央看板到 Vercel（绑定 `zondev.top` / `board.zondev.top`）

本仓库已有聚合脚本参考：`tools/zondev-board/update-board.mjs`（适合中央仓库使用）。

## Templates (copy-as-is, then customize)

这些模板用于“落地骨架”，真正的业务逻辑由 handler 实现：

- `codex_skill_patch/repo-chatops-vercel-board/assets/workflows/chatops.yml`
- `codex_skill_patch/repo-chatops-vercel-board/assets/issue-templates/chatops.yml`
- `codex_skill_patch/repo-chatops-vercel-board/assets/scripts/entry.mjs`

## Workflow（执行顺序）

1) 询问用户：目标 repo？只产报告还是允许改代码？改代码走 PR 还是直推？
2) Scaffold 上述文件（先用模板）。
3) 按 repo 诉求，新增/改写 `scripts/chatops/handlers/*`。
4) 指导用户配置 repo secrets（AI + Vercel）。
5) 用一个最小 Issue 验证闭环（产出 `docs/report.html` + Vercel 链接）。

