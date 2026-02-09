#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const usage = () => {
  console.log(`
game-vn-immersive · new-game

Usage:
  node ~/.codex/skills/game-vn-immersive/scripts/new-game.mjs \\
    --slug <game-slug> \\
    --title <title> \\
    [--title-en <title-en>] \\
    [--out <path>] \\
    [--force]

Examples:
  node ~/.codex/skills/game-vn-immersive/scripts/new-game.mjs \\
    --slug rainy-apartment \\
    --title "雨夜公寓" \\
    --title-en "Rainy Apartment"
`.trim());
};

const parseArgs = (argv) => {
  const out = { force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--force") {
      out.force = true;
      continue;
    }
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--title") out.title = argv[++i];
    else if (a === "--title-en") out.titleEn = argv[++i];
    else if (a === "--out") out.outPath = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
};

const isSafeSlug = (slug) => /^[a-z0-9][a-z0-9-]{1,63}$/.test(slug);

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  const slug = String(args.slug || "").trim().toLowerCase();
  const title = String(args.title || "").trim();
  const titleEn = String(args.titleEn || "").trim();

  if (!slug || !isSafeSlug(slug)) {
    console.error("Error: --slug must match /^[a-z0-9][a-z0-9-]{1,63}$/ (e.g. rainy-apartment)");
    usage();
    process.exit(1);
  }
  if (!title) {
    console.error("Error: --title is required");
    usage();
    process.exit(1);
  }

  const outPath = path.resolve(args.outPath || path.join(process.cwd(), "docs", "games", `${slug}.html`));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "..", "assets", "game-vn-immersive.template.html");

  const tpl = await fs.readFile(templatePath, "utf8");
  const filled = tpl
    .replaceAll("__GAME_SLUG__", slug)
    .replaceAll("__GAME_TITLE__", title)
    .replaceAll("__GAME_TITLE_EN__", titleEn || title);

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  try {
    const st = await fs.stat(outPath);
    if (st.isFile() && !args.force) {
      console.error(`Error: output exists: ${outPath} (use --force to overwrite)`);
      process.exit(1);
    }
  } catch {
    // ok
  }

  await fs.writeFile(outPath, filled, "utf8");
  console.log(`OK: wrote ${outPath}`);
};

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

