/**
 * @param {{
 *   onSkip: () => void,
 *   show: boolean,
 * }} props
 */
export default function Hud({ onSkip, show }) {
  if (!show) {
    return null
  }

  return (
    <div className="game-hud pointer-events-none absolute inset-0 z-20">
      <button
        type="button"
        className="game-action-btn font-display pointer-events-auto absolute left-[max(1rem,env(safe-area-inset-left,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] border-2 border-ink bg-desert px-2 py-2 text-base text-ink"
        onClick={onSkip}
      >
        SKIP GAME
      </button>
    </div>
  )
}