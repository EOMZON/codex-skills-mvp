# Codex Skills MVP (GitHub Actions)

把你本机的 `~/.codex/skills` 里的 **skills（指令包）** 版本化到一个 GitHub 仓库里，并在 **其他仓库的 GitHub Actions** 里一键安装到 runner（默认 `~/.codex/skills`），从而让“系统 skills”能在 CI 中复用。

## Status

- Published: `EOMZON/codex-skills-mvp@v0`

## 你会得到什么

- 一个可被其他仓库 `uses:` 的 GitHub Action（本仓库根目录 `action.yml`）
- 一个 `skills/` 目录（MVP 先放 `best-minds`，后续可同步更多）
- 一个自测 workflow（推上 GitHub 后可直接跑）

## 本机同步（不改变你的本地使用）

把你本机的某些 skills 复制进本仓库的 `skills/`：

```bash
cd tools/codex-skills-mvp
./scripts/sync-from-local.sh best-minds
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
git init
git add -A
git commit -m "init: codex skills mvp"
git branch -M main
```

创建远端 repo（两种方式二选一）：

- GitHub 网页 UI 手动创建 repo，然后：
  - `git remote add origin git@github.com:<OWNER>/<REPO>.git`
- 或用脚本（需要 token）：
  - `python3 /Users/zon/.codex/skills/github-repo-bootstrap/scripts/create_repo.py --owner <OWNER> --name <REPO> --private --env-file /Users/zon/Desktop/MINE/.env`

最后 push：

```bash
git push -u origin main
```
