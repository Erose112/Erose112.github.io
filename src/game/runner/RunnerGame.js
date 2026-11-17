import { DESERT_COLOR } from '../constants.js'

const MAX_DT = 0.05

/**
 * R1 stub: owns the canvas rAF while `loopMode === 'runner'`.
 * Ready / playing / over land in later milestones.
 */
export class RunnerGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   sprite: HTMLImageElement,
   *   input: import('../input.js').GameInput | null,
   * }} deps
   */
  constructor(canvas, deps) {
    this.canvas = canvas
    this.sprite = deps.sprite
    this.input = deps.input
    this.disposed = false
    this.rafId = 0
    this.running = false
    this.lastTime = 0
    this.ctx = null
    /** @type {'ready'} */
    this.phase = 'ready'
    this._onFrame = this._onFrame.bind(this)
  }

  enterReady() {
    this.phase = 'ready'
    this.input?.clearJumpLatchForReady()
  }

  start() {
    if (this.disposed || this.running) {
      return
    }
    this.running = true
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this._onFrame)
  }

  /**
   * @param {{ bufferW: number, bufferH: number } | null} pixelBox
   * @param {number} clientW
   * @param {number} clientH
   */
  resize(pixelBox, clientW, clientH) {
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d', { alpha: false })
    }
    void pixelBox
    void clientW
    void clientH
    this.draw()
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
    let dt = (time - this.lastTime) / 1000
    this.lastTime = time
    if (dt > MAX_DT) {
      dt = MAX_DT
    }
    void dt
    this.draw()
  }

  destroy() {
    this.disposed = true
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }
}