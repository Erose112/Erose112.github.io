import { ATLAS } from './atlas.js'
import {
  DESERT_COLOR,
  DUNE_TINT,
  GROUND_BOTTOM,
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

  const rng = createRng(WORLD_SEED + 1)
  const { x: hsx, y: hsy, w: hw, h: hh } = ATLAS.horizon
  const groundH = GROUND_BOTTOM - GROUND_TOP

  /** @type {{ x: number, y: number, influence: number }[]} */
  const gateHints = PORTAL_DEFS.map((p) => ({ x: p.x, y: p.y, influence: 1 }))

  const sliceCount = randInt(rng, 42, 58)
  for (let i = 0; i < sliceCount; i++) {
    const sliceW = randInt(rng, HORIZON_SLICE_MIN_W, HORIZON_SLICE_MAX_W)
    const srcX = randInt(rng, 0, Math.max(0, hw - sliceW))
    const x = randInt(rng, 0, WORLD_WIDTH - sliceW)
    const nearGate = gateHints.reduce(
      (best, g) => Math.min(best, Math.hypot(x - g.x, GROUND_TOP - g.y)),
      Infinity,
    )
    const extraRows = nearGate < 140 ? randInt(rng, 0, 2) : 0
    const y = GROUND_TOP + randInt(rng, 0, Math.max(0, groundH - hh - extraRows * 4))
    const sy = hsy
    if (sprite) {
      ctx.drawImage(sprite, hsx + srcX, sy, sliceW, hh, x, y, sliceW, hh)
    } else {
      ctx.fillStyle = INK_SPECK
      ctx.fillRect(x, y, sliceW, hh)
    }
  }

  const pebbleCount = randInt(rng, 180, 260)
  for (let i = 0; i < pebbleCount; i++) {
    const x = randFloat(rng, 0, WORLD_WIDTH)
    const y = randFloat(rng, GROUND_TOP, GROUND_BOTTOM - 2)
    const s = rng() < 0.6 ? 1 : 2
    ctx.fillStyle = INK_SPECK
    ctx.fillRect(Math.floor(x), Math.floor(y), s, s)
  }

  const tuftCount = randInt(rng, 40, 70)
  for (let i = 0; i < tuftCount; i++) {
    const x = randFloat(rng, 0, WORLD_WIDTH)
    const y = randFloat(rng, GROUND_TOP, GROUND_BOTTOM - 4)
    ctx.fillStyle = INK_SPECK
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 3)
    ctx.fillRect(Math.floor(x) + 2, Math.floor(y) + 1, 2, 2)
  }

  const duneCount = randInt(rng, 6, 12)
  for (let i = 0; i < duneCount; i++) {
    const w = randInt(rng, 48, 120)
    const h = randInt(rng, 8, 20)
    const x = randInt(rng, 0, WORLD_WIDTH - w)
    const y = randInt(rng, GROUND_TOP + 20, GROUND_BOTTOM - h - 8)
    ctx.fillStyle = DUNE_TINT
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if ((dx + dy) % 3 === 0) {
          ctx.fillRect(x + dx, y + dy, 1, 1)
        }
      }
    }
  }

  const pathSpeck = '#c8c8c8'
  const pathStep = 8
  for (const gate of PORTAL_DEFS) {
    const dist = Math.hypot(gate.x - SPAWN.x, gate.y - SPAWN.y)
    const steps = Math.ceil(dist / pathStep)
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const bx = SPAWN.x + (gate.x - SPAWN.x) * t
      const by = SPAWN.y + (gate.y - SPAWN.y) * t
      const jx = randFloat(rng, -2.5, 2.5)
      const jy = randFloat(rng, -2.5, 2.5)
      ctx.fillStyle = pathSpeck
      ctx.fillRect(Math.floor(bx + jx), Math.floor(by + jy), 2, 2)
    }
  }

  return canvas
}

const INK_SPECK = '#535353'

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