import { computeScale } from './constants.js'

/**
 * @param {number} clientWidth
 * @param {number} clientHeight
 * @param {number} dpr
 * @param {{ bufferW: number, bufferH: number } | null} pixelBox
 */
export function resolveBufferSize(clientWidth, clientHeight, dpr, pixelBox) {
  if (
    pixelBox &&
    Number.isFinite(pixelBox.bufferW) &&
    Number.isFinite(pixelBox.bufferH)
  ) {
    return { bufferW: pixelBox.bufferW, bufferH: pixelBox.bufferH }
  }
  return {
    bufferW: Math.round(clientWidth * dpr),
    bufferH: Math.round(clientHeight * dpr),
  }
}

/**
 * Integer device-pixel scale S and canvas backing store for the game view.
 */
export function applyCanvasScale(canvas, clientWidth, clientHeight, dpr, pixelBox) {
  const S = computeScale(dpr, clientWidth, clientHeight)
  const { bufferW, bufferH } = resolveBufferSize(
    clientWidth,
    clientHeight,
    dpr,
    pixelBox,
  )

  canvas.style.width = `${clientWidth}px`
  canvas.style.height = `${clientHeight}px`
  canvas.width = bufferW
  canvas.height = bufferH

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    return null
  }
  ctx.setTransform(S, 0, 0, S, 0, 0)
  ctx.imageSmoothingEnabled = false

  return { ctx, S, bufferW, bufferH, visibleW: bufferW / S, visibleH: bufferH / S }
}

/** Integer N so restart sprite device box is 36N × 32N (PLAN §5). */
export function restartSpriteMultiple(dpr) {
  return Math.max(2, Math.round(2 * dpr))
}