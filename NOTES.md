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

## Milestone 2 — Static world (completed)

### Built
- `src/game/atlas.js` — 1× ldpi sprite rects (T-Rex, cloud, horizon, cacti, restart, pterodactyl) from the plan / Chromium reference.
- `src/game/constants.js` — world size, sky/ground bands, spawn `(800, 760)`, blink timing, scale helper, sprite URL.
- `src/game/scale.js` — integer `S`, backing-store sizing with `ResizeObserver` `devicePixelContentBoxSize` when available, `restartSpriteMultiple()` for exit crop sizing.
- `src/game/entities.js` — idle dino blink, four clouds, sky fill, horizon tiling, draw order helpers.
- `src/game/Game.js` — preload + `decode()`, rAF loop (blink + cloud drift), visibility pause, StrictMode-safe `destroy()`, camera with headroom anchor formula (for later jump room).
- `src/components/World.jsx` — full-viewport canvas + resize observer.
- `src/components/ExitButton.jsx` — off-loop restart crop drawn at **36N × 32N** device pixels (top center preview until milestone 5 dialog).
- `src/App.jsx` renders `World` (not `PlainPage`) for this shippable slice.
- `index.html` — `<link rel="preload">` for `/sprites/100-offline-sprite.png`.
- `src/index.css` — `.world-canvas { image-rendering: pixelated }`.

### Deviations
- **Horizon source Y:** `atlas.js` / `HORIZON_SOURCE_Y` use **52** (`horizon_line.ts` config) instead of **54** (`offline_sprite_definitions.ts`). Plan §5 says to prefer 52 if 54 clips bumps; confirm visually and flip the constant if bumps look wrong.
- **Exit button on screen:** Shown at top center (non-interactive, `pointer-events-none`) so acceptance can verify the circular-arrow crop and device-pixel box before milestone 5 hides it in the dialog.
- **`PlainPage` not mounted:** Milestone 2 acceptance is the desert only; `#plain` / skip return in milestone 6.

### Constants worth tuning
- `src/game/constants.js` — `HORIZON_SOURCE_Y` (52 vs 54), `HORIZON_TILE_STEP_Y` (56), cloud spawn band, `computeScale()` divisor **220**.
- `src/game/constants.js` — blink delays `BLINK_DELAY_MIN_MS` / `BLINK_DELAY_MAX_MS` (3000–7000 per plan).
- `src/game/scale.js` — `restartSpriteMultiple()` uses `max(2, round(2 * dpr))`.

### For milestone 3+
- Re-mount `PlainPage` behind mode shell when `App.jsx` gains `syncFromLocation()` (milestone 5–6).
- `Game` already pauses on `document.hidden`; add input (`src/game/input.js`), movement, jump `z`, shadow, and run frames — reuse `TREX_FRAME_OFFSET` and stored `scaleS` / camera anchor.
- Portals/cacti crops are in `atlas.js` but not drawn until milestone 4.
- `ExitButton` preview can move into `SectionFrame` or become the real dialog control in milestone 5.
- Dino `footX` / `footY` at spawn; draw uses foot-centered 44×47 sprite (milestone 3 movement should treat `y` as foot position).

## Milestone 3 — Move and jump (completed)

### Built
- `src/game/input.js` — `GameInput`: WASD / arrow `event.code` keys (no repeat), normalized diagonals, Space jump edge + held state, `inputLocked` gating, `preventDefault` on movement/jump only while the loop is active (`world` or `transition`), `blur` and `visibilitychange` clear held keys.
- `src/game/constants.js` — `MOVE_SPEED` (180), jump physics constants (`JUMP_*`), footprint size, shadow size, `INK_COLOR` for shadow fill.
- `src/game/entities.js` — footprint clamp to walk bounds, `updateDinoMoveAndJump`, run cycle (`RUN_FRAME_MS`), idle blink when stationary, airborne stand frame, `drawDinoShadow` (ink oval under feet).
- `src/game/Game.js` — input wired into `tick`, per-frame camera from anchor formula, `loopMode` (`world` | `transition` | `section` | `plain`) with pause only for `section`, `plain`, and hidden tab; `setInputLocked()`; loop keeps stepping for `transition`.
- `src/components/World.jsx` — in dev, `canvas.__portfolioGame` for manual `setLoopMode` checks.

### Deviations
- **Dev game handle:** `canvas.__portfolioGame` only when `import.meta.env.DEV` (for verifying transition vs section pause without milestone 5 UI).
- **Float jump crest:** Per-frame float integration peaks at **~88.4** game px on a full hold (within plan’s 88–94 band). Slightly under Chromium’s ~90 due to no rounded y stepping.
- **Early-release trim:** Physics match plan pseudocode (`vz = 5` after `z >= 30`). Releasing Space the same frame `reachedMin` becomes true trims more than ~10 px in this float model; a slightly longer tap still reads as “lower than hold” in the browser.

