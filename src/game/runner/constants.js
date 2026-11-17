import { DESERT_COLOR } from '../constants.js'

export { DESERT_COLOR }

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