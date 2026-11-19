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

## R2 — Runner core (completed)

### Built
- `src/game/clock.js` — shared `frameDelta` clamped to **0.05 s**.
- `src/game/runner/constants.js` — playfield **180**, track **52–136**, runner scale `S_run`, dino x clamp, speed constants.
- `src/game/runner/scoring.js` — `distanceRan`, score `round(ceil(distance)*0.025)`, speed ramp, 100-point flash timing (visual only).
- `src/game/runner/RunnerGame.js` — ready / playing / paused, letterbox, horizon tile scroll, filled clouds, vertical lane movement, sprite HUD (`HI` + digits), blink/run anim, pause on hide/blur/resize.
- `src/game/input.js` — `setAxisMode('vertical'|'plane')` for runner up/down.
- `src/game/Game.js` — runner owns canvas scale while active; `stopRunner()` restores desert scale; keyboard `preventDefault` when runner wants keys.
- `src/components/RunnerOverlay.jsx` — **PRESS SPACE TO START** / **TAP TO START**, **PAUSED** cue.
- `src/components/World.jsx` — runner aria-label, overlay phase poll, coarse tap-to-start on canvas.

### Deviations
- **Hide/tab resume:** After `visibilitychange` back to visible (or window `focus`), a pause from blur/hidden auto-resumes with `lastTime` reset so score does not spike—R6 may replace this with an explicit Resume control.
- **Orientation resize pause:** Resumes on the next **Space** edge (no Resume button until R6).
- **Touch movement:** Vertical stick deferred to R6; tap-to-start uses `queueTouchJump()` on coarse pointers only.

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/runner/constants.js` | `PLAYFIELD_H`, `TRACK_*`, `LANE_SPEED`, `computeRunnerScale`, `RUN_REF_W` (600), `dinoScreenX`, `SPEED_*`, cloud band/gaps, HUD glyph crops |
| `src/game/runner/scoring.js` | score factor **0.025**, `SPEED_START/MAX/ACCEL` |
| `src/game/clock.js` | `MAX_FRAME_DT` |

### For R3+
- `cameraX` / `runningTime` exist for scroll and `clearTime` gating; add spawner rows and `simulate.js` collision.
- HI on HUD is read-only via `readHiScore()`; write on crash and refresh gate label on desert return.
- `phase === 'over'` not used yet; crash frame offset **220**, game-over crop, Restart DOM (R3).
- Cacti draw uses footprint sort by foot y inside the track band.

## R3 — Rows, death, HI (completed)

### Built
- `src/game/runner/difficulty.js` — corridor ramp **46→28**, shift ambition **0.25→1**, fairness cap from `gap - 28` at `T_REACT` / fair **0.9**.
- `src/game/runner/spawner.js` — rows after `CLEAR_TIME_MS` **3000**, Chromium gap formula, one-corridor footprint stacks (`ceil(blocked / footprintDepth)`), cluster size / duplication cap **2**, spawn fill ahead of `cameraX + visibleW`.
- `src/game/runner/simulate.js` — sub-steps **≤ 1/120 s**, inset dino box **2 px**/side, combined lane + scroll motion per frame.
- `src/game/runner/RunnerGame.js` — `over` phase, cactus y-sort draw, crash frame **220**, GAME OVER crop, Enter / Space (**1200 ms**) restart, immediate restart from DOM button + fresh run without ready.
- `src/game/runner/storage.js` — `writeHiScore()` → `ethan-rose.dinoRun.hi`.
- `src/game/input.js` — `Enter` edge, Space/Enter yield to focused buttons/links.
- `src/components/RunnerOverlay.jsx` — restart crop button beside **BACK TO WORLD** on game over; focus on crash.
- `src/components/World.jsx` / `src/game/Game.js` — restart handler, `onRunnerGameOver` focus hook.

### Deviations
- **R4 tests not added** — per milestone scope; spawner still applies ambition + cap math so R4 can assert seeds without rework.
- **Cactus draw** — full cluster sprite drawn at each footprint depth (same column x); collision uses per-footprint boxes only.
- **Gap bump when cap is 0** — if `fairShiftCapPx` is 0, row creation recenters corridor at shift 0 but does not yet widen `pendingGap` in-place (R4 fairness loop can extend `maybeSpawnRows`).

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/runner/constants.js` | `CLEAR_TIME_MS`, `GAMEOVER_CLEAR_MS`, `GAP_COEFFICIENT`, `MAX_GAP_COEFFICIENT`, `MAX_CLUSTER_SIZE`, `MAX_TYPE_STREAK`, `MAX_SEAM_PX`, `MIN_PASS_CORRIDOR_PX`, `CACTUS_SMALL` / `CACTUS_LARGE`, `GAME_OVER_SRC`, `TREX_CRASH_OFFSET` |
| `src/game/runner/difficulty.js` | `T_REACT`, `FAIR_FRACTION`, `CORRIDOR_*`, `AMBITION_*`, `DINO_ALONG_SCROLL` |
| `src/game/runner/simulate.js` | `MAX_SUBSTEP_SEC`, `HIT_INSET_PX` |
| `src/game/runner/spawner.js` | gap via `rowGap()` / `CACTUS_*.minGap` |
| `src/game/runner/storage.js` | `HI_KEY` |

