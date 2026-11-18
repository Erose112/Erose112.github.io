const MOVEMENT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

const PREVENT_CODES = new Set([
  ...MOVEMENT_CODES,
  'Space',
  'Enter',
])

function isModalDialogOpen() {
  return document.querySelector('dialog[open]') != null
}

const SQRT2 = Math.SQRT2

/**
 * @param {EventTarget | null} target
 */
function isNativeActivatable(target) {
  if (!(target instanceof Element)) {
    return false
  }
  const tag = target.tagName
  if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') {
    return true
  }
  return target.getAttribute('role') === 'button'
}

/**
 * Keyboard and on-screen touch input for the desert loop.
 */
export class GameInput {
  constructor() {
    this.held = new Set()
    this.inputLocked = false
    this.jumpQueued = false
    this.jumpHeld = false
    this.enterQueued = false
    this.escapeQueued = false
    this.muteQueued = false
    this._ignoreJumpUntilRelease = false
    this.touchAxis = { x: 0, y: 0 }
    this.runnerShortcutsActive = false
    /** @type {'plane' | 'vertical'} */
    this.axisMode = 'plane'
    this._shouldPrevent = () => true
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._onVisibility = this._onVisibility.bind(this)
  }

  /** @param {() => boolean} shouldPreventDefault */
  attach(shouldPreventDefault) {
    this._shouldPrevent = shouldPreventDefault
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    window.addEventListener('blur', this._onBlur)
    document.addEventListener('visibilitychange', this._onVisibility)
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    window.removeEventListener('blur', this._onBlur)
    document.removeEventListener('visibilitychange', this._onVisibility)
    this.clearAll()
  }

  /** @param {'plane' | 'vertical'} mode */
  setAxisMode(mode) {
    this.axisMode = mode
  }

  setInputLocked(locked) {
    this.inputLocked = locked
    if (locked) {
      this.jumpQueued = false
      this.touchAxis = { x: 0, y: 0 }
    }
  }

  setRunnerShortcutsActive(active) {
    this.runnerShortcutsActive = active
  }

  clearAll() {
    this.held.clear()
    this.jumpQueued = false
    this.jumpHeld = false
    this.enterQueued = false
    this.escapeQueued = false
    this.muteQueued = false
    this.touchAxis = { x: 0, y: 0 }
  }

  /** @param {number} x @param {number} y */
  setTouchAxis(x, y) {
    this.touchAxis = { x, y }
  }

  queueTouchJump() {
    if (this.inputLocked || this._ignoreJumpUntilRelease) {
      return
    }
    this.jumpQueued = true
    this.jumpHeld = true
  }

  /** Runner ready: drop queued jump; ignore held Space until release. */
  clearJumpLatchForReady() {
    this.jumpQueued = false
    if (this.jumpHeld) {
      this._ignoreJumpUntilRelease = true
    }
  }

  releaseTouchJump() {
    this.jumpHeld = false
    this._ignoreJumpUntilRelease = false
  }

  /** @param {KeyboardEvent} e */
  _onKeyDown(e) {
    if (e.repeat) {
      return
    }
    const yieldToNative =
      (e.code === 'Space' || e.code === 'Enter') && isNativeActivatable(e.target)
    const canPrevent = this._shouldPrevent() && PREVENT_CODES.has(e.code) && !yieldToNative
    if (e.code === 'Escape') {
      if (!isModalDialogOpen() && this.runnerShortcutsActive) {
        e.preventDefault()
        this.escapeQueued = true
      }
      return
    }
    if (e.code === 'KeyM') {
      if (this.runnerShortcutsActive && !isNativeActivatable(e.target)) {
        e.preventDefault()
        this.muteQueued = true
      }
      return
    }
    if (canPrevent) {
      e.preventDefault()
    }
    if (e.code === 'Enter') {
      if (!yieldToNative && !this.inputLocked) {
        this.enterQueued = true
      }
      return
    }
    if (e.code === 'Space') {
      if (yieldToNative) {
        return
      }
      if (!this.inputLocked && !this._ignoreJumpUntilRelease) {
        this.jumpQueued = true
        this.jumpHeld = true
      }
      return
    }
    if (MOVEMENT_CODES.has(e.code)) {
      if (isNativeActivatable(e.target)) {
        return
      }
      this.held.add(e.code)
    }
  }

  /** @param {KeyboardEvent} e */
  _onKeyUp(e) {
    if (e.code === 'Space') {
      this.jumpHeld = false
      this._ignoreJumpUntilRelease = false
      return
    }
    this.held.delete(e.code)
  }

  _onBlur() {
    this.clearAll()
  }

  _onVisibility() {
    if (document.hidden) {
      this.clearAll()
    }
  }

  /** @returns {{ x: number, y: number }} */
  getAxis() {
    if (this.inputLocked) {
      return { x: 0, y: 0 }
    }
    let x = 0
    let y = 0
    if (
      this.held.has('KeyA') ||
      this.held.has('ArrowLeft')
    ) {
      x -= 1
    }
    if (
      this.held.has('KeyD') ||
      this.held.has('ArrowRight')
    ) {
      x += 1
    }
    if (
      this.held.has('KeyW') ||
      this.held.has('ArrowUp')
    ) {
      y -= 1
    }
    if (
      this.held.has('KeyS') ||
      this.held.has('ArrowDown')
    ) {
      y += 1
    }
    if (x !== 0 && y !== 0) {
      x /= SQRT2
      y /= SQRT2
    }

    if (this.axisMode === 'vertical') {
      x = 0
    }

    const tx = this.touchAxis.x
    const ty = this.touchAxis.y
    if (tx !== 0 || ty !== 0) {
      x += this.axisMode === 'vertical' ? 0 : tx
      y += ty
      const mag = Math.hypot(x, y)
      if (mag > 1) {
        x /= mag
        y /= mag
      }
    }

    return { x, y }
  }

  /** Jump edge for this frame; cleared after read. */
  consumeJumpEdge() {
    if (this.inputLocked || !this.jumpQueued) {
      return false
    }
    this.jumpQueued = false
    return true
  }

  consumeEnterEdge() {
    if (this.inputLocked || !this.enterQueued) {
      return false
    }
    this.enterQueued = false
    return true
  }

  consumeEscapeEdge() {
    if (!this.escapeQueued) {
      return false
    }
    this.escapeQueued = false
    return true
  }

  consumeMuteEdge() {
    if (!this.muteQueued) {
      return false
    }
    this.muteQueued = false
    return true
  }

  isJumpHeld() {
    return this.jumpHeld && !this.inputLocked
  }
}