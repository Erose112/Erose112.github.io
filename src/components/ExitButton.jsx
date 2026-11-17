import { assetUrl } from '../assetUrl.js'
import { ATLAS } from '../game/atlas.js'
import { restartSpriteMultiple } from '../game/scale.js'

const SHEET_URL = assetUrl('sprites/100-offline-sprite.png')
const SHEET_W = 1233
const SHEET_H = 100

/**
 * Restart crop (36N × 32N device px). Frame 0 only; spin offsets stay unused.
 *
 * @param {{ onPress?: () => void }} props
 */
export default function ExitButton({ onPress }) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const N = restartSpriteMultiple(dpr)
  const deviceW = ATLAS.restart.w * N
  const deviceH = ATLAS.restart.h * N
  const cssW = deviceW / dpr
  const cssH = deviceH / dpr
  const scale = cssW / ATLAS.restart.w

  return (
    <button
      type="button"
      className="section-exit-btn game-action-btn fixed right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-10 overflow-hidden border-2 border-ink bg-desert p-0 pixelated"
      style={{ width: cssW, height: cssH }}
      aria-keyshortcuts="Escape"
      onClick={() => onPress?.()}
    >
      <span className="sr-only">Back to desert</span>
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
    </button>
  )
}