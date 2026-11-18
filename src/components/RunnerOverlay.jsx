import { forwardRef, useEffect, useState } from 'react'
import { assetUrl } from '../assetUrl.js'
import { ATLAS } from '../game/atlas.js'
import { restartSpriteMultiple } from '../game/scale.js'
import { writeSlowMode } from '../game/runner/storage.js'

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
 *   onResume?: () => void,
 *   onToggleMute?: () => void,
 *   onSlowChange?: (slow: boolean) => void,
 *   coarsePointer: boolean,
 *   phase: 'ready' | 'playing' | 'paused' | 'over',
 *   muted?: boolean,
 *   slowMode?: boolean,
 *   reduceMotion?: boolean,
 *   reducedMotionNoteDismissed?: boolean,
 *   onDismissReducedMotionNote?: () => void,
 *   restartRef?: import('react').Ref<HTMLButtonElement>,
 * }} props
 */
export default function RunnerOverlay({
  onBack,
  onRestart,
  onResume,
  onToggleMute,
  onSlowChange,
  coarsePointer,
  phase,
  muted = true,
  slowMode = false,
  reduceMotion = false,
  reducedMotionNoteDismissed = true,
  onDismissReducedMotionNote,
  restartRef,
}) {
  const startLabel = coarsePointer ? 'TAP TO START' : 'PRESS SPACE TO START'
  const showStartCue = phase === 'ready'
  const showOverChrome = phase === 'over'
  const showPausedChrome = phase === 'paused'
  const showSlowToggle = phase === 'ready' || phase === 'paused'

  const handleSlowToggle = () => {
    const next = !slowMode
    writeSlowMode(next)
    onSlowChange?.(next)
  }

  return (
    <>
      <div
        className="runner-overlay__top pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-hidden={phase === 'playing'}
      >
        <div className="flex flex-col gap-2">
          {showSlowToggle ? (
            <label className="runner-overlay__slow font-display flex cursor-pointer items-center gap-2 border-2 border-ink bg-desert px-3 py-2 text-[10px] text-ink sm:text-xs">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                checked={slowMode}
                onChange={handleSlowToggle}
              />
              SLOW MODE
            </label>
          ) : null}
          <button
            type="button"
            className="runner-overlay__mute font-display border-2 border-ink bg-desert px-3 py-2 text-[10px] text-ink hover:bg-ink hover:text-desert sm:text-xs"
            onClick={() => onToggleMute?.()}
            aria-pressed={!muted}
          >
            {muted ? 'SOUND OFF (M)' : 'SOUND ON (M)'}
          </button>
        </div>
        {reduceMotion && !reducedMotionNoteDismissed && phase !== 'playing' ? (
          <div className="runner-overlay__rm-note pointer-events-auto max-w-[14rem] border-2 border-ink bg-desert p-3 text-left">
            <p className="font-display text-[10px] leading-relaxed text-ink sm:text-xs">
              This game scrolls. Slow mode is available.
            </p>
            <button
              type="button"
              className="font-display mt-2 border-2 border-ink bg-desert px-2 py-1 text-[10px] text-ink hover:bg-ink hover:text-desert"
              onClick={() => onDismissReducedMotionNote?.()}
            >
              DISMISS
            </button>
          </div>
        ) : null}
      </div>
      <div className="runner-overlay pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {showStartCue ? (
          <p className="runner-overlay__prompt font-display pointer-events-none text-center text-base text-ink">
            {startLabel}
          </p>
        ) : null}
        {showPausedChrome ? (
          <p className="runner-overlay__prompt font-display pointer-events-none text-center text-base text-ink">
            PAUSED
          </p>
        ) : null}
        <div
          className={[
            'runner-overlay__actions pointer-events-auto flex flex-wrap items-center justify-center gap-4',
            showOverChrome || showPausedChrome ? '' : 'w-full',
          ].join(' ')}
        >
          {showPausedChrome ? (
            <button
              type="button"
              className="runner-overlay__resume font-display border-2 border-ink bg-desert px-4 py-3 text-base text-ink hover:bg-ink hover:text-desert"
              onClick={() => onResume?.()}
            >
              RESUME
            </button>
          ) : null}
          {showOverChrome ? (
            <RunnerRestartButton
              ref={restartRef}
              onPress={() => {
                onRestart()
              }}
            />
          ) : null}
          {(showOverChrome || showPausedChrome || phase === 'ready') && onBack ? (
            <button
              type="button"
              className="runner-overlay__back font-display pointer-events-auto border-2 border-ink bg-desert px-4 py-3 text-base text-ink hover:bg-ink hover:text-desert"
              onClick={onBack}
            >
              BACK TO WORLD
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}