### For R4+
- Add `test/runner/spawner.test.js`, `simulate.test.js`, `scoring.test.js`; package.json `"test": "node --test"` if not already present.
- Tighten gap inflation when shift cap is 0 before roll; bot must wait `T_REACT` after clearing a row.
- Optional: export pure helpers from spawner for gap/ceiling assertions in Node.

## R4 — Director and tests (completed)

### Built
- `src/game/runner/difficulty.js` — `minGapForFairShiftZero()`; fairness uses constant `T_REACT` **0.2** and `FAIR_FRACTION` **0.9**.
- `src/game/runner/spawner.js` — gap inflation before row roll, `shiftLocal` / `gapUsed` on rows, optional slow `gapCoefficient`, packed footprints (`STACK_OVERLAP_PX` **2**), exports `rowGap`, `verticalSeamsInRow`, `createRow`.
- `src/game/runner/botSim.js` — 300 s survival bot (normal + slow speed tables) that waits `T_REACT` after each row clear; trace mode for react regression tests.
- `src/game/runner/scoring.js` — `speedAtFrame`, `scoreFromDistance`, `stepRunScoringWithSpeed` (slow bot).
- `src/game/runner/constants.js` — **`TRACK_BOTTOM` 136** (plan 84 px track); slow speed constants for tests only; `DESERT_COLOR` inlined (no `assetUrl` in Node tests).
- `package.json` — `"test": "node --test"`.
- `test/runner/scoring.test.js`, `test/runner/spawner.test.js`, `test/runner/simulate.test.js`.

