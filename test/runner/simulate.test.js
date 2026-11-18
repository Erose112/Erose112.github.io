import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { stepRunnerMotion } from '../../src/game/runner/simulate.js'

describe('runner simulate', () => {
  it('sub-step prevents tunneling through a 17px cactus in one 50ms tick', () => {
    const cameraX = 0
    const dinoX = 72
    const footY = 100
    const obstacles = [{ footX: cameraX + dinoX + 20, footY, w: 17, h: 10 }]

    const result = stepRunnerMotion({
      cameraX,
      dinoX,
      footY,
      axisY: 0,
      speed: 13,
      dt: 0.05,
      obstacles,
    })

    assert.equal(result.hit, true)
  })

  it('39px closing motion in 50ms still overlaps a 17px wide obstacle', () => {
    const dinoX = 72
    const footY = 90
    const startCam = 0
    const obstacles = [{ footX: startCam + dinoX + 39, footY, w: 17, h: 10 }]

    const result = stepRunnerMotion({
      cameraX: startCam,
      dinoX,
      footY,
      axisY: 0,
      speed: 13,
      dt: 0.05,
      obstacles,
    })

    assert.equal(result.hit, true)
  })
})