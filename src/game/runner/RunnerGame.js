import { ATLAS, TREX_FRAME_OFFSET } from '../atlas.js'
import {
  BLINK_DELAY_MAX_MS,
  BLINK_DELAY_MIN_MS,
  BLINK_FRAME_MS,
  RUN_FRAME_MS,
} from '../constants.js'
import { frameDelta } from '../clock.js'
import { resolveBufferSize } from '../scale.js'
import { createRng, randInt } from '../rng.js'
import { readHiScore, writeHiScore } from './storage.js'
import { createSpawner, maybeSpawnRows } from './spawner.js'
import { stepRunnerMotion } from './simulate.js'
import {
  CLOUD_FREQ,
  CLOUD_GAP_MAX,
  CLOUD_GAP_MIN,
  CLOUD_MAX,
  CLOUD_Y_MAX,
  CLOUD_Y_MIN,
  computeRunnerScale,
  DESERT_COLOR,
  dinoScreenX,
  DIGIT_H,
  DIGIT_STEP,
  DIGIT_W,
  FOOTPRINT_H,
  FOOTPRINT_W,
  FOOT_Y_MAX,
  FOOT_Y_MIN,
  HORIZON_H,
  HORIZON_TILE_W,
  HUD_HI_ALPHA,
  HUD_Y,
  LANE_SPEED,
  playfieldOffsetY,
  PLAYFIELD_H,
  SKY_BOTTOM,
  TEXT_SPRITE_X,
  TRACK_BOTTOM,
  TRACK_TOP,
  TREX_CRASH_OFFSET,
  GAME_OVER_SRC,
  GAME_OVER_Y_FRAC,
  GAMEOVER_CLEAR_MS,
  CACTUS_SMALL,
  CACTUS_LARGE,
} from './constants.js'
import {
  createRunScoring,
  scoreDrawVisible,
  stepRunScoring,
  updateScoreFlash,
} from './scoring.js'

function randomBlinkDelay() {
  return BLINK_DELAY_MIN_MS + Math.random() * (BLINK_DELAY_MAX_MS - BLINK_DELAY_MIN_MS)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} sheet
 * @param {number} digit 0-11 (10=H, 11=I)
 * @param {number} destX
 * @param {number} destY
 * @param {number} [alpha]
 */
function drawHudGlyph(ctx, sheet, digit, destX, destY, alpha = 1) {
  const sx = TEXT_SPRITE_X + digit * DIGIT_W
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.drawImage(sheet, sx, 2, DIGIT_W, DIGIT_H, destX, destY, DIGIT_W, DIGIT_H)
  ctx.restore()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} sheet
 * @param {number} score
 * @param {number} hi
 * @param {number} playfieldW
 * @param {boolean} showCurrent
 */
function drawScoreHud(ctx, sheet, score, hi, playfieldW, showCurrent) {
  const hiStr = String(Math.min(99999, hi)).padStart(5, '0')
  const scoreStr = String(Math.min(99999, score)).padStart(5, '0')

  const rightPad = DIGIT_STEP * 6
  const currentRight = playfieldW - rightPad

  let x = currentRight - DIGIT_W
  for (let i = 4; i >= 0; i -= 1) {
    const d = scoreStr.charCodeAt(i) - 48
    if (showCurrent) {
      drawHudGlyph(ctx, sheet, d, x, HUD_Y, 1)
    }
    x -= DIGIT_STEP
  }

  const hiLabelX = currentRight - DIGIT_STEP * 5 - DIGIT_STEP * 2 - DIGIT_W
  drawHudGlyph(ctx, sheet, 10, hiLabelX, HUD_Y, HUD_HI_ALPHA)
  drawHudGlyph(ctx, sheet, 11, hiLabelX + DIGIT_STEP, HUD_Y, HUD_HI_ALPHA)

  let hx = hiLabelX - DIGIT_STEP
  for (let i = 4; i >= 0; i -= 1) {
    const d = hiStr.charCodeAt(i) - 48
    drawHudGlyph(ctx, sheet, d, hx, HUD_Y, HUD_HI_ALPHA)
    hx -= DIGIT_STEP
  }
}

function createRunnerClouds() {
  return Array.from({ length: CLOUD_MAX }, () => ({
    x: 0,
    y: 0,
    active: false,
    gapTimer: 0,
  }))
}

/**
 * Side-scrolling runner loop (PLAN-DINO-RUN R2).
 */
