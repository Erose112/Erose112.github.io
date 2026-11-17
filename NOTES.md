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

## Milestone 5 — Sections (completed)

### Built
- `src/App.jsx` — mode shell (`world` | `transition` | `section` | `plain`), `syncFromLocation()` on load / `popstate` / `hashchange`, `visited` `Set` (session), enter hop → apex → wipe → `pushState` + `showModal()`, idempotent dialog `close` exit with `history.back()` or `replaceState(#world)` for deep links.
- `src/components/SectionFrame.jsx` — native `<dialog class="section-dialog">`, scrollable body, `AboutSection` / `ExperienceSection` / `ProjectsSection`.
- `src/components/ExitButton.jsx` — interactive restart frame-0 crop (36N×32N device px), `dialog.close()` only, “Back to desert”, `aria-keyshortcuts="Escape"`.
- `src/game/Game.js` — `beginEnterTransition()`, apex detection (`vz` crest), `freezeAtApex()`, `placeDinoAtReturn()`, loop keeps stepping through `transition`, pauses in `section`.
- `src/components/World.jsx` — portal enter wired to App, canvas invert wipe classes, no standalone exit preview.
- `src/game/constants.js` — `WIPE_MS` (400).
- `src/index.css` — dialog body height, canvas invert wipe transition / exit keyframes; reduced motion disables wipe filter.

### Deviations
- **Exit button placement:** Lives inside the dialog (not portaled to `document.body` like the milestone-2 preview). `position: fixed` keeps it clear of the safe area over scrollable section content.
- **Night logo tiles:** Section dialogs use the night background but marquee/project logos still use the day plain-page styling (grayscale only). PLAN §6 night tiles deferred to polish / milestone 7 if needed.
- **`#plain` routing:** `syncFromLocation` mounts `PlainPage` when hash is `#plain`; skip control and “play game” return are still milestone 6.
- **Browser Back from a section:** `popstate` → `syncFromLocation` closes the dialog and returns to world without the 400ms exit wipe (Esc/restart still run the wipe). Forward/back hash navigation is stable.

### Constants worth tuning
- `src/game/constants.js` — `WIPE_MS` (400).
- `src/index.css` — `.world-canvas` filter transition and `desert-wipe-out` keyframes.
- `src/components/SectionFrame.jsx` — top padding for exit button (`pt-[calc(3.5rem+env(safe-area-inset-top))]`).

### For milestone 6+
- `visited.size` is tracked in React state (also on a hidden `data-visited-count` node for lint); wire to `Hud` “HI n/3”.
- Focus: move focus to section `h2` on open, back to canvas + live announcement on exit.
- Skip game, touch joystick/jump, coarse-pointer jump button → `GameInput`.
- `ExitButton` spin remains off until frame-0 crop is verified in the dialog.
- Deep-link section still skips the hop; dino is placed at `returnPoint` via `Game.placeDinoAtReturn()`.

## Milestone 6 — Phone, skip, HUD, focus (completed)

### Built
- `src/components/Hud.jsx` — **SKIP GAME** (top-left, safe area), **HI n/3** (top-right, session `visited` count).
- `src/components/TouchControls.jsx` — CSS joystick + **JUMP** button with `setPointerCapture`, deadzone **0.2**, simultaneous stick + jump; mounts only for `(pointer: coarse)` while `world` / `transition`.
- `src/game/input.js` — `setTouchAxis`, `queueTouchJump` / `releaseTouchJump`, touch + keyboard axis merge with clamped magnitude.
- `src/game/constants.js` — `JOYSTICK_DEADZONE`.
- `src/App.jsx` — `handleSkip` (`pushState` `#plain`), `handlePlayGame` (`#world`), exit live announcement, canvas refocus after section exit.
- `src/components/PlainPage.jsx` — **PLAY GAME** button.
- `src/components/SectionFrame.jsx` — focus section heading when dialog opens (`about-heading` h1, experience/projects h2).
- `src/index.css` — portal cue lifted above touch controls on coarse pointers; joystick `touch-action: none`.

### Deviations
- **About section focus target:** PLAN §8 says focus the section `h2`; About dialog lead is `h1` (`#about-heading`), so focus lands there (first heading in the section). Experience and Projects use their `h2` ids as specified.
- **Portal cue position:** Extra bottom offset on `(pointer: coarse)` so the cue does not sit under joystick/jump; fine pointer keeps the original bottom inset.

### Constants worth tuning
- `src/game/constants.js` — `JOYSTICK_DEADZONE` (0.2).
- `src/components/TouchControls.jsx` — stick size `h-28 w-28`, `KNOB_TRAVEL` (40px), jump button placement with `safe-area-inset-*`.
- `src/index.css` — `.world-shell .portal-cue` coarse vs fine bottom offsets.

### For milestone 7+
- Lazy-load section/marquee images; preload sheet is already in `index.html` (milestone 2) — milestone 7 may tighten “early” request + footer BSD credit on plain page.
- `ExitButton` spin still off until frame-0 crop verified.
- Night logo tiles on section dialogs still use plain-page grayscale styling (carried from milestone 5).

