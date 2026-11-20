import { site } from '../content.js'

function PixelLinkedInIcon() {
  return (
    <svg
      className="pixelated inline-block h-4 w-4 shrink-0"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden
    >
      <rect width={16} height={16} fill="currentColor" />
      <rect x={3} y={6} width={3} height={7} fill="var(--color-desert)" />
      <rect x={3} y={3} width={3} height={3} fill="var(--color-desert)" />
      <rect x={8} y={6} width={3} height={1} fill="var(--color-desert)" />
      <rect x={8} y={8} width={3} height={5} fill="var(--color-desert)" />
      <rect x={8} y={3} width={3} height={2} fill="var(--color-desert)" />
      <rect x={11} y={3} width={2} height={2} fill="var(--color-desert)" />
    </svg>
  )
}

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
        PORTFOLIO
      </button>
      <a
        href={site.linkedIn.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${site.name} on LinkedIn`}
        className="game-action-btn font-display pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] inline-flex items-center gap-2 border-2 border-ink bg-desert px-2 py-2 text-base text-ink"
      >
        <PixelLinkedInIcon />
        {site.linkedIn.label.toUpperCase()}
      </a>
    </div>
  )
}
