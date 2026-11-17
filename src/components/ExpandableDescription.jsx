import { useLayoutEffect, useRef, useState } from 'react'

export default function ExpandableDescription({ children }) {
  const [expanded, setExpanded] = useState(false)
  const [needsExpand, setNeedsExpand] = useState(false)
  const textRef = useRef(null)

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return

    const measure = () => {
      const restoreClamp = !el.classList.contains('description-clamp')
      el.classList.add('description-clamp')
      setNeedsExpand(el.scrollHeight > el.clientHeight + 1)
      if (restoreClamp) {
        el.classList.remove('description-clamp')
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, expanded])

  return (
    <div className="mt-3 section-copy">
      <p
        ref={textRef}
        className={expanded || !needsExpand ? undefined : 'description-clamp'}
      >
        {children}
      </p>
      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 font-display text-base underline cursor-pointer hover:bg-ink hover:text-desert px-1"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}
