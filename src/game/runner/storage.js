const HI_KEY = 'ethan-rose.dinoRun.hi'
const HI_SLOW_KEY = 'ethan-rose.dinoRun.hiSlow'
const MUTED_KEY = 'ethan-rose.dinoRun.muted'
const SLOW_KEY = 'ethan-rose.dinoRun.slow'

let memoryHi = 0
let memoryHiSlow = 0
let memoryMuted = true
let memorySlow = false

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

/**
 * @returns {number}
 */
export function readHiSlowScore() {
  try {
    const raw = localStorage.getItem(HI_SLOW_KEY)
    if (raw == null) {
      return 0
    }
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return memoryHiSlow
  }
}

export function readMuted() {
  try {
    const raw = localStorage.getItem(MUTED_KEY)
    if (raw == null) {
      return true
    }
    return raw === '1' || raw === 'true'
  } catch {
    return memoryMuted
  }
}

export function readSlowMode() {
  try {
    const raw = localStorage.getItem(SLOW_KEY)
    if (raw == null) {
      return false
    }
    return raw === '1' || raw === 'true'
  } catch {
    return memorySlow
  }
}

/** @param {number} score */
export function formatHiLabel(score) {
  const clamped = Math.max(0, Math.min(99999, Math.floor(score)))
  return `HI ${String(clamped).padStart(5, '0')}`
}

/** @param {number} score */
export function writeHiScore(score) {
  const clamped = Math.max(0, Math.min(99999, Math.floor(score)))
  try {
    localStorage.setItem(HI_KEY, String(clamped))
  } catch {
    /* memory fallback */
  }
  memoryHi = clamped
  return clamped
}

/** @param {number} score */
export function writeHiSlowScore(score) {
  const clamped = Math.max(0, Math.min(99999, Math.floor(score)))
  try {
    localStorage.setItem(HI_SLOW_KEY, String(clamped))
  } catch {
    /* memory fallback */
  }
  memoryHiSlow = clamped
  return clamped
}

export function writeMuted(muted) {
  const v = muted ? '1' : '0'
  try {
    localStorage.setItem(MUTED_KEY, v)
  } catch {
    /* memory fallback */
  }
  memoryMuted = muted
}

export function writeSlowMode(slow) {
  const v = slow ? '1' : '0'
  try {
    localStorage.setItem(SLOW_KEY, v)
  } catch {
    /* memory fallback */
  }
  memorySlow = slow
}