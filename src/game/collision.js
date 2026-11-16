/**
 * Axis-aligned footprint boxes (feet = bottom center).
 */

/**
 * @param {number} footX
 * @param {number} footY
 * @param {number} w
 * @param {number} h
 */
export function footprintBox(footX, footY, w, h) {
  const halfW = w / 2
  return {
    left: footX - halfW,
    right: footX + halfW,
    top: footY - h,
    bottom: footY,
  }
}

/**
 * @param {{ left: number, right: number, top: number, bottom: number }} a
 * @param {{ left: number, right: number, top: number, bottom: number }} b
 */
export function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

/**
 * @param {{ left: number, right: number, top: number, bottom: number }} a
 * @param {{ left: number, right: number, top: number, bottom: number }} b
 */
function penetrationXY(a, b) {
  const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return { overlapX, overlapY }
}

/**
 * Push box `moving` out of `solid` along the smallest penetration axis.
 * @param {{ left: number, right: number, top: number, bottom: number }} moving
 * @param {{ left: number, right: number, top: number, bottom: number }} solid
 */
export function resolveBoxOverlap(moving, solid) {
  if (!boxesOverlap(moving, solid)) {
    return moving
  }
  const { overlapX, overlapY } = penetrationXY(moving, solid)
  const out = { ...moving }
  if (overlapX < overlapY) {
    const movingCenter = (moving.left + moving.right) / 2
    const solidCenter = (solid.left + solid.right) / 2
    const shift = movingCenter < solidCenter ? -overlapX : overlapX
    out.left += shift
    out.right += shift
  } else {
    const movingMidY = (moving.top + moving.bottom) / 2
    const solidMidY = (solid.top + solid.bottom) / 2
    const shift = movingMidY < solidMidY ? -overlapY : overlapY
    out.top += shift
    out.bottom += shift
  }
  return out
}

/**
 * @param {number} footX
 * @param {number} footY
 * @param {number} w
 * @param {number} h
 * @param {{ footprint: { w: number, h: number }, footX: number, footY: number }[]} solids
 * @returns {{ x: number, y: number }}
 */
export function resolveFootprintCollisions(footX, footY, w, h, solids) {
  let box = footprintBox(footX, footY, w, h)
  for (const solid of solids) {
    const other = footprintBox(solid.footX, solid.footY, solid.footprint.w, solid.footprint.h)
    box = resolveBoxOverlap(box, other)
  }
  const centerX = (box.left + box.right) / 2
  const footYOut = box.bottom
  return { x: centerX, y: footYOut }
}