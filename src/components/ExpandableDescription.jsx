import { useState } from 'react'

export default function ExpandableDescription({ children }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3 section-copy">
      <p className={expanded ? undefined : 'description-clamp'}>{children}</p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 font-display text-base underline cursor-pointer hover:bg-ink hover:text-desert px-1"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}