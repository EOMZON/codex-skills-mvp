#!/usr/bin/env node
import fs from "node:fs/promises";

const usage = () => {
  console.log(`
game-vn-immersive · validate-game

Usage:
  node ~/.codex/skills/game-vn-immersive/scripts/validate-game.mjs <html-file>

Example:
  node ~/.codex/skills/game-vn-immersive/scripts/validate-game.mjs docs/games/rainy-apartment.html
`.trim());
};

const getPath = (obj, path) => {
  const p = String(path || "").trim();
  if (!p) return undefined;
  const parts = p.split(".");
  let cur = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
};

const isString = (v) => typeof v === "string" && v.trim().length > 0;

const validate = (data) => {
  const errors = [];
  const warnings = [];

  const start = data?.meta?.start;
  const scenes = data?.scenes;
  const characters = data?.characters || {};

  if (!isString(data?.meta?.id)) errors.push("meta.id missing");
  if (!isString(data?.meta?.title)) warnings.push("meta.title missing");
  if (!isString(start)) errors.push("meta.start missing");
  if (!scenes || typeof scenes !== "object") errors.push("scenes missing");
  if (scenes && start && !scenes[start]) errors.push(`start scene not found: ${start}`);

  const ids = scenes && typeof scenes === "object" ? Object.keys(scenes) : [];

  const isKnownSpeaker = (speakerId) => speakerId in characters || speakerId === "narrator";

  for (const id of ids) {
    const scene = scenes[id];
    if (!scene || typeof scene !== "object") {
      errors.push(`scene is not an object: ${id}`);
      continue;
    }
    const lines = Array.isArray(scene.lines) ? scene.lines : [];
    for (let i = 0; i < lines.length; i += 1) {
      const ln = lines[i];
      const sp = ln?.speaker;
      if (!isString(sp)) errors.push(`scene.${id}.lines[${i}].speaker missing`);
      else if (!isKnownSpeaker(sp)) warnings.push(`unknown speaker id: scene.${id}.lines[${i}].speaker=${sp}`);
    }

    const choices = Array.isArray(scene.choices) ? scene.choices : [];
    for (let i = 0; i < choices.length; i += 1) {
      const c = choices[i];
      if (!c || typeof c !== "object") {
        errors.push(`scene.${id}.choices[${i}] is not an object`);
        continue;
      }
      if (!isString(c.label)) errors.push(`scene.${id}.choices[${i}].label missing`);

      const to = c.to;
      const toIf = c.toIf;
      if (!isString(to) && !(toIf && typeof toIf === "object")) {
        errors.push(`scene.${id}.choices[${i}] must have "to" or "toIf"`);
      }

      if (isString(to) && scenes && !scenes[to]) errors.push(`dead link: ${id} -> ${to}`);
      if (toIf && typeof toIf === "object") {
        const thenId = toIf.then;
        const elseId = toIf.else;
        if (!isString(thenId)) errors.push(`scene.${id}.choices[${i}].toIf.then missing`);
        else if (scenes && !scenes[thenId]) errors.push(`dead link: ${id} -> ${thenId} (toIf.then)`);
        if (isString(elseId) && scenes && !scenes[elseId])
          errors.push(`dead link: ${id} -> ${elseId} (toIf.else)`);
      }
    }

    // Cast checks
    const cast = Array.isArray(scene.cast) ? scene.cast : [];
    for (let i = 0; i < cast.length; i += 1) {
      const entry = cast[i];
      const cid = typeof entry === "string" ? entry : entry?.id;
      if (!isString(cid)) {
        errors.push(`scene.${id}.cast[${i}] missing id`);
        continue;
      }
      if (!(cid in characters)) warnings.push(`unknown cast id: scene.${id}.cast[${i}]=${cid}`);
    }
  }

  // Reachability (DFS)
  if (scenes && typeof scenes === "object" && isString(start) && scenes[start]) {
    const visited = new Set();
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || visited.has(cur) || !scenes[cur]) continue;
      visited.add(cur);
      const choices = Array.isArray(scenes[cur]?.choices) ? scenes[cur].choices : [];
      for (const c of choices) {
        if (isString(c?.to)) stack.push(c.to.trim());
        const ti = c?.toIf;
        if (ti && typeof ti === "object") {
          if (isString(ti.then)) stack.push(ti.then.trim());
          if (isString(ti.else)) stack.push(ti.else.trim());
        }
      }
    }
    const unreachable = ids.filter((id) => !visited.has(id));
    if (unreachable.length) warnings.push(`unreachable scenes: ${unreachable.join(", ")}`);
  }

  // Basic schema sanity
  const state = data?.state;
  if (!state || typeof state !== "object") warnings.push("state missing (meta only game?)");
  const stats = getPath(state, "stats");
  if (!stats || typeof stats !== "object") warnings.push("state.stats missing");

  return { errors, warnings };
};

const extractGameDataJSON = (html) => {
  const m = html.match(/<script[^>]*id=["']GAME_DATA["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) throw new Error('Missing <script id="GAME_DATA" type="application/json"> in HTML');
  return m[1].trim();
};

const main = async () => {
  const file = process.argv[2];
  if (!file || file === "--help" || file === "-h") {
    usage();
    process.exit(file ? 0 : 1);
  }

  const html = await fs.readFile(file, "utf8");
  const json = extractGameDataJSON(html);
  const data = JSON.parse(json);

  const { errors, warnings } = validate(data);
  for (const w of warnings) console.warn(`[warn] ${w}`);
  for (const e of errors) console.error(`[error] ${e}`);

  if (errors.length) process.exit(1);
  console.log(`OK: ${file}`);
};

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
