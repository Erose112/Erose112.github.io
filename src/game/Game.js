import {
  cameraAnchor,
  DESERT_COLOR,
  SPRITE_SHEET_URL,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js'
import {
  createDino,
  createDustState,
  createPortals,
  createPterodactylState,
  buildCloudSprite,
  createScreenClouds,
  drawDust,
  drawSky,
  drawSortedActors,
  drawWorldMargins,
  layoutScreenClouds,
  portalLabelAnchor,
  portalOverlappingTrigger,
  portalSolidColliders,
  updateDinoAnimation,
  updateDinoGatePteros,
  updateDinoMoveAndJump,
  updateDust,
  updatePterodactyl,
  updateScreenClouds,
} from './entities.js'
import { RunnerGame } from './runner/RunnerGame.js'
import { buildGroundCanvas, drawGroundLayer } from './ground.js'
import { GameInput } from './input.js'
import { createPropCacti, propSolidColliders } from './props.js'
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

/**
 * @typedef {{
 *   onProximity?: (id: import('./entities.js').PortalGate['id'] | null) => void,
 *   onEnter?: (id: import('./entities.js').PortalId) => void,
 *   onApex?: () => void,
 *   onFirstMovement?: () => void,
 *   portalLabels?: Record<string, HTMLElement | null>,
 * }} GameOptions
 */

export class Game {
  /** @param {HTMLCanvasElement} canvas @param {GameOptions} [options] */
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.onProximity = options.onProximity ?? (() => {})
    this.onEnter = options.onEnter ?? (() => {})
    this.onApex = options.onApex ?? (() => {})
    this.onFirstMovement = options.onFirstMovement ?? (() => {})
    this.portalLabels = options.portalLabels ?? {}
    this.disposed = false
    this.rafId = 0
    this.running = false
    this.paused = false
    this.lastTime = 0
    this.sprite = new Image()
    this.sprite.src = SPRITE_SHEET_URL
    this.dino = createDino()
    this.clouds = createScreenClouds()
    this.portals = createPortals()
    this.props = createPropCacti()
    this.portalSolids = portalSolidColliders(this.portals)
    this.propSolids = propSolidColliders(this.props)
    this.allSolids = [...this.portalSolids, ...this.propSolids]
    this.dust = createDustState()
    this.ptero = createPterodactylState()
    this.groundCanvas = null
    /** @type {HTMLCanvasElement | null} */
    this.cloudSprite = null
    this.ctx = null
    this.viewW = 0
    this.viewH = 0
    this.camX = 0
    this.camY = 0
    this.pixelBox = null
    this.scaleS = 1
    this.cssPxPerGame = 1
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /** @type {'world' | 'transition' | 'section' | 'plain' | 'runner'} */
    this.loopMode = 'world'
    /** @type {RunnerGame | null} */
    this.runner = null
    /** @type {(() => void) | null} */
    this.onRunnerGameOver = null
    this.inputLocked = false
    this.input = null
    this.activePortal = null
    this._awaitingApex = false
    this._prevVz = 0
    this._frozenAtApex = false
    this._movementAnnounced = false

    this._onFrame = this._onFrame.bind(this)
    this._onVisibility = this._onVisibility.bind(this)
  }

  /** @param {'world' | 'transition' | 'section' | 'plain' | 'runner'} mode */
  setLoopMode(mode) {
    const wasRunner = this.loopMode === 'runner'
    this.loopMode = mode
    if (mode === 'runner' && !wasRunner) {
      this._syncPauseFromMode()
      return
    }
    if (wasRunner && mode !== 'runner') {
      this.stopRunner()
    }
    this._syncPauseFromMode()
  }

  startRunner() {
    if (!this.runner) {
      this.runner = new RunnerGame(this.canvas, {
        sprite: this.sprite,
        input: this.input,
        cloudSprite: this.cloudSprite,
        reduceMotion: this.reduceMotion,
        onGameOver: () => this.onRunnerGameOver?.(),
      })
    }
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.runner.resize(this.pixelBox, w, h)
    this.runner.enterReady()
    this.runner.start()
  }

  stopRunner() {
    this.runner?.destroy()
    this.runner = null
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.resize(this.pixelBox, w, h)
  }

  setInputLocked(locked) {
    this.inputLocked = locked
    this.input?.setInputLocked(locked)
  }

  /** @param {import('./entities.js').PortalId} portalId */
  placeDinoAtReturn(portalId) {
    const gate = this.portals.find((p) => p.id === portalId)
    if (!gate) {
      return
    }
    const { x, y } = gate.returnPoint
    this.dino.footX = x
    this.dino.footY = y
    this.dino.z = 0
    this.dino.vz = 0
    this.dino.airborne = false
    this.dino.reachedMinJump = false
    this.dino.moveSpeed = 0
    this.updateCamera()
  }

  beginEnterTransition() {
    this._awaitingApex = true
    this._prevVz = this.dino.vz
    this._frozenAtApex = false
  }

  freezeAtApex() {
    this._frozenAtApex = true
    this._awaitingApex = false
  }

  clearTransitionFreeze() {
    this._frozenAtApex = false
    this._awaitingApex = false
  }

  getDinoScreenHead() {
    const scale = this.cssPxPerGame
    return {
      x: (this.dino.footX - this.camX) * scale,
      y: (this.dino.footY - this.camY - 47 - this.dino.z) * scale,
    }
  }

  getCameraState() {
    return {
      camX: this.camX,
      camY: this.camY,
      viewW: this.viewW,
      viewH: this.viewH,
      portals: this.portals.map((g) => ({
        id: g.id,
        label: g.label,
        anchor: portalLabelAnchor(g),
        centerX: g.centerX,
        footY: g.footY,
      })),
    }
  }

  isPortalVisible(anchor) {
    const margin = 8
    const left = this.camX + margin
    const right = this.camX + this.viewW - margin
    const top = this.camY + margin
    const bottom = this.camY + this.viewH - margin
    return (
      anchor.x >= left &&
      anchor.x <= right &&
      anchor.y >= top &&
      anchor.y <= bottom
    )
  }

  _isLoopActive() {
    if (document.hidden) {
      return false
    }
    return this.loopMode === 'world' || this.loopMode === 'transition'
  }

  _syncPauseFromMode() {
    this.paused = !this._isLoopActive()
  }

  async start() {
    await this.sprite.decode()
    if (this.disposed) {
      return
    }
    this.groundCanvas = buildGroundCanvas(this.sprite)
    this.cloudSprite = buildCloudSprite(this.sprite)
    document.addEventListener('visibilitychange', this._onVisibility)
    this.input = new GameInput()
    this.input.attach(() => {
      if (this.loopMode === 'runner') {
        return this.runner?.wantsKeyboardCapture() ?? false
      }
      return this._isLoopActive()
    })
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
    if (this.loopMode === 'runner' && this.runner) {
      this.runner.resize(this.pixelBox, w, h)
      return
    }

    const applied = applyCanvasScale(this.canvas, w, h, dpr, this.pixelBox)
    if (!applied) {
      return
    }
    this.ctx = applied.ctx
    this.viewW = applied.visibleW
    this.viewH = applied.visibleH
    this.scaleS = applied.S
    this.cssPxPerGame = applied.S / dpr

    layoutScreenClouds(this.clouds, this.viewW, this.viewH)

    const anchor = cameraAnchor(this.viewH)
    const footScreenY = anchor * this.viewH
    const targetX = this.dino.footX - this.viewW / 2
    const targetY = this.dino.footY - footScreenY
    const cam = clampCamera(targetX, targetY, this.viewW, this.viewH)
    this.camX = cam.x
    this.camY = cam.y
    this._updatePortalLabelStyles()
    this.draw()
  }

  _portalLabelFontPx() {
    const ratio = this.cssPxPerGame
    if (ratio >= 3) {
      return 24
    }
    return 16
  }

  _updatePortalLabelStyles() {
    const fontPx = this._portalLabelFontPx()
    const scale = this.cssPxPerGame

    for (const gate of this.portals) {
      const el = this.portalLabels[gate.id]
      if (!el) {
        continue
      }
      const anchor = portalLabelAnchor(gate)
      const screenX = (anchor.x - this.camX) * scale
      const screenY = (anchor.y - this.camY) * scale
      el.style.fontSize = `${fontPx}px`
      el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%)`
    }
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
    if (this.groundCanvas) {
      drawGroundLayer(ctx, this.groundCanvas, this.camX, this.camY, this.viewW, this.viewH)
    }
    drawSortedActors(
      ctx,
      this.sprite,
      this.dino,
      this.portals,
      this.props,
      this.cloudSprite,
      this.clouds,
      this.camX,
      this.camY,
      this.viewW,
      this.viewH,
      this.ptero,
    )
    drawDust(ctx, this.dust)
    this._updatePortalLabelStyles()
  }

  updateCamera() {
    const anchor = cameraAnchor(this.viewH)
    const footScreenY = anchor * this.viewH
    const targetX = this.dino.footX - this.viewW / 2
    const targetY = this.dino.footY - footScreenY
    const cam = clampCamera(targetX, targetY, this.viewW, this.viewH)
    this.camX = cam.x
    this.camY = cam.y
  }

  _updatePortalProximity() {
    if (this.loopMode !== 'world') {
      return
    }
    const inTrigger =
      this.dino.z === 0 ? portalOverlappingTrigger(this.dino, this.portals) : null
    if (inTrigger !== this.activePortal) {
      this.activePortal = inTrigger
      this.onProximity(inTrigger)
    }
  }

  tick(dt) {
    const now = performance.now()

    if (this._frozenAtApex) {
      this.dino.moveSpeed = 0
      updateDinoAnimation(this.dino, now, 0)
      this.updateCamera()
      updateDinoGatePteros(this.portals, dt, this.reduceMotion)
      if (!this.reduceMotion) {
        updateScreenClouds(this.clouds, dt, this.viewW, this.viewH, this.camX)
        updatePterodactyl(
          this.ptero,
          now,
          dt,
          this.camX,
          this.camY,
          this.viewW,
          this.viewH,
          this.reduceMotion,
        )
      }
      return
    }

    const axis = this.input?.getAxis() ?? { x: 0, y: 0 }
    if (
      !this._movementAnnounced &&
      (Math.abs(axis.x) > 0.01 || Math.abs(axis.y) > 0.01)
    ) {
      this._movementAnnounced = true
      this.onFirstMovement()
    }
    const jumpEdge = this.input?.consumeJumpEdge() ?? false
    const jumpHeld = this.input?.isJumpHeld() ?? false

    const enteredPortal = updateDinoMoveAndJump(
      this.dino,
      axis,
      dt,
      jumpEdge,
      jumpHeld,
      this.allSolids,
      this.portals,
    )
    if (this.loopMode === 'world' && enteredPortal) {
      this.onEnter(enteredPortal)
    }

    if (
      this._awaitingApex &&
      this.loopMode === 'transition' &&
      this.dino.airborne &&
      this._prevVz > 0 &&
      this.dino.vz <= 0
    ) {
      this._awaitingApex = false
      this.onApex()
    }
    this._prevVz = this.dino.vz

    updateDinoAnimation(this.dino, now, dt)
    if (!this.reduceMotion) {
      updateDust(this.dust, this.dino, dt)
    }
    this.updateCamera()
    this._updatePortalProximity()

    updateDinoGatePteros(this.portals, dt, this.reduceMotion)
    if (!this.reduceMotion) {
      updateScreenClouds(this.clouds, dt, this.viewW, this.viewH, this.camX)
      updatePterodactyl(
        this.ptero,
        now,
        dt,
        this.camX,
        this.camY,
        this.viewW,
        this.viewH,
        this.reduceMotion,
      )
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
    this._syncPauseFromMode()
    this.input?.clearAll()
    if (!document.hidden) {
      this.lastTime = performance.now()
    }
  }

  destroy() {
    this.disposed = true
    this.running = false
    this.stopRunner()
    this.input?.destroy()
    this.input = null
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    document.removeEventListener('visibilitychange', this._onVisibility)
  }
}