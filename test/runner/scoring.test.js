import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createRunScoring,
  scoreFromDistance,
  speedAtFrame,
  stepRunScoring,
} from '../../src/game/runner/scoring.js'
import { SPEED_MAX, SPEED_START } from '../../src/game/runner/constants.js'

describe('runner scoring', () => {
  it('score is round(ceil(distance) * 0.025)', () => {
    assert.equal(scoreFromDistance(0), 0)
    assert.equal(scoreFromDistance(39.9), 1)
    assert.equal(scoreFromDistance(40), 1)
    assert.equal(scoreFromDistance(4000), 100)
  })

  it('flash starts once when score hits a new multiple of 100', () => {
    const state = createRunScoring()
    state.distanceRan = 3999
    state.score = 99
    state.lastScoreHundred = 0
    stepRunScoring(state, 1 / 60, true)
    assert.equal(state.score, 100)
    assert.equal(state.flashIterationsLeft, 3)
    assert.equal(state.lastScoreHundred, 1)
    const before = state.flashIterationsLeft
    stepRunScoring(state, 2, true)
    assert.equal(state.flashIterationsLeft, before)
  })

  it('speed after n frames is min(13, 6 + 0.001 * n)', () => {
    assert.equal(speedAtFrame(0), SPEED_START)
    assert.equal(speedAtFrame(1000), 6 + 1)
    assert.equal(speedAtFrame(7000), SPEED_MAX)
    assert.equal(speedAtFrame(8000), SPEED_MAX)
  })

  it('at frame 7000 score is about 1660', () => {
    let distance = 0
    let speed = SPEED_START
    for (let f = 0; f < 7000; f += 1) {
      distance += speed
      if (speed < SPEED_MAX) {
        speed += 0.001
      }
    }
    const score = scoreFromDistance(distance)
    assert.ok(score >= 1650 && score <= 1670, `score ${score}`)
  })
})