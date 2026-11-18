# Third-party notices

## Chrome offline dinosaur game (Chromium)

Copyright 2014 The Chromium Authors.

Sprites, sound effects, and the read-only TypeScript excerpts under `reference/dino_game/` are used under the Chromium BSD-style license: https://chromium.googlesource.com/chromium/src/+/main/LICENSE

### Assets in this repository

| Path | Use |
| --- | --- |
| `public/sprites/100-offline-sprite.png` | 1× sprite sheet; canvas desert and runner; section exit / runner restart crops |
| `public/sprites/200-offline-sprite.png` | 2× sheet shipped for reference; not loaded by the app |
| `public/sounds/button-press.mp3` | Dino Run start/restart (muted by default; M toggles) |
| `public/sounds/score-reached.mp3` | Dino Run each 100 points |
| `public/sounds/hit.mp3` | Dino Run crash |
| `reference/dino_game/` | Read-only reference; not imported at runtime |

The HTML document preloads `public/sprites/100-offline-sprite.png` so the desert renderer can start after `Image.decode()`.

### 1× sprite crops (`src/game/atlas.js`)

All source rectangles below are in game pixels on `100-offline-sprite.png`. Runtime code reads them from `ATLAS`, `TREX_FRAME_OFFSET`, `runnerDigitSrc()`, and `cactusClusterSrc()`.

| Crop | Source rect (x, y, w, h) | Use |
| --- | --- | --- |
| T-Rex stand / jump | (848, 2, 44, 47) + offset 0 | Desert idle; runner ready / paused |
| T-Rex blink | + offset 44 | Desert idle; runner ready / paused blink |
| T-Rex run frame 1 | + offset 88 | Desert run; runner playing |
| T-Rex run frame 2 | + offset 132 | Desert run; runner playing |
| T-Rex crashed | + offset 220 | Runner game over |
| Cloud | (86, 2, 46, 14) | Desert (filled outline); runner clouds |
| Horizon strip | (2, 52, 600, 12) | Desert ground slices; runner horizon tile |
| Small cactus (single) | (228, 2, 17, 35) | Desert props flanks/small; runner size-1 cluster |
| Small cactus cluster ×2 | (245, 2, 34, 35) | Runner obstacles |
| Small cactus cluster ×3 | (279, 2, 51, 35) | Runner obstacles |
| Large cactus (single) | (332, 2, 25, 50) | Desert portals/props; runner size-1 cluster |
| Large cactus cluster ×2 | (357, 2, 50, 50) | Runner obstacles |
| Large cactus cluster ×3 | (407, 2, 75, 50) | Runner obstacles |
| Pterodactyl frame 1 | (134, 2, 46, 40) | Dino gate decoration; runner bird row |
| Pterodactyl frame 2 | (180, 2, 46, 40) | Dino gate; runner bird row |
| Restart / exit frame 0 | (2, 68, 36, 32) | Section exit button; runner restart (frame 0 only) |
| Score digit 0–9 | (655 + 10×d, 2, 10, 13) | Runner HUD current score and HI digits |
| Score glyph H | (755, 2, 10, 13) | Runner HUD `HI` label |
| Score glyph I | (765, 2, 10, 13) | Runner HUD `HI` label |
| GAME OVER | (655, 15, 191, 11) | Runner canvas game-over banner |

Runner obstacle collision uses base footprints from `src/game/runner/constants.js` (`CACTUS_SMALL` / `CACTUS_LARGE`), not the full sprite collision boxes from the Chromium reference.