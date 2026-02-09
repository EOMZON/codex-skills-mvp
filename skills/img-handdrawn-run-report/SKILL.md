---
name: img-handdrawn-run-report
description: Generate a clean, printable Zon Minimal Editorial · Light HTML run report page for image runs (hand-drawn / sketchnote / Nano Banana / nano-banana-fast / sora-image). Use when user asks for “清晰的 HTML 展示/报告页/复现记录/Prompt 展示/生成过程归档” and you have an output image + meta JSON.
---

# IMG · Handdrawn Run Report

## Quick Start

Create an HTML report from an existing meta JSON (prompt + params) and an output image:

```bash
node ~/.codex/skills/img-handdrawn-run-report/scripts/generate-run-report.mjs \
  --meta tmp/style-run-sop/.../style-test-01.json \
  --image tmp/style-run-sop/.../style-test-01.png
```

Output defaults to `docs/reports/report-YYYYMMDD-HHMMSS.html`.

## Workflow (Do This)

1) Ensure you have:
   - Output image(s): `.png/.jpg/.webp`
   - A meta JSON that includes at least: `prompt`, `model`, `aspectRatio`, `imageSize`, `createdAt` (best effort)

2) Generate the report (embeds images by default; portable single-file HTML):

```bash
node ~/.codex/skills/img-handdrawn-run-report/scripts/generate-run-report.mjs \
  --meta path/to/meta.json \
  --image path/to/output.png \
  --title "中文标题" \
  --title-en "English Title"
```

3) If you want the HTML to reference local files instead of embedding:

```bash
node ~/.codex/skills/img-handdrawn-run-report/scripts/generate-run-report.mjs \
  --meta path/to/meta.json \
  --image path/to/output.png \
  --no-embed-images
```

## What To Include (Standard Sections)

- Outcome summary (success/fallback count)
- Output image preview(s) + local path(s) + result URL (if any)
- Prompt (verbatim)
- Parameters (API/model/aspect/size/timestamps/meta path)
- Reproduce commands
- Raw meta JSON (for audit/traceability)
- Interaction: every output image must support click-to-open a full-screen viewer with fit-to-viewport, zoom (wheel/pinch), and pan (drag)

## Resources

- Script: `scripts/generate-run-report.mjs`
- Template: `assets/zon-run-report.template.html`