### Constants worth tuning
- `src/game/constants.js` — `MOVE_SPEED`, `JUMP_INITIAL_VELOCITY`, `JUMP_GRAVITY`, `JUMP_DROP_VELOCITY`, `HEADROOM` / `cameraAnchor()`.
- `src/game/entities.js` — `moveSpeed > 0.5` run vs idle threshold; shadow `SHADOW_W` / `SHADOW_H` and scale via `JUMP_PEAK_REF`.
- `src/game/constants.js` — walk clamp via `FOOTPRINT_W` / `FOOTPRINT_H` and `WALK_*` / `GROUND_*`.

### For milestone 4+
- Portals/collision: `clampFootprint` is world bounds only; replace or extend with post/flank resolution in `collision.js` (cactus crops already in `atlas.js`).
- `Game.setInputLocked()` / `inputLocked` on `GameInput` are ready for enter-hop and wipes in milestone 5.
- `loopMode === 'transition'` already keeps the rAF loop running; React mode shell will call `setLoopMode` from `App.jsx`.
- Touch / joystick lives in `input.js` extension or parallel module (milestone 6); jump edge hook should accept pointer `pointerdown` on the jump button.
- No cactus draw or y-sort yet; dino draws after clouds with shadow under sprite only.

### Milestone 2 follow-up (visibility fixes)
- **`Game.start()`** called removed `_onResize()` — loop/resize could fail silently in dev.
- **Clouds** were only in world y&lt;150; spawn camera looks at y≈600+, so clouds never entered the view. `layoutCloudsForView()` places them in the top of the current viewport (sky band still used when the camera shows it).
- **Ground** looked like 3 stripes because tiles were 56px apart; `HORIZON_TILE_STEP_Y` is **12** (strip height) until we revisit PLAN §5 spacing.
- **Exit preview** uses `z-20`, `img.decode()`, and the game canvas is `z-0` so the restart crop sits above the desert.

## Milestone 4 — Portals (completed)

### Built
- `src/game/collision.js` — footprint AABBs, overlap test, smallest-axis separation for dino vs solids.
- `src/game/constants.js` — gate geometry (`GATE_GAP`, post/flank footprint sizes, trigger size), `PORTAL_DEFS` with opening centers and `PORTAL_RETURN_OFFSET_Y` (72px).
- `src/game/entities.js` — `createPortals()`, solid colliders, trigger overlap, `drawSortedActors()` y-sort (dino + posts + flanks by foot y), `portalLabelAnchor()`, movement resolves X/Y against portal solids before world clamp.
- `src/game/Game.js` — `onProximity` / `onEnter` callbacks (enter only when `loopMode === 'world'`, jump edge, `z === 0`, footprint in trigger); DOM label `translate3d` each frame from camera; label font 16px vs 24px from `S / dpr`.
- `src/components/World.jsx` — Press Start 2P labels in a layer above canvas (`z-10`), blinking proximity cue (opacity, `CUE_BLINK_MS`), `aria-live` cue text, dev `console.info` on enter.
- `src/index.css` — `.portal-label-layer` / `.portal-label`.

### Deviations
- **Enter feedback:** No section UI yet; `onEnter` updates status text and logs in dev until milestone 5 wires hash + dialog.
- **Cue blink:** Opacity blink on the bottom cue keeps `aria-live` text stable while inside the trigger (plan: do not repeat announcement while stationary in the box).
- **Coarse pointer copy:** Cue says “Tap jump” when `(pointer: coarse)` even before milestone 6 touch controls exist.

### Constants worth tuning
- `src/game/constants.js` — `PORTAL_DEFS` centers, `GATE_GAP` (48), `GATE_FLANK_OUTSET` (16), `POST_FOOTPRINT_*`, `FLANK_FOOTPRINT_*`, `PORTAL_TRIGGER_W/H`, `PORTAL_RETURN_OFFSET_Y`.
- `src/game/entities.js` — label anchor offset **12px** above large cactus tops (`portalLabelAnchor`).
- `src/game/Game.js` — label font threshold at `cssPxPerGame >= 3` → 24px else 16px.

### For milestone 5+
- `Game.onEnter` is ready; set `inputLocked`, `loopMode: 'transition'`, apex wipe, then `pushState` + `syncFromLocation()` from `App.jsx`.
- Each gate exposes `returnPoint` on the portal object (`createPortals()`); use when exiting a section.
- Ignore `onEnter` when React `mode !== 'world'` (per plan) — enforce in App/wrapper, not only in `Game._handlePortalTriggers`.
- `portalLabels` refs are passed into `Game`; same hook can drive HUD later.
- Collision list is static per session; no dynamic obstacles.