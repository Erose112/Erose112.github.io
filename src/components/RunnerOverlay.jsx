import { forwardRef, useEffect, useState } from 'react'
import { assetUrl } from '../assetUrl.js'
import { ATLAS } from '../game/atlas.js'
import { restartSpriteMultiple } from '../game/scale.js'

const SHEET_URL = assetUrl('sprites/100-offline-sprite.png')
const SHEET_W = 1233
const SHEET_H = 100

/** Restart strip frames from `game_over_panel.ts` (frame 0 is the square + arrow). */
const RESTART_FRAME_X = [0, 36, 72, 108, 144, 180, 216, 252]
const RESTART_MS_PER_FRAME = 875 / 8

const RunnerRestartButton = forwardRef(function RunnerRestartButton(
  { onPress },
  ref,
) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const N = restartSpriteMultiple(dpr)
  const deviceW = ATLAS.restart.w * N
  const deviceH = ATLAS.restart.h * N
  const cssW = deviceW / dpr
  const cssH = deviceH / dpr
  const scale = cssW / ATLAS.restart.w
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % RESTART_FRAME_X.length)
    }, RESTART_MS_PER_FRAME)
    return () => window.clearInterval(id)
  }, [])

  const frameX = ATLAS.restart.x + RESTART_FRAME_X[frame]

  return (
    <button
      ref={ref}
      type="button"
      className="runner-overlay__restart section-exit-btn game-action-btn overflow-hidden border-2 border-ink bg-desert p-0 pixelated"
      style={{ width: cssW, height: cssH }}
      onClick={() => {
        onPress?.()
      }}
    >
      <span className="sr-only">Restart run</span>
      <img
        src={SHEET_URL}
        alt=""
        draggable={false}
        className="block max-w-none"
        width={Math.round(SHEET_W * scale)}
        height={Math.round(SHEET_H * scale)}
        style={{
          marginLeft: -frameX * scale,
          marginTop: -ATLAS.restart.y * scale,
        }}
      />
    </button>
  )
})

/**
 * @param {{
 *   onBack: () => void,
 *   onRestart: () => void,
 *   coarsePointer: boolean,
 *   phase: 'ready' | 'playing' | 'paused' | 'over',
 *   restartRef?: import('react').Ref<HTMLButtonElement>,
 * }} props
 */
export default function RunnerOverlay({
  onBack,
  onRestart,
  coarsePointer,
  phase,
  restartRef,
}) {
  const startLabel = coarsePointer ? 'TAP TO START' : 'PRESS SPACE TO START'
  const showStartCue = phase === 'ready'
  const showOverChrome = phase === 'over'

  return (
    <div className="runner-overlay pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {showStartCue ? (
        <p className="runner-overlay__prompt font-display pointer-events-none text-center text-base text-ink">
          {startLabel}
        </p>
      ) : null}
      {phase === 'paused' ? (
        <p className="runner-overlay__prompt font-display pointer-events-none text-center text-base text-ink">
          PAUSED
        </p>
      ) : null}
      <div
        className={[
          'runner-overlay__actions pointer-events-auto flex items-center justify-center gap-4',
          showOverChrome ? '' : 'w-full',
        ].join(' ')}
      >
        {showOverChrome ? (
          <RunnerRestartButton
            ref={restartRef}
            onPress={() => {
              onRestart()
            }}
          />
        ) : null}
        <button
          type="button"
          className="runner-overlay__back font-display pointer-events-auto border-2 border-ink bg-desert px-4 py-3 text-base text-ink hover:bg-ink hover:text-desert"
          onClick={onBack}
        >
          BACK TO WORLD
        </button>
      </div>
    </div>
  )
}