#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function safeOneLine(input) {
  return String(input ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readEnvFile(absPath) {
  const p = path.resolve(String(absPath || ""));
  if (!p || !fs.existsSync(p)) return {};
  const out = {};
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const k = m[1];
    let v = String(m[2] ?? "").trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

function readTokenFromFile(p) {
  const abs = path.resolve(String(p || ""));
  if (!abs) return "";
  if (!fs.existsSync(abs)) return "";
  const raw = fs.readFileSync(abs, "utf8");
  return safeOneLine(raw);
}

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...options });
  if (res.error) throw res.error;
  return res;
}

function extractLastUrl(text) {
  const matches = String(text || "").match(/https?:\/\/[^\s]+/g);
  if (!matches || !matches.length) return "";
  return String(matches[matches.length - 1] || "").trim();
}

function main() {
  const selfDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(selfDir, "..");
  const docsDir = path.join(repoRoot, "docs");

  const argv = process.argv.slice(2);
  const args = new Set(argv.filter((a) => a.startsWith("--")));
  const pickArg = (name) => {
    const idx = argv.indexOf(name);
    if (idx < 0) return "";
    return safeOneLine(argv[idx + 1] || "");
  };

  const mode = args.has("--preview") ? "preview" : "prod";
  const explicitEnv = pickArg("--env") || safeOneLine(process.env.VERCEL_ENV_FILE || "");

  const envCandidates = [];
  if (explicitEnv) envCandidates.push(explicitEnv);
  envCandidates.push(path.join(repoRoot, ".env"));
  envCandidates.push(path.join(repoRoot, "..", ".env"));
  envCandidates.push(path.join(repoRoot, "..", "..", ".env"));
  const envFile = envCandidates.find((p) => p && fs.existsSync(p)) || "";
  const envFromFile = envFile ? readEnvFile(envFile) : {};

  const token =
    safeOneLine(process.env.VERCEL_TOKEN || "") ||
    safeOneLine(envFromFile.VERCEL_TOKEN || "") ||
    readTokenFromFile(process.env.VERCEL_TOKEN_FILE || "/tmp/VERCEL_TOKEN.txt");
  if (!token) {
    die(
      [
        "Missing Vercel token.",
        "Set env VERCEL_TOKEN, or put it in a .env file as VERCEL_TOKEN=..., or write it to /tmp/VERCEL_TOKEN.txt (recommended).",
        "Example (macOS): copy token → then run: pbpaste > /tmp/VERCEL_TOKEN.txt",
        envFile ? `Detected env file: ${envFile} (but missing VERCEL_TOKEN)` : "",
      ].join("\n"),
    );
  }

  const scope = safeOneLine(process.env.VERCEL_SCOPE || "") || safeOneLine(envFromFile.VERCEL_SCOPE || "");
  const project =
    safeOneLine(process.env.VERCEL_PROJECT_NAME || "") ||
    safeOneLine(envFromFile.VERCEL_PROJECT_NAME || "") ||
    pickArg("--project") ||
    "codex-skills-mvp-docs";
  const scopeArgs = scope ? [`--scope=${scope}`] : [];

  // 1) Build latest docs/index.html
  {
    const build = run("node", [path.join(repoRoot, "scripts", "build-docs-site.mjs")], { cwd: repoRoot, stdio: "inherit" });
    if (build.status !== 0) die("Failed to build docs site.");
  }

  if (!fs.existsSync(docsDir)) die(`Missing docs dir: ${docsDir}`);

  // 2) Link (prod only; preview deploy does not need linking)
  const vercelDir = path.join(docsDir, ".vercel");
  const linked = fs.existsSync(path.join(vercelDir, "project.json"));
  if (mode === "prod" && !linked) {
    fs.mkdirSync(vercelDir, { recursive: true });
    const link = run(
      "npx",
      ["vercel@latest", "link", "--yes", `--project=${project}`, `--token=${token}`, ...scopeArgs],
      { cwd: docsDir, stdio: "inherit" },
    );
    if (link.status !== 0) die("Vercel link failed.");
  }

  // 3) Deploy
  const prodFlag = mode === "prod" ? ["--prod"] : [];
  const deploy = run(
    "npx",
    ["vercel@latest", "deploy", ...prodFlag, "--yes", `--token=${token}`, ...scopeArgs],
    { cwd: docsDir, stdio: ["ignore", "pipe", "pipe"] },
  );
  const out = [deploy.stdout, deploy.stderr].filter(Boolean).join("\n");
  if (deploy.status !== 0) {
    process.stderr.write(out.slice(0, 8000) + "\n");
    die("Vercel deploy failed.");
  }

  const url = extractLastUrl(out);
  if (url) {
    process.stdout.write(`Deploy URL: ${url}\n`);
    return;
  }
  process.stdout.write(out.trim() + "\n");
}

main();
