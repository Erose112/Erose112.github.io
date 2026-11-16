/** Mulberry32 — seeded deterministic PRNG for world decoration. */
export function createRng(seed) {
  let s = seed >>> 0
  return function next() {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function randFloat(rng, min, max) {
  return rng() * (max - min) + min
}