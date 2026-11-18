/** Horizon strip source Y (`horizon_line.ts` uses 52; see PLAN §5). */
export const HORIZON_SOURCE_Y = 52

/** 1× ldpi crops transcribed from reference offline_sprite_definitions / PLAN §5 & PLAN-DINO-RUN §4. */
export const ATLAS = {
  tRex: { x: 848, y: 2, w: 44, h: 47 },
  cloud: { x: 86, y: 2, w: 46, h: 14 },
  horizon: { x: 2, y: HORIZON_SOURCE_Y, w: 600, h: 12 },
  cactusLarge: { x: 332, y: 2, w: 25, h: 50 },
  cactusSmall: { x: 228, y: 2, w: 17, h: 35 },
  restart: { x: 2, y: 68, w: 36, h: 32 },
  pterodactyl: { x: 134, y: 2, w: 46, h: 40 },
  pterodactylFrame2: { x: 180, y: 2, w: 46, h: 40 },
  /** Digits 0–9, then H (10) and I (11); GAME OVER on row y=15 (`textSprite` in reference). */
  textSprite: {
    x: 655,
    digitRowY: 2,
    digitW: 10,
    digitH: 13,
    digitStep: 11,
    hiIndex: 10,
    iIndex: 11,
    gameOver: { x: 655, y: 15, w: 191, h: 11 },
  },
}

export const TREX_FRAME_OFFSET = {
  stand: 0,
  blink: 44,
  run1: 88,
  run2: 132,
  crash: 220,
}

/**
 * Source rect for a runner HUD digit or letter (0–9, H=10, I=11).
 * @param {number} digit
 */
export function runnerDigitSrc(digit) {
  const t = ATLAS.textSprite
  return {
    x: t.x + digit * t.digitW,
    y: t.digitRowY,
    w: t.digitW,
    h: t.digitH,
  }
}

/**
 * Cluster cactus crop (`obstacle.ts` draw): width grows with size, sourceX centered on size.
 * @param {'small' | 'large'} kind
 * @param {number} clusterSize
 */
export function cactusClusterSrc(kind, clusterSize) {
  const atlas = kind === 'small' ? ATLAS.cactusSmall : ATLAS.cactusLarge
  const destW = atlas.w * clusterSize
  const sourceX = atlas.x + (atlas.w * clusterSize * (clusterSize - 1)) / 2
  return { x: sourceX, y: atlas.y, w: destW, h: atlas.h }
}