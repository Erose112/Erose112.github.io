import { HORIZON_SOURCE_Y } from './constants.js'

/** 1× ldpi crops transcribed from reference offline_sprite_definitions / PLAN §5. */
export const ATLAS = {
  tRex: { x: 848, y: 2, w: 44, h: 47 },
  cloud: { x: 86, y: 2, w: 46, h: 14 },
  horizon: { x: 2, y: HORIZON_SOURCE_Y, w: 600, h: 12 },
  cactusLarge: { x: 332, y: 2, w: 25, h: 50 },
  cactusSmall: { x: 228, y: 2, w: 17, h: 35 },
  restart: { x: 2, y: 68, w: 36, h: 32 },
  pterodactyl: { x: 134, y: 2, w: 46, h: 40 },
  pterodactylFrame2: { x: 180, y: 2, w: 46, h: 40 },
}

export const TREX_FRAME_OFFSET = {
  stand: 0,
  blink: 44,
  run1: 88,
  run2: 132,
}