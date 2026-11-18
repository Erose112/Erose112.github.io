import { SPEED_ACCEL, SPEED_MAX, SPEED_START } from './constants.js'

const SCORE_FACTOR = 0.025
const SCORE_MAX = 99999

/**
 * @typedef {{
 *   distanceRan: number,
 *   speed: number,
 *   score: number,
 *   flashUntil: number,
 *   flashOn: boolean,
 *   flashIterationsLeft: number,
 *   lastScoreHundred: number,
 * }} RunScoring
 */

export function createRunScoring() {
  return {
    distanceRan: 0,
    speed: SPEED_START,
    score: 0,
    flashUntil: 0,
    flashOn: false,
    flashIterationsLeft: 0,
    lastScoreHundred: -1,
  }
}

/**
 * @param {RunScoring} state
 * @param {number} dt
 * @param {boolean} integrate when false (ready / paused), freeze distance and speed
 */
export function stepRunScoring(state, dt, integrate) {
  if (!integrate) {
    return
  }
  const frames = dt * 60
  state.distanceRan += state.speed * frames
  if (state.speed < SPEED_MAX) {
    state.speed += SPEED_ACCEL * frames
  }
  const nextScore = Math.min(
    SCORE_MAX,
    Math.round(Math.ceil(state.distanceRan) * SCORE_FACTOR),
  )
  if (nextScore !== state.score) {
    state.score = nextScore
    const hundred = Math.floor(nextScore / 100)
    if (hundred > state.lastScoreHundred && nextScore % 100 === 0) {
      state.lastScoreHundred = hundred
      state.flashIterationsLeft = 3
      state.flashOn = false
      state.flashUntil = 0
    }
  }
}

/**
 * @param {RunScoring} state
 * @param {number} nowMs
 */
export function updateScoreFlash(state, nowMs) {
  if (state.flashIterationsLeft <= 0) {
    return
  }
  if (nowMs >= state.flashUntil) {
    state.flashOn = !state.flashOn
    state.flashUntil = nowMs + 250
    if (!state.flashOn) {
      state.flashIterationsLeft -= 1
    }
  }
}

export function scoreDrawVisible(state, nowMs) {
  if (state.flashIterationsLeft <= 0) {
    return true
  }
  updateScoreFlash(state, nowMs)
  return state.flashOn
}

/** Chromium-style speed after n integrated 60fps frames (normal mode). */
export function speedAtFrame(frames) {
  return Math.min(SPEED_MAX, SPEED_START + SPEED_ACCEL * frames)
}

/** Score from accumulated scroll distance. */
export function scoreFromDistance(distanceRan) {
  return Math.round(Math.ceil(distanceRan) * SCORE_FACTOR)
}

/**
 * @param {RunScoring} state
 * @param {number} dt
 * @param {{ start: number, max: number, accel: number }} speedCfg
 */
export function stepRunScoringWithSpeed(state, dt, speedCfg, integrate = true) {
  if (!integrate) {
    return
  }
  const frames = dt * 60
  state.distanceRan += state.speed * frames
  if (state.speed < speedCfg.max) {
    state.speed += speedCfg.accel * frames
  }
  const nextScore = Math.min(
    SCORE_MAX,
    Math.round(Math.ceil(state.distanceRan) * SCORE_FACTOR),
  )
  if (nextScore !== state.score) {
    state.score = nextScore
    const hundred = Math.floor(nextScore / 100)
    if (hundred > state.lastScoreHundred && nextScore % 100 === 0) {
      state.lastScoreHundred = hundred
      state.flashIterationsLeft = 3
      state.flashOn = false
      state.flashUntil = 0
    }
  }
}