import { useCallback, useRef } from 'react'
import { JOYSTICK_DEADZONE } from '../game/constants.js'

const KNOB_TRAVEL = 40

/**
 * @param {{
 *   input: import('../game/input.js').GameInput | null,
 *   show: boolean,
 *   shouldPreventDefault: () => boolean,
 *   axisLock?: 'plane' | 'vertical',
 *   hideJump?: boolean,
 * }} props
 */
export default function TouchControls({
  input,
  show,
  shouldPreventDefault,
  axisLock = 'plane',
  hideJump = false,
}) {
  const stickRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const knobRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const stickCenterRef = useRef({ x: 0, y: 0 })
  const activeStickPointerRef = useRef(/** @type {number | null} */ (null))

  const applyAxis = useCallback(
    (dx, dy) => {
      if (!input) {
        return
      }
      const len = Math.hypot(dx, dy)
      if (len <= JOYSTICK_DEADZONE * KNOB_TRAVEL) {
        input.setTouchAxis(0, 0)
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate(-50%, -50%)'
        }
        return
      }
      let nx = dx / KNOB_TRAVEL
      let ny = dy / KNOB_TRAVEL
      if (axisLock === 'vertical') {
        nx = 0
      }
      const mag = Math.hypot(nx, ny)
      if (mag > 1) {
        nx /= mag
        ny /= mag
      }
      input.setTouchAxis(nx, ny)
      if (knobRef.current) {
        const clampedDx = nx * KNOB_TRAVEL
        const clampedDy = ny * KNOB_TRAVEL
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedDx}px), calc(-50% + ${clampedDy}px))`
      }
    },
    [input, axisLock],
  )

  const resetStick = useCallback(() => {
    activeStickPointerRef.current = null
    applyAxis(0, 0)
  }, [applyAxis])

  /** @param {React.PointerEvent} e */
  const onStickDown = (e) => {
    if (!input || activeStickPointerRef.current !== null) {
      return
    }
    const el = stickRef.current
    if (!el) {
      return
    }
    if (shouldPreventDefault()) {
      e.preventDefault()
    }
    el.setPointerCapture(e.pointerId)
    activeStickPointerRef.current = e.pointerId
    const rect = el.getBoundingClientRect()
    stickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    applyAxis(e.clientX - stickCenterRef.current.x, e.clientY - stickCenterRef.current.y)
  }

  /** @param {React.PointerEvent} e */
  const onStickMove = (e) => {
    if (activeStickPointerRef.current !== e.pointerId) {
      return
    }
    if (shouldPreventDefault()) {
      e.preventDefault()
    }
    applyAxis(e.clientX - stickCenterRef.current.x, e.clientY - stickCenterRef.current.y)
  }

  /** @param {React.PointerEvent} e */
  const onStickEnd = (e) => {
    if (activeStickPointerRef.current !== e.pointerId) {
      return
    }
    stickRef.current?.releasePointerCapture(e.pointerId)
    resetStick()
  }

  /** @param {React.PointerEvent} e */
  const onJumpDown = (e) => {
    if (!input) {
      return
    }
    if (shouldPreventDefault()) {
      e.preventDefault()
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    input.queueTouchJump()
  }

  if (!show) {
    return null
  }

  return (
    <div
      className="touch-controls pointer-events-none absolute inset-0 z-20 touch-none"
      aria-hidden
    >
      <div
        ref={stickRef}
        className="touch-joystick pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] h-28 w-28 border-2 border-ink bg-desert/90 touch-none"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
        role="presentation"
      >
        <div
          ref={knobRef}
          className="touch-joystick-knob absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-ink"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      </div>
      {!hideJump ? (
        <button
          type="button"
          className="font-display pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] h-28 min-w-28 border-2 border-ink bg-desert px-3 text-base text-ink touch-none hover:bg-ink hover:text-desert"
          onPointerDown={onJumpDown}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId)
            input?.releaseTouchJump()
          }}
          onPointerCancel={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId)
            input?.releaseTouchJump()
          }}
          aria-label="Jump"
        >
          JUMP
        </button>
      ) : null}
    </div>
  )
}