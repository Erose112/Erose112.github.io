const HI_KEY = 'ethan-rose.dinoRun.hi'

let memoryHi = 0

/**
 * @returns {number}
 */
export function readHiScore() {
  try {
    const raw = localStorage.getItem(HI_KEY)
    if (raw == null) {
      return 0
    }
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return memoryHi
  }
}

/** @param {number} score */
export function formatHiLabel(score) {
  const clamped = Math.max(0, Math.min(99999, Math.floor(score)))
  return `HI ${String(clamped).padStart(5, '0')}`
}