import {
  dinoScreenX,
  GAP_COEFFICIENT,
  LANE_SPEED,
  RUN_REF_W,
  SLOW_GAP_COEFFICIENT,
  SLOW_SPEED_ACCEL,
  SLOW_SPEED_MAX,
  SLOW_SPEED_START,
  SPEED_ACCEL,
  SPEED_MAX,
  SPEED_START,
  TRACK_TOP,
  FOOT_Y_MIN,
  FOOT_Y_MAX,
  BIRD_SHADOW_DEPTH,
  BIRD_SHADOW_WIDTH,
} from './constants.js'
import { T_REACT } from './difficulty.js'
import { createSpawner, maybeSpawnRows } from './spawner.js'
import { createRunScoring, stepRunScoringWithSpeed } from './scoring.js'
import { stepRunnerMotion } from './simulate.js'

const BOT_VISIBLE_W = RUN_REF_W

/**
 * Fair bot: after clearing a row, wait T_REACT before moving toward the next corridor.
 *
 * @param {{
 *   durationSec: number,
 *   seed: number,
 *   slow?: boolean,
 *   reactDelaySec?: number,
 * }} opts
 * @returns {{ survived: boolean, hitAtSec: number | null }}
 */
export function runFairnessBot(opts) {
  const {
    durationSec,
    seed,
    slow = false,
    reactDelaySec = T_REACT,
    trace = false,
  } = opts

  const speedCfg = slow
    ? { start: SLOW_SPEED_START, max: SLOW_SPEED_MAX, accel: SLOW_SPEED_ACCEL }
    : { start: SPEED_START, max: SPEED_MAX, accel: SPEED_ACCEL }

  const gapCoefficient = slow ? SLOW_GAP_COEFFICIENT : GAP_COEFFICIENT
  const scoring = createRunScoring()
  scoring.speed = speedCfg.start

  const spawner = createSpawner(seed)
  spawner.spawnCursor = BOT_VISIBLE_W

  let cameraX = 0
  let footY = (FOOT_Y_MIN + FOOT_Y_MAX) / 2
  let runningTimeMs = 0
  /** @type {import('./spawner.js').RunnerRow[]} */
  let rows = []
  let clearedRows = 0
  let waitUntilSec = 0
  let lastClearSec = -1
  /** @type {number[]} */
  const reactViolations = []
  let earlyMovesAfterClear = 0
  let timeSec = 0
  const dinoX = dinoScreenX(BOT_VISIBLE_W)

  const dt = 1 / 120
  while (timeSec < durationSec) {
    runningTimeMs += dt * 1000
    stepRunScoringWithSpeed(scoring, dt, speedCfg, true)

    const newRows = maybeSpawnRows(spawner, {
      runningTimeMs,
      cameraX,
      visibleW: BOT_VISIBLE_W,
      score: scoring.score,
      speed: scoring.speed,
      gapCoefficient,
    })
    if (newRows.length > 0) {
      rows.push(...newRows)
    }

    const dinoWorldX = cameraX + dinoX
    while (clearedRows < rows.length) {
      const row = rows[clearedRows]
      const rowBack = row.worldX + row.rowWidth
      if (dinoWorldX <= rowBack) {
        break
      }
      clearedRows += 1
      lastClearSec = timeSec
      waitUntilSec = timeSec + reactDelaySec
    }

    let axisY = 0
    if (timeSec >= waitUntilSec && clearedRows < rows.length) {
      const targetRow = rows[clearedRows]
      const aimLocal =
        targetRow.isBird && targetRow.safeSlotCenterLocal != null
          ? targetRow.safeSlotCenterLocal
          : targetRow.corridorCenterLocal
      const aimY = TRACK_TOP + aimLocal
      const dy = aimY - footY
      if (Math.abs(dy) > 0.5) {
        axisY = Math.sign(dy)
      }
    } else if (timeSec >= waitUntilSec && clearedRows >= rows.length && rows.length > 0) {
      const last = rows[rows.length - 1]
      const aimLocal =
        last.isBird && last.safeSlotCenterLocal != null
          ? last.safeSlotCenterLocal
          : last.corridorCenterLocal
      const aimY = TRACK_TOP + aimLocal
      const dy = aimY - footY
      if (Math.abs(dy) > 0.5) {
        axisY = Math.sign(dy)
      }
    }

    if (trace && axisY !== 0 && lastClearSec >= 0) {
      const sinceClear = timeSec - lastClearSec
      if (sinceClear < reactDelaySec - 1e-6) {
        reactViolations.push(sinceClear)
      }
      if (sinceClear <= dt + 1e-6) {
        earlyMovesAfterClear += 1
      }
    }

    const obstacles = []
    const margin = 100
    for (const row of rows) {
      if (row.worldX + row.rowWidth < cameraX + dinoX - margin) {
        continue
      }
      if (row.worldX > cameraX + dinoX + margin) {
        continue
      }
      const footX = row.worldX + row.rowWidth / 2
      for (const fp of row.footprints) {
        obstacles.push({ footX, footY: fp.footY, w: fp.w, h: fp.h })
      }
      if (row.isBird && row.shadowFootY != null) {
        obstacles.push({
          footX: row.worldX + BIRD_SHADOW_WIDTH / 2,
          footY: row.shadowFootY,
          w: BIRD_SHADOW_WIDTH,
          h: BIRD_SHADOW_DEPTH,
        })
      }
    }

    const motion = stepRunnerMotion({
      cameraX,
      dinoX,
      footY,
      axisY,
      speed: scoring.speed,
      dt,
      obstacles,
    })
    if (motion.hit) {
      return {
        survived: false,
        hitAtSec: timeSec,
        reactViolations,
        earlyMovesAfterClear,
      }
    }
    cameraX = motion.cameraX
    footY = motion.footY

    timeSec += dt
  }

  return {
    survived: true,
    hitAtSec: null,
    reactViolations,
    earlyMovesAfterClear,
  }
}