export class RunnerGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   sprite: HTMLImageElement,
   *   input: import('../input.js').GameInput | null,
   *   cloudSprite: HTMLCanvasElement | null,
   *   reduceMotion: boolean,
   *   onGameOver?: () => void,
   * }} deps
   */
  constructor(canvas, deps) {
    this.canvas = canvas
    this.sprite = deps.sprite
    this.input = deps.input
    this.cloudSprite = deps.cloudSprite
    this.reduceMotion = deps.reduceMotion
    this.onGameOver = deps.onGameOver
    this.disposed = false
    this.rafId = 0
    this.running = false
    this.lastTime = 0
    this.ctx = null
    this.scaleS = 1
    this.visibleW = 0
    this.visibleH = 0
    this.bufferW = 0
    this.bufferH = 0
    this.playfieldY = 0
    this.dinoX = 48
    this.cameraX = 0
    this.horizonX = 0
    this.footY = (FOOT_Y_MIN + FOOT_Y_MAX) / 2
    this.runningTime = 0
    /** @type {'ready' | 'playing' | 'paused' | 'over'} */
    this.phase = 'ready'
    /** @type {import('./spawner.js').RunnerRow[]} */
    this.rows = []
    this.spawner = null
    this.crashAtMs = 0
    this._runSeed = Date.now()
    this.scoring = createRunScoring()
    this.hiScore = readHiScore()
    this.clouds = createRunnerClouds()
    this.cloudRng = createRng(Date.now())
    this.cloudSpawnAcc = 0
    this._layoutReady = false
    this._pauseFromResize = false
    this._systemPause = false
    this.dino = {
      frameOffset: TREX_FRAME_OFFSET.stand,
      blinkPhase: 'idle',
      nextBlinkAt: performance.now() + randomBlinkDelay(),
      blinkEndAt: 0,
      runFrameIndex: 0,
      runAnimElapsed: 0,
    }
    this._onFrame = this._onFrame.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._onFocus = this._onFocus.bind(this)
    this._onVisibility = this._onVisibility.bind(this)
  }

  wantsKeyboardCapture() {
    return !this.disposed && this.running && this.phase !== 'paused'
  }

  enterReady() {
    this.phase = 'ready'
    this.scoring = createRunScoring()
    this.cameraX = 0
    this.horizonX = 0
    this.runningTime = 0
    this.footY = (FOOT_Y_MIN + FOOT_Y_MAX) / 2
    this.input?.setAxisMode('vertical')
    this.input?.clearJumpLatchForReady()
    this.dino.frameOffset = TREX_FRAME_OFFSET.stand
    this.dino.blinkPhase = 'idle'
    this.dino.nextBlinkAt = performance.now() + randomBlinkDelay()
    for (const c of this.clouds) {
      c.active = false
    }
    this.seedInitialClouds()
    this.resetSpawner()
    this.rows = []
    this.crashAtMs = 0
  }

  resetSpawner() {
    this._runSeed = Date.now()
    this.spawner = createSpawner(this._runSeed)
    this.spawner.spawnCursor = this.cameraX + this.visibleW
  }

  seedInitialClouds() {
    let x = randInt(this.cloudRng, 0, Math.max(1, Math.floor(this.visibleW)))
    for (const cloud of this.clouds) {
      cloud.y = randInt(this.cloudRng, CLOUD_Y_MIN, CLOUD_Y_MAX)
      cloud.x = x
      cloud.active = true
      cloud.gapTimer = 0
      x += randInt(this.cloudRng, CLOUD_GAP_MIN, CLOUD_GAP_MAX)
    }
  }

  start() {
    if (this.disposed || this.running) {
      return
    }
    this.running = true
    this.lastTime = performance.now()
    window.addEventListener('blur', this._onBlur)
    window.addEventListener('focus', this._onFocus)
    document.addEventListener('visibilitychange', this._onVisibility)
    this.rafId = requestAnimationFrame(this._onFrame)
  }

  /**
   * @param {{ bufferW: number, bufferH: number } | null} pixelBox
   * @param {number} clientW
   * @param {number} clientH
   */
  resize(pixelBox, clientW, clientH) {
    const dpr = window.devicePixelRatio || 1
    const { bufferW, bufferH } = resolveBufferSize(clientW, clientH, dpr, pixelBox)
    const S = computeRunnerScale(bufferW, bufferH)

    this.canvas.style.width = `${clientW}px`
    this.canvas.style.height = `${clientH}px`
    this.canvas.width = bufferW
    this.canvas.height = bufferH

    const ctx = this.canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      return
    }
    this.ctx = ctx
    ctx.setTransform(S, 0, 0, S, 0, 0)
    ctx.imageSmoothingEnabled = false

    this.scaleS = S
    this.bufferW = bufferW
    this.bufferH = bufferH
    this.visibleW = bufferW / S
    this.visibleH = bufferH / S
    this.playfieldY = playfieldOffsetY(this.visibleH)
    this.dinoX = dinoScreenX(this.visibleW)

    if (this._layoutReady && this.phase === 'playing') {
      this.phase = 'paused'
      this._pauseFromResize = true
    }
    this._layoutReady = true

    this.draw()
  }

  _integrateMotion() {
    return this.phase === 'playing'
  }

  /** @returns {import('./spawner.js').RunnerRow[]} */
  _activeCollisionFootprints() {
    const dinoWorldX = this.cameraX + this.dinoX
    const margin = 80
    const minX = dinoWorldX - margin
    const maxX = dinoWorldX + margin
    /** @type {{ footX: number, footY: number, w: number, h: number }[]} */
    const out = []
    for (const row of this.rows) {
      const left = row.worldX
      const right = row.worldX + row.rowWidth
      if (right < minX || left > maxX) {
        continue
      }
      const footX = row.worldX + row.rowWidth / 2
      for (const fp of row.footprints) {
        out.push({ footX, footY: fp.footY, w: fp.w, h: fp.h })
      }
    }
    return out
  }

  crash() {
    if (this.phase !== 'playing') {
      return
    }
    this.phase = 'over'
    this.crashAtMs = performance.now()
    this.dino.frameOffset = TREX_CRASH_OFFSET
    this.input?.clearAll()
    if (this.scoring.score > this.hiScore) {
      this.hiScore = writeHiScore(this.scoring.score)
    }
    this.onGameOver?.()
  }

  restartAfterCrash() {
    if (this.phase !== 'over') {
      return
    }
    this.scoring = createRunScoring()
    this.cameraX = 0
    this.horizonX = 0
    this.runningTime = 0
    this.footY = (FOOT_Y_MIN + FOOT_Y_MAX) / 2
    this.rows = []
    this.resetSpawner()
    this.crashAtMs = 0
    this.phase = 'playing'
    this.dino.frameOffset = TREX_FRAME_OFFSET.run1
    this.dino.runFrameIndex = 0
    this.canvas.focus({ preventScroll: true })
  }

  _handleOverInput() {
    if (this.phase !== 'over') {
      return
    }
    const now = performance.now()
    if (this.input?.consumeEnterEdge()) {
      this.restartAfterCrash()
      return
    }
    if (this.input?.consumeJumpEdge()) {
      if (now - this.crashAtMs >= GAMEOVER_CLEAR_MS) {
        this.restartAfterCrash()
      }
    }
  }

  _onBlur() {
    if (this.phase === 'playing') {
      this.phase = 'paused'
      this._systemPause = true
      this.input?.clearAll()
    }
  }

  _onFocus() {
    this._resumeAfterSystemPause()
  }

  _onVisibility() {
    if (document.hidden) {
      if (this.phase === 'playing') {
        this.phase = 'paused'
        this._systemPause = true
      }
      this.input?.clearAll()
      return
    }
    this._resumeAfterSystemPause()
  }

  _resumeAfterSystemPause() {
    if (this._pauseFromResize) {
      return
    }
    if (this.phase === 'paused' && this._systemPause) {
      this.phase = 'playing'
      this._systemPause = false
      this.lastTime = performance.now()
      this.input?.clearAll()
    }
  }

  beginPlay() {
    if (this.phase !== 'ready') {
      return
    }
    this.phase = 'playing'
    this.canvas.focus({ preventScroll: true })
  }

  resumeFromPause() {
    if (this.phase === 'paused') {
      this.phase = 'playing'
      this.lastTime = performance.now()
      this.input?.clearAll()
    }
  }

  _onFrame(time) {
    if (this.disposed) {
      return
    }
    this.rafId = requestAnimationFrame(this._onFrame)
    if (!this.running) {
      this.lastTime = time
      return
    }

    const dt = frameDelta(time, this.lastTime)
    this.lastTime = time

    if (this.phase === 'ready') {
      if (this.input?.consumeJumpEdge()) {
        this.beginPlay()
      }
    } else if (this.phase === 'over') {
      this._handleOverInput()
    } else if (this.phase === 'paused' && this._pauseFromResize) {
      if (this.input?.consumeJumpEdge()) {
        this.resumeFromPause()
        this._pauseFromResize = false
      }
    }

    this.tick(dt, time)
    this.draw()
  }

  /** @param {number} dt @param {number} now */
  tick(dt, now) {
    const integrate = this._integrateMotion()

    if (integrate) {
      this.runningTime += dt * 1000
    }

    stepRunScoring(this.scoring, dt, integrate)
    updateScoreFlash(this.scoring, now)

    const axis = this.input?.getAxis() ?? { x: 0, y: 0 }
    if (integrate) {
      const newSpawned = maybeSpawnRows(this.spawner, {
        runningTimeMs: this.runningTime,
        cameraX: this.cameraX,
        visibleW: this.visibleW,
        score: this.scoring.score,
        speed: this.scoring.speed,
      })
      if (newSpawned.length > 0) {
        this.rows.push(...newSpawned)
      }

      const motion = stepRunnerMotion({
        cameraX: this.cameraX,
        dinoX: this.dinoX,
        footY: this.footY,
        axisY: axis.y,
        speed: this.scoring.speed,
        dt,
        obstacles: this._activeCollisionFootprints(),
      })
      if (motion.hit) {
        this.crash()
        return
      }

      const scroll = motion.cameraX - this.cameraX
      this.cameraX = motion.cameraX
      this.footY = motion.footY
      this.horizonX = (this.horizonX + scroll) % HORIZON_TILE_W
      this.updateClouds(dt, this.scoring.speed)

      const cullBefore = this.cameraX - 120
      this.rows = this.rows.filter((row) => row.worldX + row.rowWidth >= cullBefore)
    }

    if (this.phase !== 'over') {
      this.updateDinoAnim(now, dt, integrate ? this.scoring.speed : 0)
    }
  }

  /** @param {number} dt @param {number} speed */
  updateClouds(dt, speed) {
    if (this.reduceMotion) {
      return
    }
    const dtMs = dt * 1000
    const elSpeed = Math.ceil((0.2 / 1000) * dtMs * speed)

    for (const cloud of this.clouds) {
      if (!cloud.active) {
        continue
      }
      cloud.x -= elSpeed
    }

    const leftEdge = -ATLAS.cloud.w
    for (const cloud of this.clouds) {
      if (cloud.active && cloud.x < leftEdge) {
        cloud.active = false
      }
    }

    this.cloudSpawnAcc += dt
    while (this.cloudSpawnAcc >= 1) {
      this.cloudSpawnAcc -= 1
      if (this.cloudRng() > CLOUD_FREQ) {
        continue
      }
      const slot = this.clouds.find((c) => !c.active)
      if (!slot) {
        continue
      }
      slot.active = true
      slot.y = randInt(this.cloudRng, CLOUD_Y_MIN, CLOUD_Y_MAX)
      slot.x = this.visibleW + randInt(this.cloudRng, CLOUD_GAP_MIN, CLOUD_GAP_MAX)
    }
  }

  /** @param {number} now @param {number} dt @param {number} speed */
  updateDinoAnim(now, dt, speed) {
    const dino = this.dino
    if (this.phase === 'over') {
      dino.frameOffset = TREX_CRASH_OFFSET
      return
    }
    const runningAnim = this.phase === 'playing' && speed > 0

    if (runningAnim) {
      dino.blinkPhase = 'idle'
      dino.runAnimElapsed += dt * 1000
      while (dino.runAnimElapsed >= RUN_FRAME_MS) {
        dino.runAnimElapsed -= RUN_FRAME_MS
        dino.runFrameIndex = 1 - dino.runFrameIndex
      }
      dino.frameOffset =
        dino.runFrameIndex === 0 ? TREX_FRAME_OFFSET.run1 : TREX_FRAME_OFFSET.run2
      return
    }

    dino.runAnimElapsed = 0
    dino.frameOffset = TREX_FRAME_OFFSET.stand
    if (this.reduceMotion) {
      return
    }
    if (dino.blinkPhase === 'blink' && now >= dino.blinkEndAt) {
      dino.blinkPhase = 'idle'
      dino.nextBlinkAt = now + randomBlinkDelay()
    } else if (dino.blinkPhase === 'idle' && now >= dino.nextBlinkAt) {
      dino.blinkPhase = 'blink'
      dino.frameOffset = TREX_FRAME_OFFSET.blink
      dino.blinkEndAt = now + BLINK_FRAME_MS
    } else if (dino.blinkPhase === 'blink') {
      dino.frameOffset = TREX_FRAME_OFFSET.blink
    }
  }

  draw() {
    const ctx = this.ctx ?? this.canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      return
    }
    this.ctx = ctx

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = DESERT_COLOR
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.restore()

    ctx.setTransform(this.scaleS, 0, 0, this.scaleS, 0, 0)
    ctx.imageSmoothingEnabled = false

    const pfY = this.playfieldY
    const w = this.visibleW

    ctx.save()
    ctx.translate(0, pfY)

    ctx.fillStyle = DESERT_COLOR
    ctx.fillRect(0, 0, w, PLAYFIELD_H)

    ctx.strokeStyle = '#535353'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, SKY_BOTTOM + 0.5)
    ctx.lineTo(w, SKY_BOTTOM + 0.5)
    ctx.stroke()

    this.drawHorizon(ctx, w)
    this.drawClouds(ctx, w)

    ctx.fillStyle = DESERT_COLOR
    ctx.fillRect(0, TRACK_TOP, w, TRACK_BOTTOM - TRACK_TOP)

    this.drawRowsAndDino(ctx)

    const showScore = scoreDrawVisible(this.scoring, performance.now())
    const showCurrent = this.phase !== 'over' ? showScore : true
    drawScoreHud(ctx, this.sprite, this.scoring.score, this.hiScore, w, showCurrent)

    if (this.phase === 'over') {
      const { x, y, w: gw, h: gh } = GAME_OVER_SRC
      const destX = Math.round((w - gw) / 2)
      ctx.drawImage(this.sprite, x, y, gw, gh, destX, GAME_OVER_Y_FRAC, gw, gh)
    }

    ctx.restore()
  }

  drawRowsAndDino(ctx) {
    /** @type {{ footY: number, draw: () => void }[]} */
    const layer = []
    layer.push({
      footY: this.footY,
      draw: () => this.drawDino(ctx),
    })
    for (const row of this.rows) {
      const screenLeft = row.worldX - this.cameraX
      if (screenLeft > this.visibleW + row.rowWidth || screenLeft + row.rowWidth < -row.rowWidth) {
        continue
      }
      for (const fp of row.footprints) {
        layer.push({
          footY: fp.footY,
          draw: () => this.drawRowFootprint(ctx, row, screenLeft, fp),
        })
      }
    }
    layer.sort((a, b) => a.footY - b.footY)
    for (const item of layer) {
      item.draw()
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./spawner.js').RunnerRow} row
   * @param {number} screenLeft
   * @param {{ footY: number }} fp
   */
  drawRowFootprint(ctx, row, screenLeft, fp) {
    const cfg = row.type === 'large' ? CACTUS_LARGE : CACTUS_SMALL
    const atlas = row.type === 'large' ? ATLAS.cactusLarge : ATLAS.cactusSmall
    const size = row.clusterSize
    const destW = atlas.w * size
    const sourceX = atlas.x + atlas.w * size * (size - 1) / 2
    const destX = Math.round(screenLeft)
    const destY = Math.round(fp.footY - cfg.spriteH)
    ctx.drawImage(
      this.sprite,
      sourceX,
      atlas.y,
      destW,
      atlas.h,
      destX,
      destY,
      destW,
      atlas.h,
    )
  }

  /** @param {CanvasRenderingContext2D} ctx @param {number} w */
  drawHorizon(ctx, w) {
    const { horizon } = ATLAS
    let x = -this.horizonX
    while (x < w) {
      ctx.drawImage(
        this.sprite,
        horizon.x,
        horizon.y,
        horizon.w,
        horizon.h,
        Math.floor(x),
        SKY_BOTTOM,
        horizon.w,
        HORIZON_H,
      )
      x += HORIZON_TILE_W
    }
  }

  /** @param {CanvasRenderingContext2D} ctx @param {number} w */
  drawClouds(ctx, w) {
    const cloudImg = this.cloudSprite
    if (!cloudImg) {
      return
    }
    const { w: cw, h: ch } = ATLAS.cloud
    for (const cloud of this.clouds) {
      if (!cloud.active) {
        continue
      }
      ctx.drawImage(cloudImg, Math.floor(cloud.x), cloud.y, cw, ch)
    }
  }

  drawDino(ctx) {
    const trex = ATLAS.tRex
    const destX = Math.round(this.dinoX - FOOTPRINT_W / 2)
    const footY = Math.round(this.footY)
    const destY = footY - trex.h
    ctx.drawImage(
      this.sprite,
      trex.x + this.dino.frameOffset,
      trex.y,
      trex.w,
      trex.h,
      destX,
      destY,
      trex.w,
      trex.h,
    )
  }

  destroy() {
    this.disposed = true
    this.running = false
    window.removeEventListener('blur', this._onBlur)
    window.removeEventListener('focus', this._onFocus)
    document.removeEventListener('visibilitychange', this._onVisibility)
    this.input?.setAxisMode('plane')
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }
}