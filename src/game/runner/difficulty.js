import { LANE_SPEED, TRACK_DEPTH } from './constants.js'

export const T_REACT = 0.2
export const FAIR_FRACTION = 0.9
export const CORRIDOR_MAX = 46
export const CORRIDOR_MIN = 28
export const CORRIDOR_RAMP_SCORE = 1500
export const AMBITION_RAMP_SCORE = 1000
export const AMBITION_MIN = 0.25
export const AMBITION_MAX = 1
export const DINO_ALONG_SCROLL = 28

/**
 * @param {number} score
 */
export function corridorLengthForScore(score) {
  const t = Math.min(1, Math.max(0, score / CORRIDOR_RAMP_SCORE))
  return CORRIDOR_MAX + (CORRIDOR_MIN - CORRIDOR_MAX) * t
}

/**
 * @param {number} score
 */
export function shiftAmbition(score) {
  const t = Math.min(1, Math.max(0, score / AMBITION_RAMP_SCORE))
  return AMBITION_MIN + (AMBITION_MAX - AMBITION_MIN) * t
}

/**
 * Time budget in seconds for vertical lane change after accounting for reaction.
 * @param {number} gap px between rows along scroll axis
 * @param {number} speed px per 60fps frame
 */
export function fairShiftCapPx(gap, speed) {
  const free = gap - DINO_ALONG_SCROLL
  const freeTime = free / (speed * 60)
  const budgetSec = FAIR_FRACTION * freeTime - T_REACT
  if (budgetSec <= 0) {
    return 0
  }
  return budgetSec * LANE_SPEED
}

/**
 * @param {number} corridorLen
 * @param {number} shiftLocal track-local px, signed
 */
export function corridorStartLocal(corridorLen, shiftLocal) {
  const unshifted = (TRACK_DEPTH - corridorLen) / 2
  const minStart = 0
  const maxStart = TRACK_DEPTH - corridorLen
  return Math.min(maxStart, Math.max(minStart, unshifted + shiftLocal))
}