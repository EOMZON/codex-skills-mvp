# Codex Skills MVP (GitHub Actions)

把你本机的 `~/.codex/skills` 里的 **skills（指令包）** 版本化到一个 GitHub 仓库里，并在 **其他仓库的 GitHub Actions** 里一键安装到 runner（默认 `~/.codex/skills`），从而让“系统 skills”能在 CI 中复用。

## Status

- Published: `EOMZON/codex-skills-mvp@v0`

## 你会得到什么

- 一个可被其他仓库 `uses:` 的 GitHub Action（本仓库根目录 `action.yml`）
- 一个 `skills/` 目录（**只同步“不依赖本机隐私信息/绝对路径”的 skills**，用于跨仓库复用）
- 一个自测 workflow（推上 GitHub 后可直接跑）

## 已同步的 skills（public-safe pack）

当前仓库包含这些 skills（均不包含本机绝对路径如 `/Users/...`，可直接公开在 repo 中）：

- `best-minds`
- `best-minds-minimalist`
- `doc-coauthoring`
- `frontend-design`
- `theme-factory`
- `repo-chatops-vercel-board`
- `vercel-deploy`
- `mcp-builder`
- `pdf`
- `xlsx`
- `web-artifacts-builder`
- `webapp-testing`
- `game-vn-immersive`
- `wechat-article-creation`
- `wechat-svg`
- `algorithmic-art`
- `image-upscale-best`
- `img-handdrawn-run-report`
- `img-vn-pack`
- `style-run-sop`
- `skill-creator`

> 没同步的（例如 `chatops-main-push/github-ops/vercel-ship/...`）通常包含本机绝对路径或强绑定你个人环境的说明；如确实要同步，建议先做“公开版脱敏”再放进来。

## Docs 网站（Zon Minimal Editorial · Light）

本仓库自带一个单页 docs 站点（支持搜索 / 目录 / 代码块复制 / 移动端菜单 / 可打印）：

- 生成：`node scripts/build-docs-site.mjs`（输出到 `docs/index.html`）
- 本地打开：直接打开 `docs/index.html`
- Vercel CLI 部署（以 `docs/` 作为静态站）：
  - `cd docs`
  - `npx vercel@latest link --yes --project <YOUR_PROJECT> --token=$VERCEL_TOKEN`
  - `npx vercel@latest deploy --prod --yes --token=$VERCEL_TOKEN`

## 本机同步（不改变你的本地使用）

把你本机的某些 skills 复制进本仓库的 `skills/`：

```bash
cd tools/codex-skills-mvp
./scripts/sync-from-local.sh best-minds best-minds-minimalist doc-coauthoring
```

> 只读复制：不会修改 `~/.codex/skills`。

## 在其他仓库里使用

在目标仓库的 workflow 里加一步：

```yaml
- name: Install Codex skills
  uses: <OWNER>/<REPO>@<REF>
```

默认安装到 runner 的 `~/.codex/skills`（与本机一致）。如果你更想隔离到 workspace：

```yaml
- name: Install Codex skills (isolated)
  uses: <OWNER>/<REPO>@<REF>
  with:
    dest: ${{ github.workspace }}/.codex/skills
```

## 本地验证（不写入 ~/.codex）

```bash
cd tools/codex-skills-mvp
./scripts/install-local.sh /tmp/codex-skills-mvp/.codex/skills
test -f /tmp/codex-skills-mvp/.codex/skills/best-minds/SKILL.md
```

## 发布到 GitHub（MVP）

```bash
cd tools/codex-skills-mvp
git add -A
git commit -m "chore: sync public-safe skills"
```

创建远端 repo（两种方式二选一）：

- GitHub 网页 UI 手动创建 repo，然后：
  - `git remote add origin git@github.com:<OWNER>/<REPO>.git`
- 或用 `gh`：
  - `gh repo create <OWNER>/<REPO> --public --source . --remote origin --push`

最后 push：

```bash
git push -u origin main
```
