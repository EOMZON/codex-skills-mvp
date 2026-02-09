# Zon Minimal Editorial — Noir (Night Reading)

Use this when the user wants the same “minimal editorial” structure as the light house style, but optimized for dark backgrounds and long-form night reading.

## Differences From Light

- Palette: deep ink background + warm-paper text (not pure white)
- Borders/rules: low-contrast grays to avoid glare
- Highlights: subtle “light wash” behind text (instead of dark wash)
- Header: darker translucent glass + blur remains

## Recommended Tokens

- `--black: #0b0c10` (page background)
- `--white: #f4f4f3` (primary text)
- `--gray-100: #11131a` (panels / soft blocks)
- `--gray-200: #1c2030` (borders / rules)
- `--gray-400: #7f8698` (secondary labels)
- `--gray-600: #b2b6c2` (secondary text)
- `--gray-800: #e5e6ea` (body text on dark)
- Optional accent: `--accent: #d7c6a6` (warm)

## Components Checklist

- Keep the same layout structure as the light template.
- Trait chips can stay “ink-on-paper” for contrast: light chip background + dark text.
- Ensure `@media print` returns to a light background for printing (or keep print minimal).

