---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

### Zon Preference (Default)

When the user says “用我最喜欢的设计风格 / 黑白简洁 / 极简黑白”, default to a **strict black & white minimal** system:
- Palette: pure B/W + neutral grays only; avoid gradients, colorful accents, glassmorphism/blur.
- Layout: whitespace-first, hard edges, 1px rules; minimal radius; no heavy shadows.
- Type: clean sans for body + mono for UI labels; avoid decorative display faces.
- Interaction: understated; hover via underline or color inversion; motion ≤150ms.

If unclear, ask 1 question: “纯黑白，还是允许一个点缀色？”

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## Information Display Dashboards (Zon)

When the user asks to extract information from a link/document and present it as an HTML page (information display / info dashboard):

- Default to an information-dense dashboard rather than a sparse landing page.
- Make it scannable “at a glance”: metadata, thesis, outline, key entities/tools, and links.
- Visualize the message with SVG: include at least (1) a global map diagram and (2) a workflow/process diagram.
- All images/diagrams/canvas must be zoomable: click → full-screen viewer → fit-to-viewport, pan (drag), zoom (wheel/pinch), ESC close.
- Emphasize actionability: add a step-by-step playbook, checklists, and clear operational instructions (“how to use / how to apply”).
- Emphasize personal value: include decision points, pitfalls, measurement/experiments, and a notes area for the user.
- Provide copy/export actions (copy link/JSON/checklist; print to PDF) and persist checklist state locally when helpful.
- Respect copyright: avoid reproducing full article text; paraphrase and link to the original.

## Static Editorial Documents (Zon House Style)

When the user asks for a static, content-first single-file HTML document (interview transcript, profile, essay, notes) and does not request a different aesthetic/UI framework, or references `8_Workflow/shareAuto/INFJ/采访/布琳布朗_INFJ对谈.html`:

- Default to the **Zon Minimal Editorial** house style for continuity across documents (even though this skill otherwise encourages aesthetic variation).
- All images/diagrams/canvas must be zoomable: click → full-screen viewer → fit-to-viewport, pan (drag), zoom (wheel/pinch), ESC close.
- Available variants:
  - **Light (default)**: `assets/zon-minimal-editorial.template.html` + `references/zon-minimal-editorial.md`
  - **Warm Paper**: `assets/zon-minimal-editorial.warm-paper.template.html` + `references/zon-minimal-editorial.warm-paper.md`
  - **Noir (night reading)**: `assets/zon-minimal-editorial.noir.template.html` + `references/zon-minimal-editorial.noir.md`
  - **Typewriter (draft)**: `assets/zon-minimal-editorial.typewriter.template.html` + `references/zon-minimal-editorial.typewriter.md`
  - **Luxury Serif (feature)**: `assets/zon-minimal-editorial.luxury-serif.template.html` + `references/zon-minimal-editorial.luxury-serif.md`
  - **Brutalist (hard)**: `assets/zon-minimal-editorial.brutalist.template.html` + `references/zon-minimal-editorial.brutalist.md`
- Variant selection:
  - If the user mentions night/dark reading (e.g. “暗色/夜读/深色/护眼”), use **Noir**.
  - If the user wants warmer paper tone (e.g. “暖/米白/纸感/不那么冷”), use **Warm Paper**.
  - If the user wants a typed manuscript feel (e.g. “打字机/稿纸/等宽/工作日志/研究记录”), use **Typewriter**.
  - If the user wants a magazine/book feature vibe (e.g. “书刊/衬线/特稿/高级/更像杂志”), use **Luxury Serif**.
  - If the user wants sharper, raw layout (e.g. “粗野/硬核/Brutalist/像宣言/像海报”), use **Brutalist**.
  - If the user says “保持和布琳布朗那份一样/同款风格”, use **Light**.
  - Otherwise, ask one short question: “要 Light / Warm Paper / Noir / Typewriter / Luxury Serif / Brutalist 哪一套？”
- Exception to the “avoid system fonts” guideline: for Chinese-heavy editorial documents, prefer the template’s system font stack for legibility and consistency.
