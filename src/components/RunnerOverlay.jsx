/**
 * @param {{
 *   onBack: () => void,
 *   coarsePointer: boolean,
 *   phase: 'ready' | 'playing' | 'paused',
 * }} props
 */
export default function RunnerOverlay({ onBack, coarsePointer, phase }) {
  const startLabel = coarsePointer ? 'TAP TO START' : 'PRESS SPACE TO START'
  const showStartCue = phase === 'ready'

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
      <button
        type="button"
        className="runner-overlay__back font-display pointer-events-auto border-2 border-ink bg-desert px-4 py-3 text-base text-ink hover:bg-ink hover:text-desert"
        onClick={onBack}
      >
        BACK TO WORLD
      </button>
    </div>
  )
}