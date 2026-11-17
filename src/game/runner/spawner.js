import { createRng, randInt } from '../rng.js'
import {
  CACTUS_LARGE,
  CACTUS_SMALL,
  GAP_COEFFICIENT,
  CLEAR_TIME_MS,
  MAX_CLUSTER_SIZE,
  MAX_GAP_COEFFICIENT,
  MAX_SEAM_PX,
  MAX_TYPE_STREAK,
  MIN_PASS_CORRIDOR_PX,
  TRACK_DEPTH,
  TRACK_TOP,
} from './constants.js'
import {
  corridorLengthForScore,
  corridorStartLocal,
  fairShiftCapPx,
  shiftAmbition,
} from './difficulty.js'

/**
 * @typedef {{
 *   worldX: number,
 *   clusterSize: number,
 *   type: 'small' | 'large',
 *   rowWidth: number,
 *   gapAfter: number,
 *   corridorCenterLocal: number,
 *   footprints: { footY: number, w: number, h: number }[],
 * }} RunnerRow
 */

/**
 * @param {number} rowWidth
 * @param {number} speed
 * @param {{ minGap: number }} typeCfg
 */
export function rowGap(rowWidth, speed, typeCfg) {
  const minGap = Math.round(rowWidth * speed + typeCfg.minGap * GAP_COEFFICIENT)
  const maxGap = Math.round(minGap * MAX_GAP_COEFFICIENT)
  return { minGap, maxGap }
}

/**
 * @param {() => number} rng
 * @param {number} minGap
 * @param {number} maxGap
 */
export function rollGap(rng, minGap, maxGap) {
  return randInt(rng, minGap, maxGap)
}

/**
 * Pack footprints above and below the corridor within the track band.
 *
 * @param {number} corridorStart track-local top of corridor
 * @param {number} corridorLen
 * @param {number} count
 * @param {number} depth
 * @param {() => number} rng
 */
function buildFootprints(corridorStart, corridorLen, count, footW, depth, rng) {
  const corridorEnd = corridorStart + corridorLen
  let above = Math.ceil(count / 2)
  let below = count - above
  if (count >= 3 && rng() > 0.5) {
    above = Math.floor(count / 2)
    below = count - above
  }

  /** @type {{ footY: number, w: number, h: number }[]} */
  const footprints = []

  let cursor = 0
  for (let i = 0; i < above; i += 1) {
    if (i > 0) {
      cursor += randInt(rng, 0, MAX_SEAM_PX)
    }
    const footLocal = cursor + depth
    if (footLocal > corridorStart - MIN_PASS_CORRIDOR_PX) {
      break
    }
    footprints.push({ footY: TRACK_TOP + footLocal, w: footW, h: depth })
    cursor = footLocal
  }

  let belowCursor = corridorEnd + (below > 0 ? randInt(rng, 0, MAX_SEAM_PX) : 0)
  for (let i = 0; i < below; i += 1) {
    if (i > 0) {
      belowCursor += randInt(rng, 0, MAX_SEAM_PX)
    }
    const footLocal = belowCursor + depth
    if (footLocal > TRACK_DEPTH) {
      break
    }
    footprints.push({ footY: TRACK_TOP + footLocal, w: footW, h: depth })
    belowCursor = footLocal
  }

  return footprints
}

/**
 * @param {() => number} rng
 * @param {number} speed
 * @param {number} score
 * @param {number} gapBefore
 * @param {{ type: string, streak: number } | null} lastType
 */
export function createRow(rng, speed, score, gapBefore, lastType) {
  const corridorLen = Math.max(MIN_PASS_CORRIDOR_PX, corridorLengthForScore(score))
  let type = rng() < 0.55 ? 'small' : 'large'
  if (lastType && lastType.streak >= MAX_TYPE_STREAK && lastType.type === type) {
    type = type === 'small' ? 'large' : 'small'
  }

  let clusterSize = randInt(rng, 1, MAX_CLUSTER_SIZE)
  const cfg = type === 'large' ? CACTUS_LARGE : CACTUS_SMALL
  if (clusterSize > 1 && speed < cfg.multipleSpeed) {
    clusterSize = 1
  }

  const rowWidth = cfg.footW * clusterSize
  const blocked = TRACK_DEPTH - corridorLen
  const count = Math.ceil(blocked / cfg.footH)

  let cap = fairShiftCapPx(gapBefore, speed)
  const ambition = shiftAmbition(score)
  let shift = (rng() * 2 - 1) * ambition * cap
  if (cap <= 0) {
    shift = 0
  } else {
    shift = Math.max(-cap, Math.min(cap, shift))
  }

  let corridorStart = corridorStartLocal(corridorLen, shift)
  let footprints = buildFootprints(
    corridorStart,
    corridorLen,
    count,
    cfg.footW,
    cfg.footH,
    rng,
  )

  if (gapBefore > 0 && cap <= 0) {
    const { minGap } = rowGap(rowWidth, speed, cfg)
    const extra = minGap - gapBefore
    if (extra > 0) {
      cap = fairShiftCapPx(minGap, speed)
      shift = 0
      corridorStart = corridorStartLocal(corridorLen, 0)
      footprints = buildFootprints(
        corridorStart,
        corridorLen,
        count,
        cfg.footW,
        cfg.footH,
        rng,
      )
    }
  }

  const corridorCenterLocal = corridorStart + corridorLen / 2
  const { minGap, maxGap } = rowGap(rowWidth, speed, cfg)
  const gapAfter = rollGap(rng, minGap, maxGap)

  return {
    worldX: 0,
    clusterSize,
    type,
    rowWidth,
    gapAfter,
    corridorCenterLocal,
    footprints,
  }
}

/**
 * @param {number} seed
 */
export function createSpawner(seed) {
  const rng = createRng(seed)
  return {
    lastType: /** @type {{ type: string, streak: number } | null} */ (null),
    spawnCursor: 0,
    pendingGap: 0,
    lastCorridorCenter: TRACK_DEPTH / 2,
    rowsSpawned: 0,
    rng,
  }
}

/**
 * @param {ReturnType<typeof createSpawner>} spawner
 * @param {{
 *   runningTimeMs: number,
 *   cameraX: number,
 *   visibleW: number,
 *   score: number,
 *   speed: number,
 * }} ctx
 * @returns {RunnerRow[]}
 */
export function maybeSpawnRows(spawner, ctx) {
  if (ctx.runningTimeMs < CLEAR_TIME_MS) {
    return []
  }

  const targetRight = ctx.cameraX + ctx.visibleW
  if (spawner.rowsSpawned === 0) {
    spawner.spawnCursor = Math.max(spawner.spawnCursor, targetRight)
  }

  if (spawner.spawnCursor > targetRight) {
    return []
  }

  /** @type {RunnerRow[]} */
  const spawned = []
  const gapBefore = spawner.rowsSpawned === 0 ? 0 : spawner.pendingGap
  const row = createRow(spawner.rng, ctx.speed, ctx.score, gapBefore, spawner.lastType)
  row.worldX = spawner.spawnCursor
  spawned.push(row)

  if (!spawner.lastType || spawner.lastType.type !== row.type) {
    spawner.lastType = { type: row.type, streak: 1 }
  } else {
    spawner.lastType.streak += 1
  }

  spawner.lastCorridorCenter = row.corridorCenterLocal
  spawner.pendingGap = row.gapAfter
  spawner.spawnCursor = row.worldX + row.rowWidth + row.gapAfter
  spawner.rowsSpawned += 1

  return spawned
}