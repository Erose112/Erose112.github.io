/** Seconds between frames, clamped to avoid spike catch-up (both game loops). */
export const MAX_FRAME_DT = 0.05

/**
 * @param {number} nowMs
 * @param {number} lastMs
 * @returns {number}
 */
export function frameDelta(nowMs, lastMs) {
  let dt = (nowMs - lastMs) / 1000
  if (dt > MAX_FRAME_DT) {
    dt = MAX_FRAME_DT
  }
  return dt
}