### Deviations
- **`TRACK_BOTTOM` was 200 in R3** — corrected to **136** so track depth is **84** per plan (`y` 52–136). This tightens lane clamp and cactus packing vs the R3 browser build (worth re-checking play feel).
- **Footprint count / ≤4 px seams** — plan’s full row layout assertions are not in CI; seeds **1** and **2** tests focus on fairness pairs, corridor ramp, ambition cap, and `clusterSize` vs `multipleSpeed`. Packing can still place fewer than `ceil(blocked/depth)` large rows in tight shifts (noted for R5/R7).
- **Bot instant-move** — survival does not always differ at `reactDelaySec: 0`; regression uses `trace: true` (`reactViolations` / `earlyMovesAfterClear`) so removing the wait fails CI.
- **Tests dropped from runner `constants.js`** — dropped re-export of `src/game/constants.js` to keep `node --test` off `assetUrl` / Vite `import.meta.env`.

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/runner/difficulty.js` | `T_REACT`, `FAIR_FRACTION`, `CORRIDOR_*`, `AMBITION_*`, `DINO_ALONG_SCROLL`, `minGapForFairShiftZero` |
| `src/game/runner/spawner.js` | `STACK_OVERLAP_PX` (**2**), gap via `GAP_COEFFICIENT` / row `gapCoefficient` |
| `src/game/runner/constants.js` | `TRACK_TOP`/`TRACK_BOTTOM`, `SLOW_SPEED_*`, `SLOW_GAP_COEFFICIENT` |
| `src/game/runner/botSim.js` | `BOT_VISIBLE_W` (= `RUN_REF_W` **600**), default `reactDelaySec` = `T_REACT` |

### For R5+
- `verticalSeamsInRow` + tighter packing if birds need exact partial stacks and ≤4 px seams everywhere.
- Slow mode UI (R6) should reuse `stepRunScoringWithSpeed` + `SLOW_GAP_COEFFICIENT` / `maybeSpawnRows({ gapCoefficient })`.
- Re-verify runner lane clamp in browser after `TRACK_BOTTOM` **136** change.

## R5 — Birds (completed)

### Built
- `src/game/runner/spawner.js` — `createBirdRow`, `shouldSpawnBird(seed, rowIndex, speed)` in `maybeSpawnRows` (**40%** at speed ≥ **8.5**); partial cactus stack with opening **`corridorLen + 12`**, ground **shadow** footprint (**46×12**), fairness on **safe-slot center**; ptero **minGap 150** for bird gaps.
- `src/game/runner/constants.js` — bird tuning (`BIRD_*`, `RUNNER_PTERO_FRAME_MS`, sky altitudes `BIRD_SKY_Y`).
- `src/game/runner/RunnerGame.js` — ink shadow oval, flapping pterodactyl in sky, **1 px** right-edge telegraph (**600 ms** lead, blink **1000/3 ms**), shadow collision.
- `src/game/runner/botSim.js` — aims at `safeSlotCenterLocal` / shadow obstacles.
- `test/runner/spawner.test.js` — bird layout, spawn gate, `maybeSpawnRows` integration; five-minute bot still passes with birds.

### Deviations
- **Bird spawn roll** uses a **hash of seed + row index**, not an extra `rng()` call, so R4 cactus sequences stay bit-identical until a bird row replaces one spawn.
- **Ground shadow** is an ink **ellipse** (same approach as desert dino shadow), not a sprite — the sheet has no shadow crop (per main PLAN).
- **`BIRD_SPAWN_CHANCE` 0.4** is not specified in PLAN-DINO-RUN; tune in `constants.js` if birds feel too sparse or dense.

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/runner/constants.js` | `BIRD_MIN_SPEED`, `BIRD_SPAWN_CHANCE`, `BIRD_SHADOW_DEPTH/WIDTH`, `BIRD_MIN_GAP`, `BIRD_TELEGRAPH_SEC`, `BIRD_TELEGRAPH_BLINK_MS`, `RUNNER_PTERO_FRAME_MS`, `BIRD_SKY_Y` |
| `src/game/runner/spawner.js` | `shouldSpawnBird` mix function |

### For R6+
- Telegraph and ptero flap respect `reduceMotion` (frozen); R6 reduced-motion note should mention telegraph freeze.
- Touch vertical stick — bot already targets safe slot; human play must dodge shadow, not whole opening.
- No audio on bird telegraph (visual-only per plan).

## R6 — Touch, audio, slow mode, focus (completed)

