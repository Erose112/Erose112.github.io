import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BIRD_MIN_SPEED,
  BIRD_SHADOW_DEPTH,
  BIRD_SHADOW_WIDTH,
  CACTUS_LARGE,
  CACTUS_SMALL,
  GAP_COEFFICIENT,
  LANE_SPEED,
  MAX_SEAM_PX,
  MIN_PASS_CORRIDOR_PX,
  TRACK_DEPTH,
  TRACK_TOP,
} from '../../src/game/runner/constants.js'
import {
  FAIR_FRACTION,
  T_REACT,
  corridorLengthForScore,
  fairShiftCapPx,
  shiftAmbition,
} from '../../src/game/runner/difficulty.js'
import {
  createBirdRow,
  createRow,
  createSpawner,
  maybeSpawnRows,
  rowGap,
} from '../../src/game/runner/spawner.js'
import { createRng } from '../../src/game/rng.js'
import { runFairnessBot } from '../../src/game/runner/botSim.js'

const EPS = 0.001

/**
 * @param {number} seed
 * @param {number} maxRows
 */
function spawnRowsForSeed(seed, maxRows = 40) {
  const visibleW = 600
  const spawner = createSpawner(seed)
  spawner.spawnCursor = visibleW
  let cameraX = 0
  let runningTimeMs = 3000
  let score = 0
  let speed = 6
  /** @type {import('../../src/game/runner/spawner.js').RunnerRow[]} */
  const rows = []
  let guard = 0
  while (rows.length < maxRows && guard < 8000) {
    guard += 1
    const batch = maybeSpawnRows(spawner, {
      runningTimeMs,
      cameraX,
      visibleW,
      score,
      speed,
    })
    if (batch.length > 0) {
      rows.push(...batch)
    }
    cameraX += 40
    runningTimeMs += 80
    speed = Math.min(13, speed + 0.004)
    score = Math.min(2000, score + 1)
  }
  return rows
}

