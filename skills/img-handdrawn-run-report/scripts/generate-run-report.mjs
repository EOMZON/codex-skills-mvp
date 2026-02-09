#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = {
    title: "",
    titleEn: "",
    subtitle: "",
    heroLabel: "Run Record",
    headerLeft: "",
    headerRight: "Run Report",
    date: "",
    meta: "",
    prompt: "",
    promptFile: "",
    images: [],
    out: "",
    repro: [],
    embedImages: true,
    maxEmbedMb: 6,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--title") args.title = next, (i += 1);
    else if (a === "--title-en") args.titleEn = next, (i += 1);
    else if (a === "--subtitle") args.subtitle = next, (i += 1);
    else if (a === "--hero-label") args.heroLabel = next, (i += 1);
    else if (a === "--header-left") args.headerLeft = next, (i += 1);
    else if (a === "--header-right") args.headerRight = next, (i += 1);
    else if (a === "--date") args.date = next, (i += 1);
    else if (a === "--meta") args.meta = next, (i += 1);
    else if (a === "--prompt") args.prompt = next, (i += 1);
    else if (a === "--prompt-file") args.promptFile = next, (i += 1);
    else if (a === "--image") args.images.push(next), (i += 1);
    else if (a === "--images") args.images.push(...String(next || "").split(",").map((s) => s.trim()).filter(Boolean)), (i += 1);
    else if (a === "--out") args.out = next, (i += 1);
    else if (a === "--repro") args.repro.push(next), (i += 1);
    else if (a === "--embed-images") args.embedImages = true;
    else if (a === "--no-embed-images") args.embedImages = false;
    else if (a === "--max-embed-mb") args.maxEmbedMb = Number(next || 0), (i += 1);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  return [
    "zon-run-report: generate a clean HTML run report (Zon Minimal Editorial · Light)",
    "",
    "Usage:",
    "  node generate-run-report.mjs --meta path/to/run.json --image path/to/out.png",
    "  node generate-run-report.mjs --meta path/to/run.json --images a.png,b.png",
    "",
    "Options:",
    "  --meta <path>            JSON meta file (recommended)",
    "  --prompt <text>          Override prompt text (optional)",
    "  --prompt-file <path>     Load prompt text from file (optional)",
    "  --image <path>           Add an output image (repeatable)",
    "  --images <csv>           Add multiple images (comma-separated)",
    "  --out <path>             Output HTML path (default: docs/reports/report-YYYYMMDD-HHMMSS.html)",
    "  --title <text>           Main title (CN)",
    "  --title-en <text>        Secondary title (EN)",
    "  --subtitle <text>        Subtitle line (below meta)",
    "  --date <YYYY-MM-DD>      Date display (default: today)",
    "  --repro <cmd>            Repro command (repeatable)",
    "  --embed-images           Embed images as data URIs (default)",
    "  --no-embed-images        Use relative file paths instead of embedding",
    "  --max-embed-mb <n>        Max MB per embedded image (default: 6)",
  ].join("\n");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowId(d = new Date()) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function todayYmd(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function basenameNoExt(p) {
  const ext = path.extname(p);
  return path.basename(p, ext);
}

function detectMime(p) {
  const ext = path.extname(String(p || "")).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function shortUrlLabel(u) {
  try {
    const url = new URL(String(u || ""));
    return `${url.host}/…`;
  } catch {
    const s = String(u || "").trim();
    if (!s) return "";
    if (s.length <= 48) return s;
    return `${s.slice(0, 42)}…`;
  }
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p) {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

async function readText(p) {
  return await fs.readFile(p, "utf8");
}

async function imageSrc({ imageAbs, embedImages, maxEmbedBytes, htmlAbs }) {
  if (!embedImages) {
    const rel = path.relative(path.dirname(htmlAbs), imageAbs).split(path.sep).join("/");
    return escapeHtml(rel);
  }

  const stat = await fs.stat(imageAbs).catch(() => null);
  if (!stat || !stat.isFile()) throw new Error(`Image not found: ${imageAbs}`);

  if (maxEmbedBytes > 0 && stat.size > maxEmbedBytes) {
    const rel = path.relative(path.dirname(htmlAbs), imageAbs).split(path.sep).join("/");
    return escapeHtml(rel);
  }

  const buf = await fs.readFile(imageAbs);
  const mime = detectMime(imageAbs);
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

function kvRow(k, v) {
  return `<div>${escapeHtml(k)}</div><div class="mono">${escapeHtml(v ?? "")}</div>`;
}

function section(title, innerHtml) {
  return `<section class="section"><div class="section-title">${escapeHtml(title)}</div>${innerHtml}</section>`;
}

function wrapP(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return `<p class="p">${escapeHtml(t)}</p>`;
}

function wrapNote(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return `<div class="note">${escapeHtml(t)}</div>`;
}

function codeBlock(text) {
  return `<pre><code>${escapeHtml(text || "")}</code></pre>`;
}

function heroH1Html({ title, titleEn }) {
  const safeTitle = escapeHtml(title || "");
  const safeTitleEn = escapeHtml(titleEn || "");
  if (safeTitle && safeTitleEn) return `<strong>${safeTitle}</strong><br />${safeTitleEn}`;
  if (safeTitle) return `<strong>${safeTitle}</strong>`;
  if (safeTitleEn) return `<strong>${safeTitleEn}</strong>`;
  return `<strong>Run Report</strong>`;
}

function normalizeReproCommands(cmds) {
  const out = [];
  for (const c of cmds || []) {
    const s = String(c || "").trim();
    if (!s) continue;
    out.push(s);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(help() + "\n");
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const skillRootAbs = path.resolve(__dirname, "..");
  const templateAbs = path.join(skillRootAbs, "assets", "zon-run-report.template.html");

  const cwd = process.cwd();
  const outAbs = args.out
    ? path.resolve(cwd, args.out)
    : path.resolve(cwd, "docs", "reports", `report-${nowId()}.html`);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });

  const metaAbs = args.meta ? path.resolve(cwd, args.meta) : "";
  const meta = metaAbs ? await readJson(metaAbs) : null;

  const promptOverride =
    args.promptFile ? String(await readText(path.resolve(cwd, args.promptFile))) : args.prompt;

  const images = [...args.images];
  if (!images.length && metaAbs) {
    const maybePng = path.join(path.dirname(metaAbs), `${basenameNoExt(metaAbs)}.png`);
    const maybeJpg = path.join(path.dirname(metaAbs), `${basenameNoExt(metaAbs)}.jpg`);
    const maybeJpeg = path.join(path.dirname(metaAbs), `${basenameNoExt(metaAbs)}.jpeg`);
    if (await exists(maybePng)) images.push(path.relative(cwd, maybePng));
    else if (await exists(maybeJpg)) images.push(path.relative(cwd, maybeJpg));
    else if (await exists(maybeJpeg)) images.push(path.relative(cwd, maybeJpeg));
  }

  const title = args.title || (meta?.title ?? "") || "Run Report";
  const titleEn = args.titleEn || (meta?.titleEn ?? "") || "";
  const date = args.date || todayYmd();
  const subtitle = args.subtitle || (meta?.subtitle ?? "") || "";

  const headerLeft = args.headerLeft || `${path.basename(cwd)} / zon-run-report`;
  const headerRight = args.headerRight || "Run Report";

  const apiUrl = meta?.api?.drawUrl || meta?.api?.url || meta?.drawUrl || "";
  const model = meta?.model || meta?.imageModel || "";
  const aspect = meta?.aspectRatio || meta?.aspect || "";
  const size = meta?.imageSize || meta?.size || "";
  const createdAt = meta?.createdAt || meta?.generatedAt || "";
  const resultUrl = meta?.resultUrl || (meta?.results?.[0]?.url ?? "") || "";
  const prompt = promptOverride || meta?.prompt || "";
  const attempts = Array.isArray(meta?.attempts) ? meta.attempts : [];

  const traits = [model, aspect, size]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((t) => `<span class="trait">${escapeHtml(t)}</span>`)
    .join("");

  const aboutLeft = [
    "<h3>Outcome</h3>",
    `<p>结论：<span class="highlight">${escapeHtml(model ? `Success with model=${model}` : "Run completed")}</span>${
      attempts.length ? `（包含 ${attempts.length} 次失败尝试后回退）` : ""
    }。</p>`,
    metaAbs ? `<div class="note">Meta：<span class="mono">${escapeHtml(path.relative(cwd, metaAbs))}</span></div>` : "",
  ].join("");

  const aboutRight = [
    "<h3>Run Context</h3>",
    `<div class="traits">${traits || `<span class="trait">run</span>`}</div>`,
    `<p style="margin-top: 14px; font-size: 13px; color: var(--gray-600)">` +
      `${apiUrl ? `API：<span class="mono">${escapeHtml(apiUrl)}</span><br />` : ""}` +
      `输出：<span class="mono">${escapeHtml(path.relative(cwd, outAbs))}</span>` +
      `</p>`,
  ].join("");

  const maxEmbedBytes = Math.max(0, Number(args.maxEmbedMb || 0)) * 1024 * 1024;
  const imageBlocks = [];
  for (const rel of images) {
    const imageAbs = path.resolve(cwd, rel);
    const src = await imageSrc({ imageAbs, embedImages: args.embedImages, maxEmbedBytes, htmlAbs: outAbs });
    const captionLines = [
      `本地路径：<span class="mono">${escapeHtml(rel)}</span>`,
      resultUrl ? `远程结果 URL：<a href="${escapeHtml(resultUrl)}">${escapeHtml(shortUrlLabel(resultUrl))}</a>` : "",
    ].filter(Boolean);
    imageBlocks.push(
      `<img class="shot" src="${src}" alt="${escapeHtml(path.basename(rel))}" />` +
        (captionLines.length ? `<p class="caption">${captionLines.join("<br />")}</p>` : "")
    );
  }

  const outputHtml = section(
    "Output",
    wrapP("生成结果（如图未显示：请改用 --no-embed-images 或检查图片路径）。") + (imageBlocks.join("") || wrapNote("未提供图片。可用 --image/--images 指定。"))
  );

  const promptHtml = section(
    "Prompt",
    wrapP("本次用于生成/验证的 prompt（原样记录）：") +
      (prompt ? codeBlock(prompt) : wrapNote("未在 meta 中找到 prompt。可用 --prompt 或在 meta.json 里补 prompt 字段。"))
  );

  const paramsRows = [
    apiUrl ? kvRow("API", apiUrl) : "",
    model ? kvRow("Model", model) : "",
    aspect ? kvRow("Aspect Ratio", aspect) : "",
    size ? kvRow("Image Size", size) : "",
    createdAt ? kvRow("Created At", createdAt) : "",
    metaAbs ? kvRow("Meta JSON", path.relative(cwd, metaAbs)) : "",
  ]
    .filter(Boolean)
    .join("");
  const paramsHtml = section("Parameters", `<div class="kv">${paramsRows || kvRow("Note", "No parameters found")}</div>`);

  const attemptsHtml =
    attempts.length === 0
      ? ""
      : section(
          "Fallback / Attempts",
          wrapP("失败尝试记录（便于判断模型是否不可用/接口是否变更）：") +
            codeBlock(JSON.stringify(attempts, null, 2))
        );

  const reproCmds = normalizeReproCommands(args.repro);
  const reproDefault = meta?.repro?.commands || meta?.reproCommands || [];
  const reproAll = normalizeReproCommands([...reproCmds, ...(Array.isArray(reproDefault) ? reproDefault : [])]);
  const reproHtml = section(
    "Reproduce",
    wrapP("复跑建议（根据你的项目替换/补充）：") +
      codeBlock(
        reproAll.length
          ? reproAll.join("\n")
          : [
              "# 例：优先跑 nanofast，失败再试 sora-image",
              "node tools/shot/image-model-smoke-test.mjs",
              "",
              "# 只测 sora-image",
              "node tools/shot/image-model-smoke-test.mjs --models sora-image",
            ].join("\n")
      )
  );

  const rawMetaHtml =
    metaAbs && meta
      ? section("Raw Meta", wrapP("完整 meta（便于审计/复现）：") + codeBlock(JSON.stringify(meta, null, 2)))
      : "";

  const mainHtml = [outputHtml, promptHtml, paramsHtml, attemptsHtml, reproHtml, rawMetaHtml].filter(Boolean).join("");

  const heroSubParts = [
    escapeHtml(date),
    model ? `model=${escapeHtml(model)}` : "",
    aspect && size ? `${escapeHtml(aspect)} · ${escapeHtml(size)}` : aspect ? escapeHtml(aspect) : size ? escapeHtml(size) : "",
  ].filter(Boolean);
  const heroSubHtml = heroSubParts.map((p, idx) => (idx ? `${p} <span>·</span> ` : "") + p).join("");
  const heroSubFinal = [heroSubHtml, subtitle ? `<span>·</span> ${escapeHtml(subtitle)}` : ""].filter(Boolean).join(" ");

  const footerNote = args.embedImages
    ? "备注：本页默认把图片以内嵌方式写进 HTML（更易搬运）。如需引用本地文件路径，用 --no-embed-images。"
    : "备注：本页使用相对路径引用图片。如需单文件可搬运版本，用 --embed-images。";
  const footerMeta = `Zon Minimal Editorial · Light · Generated ${escapeHtml(new Date().getFullYear())}`;

  const template = await fs.readFile(templateAbs, "utf8");
  const html = template
    .replaceAll("{{PAGE_TITLE}}", escapeHtml(titleEn ? `${title} · ${titleEn}` : title))
    .replaceAll("{{HEADER_LEFT}}", escapeHtml(headerLeft))
    .replaceAll("{{HEADER_RIGHT}}", escapeHtml(headerRight))
    .replaceAll("{{HERO_LABEL}}", escapeHtml(args.heroLabel))
    .replaceAll("{{HERO_H1_HTML}}", heroH1Html({ title, titleEn }))
    .replaceAll("{{HERO_SUB_HTML}}", heroSubFinal || escapeHtml(date))
    .replaceAll("{{ABOUT_LEFT_HTML}}", aboutLeft)
    .replaceAll("{{ABOUT_RIGHT_HTML}}", aboutRight)
    .replaceAll("{{MAIN_HTML}}", mainHtml)
    .replaceAll("{{FOOTER_NOTE}}", escapeHtml(footerNote))
    .replaceAll("{{FOOTER_META}}", escapeHtml(footerMeta));

  await fs.writeFile(outAbs, html, "utf8");
  process.stdout.write(`${path.relative(cwd, outAbs)}\n`);
}

await main();