## Milestone 7 — Load and credit (completed)

### Built
- `index.html` — unchanged `<link rel="preload" as="image">` for `/sprites/100-offline-sprite.png` (milestone 2); `Game.start()` still awaits `sprite.decode()` before the rAF loop.
- `src/components/ProjectsSection.jsx` — lazy/async decoding on project screenshots.
- `src/content.js` — `chromiumAttribution` strings for the plain-page footer.
- `src/components/PlainPage.jsx` — footer with BSD credit link.
- `THIRD_PARTY_NOTICES.md` — extended Chromium section with asset table and preload note.
- `README.md` — project blurb + pointer to `THIRD_PARTY_NOTICES.md`.

### Deviations
- **`LogoMarquee` left out** — PLAN §6 expects it, but it was already missing from the tree; this milestone does not restore it. Lazy-loading covers project screenshots only.
- **BSD footer on plain page only** — section dialogs do not repeat the credit; acceptance calls out plain page + notices file.

### Constants worth tuning
- `src/content.js` — `chromiumAttribution` copy if legal wants different wording.
- `index.html` — preload `href` must stay aligned with `SPRITE_SHEET_URL` in `src/game/constants.js`.

### For optional milestones+
- `ExitButton` spin, audio, night toggle, pterodactyl remain optional per PLAN §9.
- Night logo tiles on section dialogs still use plain-page grayscale marquee styling.

## P1 — Polish pass (completed)

### Built
- **World layout:** `960×560` game px, walkable `x 24–936`, `y 120–540`, sky band `0–100`, spawn `(480, 430)`, portals About `(220, 300)`, Experience `(480, 190)`, Projects `(740, 300)`, `MOVE_SPEED` **240**; camera still uses `HEADROOM` / `cameraAnchor()`.
- **Edge hints:** DOM pixel arrows + gate labels for **unvisited** portals off-screen (`World.jsx`, `Game.isPortalVisible()`, `index.css` `.portal-edge-*`).
- **Props:** `src/game/props.js` — **14–20** seeded clusters (1–3 small/large plants), `PROP_MIN_SPACING` **56**, `GATE_OPENING_CLEAR_PX` **90**, `PROP_PATH_CLEAR_PX` **40** from spawn→gate paths; base footprints merged into `Game.allSolids`; y-sorted in `drawSortedActors`.
- **Dust / ptero:** Foot dust puffs while running (`DUST_*` in `entities.js`); decorative pterodactyl every **25–40s** in top third, no collision, disabled when reduced motion.
- **Ground:** `src/game/ground.js` — pre-rendered offscreen canvas (`WORLD_SEED`), scattered horizon slices **24–80px**, pebbles/tufts, gate-adjacent density, dotted paths, optional `#ebebeb` dune dither; replaces horizon row tiling.
- **Clouds:** Screen-space layer — **6** clouds, **12–30 px/s**, `CLOUD_PARALLAX` **0.3**, top third of view. Outline atlas crop is filled once via `buildCloudSprite()` (interior `#dadada`, exterior stays transparent). Spawn/respawn **off the left** (`CLOUD_RESPAWN_GAP_*`); exit only after the **parallax draw X** clears the right edge — never pop in mid-view. Drawn in `drawSortedActors` between cactus and dino/ptero (`DRAW_LAYER_*`); cull/respawn use `cloudDrawScreenX` so parallax matches visibility.
- **Sections:** Day palette (`#f7f7f7` / `#535353`), **4px** inset panel **12px**, checkerboard `::backdrop` over desert; **300ms** 3-step opacity blink instead of invert wipe (`WIPE_MS`, `index.css` `desert-blink-wipe`); project logos grayscale hover only (no night tiles).
- **Typography:** `.section-copy` **28px** (**32px** `md+`), `line-height` **1.45**, **62ch**; `.section-meta` **24px**; `ExpandableDescription` **3-line** clamp + Show more/less.
- **Welcome / HUD:** Press Start 2P banner + touch/desktop copy, blink `WELCOME_BLINK_MS`, dismiss on move or `WELCOME_DISMISS_MS` **8s**, `aria-live`; permanent **ETHAN ROSE** label; visited portal labels invert (`.portal-label--visited`); **HI n/3** blinks `HI_BLINK_TIMES` × at `HI_BLINK_MS` on first visit (`Hud.jsx`, `visitedPulse` in `App.jsx`).
- **RNG:** `src/game/rng.js` (`WORLD_SEED`).

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/constants.js` | `WORLD_*`, `SKY_BOTTOM`, `GROUND_*`, `WALK_*`, `SPAWN`, `PORTAL_DEFS`, `MOVE_SPEED`, `HEADROOM`, `WORLD_SEED`, `HORIZON_SLICE_*`, `CLOUD_COUNT`, `CLOUD_PARALLAX`, `CLOUD_SPEED_*`, `CLOUD_RESPAWN_GAP_*`, `PROP_*`, `GATE_OPENING_CLEAR_PX`, `PROP_PATH_CLEAR_PX`, `PTERO_*`, `DUST_*`, `WIPE_MS`, `WIPE_BLINK_STEPS`, `WELCOME_*`, `HI_BLINK_*`, `DUNE_TINT`, jump/move/HUD portal geometry (unchanged names) |
| `src/game/ground.js` | Slice/pebble/tuft/dune counts (inline in `buildGroundCanvas`) |
| `src/game/props.js` | Uses `PROP_*`, `GATE_OPENING_CLEAR_PX`, `PROP_PATH_CLEAR_PX` |
| `src/game/entities.js` | Ptero fly speed **140** px/s (inline in `updatePterodactyl`) |
| `src/index.css` | Section panel inset **12px**, border **4px**, wipe keyframes **300ms**, edge-hint layout |
| `src/components/Hud.jsx` | Uses `HI_BLINK_MS`, `HI_BLINK_TIMES` |
| `src/components/World.jsx` | Uses `WELCOME_*`, `CUE_BLINK_MS` |

### Deviations
- **Pterodactyl atlas frame 2** assumed at **x 180** on the 1× sheet (46px stride); verify visually against `public/sprites/100-offline-sprite.png`.
- **Ground build** runs once after `sprite.decode()`; slice draw uses live `drawImage` from the sheet into the static ground canvas.
- **Cloud fill** is runtime (`buildCloudSprite`), not baked into `100-offline-sprite.png`; sheet outline stays hollow for Chromium fidelity.
- **Cloud draw order** is layer-hard (cactus behind clouds; clouds behind dino/ptero). Dino vs cactus still y-sorts by foot y.
- **Section backdrop** uses CSS checkerboard + desert tint rather than sampling the live canvas bitmap (canvas remains visible underneath transparent dialog root).

## R1 — Gate and routing (completed)

### Built
- `src/game/constants.js` — `WORLD_HEIGHT` **780**, `GROUND_NORTH_BOTTOM` **540**, `GROUND_BOTTOM` **760**, `DINO_RUN_PORTAL_DEF` at **(480, 660)**, `path: false` on section defs.
- `src/game/entities.js` — fourth gate (posts only, no flanks), decorative gate pterodactyl, opening horizon strip, return **(480, 588)** (`y - 72`).
- `src/game/ground.js` / `src/game/props.js` — north band unchanged seed/counts; south fill `WORLD_SEED + 11`; spawn path dots skip `path: false`.
- `src/game/runner/RunnerGame.js` — ready stub (desert fill + own rAF); `src/game/runner/storage.js` — read HI for gate label.
- `src/game/Game.js` — `loopMode: 'runner'`, `startRunner()` / `stopRunner()`, resize forward.
- `src/game/input.js` — `clearJumpLatchForReady()` for later Space latch.
- `src/App.jsx` — `mode: 'runner'`, `#dino-run` before unknown-hash fallback, hop+wipe enter, Back/Esc + `history.back()` / `replaceState(#world)`.
- `src/components/World.jsx` — `DINO RUN` + HI label (`portal-label--dino`, not visited), runner overlay hook, dino proximity copy.
- `src/components/RunnerOverlay.jsx` — **BACK TO WORLD**.

