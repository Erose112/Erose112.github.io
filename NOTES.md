# Implementation notes

## Milestone 1 — Content and theme (completed)

### Built
- `src/content.js` — all portfolio strings and structured data (logos, site copy, experience roles, projects).
- `src/index.css` — Tailwind v4 `@theme` (desert / ink / night tokens), body reset, marquee + reduced-motion, `.font-display` smoothing off, placeholder `dialog.section-dialog` styles for later milestones.
- Self-hosted fonts via `@fontsource/press-start-2p` and `@fontsource/vt323` (imported in `index.css`).
- Components: `PlainPage`, `AboutSection`, `ExperienceSection`, `ProjectsSection`, `LogoMarquee`, `ExpandableDescription`.
- `src/App.jsx` renders `PlainPage` only (no nested `<body>`).
- `index.html` — title `Ethan Rose`, meta description from intro line, `<noscript>` with name + LinkedIn, GitHub, Resume links.
- Qflow screenshot path fixed to `/qflow-screenshot.png`.

### Deviations
- **`imageObjectPosition` in `content.js`:** Added per-project object-position strings so project images match the old `object-left-top` / `object-center` / `object-left` classes without duplicating alt-text checks in JSX. Copy and URLs are unchanged; only layout metadata moved next to each project.
- **VT323 body size:** Chose **24px** (`text-2xl`) for body copy after spot-checking 16px and 32px; 24px kept the pixel strokes most even at common viewport scales. Press Start 2P uses **16px** on small viewports and **32px** for the `h1` from the `lg` breakpoint (`AboutSection.jsx`).
- **`dialog.section-dialog` CSS:** Added ahead of milestone 5 so theme tokens and dialog reset live in one place; no dialog markup yet.

### Constants worth tuning
- `src/index.css` — theme colors (`--color-desert`, `--color-ink`, `--color-night`, `--color-night-ink`).
- `src/components/AboutSection.jsx` — `h1` sizing: `text-base` vs `lg:text-[32px]`.
- `src/index.css` — `.logo-marquee-track` duration **30s** (unchanged from pre-redesign).
- Body typography default: **`text-2xl` (24px VT323)** with `leading-[1.35]` on section components.

### For milestone 2+
- `App.jsx` will become the mode shell; `PlainPage` is ready to mount for `#plain` / skip flow.
- Section components (`AboutSection`, `ExperienceSection`, `ProjectsSection`) are shared with future `SectionFrame` dialogs — `AboutSection` accepts `showHeading` for reuse if a dialog supplies its own title (prop exists, currently always `true` on plain page).
- `body { overflow: hidden }` is global; `.plain-page` uses `overflow-y: auto` — game world will need its own full-viewport layer.
- Logo marquee images use **grayscale** + hover/focus color; night-section logo tiles (`#f7f7f7` + 2px border) are not applied on the day plain page yet (per plan, sections use night palette later).
- No sprite preload in `index.html` until milestone 2.