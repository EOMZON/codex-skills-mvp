import fs from "node:fs";
import path from "node:path";

const REQUIRED_ENV = ["GITHUB_EVENT_PATH", "GITHUB_REPOSITORY", "GITHUB_TOKEN"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

const GITHUB_USER_AGENT = "repo-chatops (GitHub Actions)";
const MARKER_START = "<!-- CHATOPS_START -->";
const MARKER_END = "<!-- CHATOPS_END -->";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowParts(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return { yyyy, mm, dd, hh, mi, ss };
}

function safeOneLine(input) {
  return String(input ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const ms = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 45000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function redactSecrets(text) {
  let out = String(text ?? "");
  const secrets = [
    process.env.GITHUB_TOKEN,
    process.env.ANTHROPIC_AUTH_TOKEN,
    process.env.OPENAI_API_KEY,
    process.env.VERCEL_TOKEN,
  ].filter(Boolean);
  for (const s of secrets) out = out.split(s).join("***");
  return out;
}

async function gh(method, urlPath, body) {
  const repo = process.env.GITHUB_REPOSITORY;
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${repo}${urlPath}`,
    {
      method,
      headers: {
        "User-Agent": GITHUB_USER_AGENT,
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    20000,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${urlPath} failed: ${res.status} ${res.statusText}\n${String(text || "").slice(0, 800)}`);
  }
  return await res.json();
}

function extractIssueFormSection(body, heading) {
  if (!body) return null;
  const re = new RegExp(`^###\\s+${heading}\\s*$[\\r\\n]+([\\s\\S]*?)(?=\\r?\\n###\\s+|$)`, "im");
  const m = String(body).match(re);
  return m ? String(m[1] ?? "").trim() : null;
}

function isIssueFormCheckboxChecked(sectionText, label) {
  if (!sectionText || !label) return false;
  const re = new RegExp(`^\\s*-\\s*\\[[xX]\\]\\s*${label}\\s*$`, "m");
  return re.test(String(sectionText));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function renderReportHtml({ title, subtitle, bodyHtml }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#fafafa" />
    <title>${escapeHtml(title)}</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%2248%22%20height%3D%2248%22%20rx%3D%2212%22%20fill%3D%22%230a0a0a%22%2F%3E%3Cpath%20d%3D%22M24%2C42%20L40%2C32%20L24%2C22Z%22%20fill%3D%22%23fafafa%22%2F%3E%3C%2Fsvg%3E" />
    <style>
      :root { --black:#0a0a0a; --white:#fafafa; --gray-100:#f5f5f5; --gray-200:#e8e8e8; --gray-600:#666; --measure:860px; }
      *{ box-sizing:border-box; }
      body{ margin:0; background:var(--white); color:var(--black); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif; line-height:1.8; font-size:16px; }
      a{ color:inherit; text-decoration:none; border-bottom:1px solid var(--gray-200); }
      main{ max-width:var(--measure); margin:0 auto; padding:56px 22px; }
      h1{ margin:0 0 6px; font-size:clamp(26px, 3.6vw, 42px); font-weight:320; letter-spacing:1.2px; line-height:1.15; }
      .sub{ margin:0 0 18px; color:var(--gray-600); }
      .card{ border:1px solid var(--gray-200); background:rgba(245,245,245,.65); padding:14px 16px; border-radius:14px; }
      .meta{ margin-top:10px; font-size:12px; color:var(--gray-600); font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace; }
      hr{ border:0; border-top:1px solid var(--gray-200); margin:20px 0; }
      @media print{ a{ border-bottom:none; text-decoration:underline; } }
    </style>
  </head>
  <body>
    <main>
      <p class="meta">ChatOps Report</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(subtitle || "")}</p>
      <div class="card">${bodyHtml || ""}</div>
    </main>
  </body>
</html>`;
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const forceIssueNumberRaw = String(process.env.FORCE_ISSUE_NUMBER || "").trim();
  const eventComment = event && typeof event.comment === "object" ? event.comment : null;
  const isCommentEvent = Boolean(eventComment && typeof eventComment === "object");

  let issue = event.issue;
  if ((!issue || typeof issue !== "object") && forceIssueNumberRaw) {
    const n = Number.parseInt(forceIssueNumberRaw, 10);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid FORCE_ISSUE_NUMBER: ${forceIssueNumberRaw}`);
    issue = await gh("GET", `/issues/${n}`);
  }
  if (!issue) throw new Error("No issue in event payload.");

  const issueNumber = issue.number;
  const issueTitle = safeOneLine(issue.title ?? "");
  const issueUrl = safeOneLine(issue.html_url ?? "");
  const issueBody = String(issue.body ?? "").trim();

  const authorAssociation = safeOneLine(issue?.author_association || "");
  const commentAuthorAssociation = safeOneLine(eventComment?.author_association || "");
  const repoOwner = String(process.env.GITHUB_REPOSITORY || "").split("/")[0] || "";
  const issueUserLogin = safeOneLine(issue?.user?.login || "");
  const commentUserLogin = safeOneLine(eventComment?.user?.login || "");

  const allowedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
  const isAllowedAuthor =
    (authorAssociation && allowedAssociations.has(authorAssociation)) ||
    (repoOwner && issueUserLogin && issueUserLogin.toLowerCase() === repoOwner.toLowerCase());
  const isAllowedCommentAuthor =
    (commentAuthorAssociation && allowedAssociations.has(commentAuthorAssociation)) ||
    (repoOwner && commentUserLogin && commentUserLogin.toLowerCase() === repoOwner.toLowerCase());
  const isAllowedTriggerActor = isCommentEvent ? isAllowedCommentAuthor : isAllowedAuthor;
  if (!isAllowedTriggerActor) return;

  const commentId = isCommentEvent ? eventComment?.id : null;
  const commentBody = isCommentEvent ? String(eventComment?.body || "").trim() : "";

  // Idempotency for comments: if we already posted marker, skip
  if (isCommentEvent && commentId) {
    const marker = `ingested_comment_id: \`${commentId}\``;
    const comments = await gh("GET", `/issues/${issueNumber}/comments`).catch(() => []);
    const already = Array.isArray(comments) ? comments.some((c) => String(c?.body || "").includes(marker)) : false;
    if (already) return;
  }

  const intentFromForm = extractIssueFormSection(issueBody, "Intent");
  const optionsFromForm = extractIssueFormSection(issueBody, "Options");
  const textFromForm = extractIssueFormSection(issueBody, "Text");

  const raw = safeOneLine(textFromForm || commentBody || issueBody || issueTitle);
  const intent = safeOneLine(intentFromForm || "").toLowerCase() || "research";
  const prOnly = isIssueFormCheckboxChecked(optionsFromForm, "PR only (do not push to main)");
  const skipAi = isIssueFormCheckboxChecked(optionsFromForm, "Skip AI (run handler with raw text only)");

  const { yyyy, mm, dd, hh, mi, ss } = nowParts();
  const stamp = `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;

  ensureDir(path.join("docs", "reports"));
  const reportRel = path.join("docs", "reports", `report-${stamp}.html`);

  const bodyHtml = [
    `<p><strong>Intent</strong>: ${escapeHtml(intent)}</p>`,
    `<p><strong>Input</strong>: ${escapeHtml(raw)}</p>`,
    `<hr />`,
    `<p class="meta">This is a scaffolded fallback report. Replace with your repo handler logic.</p>`,
  ].join("");

  fs.writeFileSync(reportRel, renderReportHtml({ title: issueTitle || `AI: #${issueNumber}`, subtitle: issueUrl, bodyHtml }), "utf8");
  fs.writeFileSync(
    path.join("docs", "report.html"),
    renderReportHtml({
      title: "Reports Index",
      subtitle: `Latest: ${stamp}`,
      bodyHtml: `<p><a href="reports/${escapeHtml(path.basename(reportRel))}">Open latest report</a></p>`,
    }),
    "utf8",
  );

  const markerLine = isCommentEvent && commentId ? `\n\n- ingested_comment_id: \`${commentId}\`` : "";
  const prHint = prOnly ? "\n\n- mode: PR-only (handler must implement PR creation)" : "";
  const aiHint = skipAi ? "\n\n- ai: skipped" : "";

  await gh("POST", `/issues/${issueNumber}/comments`, {
    body: `Done.\n\n- report: \`${reportRel}\`${markerLine}${prHint}${aiHint}\n- tip: deploy \`docs/\` to Vercel for a shareable link`,
  });
}

try {
  await main();
} catch (e) {
  const msg = redactSecrets(e?.message || String(e));
  // best effort: do not throw secrets into logs
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