### Built
- `src/game/runner/audio.js` — `RunnerAudio` with `button-press`, `hit`, `score-reached` (muted default, unlock on gesture, `play()` swallows errors).
- `src/game/runner/storage.js` — `hiSlow`, `muted`, `slow` keys + memory fallbacks; gate label reads `.hi` only via `readHiScore()`.
- `src/game/input.js` — `Escape` / `KeyM` edges, `setRunnerShortcutsActive`, Escape yields to `dialog[open]`; `wantsRunnerPreventDefault` path in `Game.js`.
- `src/game/runner/RunnerGame.js` — Esc pause/resume/exit, explicit Resume (no blur auto-resume), slow ramp (`SLOW_SPEED_*`, `SLOW_GAP_COEFFICIENT` **0.6**), separate `writeHiSlowScore`, live `onAnnounce`, sfx hooks.
- `src/components/TouchControls.jsx` — `axisLock="vertical"`, `hideJump` in runner.
- `src/components/RunnerOverlay.jsx` — Resume, mute, slow toggle, reduced-motion dismissible note, runner controls top-safe-area.
- `src/components/World.jsx` — runner touch, `aria-live` runner status, dynamic canvas `aria-label`, dino gate **HI** line, mute/slow UI state.

### Deviations
- **R3 restart spin** on `RunnerRestartButton` left as-is (8-frame spin); plan R3 preferred frame 0 only — not reworked in R6.
- **Slow toggle while paused** updates HUD HI and persisted `slow` but does not swap the in-flight speed table until **ready** or **restart** (avoids mid-run inconsistent ramp).
- **Muted announcement** on M-toggle speaks “Sound on/off” via the same live region as run events.

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/runner/constants.js` | `SLOW_SPEED_START` **4.2**, `SLOW_SPEED_MAX` **9**, `SLOW_SPEED_ACCEL` **0.0005**, `SLOW_GAP_COEFFICIENT` **0.6** |
| `src/game/runner/storage.js` | `HI_KEY`, `HI_SLOW_KEY`, `MUTED_KEY`, `SLOW_KEY` |
| `src/components/TouchControls.jsx` | `axisLock`, `hideJump`, `JOYSTICK_DEADZONE` (parent) |

### For R7+
- Crop/dpr audit on runner HUD and game-over strip; confirm restart strip offsets on screen.
- `THIRD_PARTY_NOTICES.md` — mark sounds as in use and list runner atlas crops.
- North desert ground/props regression check after south-band work (R1).

## R7 — Polish and credit (completed)

### Built
- `src/game/atlas.js` — `textSprite` (digits, HI, GAME OVER), `TREX_FRAME_OFFSET.crash`, `runnerDigitSrc()`, `cactusClusterSrc()`; `HORIZON_SOURCE_Y` lives here (re-exported from `constants.js`).
- `src/game/runner/constants.js` — HUD / game-over / crash offsets sourced from `atlas.js`.
- `src/game/runner/RunnerGame.js` — HUD and cluster draws use atlas helpers.
- `src/game/constants.js` — named south-band ground/prop density (`SOUTH_*`); north still uses `WORLD_SEED+1` / `+7` with unchanged ranges.
- `src/components/RunnerOverlay.jsx` — restart button **frame 0 only** (same crisp `36N×32N` path as `ExitButton.jsx`).
- `THIRD_PARTY_NOTICES.md` — full crop table aligned with `atlas.js` (digits, HI, GAME OVER, restart, clusters, ptero, cloud, horizon, dino frames, sounds).
- `test/runner/atlas.test.js` — cluster and digit rect regression for CI.

### Deviations
- **`HORIZON_SOURCE_Y` moved to `atlas.js`** so Node tests can import atlas without loading Vite `assetUrl` via `constants.js`. Value stays **52**; `constants.js` re-exports.
- **Runner restart spin removed** in R7 (plan frame 0 only); R6 had left the 8-frame strip spinning.
- **South prop density** unchanged at **6–10**; R7 only names constants (no layout change vs R1).

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/atlas.js` | `HORIZON_SOURCE_Y`, `ATLAS.textSprite.*`, `TREX_FRAME_OFFSET`, cluster via `cactusClusterSrc` |
| `src/game/constants.js` | `SOUTH_PROP_COUNT_*`, `SOUTH_GROUND_SLICE_*`, `SOUTH_GROUND_PEBBLE_*`, `SOUTH_GROUND_TUFT_*`, `SOUTH_GROUND_DUNE_*` |
| `src/game/scale.js` | `computeScale`, `restartSpriteMultiple` (dpr **1.25** → N **3**, **1.5** → N **3**) |
| `src/game/runner/constants.js` | `computeRunnerScale`, digit/HUD fields mirrored from atlas |

