import { ATLAS } from './atlas.js'
import {
  GATE_OPENING_CLEAR_PX,
  GROUND_BOTTOM,
  GROUND_TOP,
  PORTAL_DEFS,
  PROP_COUNT_MAX,
  PROP_COUNT_MIN,
  PROP_MIN_SPACING,
  PROP_PATH_CLEAR_PX,
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

/** @returns {PropCactus[]} */
export function createPropCacti() {
  const rng = createRng(WORLD_SEED + 7)
  const target = randInt(rng, PROP_COUNT_MIN, PROP_COUNT_MAX)
  /** @type {PropCactus[]} */
  const props = []
  const maxAttempts = target * 80
  let attempts = 0

  while (props.length < target && attempts < maxAttempts) {
    attempts++
    const kind = rng() < 0.55 ? 'small' : 'large'
    const size = /** @type {ClusterSize} */ (randInt(rng, 1, 3))
    const unitW = kind === 'small' ? ATLAS.cactusSmall.w : ATLAS.cactusLarge.w
    const footX = randFloat(rng, unitW * size / 2 + 8, WORLD_WIDTH - unitW * size / 2 - 8)
    const footY = randFloat(rng, GROUND_TOP + 20, GROUND_BOTTOM - 4)

    let ok = true
    for (const other of props) {
      if (Math.hypot(footX - other.footX, footY - other.footY) < PROP_MIN_SPACING) {
        ok = false
        break
      }
    }
    if (!ok) {
      continue
    }

    for (const gate of PORTAL_DEFS) {
      if (Math.hypot(footX - gate.x, footY - gate.y) < GATE_OPENING_CLEAR_PX) {
        ok = false
        break
      }
    }
    if (!ok) {
      continue
    }

    for (const gate of PORTAL_DEFS) {
      const d = distPointToSegment(SPAWN.x, SPAWN.y, gate.x, gate.y, footX, footY)
      if (d < PROP_PATH_CLEAR_PX) {
        ok = false
        break
      }
    }
    if (!ok) {
      continue
    }

    const footprintW = unitW * size
    const footprintH = kind === 'small' ? 6 : 8
    props.push({ footX, footY, kind, size, footprint: { w: footprintW, h: footprintH } })
  }

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