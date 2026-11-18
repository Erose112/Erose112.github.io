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
  BIRD_MIN_SPEED,
  BIRD_SPAWN_CHANCE,
  BIRD_SHADOW_DEPTH,
  BIRD_SHADOW_WIDTH,
  BIRD_MIN_GAP,
  BIRD_SKY_Y,
} from './constants.js'
import {
  corridorLengthForScore,
  corridorStartLocal,
  fairShiftCapPx,
  minGapForFairShiftZero,
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
 *   corridorLen: number,
 *   shiftLocal: number,
 *   footprintDepth: number,
 *   footprints: { footY: number, w: number, h: number }[],
 *   isBird?: boolean,
 *   openingLen?: number,
 *   shadowFootY?: number,
 *   safeSlotCenterLocal?: number,
 *   birdSkyY?: number,
 *   shadowAtFar?: boolean,
 * }} RunnerRow
 */

/**
 * @param {number} rowWidth
 * @param {number} speed
 * @param {{ minGap: number }} typeCfg
 * @param {number} [gapCoefficient]
 */
export function rowGap(rowWidth, speed, typeCfg, gapCoefficient = GAP_COEFFICIENT) {
  const minGap = Math.round(rowWidth * speed + typeCfg.minGap * gapCoefficient)
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
const STACK_OVERLAP_PX = 2

function buildFootprints(corridorStart, corridorLen, count, footW, depth, rng) {
  const corridorEnd = corridorStart + corridorLen
  /** @type {{ footY: number, w: number, h: number }[]} */
  const footprints = []

  let remaining = count
  let cursor = 0
  while (remaining > 0) {
    if (footprints.length > 0) {
      cursor = cursor - STACK_OVERLAP_PX + randInt(rng, 0, MAX_SEAM_PX)
    }
    const footLocal = cursor + depth
    if (footLocal > corridorStart) {
      break
    }
    footprints.push({ footY: TRACK_TOP + footLocal, w: footW, h: depth })
    cursor = footLocal
    remaining -= 1
  }

  let belowCursor = corridorEnd
  if (remaining > 0) {
    belowCursor += randInt(rng, 0, MAX_SEAM_PX)
  }
  while (remaining > 0) {
    const footLocal = belowCursor + depth
    if (footLocal > TRACK_DEPTH) {
      break
    }
    footprints.push({ footY: TRACK_TOP + footLocal, w: footW, h: depth })
    belowCursor = footLocal - STACK_OVERLAP_PX + randInt(rng, 0, MAX_SEAM_PX)
    remaining -= 1
  }

  return footprints
}

/**
 * Vertical empty spans along track depth (0 = top of band).
 *
 * @param {RunnerRow} row
 */
export function verticalSeamsInRow(row) {
  const corridorStart = row.corridorCenterLocal - row.corridorLen / 2
  const corridorEnd = corridorStart + row.corridorLen
  const solids = row.footprints
    .map((fp) => {
      const bottom = fp.footY - TRACK_TOP
      return { top: bottom - fp.h, bottom }
    })
    .sort((a, b) => a.top - b.top)

  const above = solids.filter((s) => s.bottom <= corridorStart + 1e-6)
  const below = solids.filter((s) => s.top >= corridorEnd - 1e-6)

  /** @type {number[]} */
  const gaps = []
  for (let i = 0; i < above.length; i += 1) {
    if (i > 0) {
      gaps.push(above[i].top - above[i - 1].bottom)
    }
  }
  if (above.length > 0) {
    gaps.push(corridorStart - above[above.length - 1].bottom)
  }
  if (below.length > 0) {
    gaps.push(below[0].top - corridorEnd)
    for (let i = 1; i < below.length; i += 1) {
      gaps.push(below[i].top - below[i - 1].bottom)
    }
  }
  return gaps
}

/**
 * Sky sprite y from safe-slot depth (far / middle / near).
 * @param {number} safeCenterLocal
 */
function birdSkyYForSafeCenter(safeCenterLocal) {
  const t = safeCenterLocal / TRACK_DEPTH
  if (t < 1 / 3) {
    return BIRD_SKY_Y[0]
  }
  if (t < 2 / 3) {
    return BIRD_SKY_Y[1]
  }
  return BIRD_SKY_Y[2]
}

/**
 * @param {() => number} rng
 * @param {number} speed
 * @param {number} score
 * @param {number} gapBefore
 * @param {{ type: string, streak: number } | null} lastType
 * @param {number | null} prevCorridorCenter
 * @param {number} [gapCoefficient]
 */
/**
 * Deterministic bird row without consuming the spawner RNG stream.
 * @param {number} seed
 * @param {number} rowIndex
 * @param {number} speed
 */
function shouldSpawnBird(seed, rowIndex, speed) {
  if (speed < BIRD_MIN_SPEED) {
    return false
  }
  const mix = (rowIndex * 1103515245 + seed * 2654435761) >>> 0
  return mix % 10000 < BIRD_SPAWN_CHANCE * 10000
}

export function createBirdRow(
  rng,
  speed,
  score,
  gapBefore,
  lastType,
  prevCorridorCenter = null,
  gapCoefficient = GAP_COEFFICIENT,
) {
  const corridorLen = Math.max(MIN_PASS_CORRIDOR_PX, corridorLengthForScore(score))
  const openingLen = corridorLen + BIRD_SHADOW_DEPTH

  let type = rng() < 0.55 ? 'small' : 'large'
  if (lastType && lastType.streak >= MAX_TYPE_STREAK && lastType.type === type) {
    type = type === 'small' ? 'large' : 'small'
  }

  let clusterSize = randInt(rng, 1, MAX_CLUSTER_SIZE)
  const cfg = type === 'large' ? CACTUS_LARGE : CACTUS_SMALL
  if (clusterSize > 1 && speed < cfg.multipleSpeed) {
    clusterSize = 1
  }

  const cactusRowWidth = cfg.footW * clusterSize
  const rowWidth = Math.max(cactusRowWidth, BIRD_SHADOW_WIDTH)
  const blocked = TRACK_DEPTH - openingLen
  const count = Math.ceil(blocked / cfg.footH)

  let effectiveGap = gapBefore
  if (effectiveGap > 0 && prevCorridorCenter != null) {
    const need = minGapForFairShiftZero(prevCorridorCenter, speed)
    if (effectiveGap < need) {
      effectiveGap = need
    }
  }

  let cap = fairShiftCapPx(effectiveGap, speed)
  const ambition = shiftAmbition(score)
  let shift = (rng() * 2 - 1) * ambition * cap
  if (cap <= 0) {
    shift = 0
  } else {
    shift = Math.max(-cap, Math.min(cap, shift))
  }

  const shadowAtFar = rng() < 0.5
  const openStartDefault = (TRACK_DEPTH - openingLen) / 2
  const defaultSafeCenter = shadowAtFar
    ? openStartDefault + BIRD_SHADOW_DEPTH + corridorLen / 2
    : openStartDefault + corridorLen / 2
  const safeCenterLocal = Math.min(
    TRACK_DEPTH - corridorLen / 2,
    Math.max(corridorLen / 2, defaultSafeCenter + shift),
  )
  const openingStart = shadowAtFar
    ? safeCenterLocal - BIRD_SHADOW_DEPTH - corridorLen / 2
    : safeCenterLocal - corridorLen / 2
  const clampedOpenStart = Math.min(
    TRACK_DEPTH - openingLen,
    Math.max(0, openingStart),
  )
  const adjustedSafeCenter =
    shadowAtFar
      ? clampedOpenStart + BIRD_SHADOW_DEPTH + corridorLen / 2
      : clampedOpenStart + corridorLen / 2

  const footprints = buildFootprints(
    clampedOpenStart,
    openingLen,
    count,
    cfg.footW,
    cfg.footH,
    rng,
  )

  const shiftLocal = adjustedSafeCenter - TRACK_DEPTH / 2
  const shadowLocalTop = shadowAtFar
    ? clampedOpenStart
    : clampedOpenStart + corridorLen
  const shadowFootY = TRACK_TOP + shadowLocalTop + BIRD_SHADOW_DEPTH

  const minGap = Math.round(rowWidth * speed + BIRD_MIN_GAP * gapCoefficient)
  const maxGap = Math.round(minGap * MAX_GAP_COEFFICIENT)
  const gapAfter = rollGap(rng, minGap, maxGap)

  return {
    worldX: 0,
    clusterSize,
    type,
    rowWidth,
    gapAfter,
    corridorLen,
    shiftLocal,
    footprintDepth: cfg.footH,
    corridorCenterLocal: adjustedSafeCenter,
    footprints,
    gapUsed: effectiveGap,
    isBird: true,
    openingLen,
    openingStartLocal: clampedOpenStart,
    shadowFootY,
    safeSlotCenterLocal: adjustedSafeCenter,
    birdSkyY: birdSkyYForSafeCenter(adjustedSafeCenter),
    shadowAtFar,
  }
}

/**
 * @param {() => number} rng
 * @param {number} speed
 * @param {number} score
 * @param {number} gapBefore
 * @param {{ type: string, streak: number } | null} lastType
 * @param {number | null} prevCorridorCenter
 * @param {number} [gapCoefficient]
 */
export function createRow(
  rng,
  speed,
  score,
  gapBefore,
  lastType,
  prevCorridorCenter = null,
  gapCoefficient = GAP_COEFFICIENT,
) {
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

  let effectiveGap = gapBefore
  if (effectiveGap > 0 && prevCorridorCenter != null) {
    const need = minGapForFairShiftZero(prevCorridorCenter, speed)
    if (effectiveGap < need) {
      effectiveGap = need
    }
  }

  let cap = fairShiftCapPx(effectiveGap, speed)
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

  const unshiftedStart = (TRACK_DEPTH - corridorLen) / 2
  let shiftLocal = corridorStart - unshiftedStart

  const corridorCenterLocal = corridorStart + corridorLen / 2
  const { minGap, maxGap } = rowGap(rowWidth, speed, cfg, gapCoefficient)
  const gapAfter = rollGap(rng, minGap, maxGap)

  return {
    worldX: 0,
    clusterSize,
    type,
    rowWidth,
    gapAfter,
    corridorLen,
    shiftLocal,
    footprintDepth: cfg.footH,
    corridorCenterLocal,
    footprints,
    gapUsed: effectiveGap,
  }
}

/**
 * @param {number} seed
 */
export function createSpawner(seed) {
  const rng = createRng(seed)
  return {
    seed,
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
 *   gapCoefficient?: number,
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
  const builder =
    shouldSpawnBird(spawner.seed, spawner.rowsSpawned, ctx.speed)
      ? createBirdRow
      : createRow
  const row = builder(
    spawner.rng,
    ctx.speed,
    ctx.score,
    gapBefore,
    spawner.lastType,
    spawner.rowsSpawned > 0 ? spawner.lastCorridorCenter : null,
    ctx.gapCoefficient,
  )
  row.worldX = spawner.spawnCursor
  row.buildScore = ctx.score
  row.buildSpeed = ctx.speed
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