import { ATLAS } from './atlas.js'
import {
  DESERT_COLOR,
  DUNE_TINT,
  DINO_RUN_PORTAL_DEF,
  GROUND_BOTTOM,
  GROUND_NORTH_BOTTOM,
  GROUND_TOP,
  HORIZON_SLICE_MAX_W,
  HORIZON_SLICE_MIN_W,
  PORTAL_DEFS,
  SPAWN,
  WORLD_HEIGHT,
  WORLD_SEED,
  WORLD_WIDTH,
} from './constants.js'
import { createRng, randFloat, randInt } from './rng.js'

const INK_SPECK = '#535353'

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource | null} sprite
 * @param {import('./rng.js').Rng} rng
 * @param {number} yTop
 * @param {number} yBottom
 * @param {{ x: number, y: number }[]} gateHints
 * @param {number} sliceCount
 * @param {number} pebbleCount
 * @param {number} tuftCount
 * @param {number} duneCount
 */
function paintGroundBand(ctx, sprite, rng, yTop, yBottom, gateHints, sliceCount, pebbleCount, tuftCount, duneCount) {
  const { x: hsx, y: hsy, w: hw, h: hh } = ATLAS.horizon
  const groundH = yBottom - yTop

  for (let i = 0; i < sliceCount; i++) {
    const sliceW = randInt(rng, HORIZON_SLICE_MIN_W, HORIZON_SLICE_MAX_W)
    const srcX = randInt(rng, 0, Math.max(0, hw - sliceW))
    const x = randInt(rng, 0, WORLD_WIDTH - sliceW)
    const nearGate = gateHints.reduce(
      (best, g) => Math.min(best, Math.hypot(x - g.x, yTop - g.y)),
      Infinity,
    )
    const extraRows = nearGate < 140 ? randInt(rng, 0, 2) : 0
    const y = yTop + randInt(rng, 0, Math.max(0, groundH - hh - extraRows * 4))
    if (sprite) {
      ctx.drawImage(sprite, hsx + srcX, hsy, sliceW, hh, x, y, sliceW, hh)
    } else {
      ctx.fillStyle = INK_SPECK
      ctx.fillRect(x, y, sliceW, hh)
    }
  }

  for (let i = 0; i < pebbleCount; i++) {
    const x = randFloat(rng, 0, WORLD_WIDTH)
    const y = randFloat(rng, yTop, yBottom - 2)
    const s = rng() < 0.6 ? 1 : 2
    ctx.fillStyle = INK_SPECK
    ctx.fillRect(Math.floor(x), Math.floor(y), s, s)
  }

  for (let i = 0; i < tuftCount; i++) {
    const x = randFloat(rng, 0, WORLD_WIDTH)
    const y = randFloat(rng, yTop, yBottom - 4)
    ctx.fillStyle = INK_SPECK
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 3)
    ctx.fillRect(Math.floor(x) + 2, Math.floor(y) + 1, 2, 2)
  }

  for (let i = 0; i < duneCount; i++) {
    const w = randInt(rng, 48, 120)
    const h = randInt(rng, 8, 20)
    const x = randInt(rng, 0, WORLD_WIDTH - w)
    const y = randInt(rng, yTop + 20, yBottom - h - 8)
    ctx.fillStyle = DUNE_TINT
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if ((dx + dy) % 3 === 0) {
          ctx.fillRect(x + dx, y + dy, 1, 1)
        }
      }
    }
  }
}

/**
 * @param {CanvasImageSource | null} sprite
 * @returns {HTMLCanvasElement}
 */
export function buildGroundCanvas(sprite) {
  const canvas = document.createElement('canvas')
  canvas.width = WORLD_WIDTH
  canvas.height = WORLD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return canvas
  }

  ctx.fillStyle = DESERT_COLOR
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

  const northHints = PORTAL_DEFS.map((p) => ({ x: p.x, y: p.y }))
  const northRng = createRng(WORLD_SEED + 1)
  paintGroundBand(
    ctx,
    sprite,
    northRng,
    GROUND_TOP,
    GROUND_NORTH_BOTTOM,
    northHints,
    randInt(northRng, 42, 58),
    randInt(northRng, 180, 260),
    randInt(northRng, 40, 70),
    randInt(northRng, 6, 12),
  )

  const southHints = [...PORTAL_DEFS, DINO_RUN_PORTAL_DEF].map((p) => ({ x: p.x, y: p.y }))
  const southRng = createRng(WORLD_SEED + 11)
  paintGroundBand(
    ctx,
    sprite,
    southRng,
    GROUND_NORTH_BOTTOM,
    GROUND_BOTTOM,
    southHints,
    randInt(southRng, 18, 28),
    randInt(southRng, 70, 110),
    randInt(southRng, 16, 28),
    randInt(southRng, 3, 6),
  )

  const pathSpeck = '#c8c8c8'
  const pathStep = 8
  const pathRng = createRng(WORLD_SEED + 1)
  for (const gate of PORTAL_DEFS) {
    if (gate.path === false) {
      continue
    }
    const dist = Math.hypot(gate.x - SPAWN.x, gate.y - SPAWN.y)
    const steps = Math.ceil(dist / pathStep)
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const bx = SPAWN.x + (gate.x - SPAWN.x) * t
      const by = SPAWN.y + (gate.y - SPAWN.y) * t
      const jx = randFloat(pathRng, -2.5, 2.5)
      const jy = randFloat(pathRng, -2.5, 2.5)
      ctx.fillStyle = pathSpeck
      ctx.fillRect(Math.floor(bx + jx), Math.floor(by + jy), 2, 2)
    }
  }

  return canvas
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} groundCanvas
 * @param {number} camX
 * @param {number} camY
 * @param {number} viewW
 * @param {number} viewH
 */
export function drawGroundLayer(ctx, groundCanvas, camX, camY, viewW, viewH) {
  const top = GROUND_TOP
  const bottom = GROUND_BOTTOM
  if (bottom < camY || top > camY + viewH) {
    return
  }
  const drawY = top
  const h = bottom - top
  const sx = Math.max(0, Math.floor(camX))
  const sw = Math.min(WORLD_WIDTH - sx, Math.ceil(viewW))
  ctx.drawImage(groundCanvas, sx, drawY, sw, h, sx, drawY, sw, h)
}