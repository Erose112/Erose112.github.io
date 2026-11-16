import {
  cameraAnchor,
  DESERT_COLOR,
  SPRITE_SHEET_URL,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js'
import {
  createClouds,
  createDino,
  drawClouds,
  drawDino,
  drawHorizonTiles,
  drawSky,
  drawWorldMargins,
  layoutCloudsForView,
  updateClouds,
  updateDinoIdle,
} from './entities.js'
import { applyCanvasScale } from './scale.js'

const MAX_DT = 0.05

function clampCamera(camX, camY, viewW, viewH) {
  let x = camX
  let y = camY
  if (viewW >= WORLD_WIDTH) {
    x = -(viewW - WORLD_WIDTH) / 2
  } else {
    x = Math.max(0, Math.min(WORLD_WIDTH - viewW, x))
  }
  if (viewH >= WORLD_HEIGHT) {
    y = -(viewH - WORLD_HEIGHT) / 2
  } else {
    y = Math.max(0, Math.min(WORLD_HEIGHT - viewH, y))
  }
  return { x: Math.round(x), y: Math.round(y) }
}

export class Game {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas
    this.disposed = false
    this.rafId = 0
    this.running = false
    this.paused = false
    this.lastTime = 0
    this.sprite = new Image()
    this.sprite.src = SPRITE_SHEET_URL
    this.dino = createDino()
    this.clouds = createClouds()
    this.ctx = null
    this.viewW = 0
    this.viewH = 0
    this.camX = 0
    this.camY = 0
    this.pixelBox = null
    this.scaleS = 1
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    this._onFrame = this._onFrame.bind(this)
    this._onVisibility = this._onVisibility.bind(this)
  }

  async start() {
    await this.sprite.decode()
    if (this.disposed) {
      return
    }
    document.addEventListener('visibilitychange', this._onVisibility)
    this.resize(
      null,
      this.canvas.clientWidth || window.innerWidth,
      this.canvas.clientHeight || window.innerHeight,
    )
    this.running = true
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this._onFrame)
  }

  /**
   * @param {{ bufferW: number, bufferH: number } | null} [pixelBox]
   * @param {number} [clientW]
   * @param {number} [clientH]
   */
  resize(pixelBox = null, clientW, clientH) {
    if (pixelBox) {
      this.pixelBox = pixelBox
    }
    const dpr = window.devicePixelRatio || 1
    const w = clientW ?? this.canvas.clientWidth ?? window.innerWidth
    const h = clientH ?? this.canvas.clientHeight ?? window.innerHeight
    const applied = applyCanvasScale(this.canvas, w, h, dpr, this.pixelBox)
    if (!applied) {
      return
    }
    this.ctx = applied.ctx
    this.viewW = applied.visibleW
    this.viewH = applied.visibleH
    this.scaleS = applied.S

    const anchor = cameraAnchor(this.viewH)
    const footScreenY = anchor * this.viewH
    const targetX = this.dino.footX - this.viewW / 2
    const targetY = this.dino.footY - footScreenY
    const cam = clampCamera(targetX, targetY, this.viewW, this.viewH)
    this.camX = cam.x
    this.camY = cam.y
    layoutCloudsForView(this.clouds, this.camX, this.camY, this.viewW, this.viewH)
    this.draw()
  }

  draw() {
    const ctx = this.ctx
    if (!ctx) {
      return
    }
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = DESERT_COLOR
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.restore()

    ctx.setTransform(this.scaleS, 0, 0, this.scaleS, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.translate(-this.camX, -this.camY)

    drawWorldMargins(ctx, this.camX, this.camY, this.viewW, this.viewH)
    drawSky(ctx, this.camX, this.camY, this.viewW, this.viewH)
    drawHorizonTiles(ctx, this.sprite, this.camX, this.camY, this.viewW, this.viewH)
    drawClouds(ctx, this.sprite, this.clouds)
    drawDino(ctx, this.sprite, this.dino)
  }

  tick(dt) {
    const now = performance.now()
    updateDinoIdle(this.dino, now)
    if (!this.reduceMotion) {
      updateClouds(this.clouds, dt, this.camX, this.viewW)
    }
  }

  _onFrame(time) {
    if (this.disposed) {
      return
    }
    this.rafId = requestAnimationFrame(this._onFrame)
    if (!this.running || this.paused) {
      this.lastTime = time
      return
    }
    let dt = (time - this.lastTime) / 1000
    this.lastTime = time
    if (dt > MAX_DT) {
      dt = MAX_DT
    }
    this.tick(dt)
    this.draw()
  }

  _onVisibility() {
    this.paused = document.hidden
    if (!document.hidden) {
      this.lastTime = performance.now()
    }
  }

  destroy() {
    this.disposed = true
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    document.removeEventListener('visibilitychange', this._onVisibility)
  }
}