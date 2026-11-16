/**
 * @param {{
 *   visitedCount: number,
 *   onSkip: () => void,
 *   show: boolean,
 * }} props
 */
export default function Hud({ visitedCount, onSkip, show }) {
  if (!show) {
    return null
  }

  return (
    <div className="game-hud pointer-events-none absolute inset-0 z-20">
      <button
        type="button"
        className="font-display pointer-events-auto absolute left-[max(1rem,env(safe-area-inset-left,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] border-2 border-ink bg-desert px-2 py-2 text-base text-ink hover:bg-ink hover:text-desert"
        onClick={onSkip}
      >
        SKIP GAME
      </button>
      <p
        className="font-display pointer-events-none absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] text-base text-ink"
        aria-hidden
      >
        HI {visitedCount}/3
      </p>
    </div>
  )
}