### For post-R7
- All PLAN-DINO-RUN milestones through R7 are complete; optional follow-ups in plan §11 (jump dodge, ready-on-restart, visible HI n/3, night invert, audio files on disk) remain product choices, not blockers.
- Visual dpr **1.25** / **1.5** checks are browser-only (integer `S` and restart crop sizing).

## Post-R7 — Plain-first UX, content, world, deploy (completed)

### Built
- **Default route:** empty / `#` → `#plain` (`hashBody`, `replaceState` on load). Desert is `#world` via **ENTER WORLD** (was **PLAY GAME** / game-first).
- **HUD:** **PORTFOLIO** (was **SKIP GAME**); top-right LinkedIn control (pixel icon + label) replaces the permanent **ETHAN ROSE** name chip.
- **Section return:** `sectionReturn` tracks whether a section was opened from desert or plain; exit label is **Back to desert** or **Back to page**; plain scroll position restored after Experience / Projects dialogs.
- **Plain / section typography:** `@fontsource/source-serif-4` as `--font-plain` for `.plain-page` and `.section-dialog` copy (Press Start 2P still for titles / game chrome).
- **About:** highlights grid, `aboutCurrently`, restored `LogoMarquee` (`aboutMarqueeLogos`); hobbies as a chip list.
- **Experience:** roles use `role` / `company` / `location` / `dates` with two-column layout; removed `ExpandableDescription` (full copy always shown).
- **World layout:** `720×660` game px, walk `x 24–696`, `GROUND_BOTTOM` **640**, spawn centered; section gates at spawn offsets (triangle), posts only (no flanks); Dino Run gate at spawn + **190** y; opening horizon strip on all gates.
- **Props:** count **10–14**; footprint box gap `PROP_BOX_GAP_PX` **16** (replaces `PROP_MIN_SPACING`); `SPAWN_PROP_CLEAR_PX` **88**.
- **Welcome banner:** anchors below dino feet (`getDinoScreenFeet`), same transform style as portal labels.
- **Resize:** canvas `width/height: 100%`; shell + device-pixel `ResizeObserver`s; `Game.resize` keeps last `pixelBox` when only CSS size changes.
- **Deploy:** `vite.config.js` `base: '/'`; canonical / OG URLs → `https://erose112.github.io/`; `deploy/personal-website-redirect/` points at the user-pages root.

### Deviations
- **Game-first default** from PLAN §11 is reversed: plain is the landing surface; desert is opt-in.
- **HI n/3** HUD counter removed from the desert chrome (LinkedIn occupies the top-right slot).
- **Qflow** is no longer a separate Experience role; it lives in About currently / projects.
- **Milestone 7 note** that `LogoMarquee` was left out is obsolete — marquee is back on About.

### Tunable constants (file → name)
| File | Constants |
|------|-----------|
| `src/game/constants.js` | `WORLD_*`, `WALK_*`, `GROUND_*`, `SPAWN`, `SECTION_PORTAL_LAYOUT` / `PORTAL_DEFS`, `DINO_RUN_PORTAL_DEF`, `PROP_COUNT_*`, `PROP_BOX_GAP_PX`, `SPAWN_PROP_CLEAR_PX` |
| `src/index.css` | `--font-plain`, `.experience-*`, `.plain-page` / `.section-dialog` copy sizes |
| `vite.config.js` | `base` (`/`) |
