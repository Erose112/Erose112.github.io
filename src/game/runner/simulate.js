import { boxesOverlap, footprintBox } from '../collision.js'
import { FOOTPRINT_H, FOOTPRINT_W, FOOT_Y_MAX, FOOT_Y_MIN, LANE_SPEED } from './constants.js'

const MAX_SUBSTEP_SEC = 1 / 120
export const HIT_INSET_PX = 2

/**
 * @param {number} footX
 * @param {number} footY
 * @param {number} [inset]
 */
export function dinoHitBox(footX, footY, inset = HIT_INSET_PX) {
  return footprintBox(
    footX,
    footY,
    FOOTPRINT_W - inset * 2,
    FOOTPRINT_H - inset * 2,
  )
}

/**
 * Sub-stepped scroll + lane move against obstacle footprints.
 *
 * @param {{
 *   cameraX: number,
 *   dinoX: number,
 *   footY: number,
 *   axisY: number,
 *   speed: number,
 *   dt: number,
 *   obstacles: { footX: number, footY: number, w: number, h: number }[],
 * }} params
 * @returns {{ hit: boolean, cameraX: number, footY: number }}
 */
export function stepRunnerMotion(params) {
  const { cameraX, dinoX, footY, axisY, speed, dt, obstacles } = params
  const steps = Math.max(1, Math.ceil(dt / MAX_SUBSTEP_SEC))
  const subDt = dt / steps
  let cam = cameraX
  let y = footY

  for (let i = 0; i < steps; i += 1) {
    const frames = subDt * 60
    cam += speed * frames
    y += axisY * LANE_SPEED * subDt
    y = Math.max(FOOT_Y_MIN, Math.min(FOOT_Y_MAX, y))
    if (obstacles.length === 0) {
      continue
    }
    const x = cam + dinoX
    const box = dinoHitBox(x, y)
    for (const ob of obstacles) {
      const other = footprintBox(ob.footX, ob.footY, ob.w, ob.h)
      if (boxesOverlap(box, other)) {
        return { hit: true, cameraX, footY }
      }
    }
  }
  return { hit: false, cameraX: cam, footY: y }
}