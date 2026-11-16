# Third-party notices

## Chrome offline dinosaur game (Chromium)

Copyright 2014 The Chromium Authors.

Sprites, sound effects, and the read-only TypeScript excerpts under `reference/dino_game/` are used under the Chromium BSD-style license: https://chromium.googlesource.com/chromium/src/+/main/LICENSE

### Assets in this repository

| Path | Use |
| --- | --- |
| `public/sprites/100-offline-sprite.png` | 1× sprite sheet; loaded by the canvas game and exit button crop |
| `public/sprites/200-offline-sprite.png` | 2× sheet shipped for reference; not loaded by the app |
| `public/sounds/button-press.mp3` | Optional (not played in the current build) |
| `public/sounds/score-reached.mp3` | Optional (not played in the current build) |
| `public/sounds/hit.mp3` | Optional (not played in the current build) |
| `reference/dino_game/` | Read-only reference; not imported at runtime |

The HTML document preloads `public/sprites/100-offline-sprite.png` so the desert renderer can start after `Image.decode()`.