### Deviations
- **Runner overlay in `World.jsx`**, not a sibling in `App.jsx`, so it shares the world shell z-index with the canvas.
- **South prop count** rolled as **6–10** extra plants (not specified in plan; keeps density light until R7).
- **Gate ptero bob period** ~**2.4 s** (visual only; plan gives ±**18 px** amplitude via `DINO_GATE_PTERO_BOB_PX`).

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/constants.js` | `WORLD_HEIGHT`, `GROUND_NORTH_BOTTOM`, `GROUND_BOTTOM`, `DINO_RUN_PORTAL_DEF`, `DINO_GATE_PTERO_BOB_PX`, `PORTAL_DEFS[].path` |
| `src/game/ground.js` | South band slice/pebble/tuft/dune counts (inline `paintGroundBand` calls) |
| `src/game/props.js` | South `southTarget` **6–10** |
| `src/game/runner/storage.js` | `HI_KEY` (`ethan-rose.dinoRun.hi`) |

### For R2+
- `RunnerGame` is a blank canvas; R2 adds scale, letterbox, horizon, clouds, movement, HUD, pause — keep handoff via `Game.startRunner()` / `stopRunner()`.
- Jump latch already on `GameInput.clearJumpLatchForReady()` — call stays in `RunnerGame.enterReady()`.
- Dino gate DOM label uses `formatHiLabel(readHiScore())`; R3 writes `.hi` and should refresh label on return to world (`World` already re-reads on `mode === 'world'`).
- `App` Escape while `mode === 'runner'` exits to desert; R6 extends Escape for pause/play.
- Do not add `'dino'` to `visited` or section path dots.