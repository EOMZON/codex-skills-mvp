# Zon Minimal Editorial (HTML) — Style Reference

Use this reference when the user wants a consistent “minimal editorial” look similar to `8_Workflow/shareAuto/INFJ/采访/布琳布朗_INFJ对谈.html`, or when generating static, content-first HTML pages (interviews, notes, essays, profiles) for Zon without an explicit alternative aesthetic.

## Design Intent

- High-contrast, near-monochrome palette (paper white + ink black + quiet grays)
- Calm, generous spacing; narrow reading measure (`max-width: 800px`)
- Editorial micro-typography: small caps-ish labels via `letter-spacing` + `text-transform: uppercase`
- “Museum label” UI: sticky header with blur, thin rules, restrained components

## Core Tokens (CSS Variables)

Use a small neutral scale and keep named tokens stable:

- `--black: #0a0a0a`
- `--white: #fafafa`
- `--gray-100: #f5f5f5`
- `--gray-200: #e8e8e8`
- `--gray-400: #999`
- `--gray-600: #666`
- `--gray-800: #333`

## Typography Rules

- Font stack: system UI + Chinese system fonts (no webfont required).
- Body: `16px`, `line-height: 1.8` (dense content can go `1.7`), antialiased.
- Headline: light weight (`300`) + subtle tracking; use `clamp()` to scale.
- Labels (meta, section headers, speakers): `10–12px`, uppercase, heavy tracking (`2–6px`).

## Layout & Components

### Sticky Header

- `position: sticky; top: 0; z-index: 100`
- Semi-transparent paper background + `backdrop-filter: blur(12px)`
- Thin bottom border (`--gray-200`)

### Hero

- Centered, generous top padding (60–100px)
- Label + headline + short subline

### Profile Card

- `border: 1px solid --gray-200`
- 2-column grid on desktop, 1-column on mobile
- Trait chips: black background, white text, compact padding

### Conversation Blocks

- Speaker line: label text + a 1px rule that fills the remaining width (via `::after`)
- Q speaker in gray; A speaker in black
- Answer text slightly larger than question text

### Highlight

Use subtle “ink wash” emphasis:

- `background: linear-gradient(transparent 60%, rgba(10,10,10,0.08) 60%)`
- Minimal horizontal padding (`0 2px`)

### Blockquote

- Left border `3px solid --black`, soft gray background, italic, generous padding

### Print

- Disable sticky/blur header in `@media print`
- Use `12pt` body size

## How To Use In Outputs

- Prefer the template: `assets/zon-minimal-editorial.template.html`.
- Keep it single-file by default (inline `<style>`). Only split CSS when user explicitly wants multi-file.
- Keep components consistent (header/hero/profile/conversation/footer), but adapt content structure as needed.

## Variant

- Night reading (dark): use `assets/zon-minimal-editorial.noir.template.html` and read `references/zon-minimal-editorial.noir.md`.
- Warm paper: use `assets/zon-minimal-editorial.warm-paper.template.html` and read `references/zon-minimal-editorial.warm-paper.md`.
- Typewriter/draft: use `assets/zon-minimal-editorial.typewriter.template.html` and read `references/zon-minimal-editorial.typewriter.md`.
- Luxury serif/feature: use `assets/zon-minimal-editorial.luxury-serif.template.html` and read `references/zon-minimal-editorial.luxury-serif.md`.
- Brutalist/hard: use `assets/zon-minimal-editorial.brutalist.template.html` and read `references/zon-minimal-editorial.brutalist.md`.
