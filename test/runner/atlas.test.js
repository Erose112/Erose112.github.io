import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ATLAS,
  TREX_FRAME_OFFSET,
  cactusClusterSrc,
  runnerDigitSrc,
} from '../../src/game/atlas.js'

describe('atlas runner crops', () => {
  it('HUD digits and HI sit on the text row', () => {
    const zero = runnerDigitSrc(0)
    assert.equal(zero.x, 655)
    assert.equal(zero.y, 2)
    assert.equal(zero.w, 10)
    assert.equal(zero.h, 13)

    const h = runnerDigitSrc(ATLAS.textSprite.hiIndex)
    assert.equal(h.x, 755)
    const i = runnerDigitSrc(ATLAS.textSprite.iIndex)
    assert.equal(i.x, 765)
  })

  it('cactus cluster widths match obstacle.ts (PLAN-DINO-RUN §4)', () => {
    assert.deepEqual(cactusClusterSrc('small', 1), {
      x: 228,
      y: 2,
      w: 17,
      h: 35,
    })
    assert.deepEqual(cactusClusterSrc('small', 2), {
      x: 245,
      y: 2,
      w: 34,
      h: 35,
    })
    assert.deepEqual(cactusClusterSrc('small', 3), {
      x: 279,
      y: 2,
      w: 51,
      h: 35,
    })
    assert.deepEqual(cactusClusterSrc('large', 1), {
      x: 332,
      y: 2,
      w: 25,
      h: 50,
    })
    assert.deepEqual(cactusClusterSrc('large', 3), {
      x: 407,
      y: 2,
      w: 75,
      h: 50,
    })
  })

  it('runner trex and game-over rects', () => {
    assert.equal(TREX_FRAME_OFFSET.crash, 220)
    assert.deepEqual(ATLAS.textSprite.gameOver, {
      x: 655,
      y: 15,
      w: 191,
      h: 11,
    })
    assert.deepEqual(ATLAS.horizon, { x: 2, y: 52, w: 600, h: 12 })
    assert.deepEqual(ATLAS.restart, { x: 2, y: 68, w: 36, h: 32 })
  })
})