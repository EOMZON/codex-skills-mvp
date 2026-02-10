#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function parseFrontMatter(md) {
  const text = String(md ?? "");
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return { frontMatter: {}, body: text };
  const fmRaw = String(m[1] ?? "");
  const body = text.slice(m[0].length);

  const fm = {};
  for (const line of fmRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const kv = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2] ?? "";
    value = String(value).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }

  return { frontMatter: fm, body };
}

function safeJsonForHtml(obj) {
  // Avoid `</script>` and other HTML parsing hazards.
  return JSON.stringify(obj)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function categoryForSlug(slug) {
  const map = {
    "best-minds": "research",
    "best-minds-minimalist": "research",
    "doc-coauthoring": "docs",
    "frontend-design": "design",
    "theme-factory": "design",
    "algorithmic-art": "design",
    "web-artifacts-builder": "design",
    "webapp-testing": "design",
    "game-vn-immersive": "design",
    "wechat-svg": "design",
    "image-upscale-best": "media",
    "img-handdrawn-run-report": "media",
    "img-vn-pack": "media",
    "style-run-sop": "media",
    "wechat-article-creation": "media",
    "vercel-deploy": "deploy",
    "repo-chatops-vercel-board": "deploy",
    "pdf": "data",
    "xlsx": "data",
    "mcp-builder": "dev",
    "skill-creator": "dev",
  };
  return map[String(slug || "")] || "misc";
}

function labelForCategory(cat) {
  const map = {
    research: "Research",
    deploy: "Deploy",
    design: "Design",
    media: "Media",
    data: "Data",
    dev: "Dev",
    docs: "Docs",
    misc: "Misc",
  };
  return map[String(cat || "")] || "Misc";
}

function renderHtml({ skills, generatedAt }) {
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="12" fill="#0a0a0a"/><path d="M23 20h18v4H23zm0 10h18v4H23zm0 10h12v4H23z" fill="#fafafa"/></svg>`;
  const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  const data = {
    generatedAt,
    categories: [
      { id: "research", label: labelForCategory("research") },
      { id: "deploy", label: labelForCategory("deploy") },
      { id: "design", label: labelForCategory("design") },
      { id: "media", label: labelForCategory("media") },
      { id: "data", label: labelForCategory("data") },
      { id: "dev", label: labelForCategory("dev") },
      { id: "docs", label: labelForCategory("docs") },
      { id: "misc", label: labelForCategory("misc") },
    ],
    skills,
  };
  const dataJson = safeJsonForHtml(data);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#fafafa" />
    <link rel="icon" type="image/svg+xml" href="${faviconHref}" />
    <title>Codex Skills · Docs</title>
    <style>
      *{ margin:0; padding:0; box-sizing:border-box; }
      :root{
        --black:#0a0a0a;
        --white:#fafafa;
        --gray-100:#f5f5f5;
        --gray-200:#e8e8e8;
        --gray-400:#999;
        --gray-600:#666;
        --gray-800:#333;
        --measure:1220px;
        --radius:14px;
        --shadow: 0 18px 60px rgba(0,0,0,.06);
        --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }

      html{ scroll-behavior:smooth; }
      body{
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;
        background:var(--white);
        color:var(--black);
        line-height:1.8;
        font-size:16px;
        -webkit-font-smoothing:antialiased;
        text-rendering:optimizeLegibility;
      }
      ::selection{ background:var(--black); color:var(--white); }
      a{ color:inherit; text-decoration:none; }
      button, input{ font:inherit; }

      .header{
        position:sticky;
        top:0;
        z-index:50;
        background:rgba(250,250,250,.92);
        backdrop-filter: blur(12px);
        border-bottom:1px solid var(--gray-200);
      }
      .header-inner{
        max-width:var(--measure);
        margin:0 auto;
        padding:18px 18px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
      }
      .logo{
        display:flex;
        align-items:baseline;
        gap:10px;
        min-width:0;
      }
      .logo .mark{
        font-size:11px;
        letter-spacing:4px;
        text-transform:uppercase;
        font-weight:700;
        color:var(--gray-600);
        white-space:nowrap;
      }
      .logo .sub{
        font-size:11px;
        letter-spacing:3px;
        text-transform:uppercase;
        color:var(--gray-400);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .header-actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
      .btn{
        appearance:none;
        border:1px solid var(--gray-200);
        background:transparent;
        color:inherit;
        padding:7px 10px;
        font-size:10px;
        letter-spacing:2px;
        text-transform:uppercase;
        cursor:pointer;
        border-radius:0;
      }
      .btn:hover{ border-color:var(--black); }
      .btn.primary{ background:var(--black); color:var(--white); border-color:var(--black); }
      .btn.primary:hover{ opacity:.92; }
      .btn.small{ padding:6px 8px; font-size:10px; letter-spacing:2px; }

      .searchbar{
        max-width:var(--measure);
        margin:0 auto;
        padding:0 18px 16px;
        display:flex;
        gap:10px;
        align-items:center;
      }
      .search{
        flex:1;
        display:flex;
        align-items:center;
        border:1px solid var(--gray-200);
        background:rgba(245,245,245,.6);
        padding:9px 10px;
        gap:10px;
      }
      .search .hint{
        font-family:var(--mono);
        font-size:11px;
        color:var(--gray-600);
        opacity:.9;
      }
      .search input{
        border:0;
        outline:none;
        background:transparent;
        width:100%;
        color:inherit;
        font-size:14px;
      }
      .pillrow{
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        justify-content:flex-end;
      }
      .pill{
        border:1px solid var(--gray-200);
        background:transparent;
        color:var(--gray-600);
        padding:6px 10px;
        font-size:10px;
        letter-spacing:2px;
        text-transform:uppercase;
        cursor:pointer;
      }
      .pill[aria-pressed="true"]{
        background:var(--black);
        color:var(--white);
        border-color:var(--black);
      }

      .scrim{
        position:fixed;
        inset:0;
        background:rgba(10,10,10,.42);
        z-index:40;
        opacity:0;
        pointer-events:none;
        transition:opacity .18s ease;
      }
      body.nav-open .scrim{ opacity:1; pointer-events:auto; }

      .layout{
        max-width:var(--measure);
        margin:0 auto;
        padding:18px 18px 80px;
        display:grid;
        grid-template-columns: 320px minmax(0, 1fr) 260px;
        gap:18px;
      }

      .sidebar{
        border:1px solid var(--gray-200);
        background:rgba(250,250,250,.92);
        align-self:start;
        position:sticky;
        top:124px;
        max-height: calc(100vh - 150px);
        overflow:auto;
      }
      .sidebar-head{
        padding:14px 14px 10px;
        border-bottom:1px solid var(--gray-200);
        display:flex;
        align-items:baseline;
        justify-content:space-between;
        gap:12px;
      }
      .sidebar-head .k{
        font-size:10px;
        letter-spacing:3px;
        text-transform:uppercase;
        color:var(--gray-400);
        font-weight:700;
      }
      .sidebar-head .v{
        font-family:var(--mono);
        font-size:11px;
        color:var(--gray-600);
        white-space:nowrap;
      }
      .skill-list{ list-style:none; }
      .skill-item{
        border-bottom:1px solid var(--gray-200);
      }
      .skill-btn{
        width:100%;
        text-align:left;
        padding:12px 14px;
        border:0;
        background:transparent;
        cursor:pointer;
      }
      .skill-btn:hover{ background:rgba(245,245,245,.75); }
      .skill-btn[aria-current="true"]{ background:rgba(10,10,10,.06); }
      .skill-name{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        font-size:13px;
        letter-spacing:.2px;
        color:var(--black);
      }
      .skill-meta{
        margin-top:4px;
        display:flex;
        gap:10px;
        align-items:center;
        justify-content:space-between;
      }
      .skill-desc{
        font-size:12px;
        color:var(--gray-600);
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .skill-tag{
        font-family:var(--mono);
        font-size:10px;
        color:var(--gray-400);
        text-transform:uppercase;
        letter-spacing:1.5px;
        white-space:nowrap;
      }

      .content{
        border:1px solid var(--gray-200);
        background:rgba(250,250,250,.92);
        box-shadow: var(--shadow);
        padding:22px 22px 26px;
        min-height: 60vh;
      }
      .kicker{
        font-size:10px;
        letter-spacing:4px;
        text-transform:uppercase;
        color:var(--gray-400);
        font-weight:700;
      }
      h1{
        margin-top:10px;
        font-size: clamp(26px, 3.2vw, 44px);
        font-weight:300;
        letter-spacing:1.4px;
        line-height:1.15;
      }
      .subtitle{
        margin-top:10px;
        color:var(--gray-600);
        font-size:14px;
        line-height:1.8;
      }
      .content-actions{
        margin-top:14px;
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }

      .doc{
        margin-top:18px;
        padding-top:18px;
        border-top:1px solid var(--gray-200);
      }
      .doc :is(h1,h2,h3,h4){ scroll-margin-top: 120px; }
      .doc h2{
        margin-top:28px;
        padding-top:16px;
        border-top:1px solid var(--gray-200);
        font-size:16px;
        letter-spacing: .6px;
        font-weight:650;
      }
      .doc h3{
        margin-top:18px;
        font-size:14px;
        font-weight:650;
        color:var(--gray-800);
      }
      .doc p{ margin-top:12px; color:var(--gray-800); }
      .doc ul, .doc ol{ margin-top:10px; padding-left: 22px; color:var(--gray-800); }
      .doc li{ margin-top:6px; }
      .doc a{ border-bottom:1px solid var(--gray-200); }
      .doc a:hover{ border-bottom-color: var(--black); }
      .doc blockquote{
        margin-top:16px;
        border-left:3px solid var(--black);
        background:var(--gray-100);
        padding:14px 16px;
        color:var(--gray-800);
        font-style:italic;
      }
      .doc hr{
        border:0;
        border-top:1px solid var(--gray-200);
        margin:18px 0;
      }
      .doc code{
        font-family:var(--mono);
        font-size: 12px;
        padding:2px 6px;
        border:1px solid var(--gray-200);
        background:rgba(245,245,245,.75);
      }

      .codeblock{
        margin-top:14px;
        border:1px solid var(--gray-200);
        background:rgba(245,245,245,.62);
      }
      .codebar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:8px 10px;
        border-bottom:1px solid var(--gray-200);
      }
      .codelang{
        font-family:var(--mono);
        font-size:10px;
        letter-spacing:2px;
        text-transform:uppercase;
        color:var(--gray-600);
      }
      .codeblock pre{
        margin:0;
        padding:12px 12px 14px;
        overflow:auto;
      }
      .codeblock pre code{
        border:0;
        background:transparent;
        padding:0;
        font-size:12px;
        line-height:1.7;
        color:var(--black);
      }

      table{
        width:100%;
        border-collapse:collapse;
        margin-top:14px;
        border:1px solid var(--gray-200);
        background:rgba(250,250,250,.92);
      }
      th, td{
        border:1px solid var(--gray-200);
        padding:10px 10px;
        vertical-align:top;
        text-align:left;
        font-size:13px;
        line-height:1.7;
      }
      th{
        background:rgba(245,245,245,.8);
        font-size:10px;
        letter-spacing:2px;
        text-transform:uppercase;
        color:var(--gray-600);
      }

      .raw{
        margin-top:14px;
        border:1px solid var(--gray-200);
        background:rgba(245,245,245,.62);
        padding:14px;
        overflow:auto;
        font-family:var(--mono);
        font-size:12px;
        line-height:1.7;
        white-space:pre;
      }

      .toc{
        border:1px solid var(--gray-200);
        background:rgba(250,250,250,.92);
        align-self:start;
        position:sticky;
        top:124px;
        max-height: calc(100vh - 150px);
        overflow:auto;
        padding:14px 14px 16px;
      }
      .toc .t{
        font-size:10px;
        letter-spacing:3px;
        text-transform:uppercase;
        color:var(--gray-400);
        font-weight:700;
      }
      .toc ol{ list-style:none; margin-top:10px; }
      .toc a{
        display:block;
        padding:6px 8px;
        border-left:2px solid transparent;
        color:var(--gray-600);
        font-size:12px;
        line-height:1.5;
      }
      .toc a:hover{ color:var(--black); }
      .toc a[aria-current="true"]{
        color:var(--black);
        border-left-color:var(--black);
        background:rgba(10,10,10,.06);
      }
      .toc .foot{
        margin-top:12px;
        border-top:1px solid var(--gray-200);
        padding-top:12px;
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }

      .toast{
        position:fixed;
        left:50%;
        bottom:18px;
        transform:translateX(-50%);
        background:rgba(10,10,10,.92);
        color:var(--white);
        padding:10px 12px;
        font-size:12px;
        border-radius:999px;
        box-shadow: var(--shadow);
        opacity:0;
        pointer-events:none;
        transition: opacity .16s ease, transform .16s ease;
        z-index:60;
      }
      .toast.show{
        opacity:1;
        transform:translateX(-50%) translateY(-4px);
      }

      footer{
        border-top:1px solid var(--gray-200);
        padding:22px 18px;
        color:var(--gray-600);
      }
      .footer-inner{
        max-width:var(--measure);
        margin:0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
      }
      .footer-note{
        font-size:12px;
        line-height:1.7;
      }
      .footer-meta{
        font-family:var(--mono);
        font-size:11px;
        color:var(--gray-400);
      }

      /* Mobile */
      @media (max-width: 1040px){
        .layout{ grid-template-columns: 300px minmax(0, 1fr); }
        .toc{ display:none; }
      }
      @media (max-width: 860px){
        .layout{ grid-template-columns: 1fr; }
        .sidebar{
          position:fixed;
          left:0;
          top:0;
          bottom:0;
          width:min(92vw, 360px);
          max-height:none;
          z-index:45;
          transform: translateX(-105%);
          transition: transform .18s ease;
          border-right:1px solid var(--gray-200);
          border-left:0;
          border-top:0;
          border-bottom:0;
        }
        body.nav-open .sidebar{ transform: translateX(0); }
        .sidebar-head{ padding-top:18px; }
      }

      @media (prefers-reduced-motion: reduce){
        html{ scroll-behavior:auto; }
        .scrim, .sidebar, .toast{ transition:none; }
      }

      @media print{
        .header, .sidebar, .toc, .scrim, .toast, .pillrow{ display:none !important; }
        .layout{ max-width: 100%; padding:0; grid-template-columns:1fr; }
        .content{ border:0; box-shadow:none; padding:0; }
        a{ border-bottom:none; text-decoration:underline; }
      }
    </style>
  </head>
  <body>
    <div class="scrim" id="scrim" hidden></div>
    <header class="header">
      <div class="header-inner">
        <a class="logo" href="#/" aria-label="Codex Skills Docs">
          <span class="mark">CODEX SKILLS</span>
          <span class="sub" id="activeSub">Docs</span>
        </a>
        <div class="header-actions">
          <button class="btn" id="menuBtn" type="button" aria-controls="sidebar" aria-expanded="false">Menu</button>
          <a class="btn" href="https://github.com/EOMZON/codex-skills-mvp" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      <div class="searchbar">
        <div class="search" role="search">
          <span class="hint">/</span>
          <input id="q" type="search" placeholder="Search skills… (name / description / full text)" autocomplete="off" />
        </div>
        <div class="pillrow" id="pillRow" aria-label="Category filter"></div>
      </div>
    </header>

    <main class="layout">
      <nav class="sidebar" id="sidebar" aria-label="Skills">
        <div class="sidebar-head">
          <div class="k">Skills</div>
          <div class="v" id="countText">0</div>
        </div>
        <ul class="skill-list" id="list"></ul>
      </nav>

      <article class="content" id="content">
        <div class="kicker" id="kicker">Overview</div>
        <h1 id="title">Codex Skills · Docs</h1>
        <p class="subtitle" id="desc">一个符合 Zon Minimal Editorial · Light 的单页文档站：支持全局搜索、目录、代码块一键复制、移动端菜单、可打印。</p>
        <div class="content-actions" id="actions">
          <button class="btn primary" id="copyAll" type="button">Copy</button>
          <button class="btn" id="copyLink" type="button">Copy Link</button>
          <button class="btn" id="toggleRaw" type="button">Raw</button>
        </div>
        <div class="doc" id="doc"></div>
      </article>

      <aside class="toc" id="toc" aria-label="Table of contents">
        <div class="t">On this page</div>
        <ol id="tocList"></ol>
        <div class="foot">
          <button class="btn small" id="topBtn" type="button">Top</button>
          <button class="btn small" id="printBtn" type="button">Print</button>
        </div>
      </aside>
    </main>

    <footer>
      <div class="footer-inner">
        <div class="footer-note">
          Install in Actions: <code>uses: EOMZON/codex-skills-mvp@v0</code> · Runner default: <code>~/.codex/skills</code>
        </div>
        <div class="footer-meta">Generated · ${escapeHtml(generatedAt)}</div>
      </div>
    </footer>

    <div class="toast" id="toast" role="status" aria-live="polite">Copied.</div>

    <script id="skillsData" type="application/json">${dataJson}</script>
    <script>
      const $ = (id) => document.getElementById(id);
      const data = (() => {
        const el = $("skillsData");
        if (!el) return { skills: [], categories: [], generatedAt: "" };
        try { return JSON.parse(el.textContent || "{}"); } catch { return { skills: [], categories: [], generatedAt: "" }; }
      })();

      const CATEGORY_LABEL = Object.fromEntries((data.categories || []).map((c) => [c.id, c.label]));
      const ALL = (data.skills || []).slice();

      const state = {
        q: "",
        cat: "all",
        active: "",
        raw: false,
      };

      const els = {
        q: $("q"),
        list: $("list"),
        countText: $("countText"),
        kicker: $("kicker"),
        title: $("title"),
        desc: $("desc"),
        doc: $("doc"),
        toc: $("toc"),
        tocList: $("tocList"),
        activeSub: $("activeSub"),
        copyAll: $("copyAll"),
        copyLink: $("copyLink"),
        toggleRaw: $("toggleRaw"),
        topBtn: $("topBtn"),
        printBtn: $("printBtn"),
        pillRow: $("pillRow"),
        toast: $("toast"),
        menuBtn: $("menuBtn"),
        sidebar: $("sidebar"),
        scrim: $("scrim"),
      };

      const escapeHtml = (s) => String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\\"", "&quot;")
        .replaceAll("'", "&#39;");

      const stripFrontMatter = (md) => {
        const text = String(md ?? "");
        const m = text.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---\\s*\\r?\\n?/);
        if (!m) return { body: text, fm: {} };
        const fmRaw = String(m[1] ?? "");
        const fm = {};
        for (const line of fmRaw.split(/\\r?\\n/)) {
          const kv = line.trim().match(/^([A-Za-z0-9_-]+)\\s*:\\s*(.*)\\s*$/);
          if (!kv) continue;
          const k = kv[1];
          let v = String(kv[2] ?? "").trim();
          if ((v.startsWith("\\"") && v.endsWith("\\"")) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          fm[k] = v;
        }
        return { body: text.slice(m[0].length), fm };
      };

      const slugify = (s) => {
        const t = String(s ?? "").trim().toLowerCase();
        const cleaned = t
          .normalize("NFKD")
          .replace(/[\\u0300-\\u036f]/g, "")
          .replace(/[^\\p{Letter}\\p{Number}\\u4e00-\\u9fff]+/gu, "-")
          .replace(/^-+|-+$/g, "");
        return (cleaned || "section").slice(0, 64);
      };

      const inlineFormat = (s) => {
        const text = escapeHtml(s);
        return text
          .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
          .replace(/\\*([^*]+)\\*/g, "<em>$1</em>")
          .replace(/\`([^\`]+)\`/g, "<code>$1</code>")
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      };

      function renderMarkdown(md) {
        const src = String(md ?? "").replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n");
        const lines = src.split("\\n");
        const out = [];
        const toc = [];

        let i = 0;
        let inCode = false;
        let codeLang = "";
        let codeBuf = [];
        let paraBuf = [];
        let listMode = ""; // "ul" | "ol" | ""
        let listItems = [];
        let quoteBuf = [];

        const flushPara = () => {
          if (!paraBuf.length) return;
          out.push("<p>" + inlineFormat(paraBuf.join(" ").trim()) + "</p>");
          paraBuf = [];
        };
        const flushList = () => {
          if (!listItems.length || !listMode) return;
          const tag = listMode === "ol" ? "ol" : "ul";
          out.push("<" + tag + ">" + listItems.map((x) => "<li>" + inlineFormat(x) + "</li>").join("") + "</" + tag + ">");
          listItems = [];
          listMode = "";
        };
        const flushQuote = () => {
          if (!quoteBuf.length) return;
          const html = quoteBuf.map((l) => inlineFormat(l)).join("<br/>");
          out.push("<blockquote>" + html + "</blockquote>");
          quoteBuf = [];
        };
        const flushCode = () => {
          if (!inCode) return;
          const lang = (codeLang || "").trim();
          const codeText = codeBuf.join("\\n");
          out.push(
            '<div class="codeblock">' +
              '<div class="codebar">' +
                '<div class="codelang">' + escapeHtml(lang || "code") + "</div>" +
                '<button class="btn small" type="button" data-copy-code>Copy</button>' +
              "</div>" +
              "<pre><code>" + escapeHtml(codeText) + "</code></pre>" +
            "</div>",
          );
          inCode = false;
          codeLang = "";
          codeBuf = [];
        };

        const isTableSep = (line) => {
          const t = String(line || "").trim();
          if (!t.includes("|")) return false;
          const cells = t.split("|").map((c) => c.trim()).filter(Boolean);
          if (!cells.length) return false;
          return cells.every((c) => /^:?-{3,}:?$/.test(c));
        };
        const splitRow = (line) => {
          const t = String(line || "").trim().replace(/^\\|/, "").replace(/\\|$/, "");
          return t.split("|").map((c) => c.trim());
        };

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // code fence
          const fence = line.match(/^\`\`\`\\s*([^\\s]*)\\s*$/);
          if (fence) {
            flushPara(); flushList(); flushQuote();
            if (inCode) {
              flushCode();
            } else {
              inCode = true;
              codeLang = fence[1] || "";
              codeBuf = [];
            }
            i++;
            continue;
          }
          if (inCode) {
            codeBuf.push(line);
            i++;
            continue;
          }

          // blank line
          if (!trimmed) {
            flushPara(); flushList(); flushQuote();
            i++;
            continue;
          }

          // blockquote
          if (trimmed.startsWith(">")) {
            flushPara(); flushList();
            quoteBuf.push(trimmed.replace(/^>\\s?/, ""));
            i++;
            continue;
          }
          if (quoteBuf.length) flushQuote();

          // hr
          if (/^(-{3,}|\\*{3,}|_{3,})$/.test(trimmed)) {
            flushPara(); flushList(); flushQuote();
            out.push("<hr />");
            i++;
            continue;
          }

          // headings
          const h = line.match(/^(#{1,6})\\s+(.+)$/);
          if (h) {
            flushPara(); flushList(); flushQuote();
            const level = h[1].length;
            const text = h[2].trim().replace(/\\s+#+\\s*$/, "");
            const idBase = slugify(text);
            const id = idBase + "-" + (toc.length + 1);
            toc.push({ level, text, id });
            out.push("<h" + level + ' id="' + escapeHtml(id) + '">' + inlineFormat(text) + "</h" + level + ">");
            i++;
            continue;
          }

          // tables (simple pipe table)
          const next = i + 1 < lines.length ? lines[i + 1] : "";
          if (trimmed.includes("|") && isTableSep(next || "")) {
            flushPara(); flushList(); flushQuote();
            const header = splitRow(line);
            const sep = splitRow(next);
            const aligns = sep.map((c) => {
              const t = c.trim();
              const left = t.startsWith(":");
              const right = t.endsWith(":");
              if (left && right) return "center";
              if (right) return "right";
              return "left";
            });
            const rows = [];
            i += 2;
            while (i < lines.length) {
              const r = lines[i];
              if (!String(r || "").trim() || !String(r || "").includes("|")) break;
              rows.push(splitRow(r));
              i++;
            }
            const ths = header
              .map((c, idx) => '<th style="text-align:' + aligns[idx] + '">' + inlineFormat(c) + "</th>")
              .join("");
            const trs = rows
              .map((row) => "<tr>" + row.map((c, idx) => '<td style="text-align:' + (aligns[idx] || "left") + '">' + inlineFormat(c) + "</td>").join("") + "</tr>")
              .join("");
            out.push("<table><thead><tr>" + ths + "</tr></thead><tbody>" + trs + "</tbody></table>");
            continue;
          }

          // lists
          const ul = line.match(/^\\s*[-*]\\s+([\\s\\S]+)$/);
          const ol = line.match(/^\\s*\\d+\\.\\s+([\\s\\S]+)$/);
          if (ul || ol) {
            flushPara(); flushQuote();
            const mode = ul ? "ul" : "ol";
            if (listMode && listMode !== mode) flushList();
            listMode = mode;
            listItems.push((ul ? ul[1] : ol[1]).trim());
            i++;
            continue;
          }
          if (listItems.length) flushList();

          // paragraph (merge wrapped lines)
          paraBuf.push(trimmed);
          i++;
        }

        flushPara(); flushList(); flushQuote(); flushCode();
        return { html: out.join("\\n"), toc };
      }

      function toast(msg) {
        if (!els.toast) return;
        els.toast.textContent = msg || "Done.";
        els.toast.classList.add("show");
        window.clearTimeout(toast._t);
        toast._t = window.setTimeout(() => els.toast.classList.remove("show"), 1200);
      }

      async function copyText(text) {
        const t = String(text ?? "");
        try {
          await navigator.clipboard.writeText(t);
          toast("Copied.");
          return true;
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = t;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          ta.style.top = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            toast("Copied.");
            return true;
          } catch {
            toast("Copy failed.");
            return false;
          } finally {
            document.body.removeChild(ta);
          }
        }
      }

      function getSlugFromHash() {
        const h = decodeURIComponent(String(location.hash || ""));
        const m = h.match(/^#\\/(.+)$/);
        if (!m) return "";
        return String(m[1] || "").split("?")[0].trim();
      }

      function setHash(slug) {
        const s = String(slug || "").trim();
        if (!s) {
          location.hash = "#/";
          return;
        }
        location.hash = "#/" + encodeURIComponent(s);
      }

      function buildPills() {
        const cats = (data.categories || []).filter((c) => c && c.id && c.id !== "misc");
        const counts = {};
        for (const sk of ALL) counts[sk.category] = (counts[sk.category] || 0) + 1;

        const items = [{ id: "all", label: "All", count: ALL.length }]
          .concat(cats.map((c) => ({ id: c.id, label: c.label, count: counts[c.id] || 0 })));

        els.pillRow.innerHTML = items
          .filter((x) => x.count > 0)
          .map((x) => {
            const pressed = x.id === state.cat ? "true" : "false";
            return '<button class="pill" type="button" data-cat="' + escapeHtml(x.id) + '" aria-pressed="' + pressed + '">' +
              escapeHtml(x.label) + " · " + escapeHtml(String(x.count)) + "</button>";
          })
          .join("");
      }

      function applyFilters() {
        const q = String(state.q || "").trim().toLowerCase();
        const cat = String(state.cat || "all");
        let list = ALL;
        if (cat !== "all") list = list.filter((s) => String(s.category || "misc") === cat);
        if (!q) return list.slice().sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

        const scored = [];
        for (const s of list) {
          const name = String(s.name || s.slug || "").toLowerCase();
          const desc = String(s.description || "").toLowerCase();
          const { body } = stripFrontMatter(s.md || "");
          const hay = (name + "\\n" + desc + "\\n" + String(body || "")).toLowerCase();
          const idx = hay.indexOf(q);
          if (idx < 0) continue;
          let score = 0;
          if (String(s.slug || "").toLowerCase().includes(q)) score += 80;
          if (name.includes(q)) score += 60;
          if (desc.includes(q)) score += 25;
          score += Math.max(0, 20 - Math.floor(idx / 200));
          scored.push({ s, score });
        }
        scored.sort((a, b) => b.score - a.score || String(a.s.slug).localeCompare(String(b.s.slug)));
        return scored.map((x) => x.s);
      }

      function highlight(text, q) {
        const t = String(text || "");
        const needle = String(q || "").trim();
        if (!needle) return escapeHtml(t);
        const idx = t.toLowerCase().indexOf(needle.toLowerCase());
        if (idx < 0) return escapeHtml(t);
        const head = escapeHtml(t.slice(0, idx));
        const mid = escapeHtml(t.slice(idx, idx + needle.length));
        const tail = escapeHtml(t.slice(idx + needle.length));
        return head + "<mark style=\\"background:rgba(10,10,10,.08); padding:0 2px\\">" + mid + "</mark>" + tail;
      }

      function renderList() {
        const filtered = applyFilters();
        els.countText.textContent = String(filtered.length) + " / " + String(ALL.length);
        const q = String(state.q || "");
        els.list.innerHTML = filtered.map((s) => {
          const current = String(s.slug || "") === String(state.active || "");
          const catLabel = CATEGORY_LABEL[String(s.category || "misc")] || "Misc";
          return '<li class="skill-item">' +
            '<button class="skill-btn" type="button" data-slug="' + escapeHtml(s.slug) + '" aria-current="' + (current ? "true" : "false") + '">' +
              '<div class="skill-name"><span>' + highlight(s.slug, q) + '</span><span class="skill-tag">' + escapeHtml(catLabel) + '</span></div>' +
              '<div class="skill-meta"><div class="skill-desc">' + highlight(s.description || "", q) + '</div></div>' +
            "</button></li>";
        }).join("");
      }

      function renderHome() {
        els.kicker.textContent = "Overview";
        els.title.textContent = "Codex Skills · Docs";
        els.activeSub.textContent = "Docs";
        els.desc.textContent = "一个符合 Zon Minimal Editorial · Light 的单页文档站：支持全局搜索、目录、代码块一键复制、移动端菜单、可打印。";
        els.copyAll.textContent = "Copy";
        els.toggleRaw.textContent = "Raw";

        const body = [
          "## Quick Start",
          "",
          "- GitHub Actions 安装：\`uses: EOMZON/codex-skills-mvp@v0\`（默认安装到 \`~/.codex/skills\`）",
          "- ChatOps 仓库：用 \`CHATOPS_SKILLS\` 选择注入哪些 skills，例如 \`best-minds best-minds-minimalist vercel-deploy\`",
          "",
          "## Vercel CLI Deploy (docs/)",
          "",
          "如果你把本仓库的 \`docs/\` 当静态站部署：",
          "",
          "\`\`\`bash",
          "cd docs",
          "npx vercel@latest link --yes --project <YOUR_PROJECT> --token=$VERCEL_TOKEN",
          "npx vercel@latest deploy --prod --yes --token=$VERCEL_TOKEN",
          "\`\`\`",
          "",
          "> 提示：更完整的部署策略请直接打开 \`vercel-deploy\` skill。",
          "",
          "## Skills",
          "",
          "从左侧选择一个 skill 开始阅读；按 \`/\` 聚焦搜索。",
        ].join("\\n");

        const { html, toc } = renderMarkdown(body);
        els.doc.innerHTML = html;
        renderToc(toc);
      }

      function renderSkill(slug) {
        const s = ALL.find((x) => String(x.slug || "") === String(slug || ""));
        if (!s) {
          renderHome();
          return;
        }

        const { body, fm } = stripFrontMatter(s.md || "");
        const catLabel = CATEGORY_LABEL[String(s.category || "misc")] || "Misc";
        const title = String(fm.name || s.name || s.slug || "Skill");
        const desc = String(fm.description || s.description || "");

        els.kicker.textContent = catLabel;
        els.title.textContent = title;
        els.activeSub.textContent = String(s.slug || "");
        els.desc.textContent = desc || "—";
        els.copyAll.textContent = "Copy Markdown";
        els.toggleRaw.textContent = state.raw ? "Pretty" : "Raw";

        if (state.raw) {
          els.doc.innerHTML = '<pre class="raw">' + escapeHtml(String(s.md || "")) + "</pre>";
          renderToc([]);
          return;
        }

        const rendered = renderMarkdown(body);
        els.doc.innerHTML = rendered.html;
        renderToc(rendered.toc);
      }

      function renderToc(toc) {
        const items = (toc || []).filter((h) => h && h.id && h.text).filter((h) => h.level >= 2 && h.level <= 4);
        if (!items.length) {
          els.tocList.innerHTML = '<li><a href="#content" aria-current="true">Top</a></li>';
          return;
        }
        els.tocList.innerHTML = items.map((h) => {
          const pad = (h.level - 2) * 10;
          return '<li><a href="#' + escapeHtml(h.id) + '" style="padding-left:' + (8 + pad) + 'px">' + escapeHtml(h.text) + "</a></li>";
        }).join("");

        // Scroll spy
        const headings = items.map((h) => document.getElementById(h.id)).filter(Boolean);
        if (renderToc._io) renderToc._io.disconnect();
        renderToc._io = new IntersectionObserver((entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0))[0];
          if (!visible) return;
          const id = visible.target.id;
          for (const a of els.tocList.querySelectorAll("a")) {
            a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + id));
          }
        }, { root: null, threshold: [0.2, 0.6] });
        for (const h of headings) renderToc._io.observe(h);
      }

      function closeNav() {
        document.body.classList.remove("nav-open");
        els.menuBtn.setAttribute("aria-expanded", "false");
        if (els.scrim) els.scrim.hidden = true;
      }

      function openNav() {
        document.body.classList.add("nav-open");
        els.menuBtn.setAttribute("aria-expanded", "true");
        if (els.scrim) els.scrim.hidden = false;
        try { els.q && els.q.focus(); } catch {}
      }

      function toggleNav() {
        if (document.body.classList.contains("nav-open")) closeNav();
        else openNav();
      }

      function rerender() {
        buildPills();
        renderList();
        if (!state.active) renderHome();
        else renderSkill(state.active);
      }

      // Events
      els.q.addEventListener("input", () => {
        state.q = els.q.value || "";
        renderList();
      });

      els.pillRow.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-cat]");
        if (!btn) return;
        state.cat = btn.getAttribute("data-cat") || "all";
        buildPills();
        renderList();
      });

      els.list.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-slug]");
        if (!btn) return;
        const slug = btn.getAttribute("data-slug") || "";
        setHash(slug);
        if (window.matchMedia("(max-width: 860px)").matches) closeNav();
      });

      els.doc.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-copy-code]");
        if (!btn) return;
        const block = btn.closest(".codeblock");
        const pre = block ? block.querySelector("pre") : null;
        const text = pre ? pre.innerText : "";
        copyText(text);
      });

      els.copyAll.addEventListener("click", () => {
        if (!state.active) {
          const text = els.doc ? els.doc.innerText : "";
          copyText(text);
          return;
        }
        const s = ALL.find((x) => String(x.slug || "") === String(state.active || ""));
        copyText(s ? String(s.md || "") : "");
      });
      els.copyLink.addEventListener("click", () => copyText(String(location.href || "")));
      els.toggleRaw.addEventListener("click", () => {
        state.raw = !state.raw;
        try { localStorage.setItem("codex_skills_raw", state.raw ? "1" : "0"); } catch {}
        rerender();
      });
      els.topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      els.printBtn.addEventListener("click", () => window.print());

      els.menuBtn.addEventListener("click", toggleNav);
      els.scrim.addEventListener("click", closeNav);

      window.addEventListener("hashchange", () => {
        state.active = getSlugFromHash();
        renderList();
        if (!state.active) renderHome();
        else renderSkill(state.active);
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "/" && !e.metaKey && !e.ctrlKey && document.activeElement !== els.q) {
          e.preventDefault();
          els.q.focus();
          return;
        }
        if (e.key === "Escape") {
          closeNav();
          return;
        }
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          els.q.focus();
          return;
        }
      });

      // Init
      try { state.raw = localStorage.getItem("codex_skills_raw") === "1"; } catch {}
      state.active = getSlugFromHash();
      els.menuBtn.style.display = window.matchMedia("(max-width: 860px)").matches ? "" : "none";
      buildPills();
      renderList();
      if (!state.active) renderHome();
      else renderSkill(state.active);
    </script>
  </body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function main() {
  const selfDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(selfDir, "..");
  const skillsRoot = path.join(repoRoot, "skills");
  const docsDir = path.join(repoRoot, "docs");

  if (!fs.existsSync(skillsRoot)) die(`Missing skills dir: ${skillsRoot}`);

  const skills = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(skillsRoot, name, "SKILL.md")))
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const p = path.join(skillsRoot, slug, "SKILL.md");
      const md = readText(p);
      const { frontMatter } = parseFrontMatter(md);
      return {
        slug,
        category: categoryForSlug(slug),
        name: String(frontMatter?.name || slug),
        description: String(frontMatter?.description || ""),
        license: String(frontMatter?.license || ""),
        md: md.trimEnd() + "\n",
      };
    });

  const generatedAt = new Date().toISOString();
  const html = renderHtml({ skills, generatedAt });

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf8");
  process.stdout.write(`Wrote docs/index.html (${skills.length} skills)\n`);
}

main();