describe('runner spawner / director', () => {
  it('rowGap matches hand values at speed 13', () => {
    const small = rowGap(CACTUS_SMALL.footW, 13, CACTUS_SMALL)
    assert.equal(small.minGap, 293)
    const large3 = rowGap(CACTUS_LARGE.footW * 3, 13, CACTUS_LARGE)
    assert.equal(large3.minGap, 1047)
  })

  it('fairShiftCapPx uses gap - 28 at speed 6', () => {
    const capMin = fairShiftCapPx(174, 6)
    assert.ok(capMin >= 38 && capMin <= 42, `cap min ${capMin}`)
    const capAvg = fairShiftCapPx(218, 6)
    assert.ok(capAvg >= 64 && capAvg <= 68, `cap avg ${capAvg}`)
    const cap13 = fairShiftCapPx(293, 13)
    assert.ok(cap13 >= 23 && cap13 <= 27, `cap speed13 ${cap13}`)
    const cap13avg = fairShiftCapPx(367, 13)
    assert.ok(cap13avg >= 44 && cap13avg <= 48, `cap speed13 avg ${cap13avg}`)
  })

  for (const seed of [1, 2]) {
    it(`seed ${seed}: no row semantics before 3s and row properties`, () => {
      const spawner = createSpawner(seed)
      const early = maybeSpawnRows(spawner, {
        runningTimeMs: 2999,
        cameraX: 0,
        visibleW: 600,
        score: 0,
        speed: 6,
      })
      assert.equal(early.length, 0)

      const rows = spawnRowsForSeed(seed, 35)
      assert.ok(rows.length >= 10)

      for (const row of rows) {
        assert.equal(row.corridorLen, corridorLengthForScore(row.buildScore))
        assert.ok(row.corridorLen >= MIN_PASS_CORRIDOR_PX)
        if (row.clusterSize > 1) {
          const cfg = row.type === 'large' ? CACTUS_LARGE : CACTUS_SMALL
          assert.ok(row.buildSpeed >= cfg.multipleSpeed)
        }
      }

      for (let i = 1; i < rows.length; i += 1) {
        const prev = rows[i - 1]
        const row = rows[i]
        const gap = row.gapUsed
        const speed = row.buildSpeed
        const cap = fairShiftCapPx(gap, speed)
        const ambition = shiftAmbition(row.buildScore)
        assert.ok(
          Math.abs(row.shiftLocal) <= ambition * cap + EPS,
          `shift ${row.shiftLocal} cap ${cap} ambition ${ambition}`,
        )
        const dc = Math.abs(row.corridorCenterLocal - prev.corridorCenterLocal)
        const freeTime = (gap - 28) / (speed * 60)
        assert.ok(
          dc / LANE_SPEED + T_REACT <= FAIR_FRACTION * freeTime + 0.05,
          `pair fairness gap=${gap} dc=${dc}`,
        )
      }
    })
  }

  it('corridor ramp 46 / 34 / 28 at scores 0, 1000, 1500', () => {
    assert.equal(corridorLengthForScore(0), 46)
    assert.ok(Math.abs(corridorLengthForScore(1000) - 34) < 0.01)
    assert.equal(corridorLengthForScore(1500), 28)
  })

  it('rolled shift cannot exceed ambition times cap at score 0', () => {
    const rng = createRng(99)
    const ambition = shiftAmbition(0)
    assert.equal(ambition, 0.25)
    for (let i = 0; i < 30; i += 1) {
      const row = createRow(rng, 6, 0, 220, null, TRACK_DEPTH / 2)
      const cap = fairShiftCapPx(row.gapUsed ?? 220, 6)
      assert.ok(Math.abs(row.shiftLocal) <= ambition * cap + EPS)
    }
  })

  it('five-minute bot with T_REACT survives normal and slow ramps', () => {
    for (const seed of [1, 2]) {
      const normal = runFairnessBot({ durationSec: 300, seed })
      assert.equal(normal.survived, true, `normal seed ${seed} hit at ${normal.hitAtSec}`)
      const slow = runFairnessBot({ durationSec: 300, seed, slow: true })
      assert.equal(slow.survived, true, `slow seed ${seed} hit at ${slow.hitAtSec}`)
    }
  })

  it('no bird rows before speed 8.5', () => {
    const rng = createRng(77)
  for (let i = 0; i < 40; i += 1) {
      const row = createRow(rng, BIRD_MIN_SPEED - 0.01, 200, 220, null, TRACK_DEPTH / 2)
      assert.ok(!row.isBird)
    }
  })

  it('bird row uses partial stack, shadow in opening, safe slot only', () => {
    const rng = createRng(12)
    const bird = createBirdRow(rng, 13, 0, 220, null, TRACK_DEPTH / 2)
    assert.ok(bird.isBird)

    const fullRng = createRng(9999)
    let full = null
    for (let i = 0; i < 30; i += 1) {
      const row = createRow(fullRng, 13, 0, 220, null, TRACK_DEPTH / 2)
      if (!row.isBird) {
        full = row
        break
      }
    }
    assert.ok(full)
    assert.ok(bird.footprints.length < full.footprints.length)

    assert.equal(bird.openingLen, bird.corridorLen + BIRD_SHADOW_DEPTH)
    assert.equal(bird.corridorLen, corridorLengthForScore(0))
    assert.ok(bird.rowWidth >= BIRD_SHADOW_WIDTH)
    assert.ok(bird.shadowFootY > 52 && bird.shadowFootY <= 136)

    const openStart = bird.openingStartLocal
    const openEnd = openStart + bird.openingLen
    const shadowTop = bird.shadowAtFar ? openStart : openStart + bird.corridorLen
    assert.equal(TRACK_TOP + shadowTop + BIRD_SHADOW_DEPTH, bird.shadowFootY)
    assert.ok(openEnd <= TRACK_DEPTH + 1e-6)
    assert.ok(openStart >= -1e-6)

    const safeTop = bird.shadowAtFar ? openStart + BIRD_SHADOW_DEPTH : openStart
    const safeBottom = safeTop + bird.corridorLen
    assert.equal(safeBottom - safeTop, bird.corridorLen)
    assert.ok(
      shadowTop + BIRD_SHADOW_DEPTH <= safeTop + 1e-6 ||
        shadowTop >= safeBottom - 1e-6,
      'shadow sits flush against safe slot, not in the middle',
    )
    assert.ok(Math.abs(openEnd - openStart - bird.openingLen) < 1e-6)
    assert.ok(Math.abs(openEnd - openStart - BIRD_SHADOW_DEPTH - bird.corridorLen) < 1e-6)
  })

  it('maybeSpawnRows inserts birds only at speed 8.5+', () => {
    const rows = spawnRowsForSeed(1, 60)
    const birds = rows.filter((r) => r.isBird)
    assert.ok(birds.length > 0)
    for (const row of rows) {
      if (row.buildSpeed < BIRD_MIN_SPEED) {
        assert.ok(!row.isBird)
      }
      if (row.isBird) {
        assert.ok(row.buildSpeed >= BIRD_MIN_SPEED)
      }
    }
  })

  it('bot does not move until T_REACT after clearing a row', () => {
    const patient = runFairnessBot({
      durationSec: 120,
      seed: 1,
      reactDelaySec: T_REACT,
      trace: true,
    })
    assert.equal(patient.survived, true)
    assert.equal(patient.reactViolations.length, 0)
    const instant = runFairnessBot({
      durationSec: 120,
      seed: 1,
      reactDelaySec: 0,
      trace: true,
    })
    assert.ok(instant.earlyMovesAfterClear > 0)
    assert.equal(instant.reactViolations.length, 0)
  })
})