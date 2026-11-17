/**
 * @param {{ onBack: () => void }} props
 */
export default function RunnerOverlay({ onBack }) {
  return (
    <div className="runner-overlay pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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