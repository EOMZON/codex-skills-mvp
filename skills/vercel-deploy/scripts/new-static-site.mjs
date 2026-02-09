#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--out") out.out = args[i + 1];
    else if (a.startsWith("--out=")) out.out = a.slice("--out=".length);
    else if (a === "--title") out.title = args[i + 1];
    else if (a.startsWith("--title=")) out.title = a.slice("--title=".length);
    else if (a === "--subtitle") out.subtitle = args[i + 1];
    else if (a.startsWith("--subtitle=")) out.subtitle = a.slice("--subtitle=".length);
    else if (a === "--force" || a === "-f") out.force = true;
  }
  return out;
}

function help() {
  return [
    "new-static-site (Vercel-ready, minimal B/W)",
    "",
    "Usage:",
    "  node new-static-site.mjs --out ./my-site --title \"My Site\" --subtitle \"Minimal · Black/White\"",
    "",
    "Options:",
    "  --out <dir>         Output directory (required)",
    "  --title <text>      Page title",
    "  --subtitle <text>   Subtitle line",
    "  --force             Overwrite if exists",
  ].join("\n");
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function template({ title, subtitle }) {
  const t = escapeHtml(title || "My Site");
  const sub = escapeHtml(subtitle || "Minimal · Black/White · Vercel");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="description" content="${t} · ${sub}" />
    <title>${t}</title>
    <script defer src="/_vercel/insights/script.js"></script>
    <style>
      :root { --bg:#fff; --fg:#0a0a0a; --muted:#666; --line:#e8e8e8; --radius:16px;
        --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
      }
      *{box-sizing:border-box}
      body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);line-height:1.8;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
      a{color:inherit;text-decoration:none;border-bottom:1px solid var(--line)}
      a:hover{border-bottom-color:var(--fg)}
      .wrap{max-width:920px;margin:0 auto;padding:84px 24px 80px}
      .kicker{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted)}
      h1{font-size:clamp(34px,6vw,56px);font-weight:320;letter-spacing:2px;line-height:1.14;margin:18px 0 14px}
      h1 strong{font-weight:780}
      .sub{color:var(--muted);font-size:13px;letter-spacing:1px}
      .card{margin-top:34px;border:1px solid var(--line);border-radius:var(--radius);padding:22px;background:#fafafa}
      .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .btn{appearance:none;border:1px solid var(--fg);background:#fff;color:var(--fg);padding:9px 12px;border-radius:999px;font-size:12px;cursor:pointer}
      .btn:hover{background:var(--fg);color:var(--bg)}
      .mono{font-family:var(--mono);font-size:12px;color:var(--muted)}
      @media print{.btn{display:none} body{font-size:12pt} .wrap{padding:24px}}
    </style>
  </head>
  <body>
    <main class="wrap">
      <div class="kicker">Minimal Site · Vercel Ready</div>
      <h1><strong>${t}</strong><br />${sub}</h1>
      <div class="sub">Single-file HTML · Analytics · Printable</div>

      <section class="card">
        <div class="row">
          <a class="btn" href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a>
          <button class="btn" type="button" onclick="window.print()">Print / PDF</button>
        </div>
        <p style="margin:14px 0 0;color:var(--muted);font-size:14px">
          这是一个最小可发布静态站点。下一步：在本目录执行 <span class="mono">vercel</span> 或 <span class="mono">vercel --prod</span>。
        </p>
      </section>

      <p class="mono" style="margin-top:18px">
        Web Analytics snippet: <span class="mono">&lt;script defer src="/_vercel/insights/script.js"&gt;&lt;/script&gt;</span>
      </p>
    </main>
  </body>
</html>
`;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.out) {
    process.stdout.write(help() + "\n");
    if (!args.out) process.exitCode = 2;
    return;
  }

  const outAbs = path.resolve(process.cwd(), args.out);
  if (await exists(outAbs)) {
    if (!args.force) {
      process.stderr.write(`Refusing to overwrite existing directory: ${outAbs}\nUse --force to overwrite.\n`);
      process.exitCode = 1;
      return;
    }
  }

  await fs.mkdir(outAbs, { recursive: true });

  await fs.writeFile(path.join(outAbs, "index.html"), template({ title: args.title, subtitle: args.subtitle }), "utf8");
  await fs.writeFile(path.join(outAbs, "vercel.json"), JSON.stringify({ trailingSlash: true }, null, 2) + "\n", "utf8");
  await fs.writeFile(
    path.join(outAbs, ".gitignore"),
    [".DS_Store", ".vercel", "node_modules", "dist", ""].join("\n"),
    "utf8"
  );

  process.stdout.write(`Created static site: ${outAbs}\nNext:\n  cd ${outAbs}\n  vercel\n  vercel --prod\n`);
}

await main();

