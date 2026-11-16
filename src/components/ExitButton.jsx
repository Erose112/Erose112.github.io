import { createPortal } from 'react-dom'
import { ATLAS } from '../game/atlas.js'
import { restartSpriteMultiple } from '../game/scale.js'

const SHEET_URL = '/sprites/100-offline-sprite.png'
const SHEET_W = 1233
const SHEET_H = 100

/**
 * Milestone 2: crisp restart crop (36N × 32N device px). Portaled to body so
 * #root { overflow: hidden } does not clip `position: fixed`.
 */
export default function ExitButton() {
  const dpr = window.devicePixelRatio || 1
  const N = restartSpriteMultiple(dpr)
  const deviceW = ATLAS.restart.w * N
  const deviceH = ATLAS.restart.h * N
  const cssW = deviceW / dpr
  const cssH = deviceH / dpr
  const scale = cssW / ATLAS.restart.w

  return createPortal(
    <div
      className="exit-preview pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top,0px))] z-[200] -translate-x-1/2"
      aria-hidden
    >
      <div
        className="pixelated overflow-hidden border-2 border-ink bg-desert"
        style={{ width: cssW, height: cssH }}
      >
        <img
          src={SHEET_URL}
          alt=""
          draggable={false}
          className="block max-w-none"
          width={Math.round(SHEET_W * scale)}
          height={Math.round(SHEET_H * scale)}
          style={{
            marginLeft: -ATLAS.restart.x * scale,
            marginTop: -ATLAS.restart.y * scale,
          }}
        />
      </div>
    </div>,
    document.body,
  )
}