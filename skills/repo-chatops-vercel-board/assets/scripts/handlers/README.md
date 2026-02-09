# ChatOps handlers (repo-specific)

`scripts/chatops/entry.mjs` 负责：

- 从 GitHub 事件里抽取输入（issue/comment）
- 做权限门禁与幂等
- 生成/更新 report 索引
- 回评 issue

真正的“做什么”（调研、生成文档、改代码、跑脚本、开 PR…）放在 handlers 里。

## Recommended contract

创建 `scripts/chatops/handlers/index.mjs`，导出：

```js
export async function handleChatOps({ intent, raw, issue, comment, env }) {
  return {
    summary: "一句话结果",
    report: {
      title: "Report title",
      subtitle: "optional",
      blocksHtml: "<section ...>...</section>",
    },
    git: { mode: "none" }, // or: { mode:"commit" } / { mode:"pr", branch, title, body }
  };
}
```

## Handler patterns

- `research`：只产出 HTML（写 `docs/reports/`），不改业务代码。
- `operate`：默认开 PR（branch + commits + PR），不要直接 push main。

## Security checklist

- 永远不要把 secrets 写到 report/issue comment。
- 如果需要执行 shell 命令：仅允许白名单命令，并且固定在 repo 内部路径。

