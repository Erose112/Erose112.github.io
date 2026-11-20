import { ATLAS } from './atlas.js'
import { boxesOverlap, footprintBox } from './collision.js'
import {
  DINO_RUN_PORTAL_DEF,
  GATE_OPENING_CLEAR_PX,
  GROUND_BOTTOM,
  GROUND_NORTH_BOTTOM,
  GROUND_TOP,
  PORTAL_DEFS,
  PROP_COUNT_MAX,
  PROP_COUNT_MIN,
  PROP_BOX_GAP_PX,
  PROP_PATH_CLEAR_PX,
  SPAWN_PROP_CLEAR_PX,
  SOUTH_PROP_COUNT_MAX,
  SOUTH_PROP_COUNT_MIN,
  SPAWN,
  WORLD_SEED,
  WORLD_WIDTH,
} from './constants.js'
import { createRng, randFloat, randInt } from './rng.js'

/**
 * @typedef {'small' | 'large'} CactusKind
 * @typedef {1 | 2 | 3} ClusterSize
 * @typedef {{
 *   footX: number,
 *   footY: number,
 *   kind: CactusKind,
 *   size: ClusterSize,
 *   footprint: { w: number, h: number },
 * }} PropCactus
 */

/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @param {number} px
 * @param {number} py
 */
/**
 * @param {PropCactus} prop
 * @param {number} footX
 * @param {number} footY
 * @param {number} footprintW
 * @param {number} footprintH
 */
function propFootprintOverlaps(prop, footX, footY, footprintW, footprintH) {
  const gap = PROP_BOX_GAP_PX
  const next = footprintBox(footX, footY, footprintW + gap, footprintH + gap)
  const existing = footprintBox(
    prop.footX,
    prop.footY,
    prop.footprint.w + gap,
    prop.footprint.h + gap,
  )
  return boxesOverlap(next, existing)
}

function distPointToSegment(ax, ay, bx, by, px, py) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const abLen2 = abx * abx + aby * aby
  let t = abLen2 > 0 ? (apx * abx + apy * aby) / abLen2 : 0
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * abx
  const cy = ay + t * aby
  return Math.hypot(px - cx, py - cy)
}

/**
 * @param {import('./rng.js').Rng} rng
 * @param {number} yMin
 * @param {number} yMax
 * @param {number} target
 * @param {PropCactus[]} props
 * @param {{ x: number, y: number }[]} openingGates
 * @param {{ x: number, y: number, path?: boolean }[]} pathGates
 */
function spawnPropsInBand(rng, yMin, yMax, target, props, openingGates, pathGates) {
  const maxAttempts = target * 80
  let attempts = 0

  const startLen = props.length
  while (props.length - startLen < target && attempts < maxAttempts) {
    attempts++
    const kind = rng() < 0.55 ? 'small' : 'large'
    const size = /** @type {ClusterSize} */ (randInt(rng, 1, 3))
    const unitW = kind === 'small' ? ATLAS.cactusSmall.w : ATLAS.cactusLarge.w
    const footX = randFloat(rng, unitW * size / 2 + 8, WORLD_WIDTH - unitW * size / 2 - 8)
    const footY = randFloat(rng, yMin + 20, yMax - 4)

    const footprintW = unitW * size
    const footprintH = kind === 'small' ? 6 : 8

    let ok = true
    if (Math.hypot(footX - SPAWN.x, footY - SPAWN.y) < SPAWN_PROP_CLEAR_PX) {
      ok = false
    }
    if (ok) {
      for (const other of props) {
        if (propFootprintOverlaps(other, footX, footY, footprintW, footprintH)) {
          ok = false
          break
        }
      }
    }
    if (!ok) {
      continue
    }

    for (const gate of openingGates) {
      if (Math.hypot(footX - gate.x, footY - gate.y) < GATE_OPENING_CLEAR_PX) {
        ok = false
        break
      }
    }
    if (!ok) {
      continue
    }

    for (const gate of pathGates) {
      if (gate.path === false) {
        continue
      }
      const d = distPointToSegment(SPAWN.x, SPAWN.y, gate.x, gate.y, footX, footY)
      if (d < PROP_PATH_CLEAR_PX) {
        ok = false
        break
      }
    }
    if (!ok) {
      continue
    }

    props.push({ footX, footY, kind, size, footprint: { w: footprintW, h: footprintH } })
  }
}

/** @returns {PropCactus[]} */
export function createPropCacti() {
  /** @type {PropCactus[]} */
  const props = []
  const northRng = createRng(WORLD_SEED + 7)
  const northTarget = randInt(northRng, PROP_COUNT_MIN, PROP_COUNT_MAX)
  const openingGates = [...PORTAL_DEFS, DINO_RUN_PORTAL_DEF]
  spawnPropsInBand(
    northRng,
    GROUND_TOP,
    GROUND_NORTH_BOTTOM,
    northTarget,
    props,
    openingGates,
    PORTAL_DEFS,
  )

  const southRng = createRng(WORLD_SEED + 11)
  const southTarget = randInt(southRng, SOUTH_PROP_COUNT_MIN, SOUTH_PROP_COUNT_MAX)
  spawnPropsInBand(
    southRng,
    GROUND_NORTH_BOTTOM,
    GROUND_BOTTOM,
    southTarget,
    props,
    openingGates,
    PORTAL_DEFS,
  )

  return props
}

/** @param {PropCactus[]} props */
export function propSolidColliders(props) {
  return props.map((p) => ({
    footX: p.footX,
    footY: p.footY,
    footprint: p.footprint,
  }))
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {PropCactus} prop
 */
export function drawPropCactus(ctx, img, prop) {
  const atlas = prop.kind === 'small' ? ATLAS.cactusSmall : ATLAS.cactusLarge
  const { x: sx, y: sy, w, h } = atlas
  const totalW = w * prop.size
  const startX = Math.round(prop.footX - totalW / 2)
  const drawY = Math.round(prop.footY - h)
  for (let i = 0; i < prop.size; i++) {
    ctx.drawImage(img, sx, sy, w, h, startX + i * w, drawY, w, h)
  }
}