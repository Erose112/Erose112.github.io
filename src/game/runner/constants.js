export const DESERT_COLOR = '#f7f7f7'

/** Fixed playfield height in runner game pixels (PLAN-DINO-RUN §4). */
export const PLAYFIELD_H = 180

export const SKY_BOTTOM = 36
export const TRACK_TOP = 52
export const TRACK_BOTTOM = 136
export const TRACK_DEPTH = TRACK_BOTTOM - TRACK_TOP

export const FOOTPRINT_W = 28
export const FOOTPRINT_H = 12

export const LANE_SPEED = 240

export const DINO_X_FRAC = 0.12
export const DINO_X_MIN = 48
export const DINO_X_MAX = 96

export const FOOT_Y_MIN = TRACK_TOP + FOOTPRINT_H
export const FOOT_Y_MAX = TRACK_BOTTOM

export const RUN_REF_W = 600

/** Normal-mode speed ramp (px per 60fps frame). */
export const SPEED_START = 6
export const SPEED_MAX = 13
export const SPEED_ACCEL = 0.001

/** Slow mode (R6 UI later); used by fairness bot tests. */
export const SLOW_SPEED_START = 4.2
export const SLOW_SPEED_MAX = 9
export const SLOW_SPEED_ACCEL = 0.0005
export const SLOW_GAP_COEFFICIENT = 0.6

export const HORIZON_TILE_W = 600
export const HORIZON_H = 12

export const CLOUD_MAX = 6
export const CLOUD_FREQ = 0.5
export const CLOUD_GAP_MIN = 100
export const CLOUD_GAP_MAX = 400
export const CLOUD_Y_MIN = 4
export const CLOUD_Y_MAX = 28

export const TEXT_SPRITE_X = 655
export const DIGIT_W = 10
export const DIGIT_H = 13
export const DIGIT_STEP = 11
export const HUD_Y = 5
export const HUD_HI_ALPHA = 0.8

/**
 * @param {number} bufferW
 * @param {number} bufferH
 */
export function computeRunnerScale(bufferW, bufferH) {
  const fromW = Math.round(bufferW / RUN_REF_W)
  const fromH = Math.floor(bufferH / PLAYFIELD_H)
  return Math.max(1, Math.min(fromW, fromH))
}

/**
 * @param {number} visibleW
 */
export function dinoScreenX(visibleW) {
  const raw = Math.round(visibleW * DINO_X_FRAC)
  return Math.max(DINO_X_MIN, Math.min(DINO_X_MAX, raw))
}

/**
 * @param {number} visibleH
 */
export function playfieldOffsetY(visibleH) {
  if (visibleH > PLAYFIELD_H) {
    return (visibleH - PLAYFIELD_H) / 2
  }
  return 0
}

export const CLEAR_TIME_MS = 3000
export const GAMEOVER_CLEAR_MS = 1200

export const GAP_COEFFICIENT = 0.6
export const MAX_GAP_COEFFICIENT = 1.5
export const MAX_CLUSTER_SIZE = 3
export const MAX_TYPE_STREAK = 2
export const MAX_SEAM_PX = 4
export const MIN_PASS_CORRIDOR_PX = 14

export const CACTUS_SMALL = {
  id: 'small',
  spriteW: 17,
  spriteH: 35,
  footW: 17,
  footH: 10,
  minGap: 120,
  multipleSpeed: 4,
}

export const CACTUS_LARGE = {
  id: 'large',
  spriteW: 25,
  spriteH: 50,
  footW: 25,
  footH: 12,
  minGap: 120,
  multipleSpeed: 7,
}

export const GAME_OVER_SRC = { x: 655, y: 15, w: 191, h: 11 }
export const GAME_OVER_Y_FRAC = Math.round((PLAYFIELD_H - 25) / 3)

export const TREX_CRASH_OFFSET = 220

/** Bird rows (PLAN-DINO-RUN §10). */
export const BIRD_MIN_SPEED = 8.5
export const BIRD_SPAWN_CHANCE = 0.4
export const BIRD_SHADOW_DEPTH = 12
export const BIRD_SHADOW_WIDTH = 46
export const BIRD_MIN_GAP = 150
export const BIRD_TELEGRAPH_SEC = 0.6
export const BIRD_TELEGRAPH_BLINK_MS = 1000 / 3
export const RUNNER_PTERO_FRAME_MS = 1000 / 6

export const BIRD_SKY_Y = [8, 16, 24]