import { useLayoutEffect, useRef, useState } from 'react'

/**
 * @param {{
 *   logos: { src: string, alt: string, href?: string }[],
 * }} props
 */
export default function LogoMarquee({ logos }) {
  const viewportRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const measureRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [copies, setCopies] = useState(2)

  useLayoutEffect(() => {
    if (!logos.length) {
      return undefined
    }

    const updateCopies = () => {
      const viewport = viewportRef.current
      const measure = measureRef.current
      if (!viewport || !measure) {
        return
      }
      const unitWidth = measure.scrollWidth
      const viewportWidth = viewport.clientWidth
      if (unitWidth <= 0 || viewportWidth <= 0) {
        return
      }
      // Need at least two full units for a seamless -50% loop, and enough
      // width that the track always covers the section edge to edge.
      const needed = Math.max(2, Math.ceil((viewportWidth * 2) / unitWidth))
      setCopies(needed % 2 === 0 ? needed : needed + 1)
    }

    updateCopies()

    const observer = new ResizeObserver(updateCopies)
    if (viewportRef.current) {
      observer.observe(viewportRef.current)
    }
    if (measureRef.current) {
      observer.observe(measureRef.current)
    }
    return () => observer.disconnect()
  }, [logos])

  if (!logos.length) {
    return null
  }

  /** @param {number} copyIndex */
  const renderSet = (copyIndex) =>
    logos.map((logo, index) => {
      const img = (
        <img
          src={logo.src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-14 w-auto max-w-[10rem] border-2 border-ink bg-desert object-contain p-2 grayscale transition-[filter] duration-150 hover:grayscale-0 focus-visible:grayscale-0"
        />
      )
      if (logo.href) {
        return (
          <a
            key={`${copyIndex}-${logo.alt}-${index}`}
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ink"
            aria-label={logo.alt}
          >
            {img}
          </a>
        )
      }
      return (
        <span
          key={`${copyIndex}-${logo.alt}-${index}`}
          className="shrink-0"
          aria-label={logo.alt}
        >
          {img}
        </span>
      )
    })

  return (
    <div
      ref={viewportRef}
      className="logo-marquee relative my-8 w-full overflow-hidden border-y-2 border-ink py-4"
    >
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-center gap-10 px-4"
        aria-hidden="true"
      >
        {renderSet(0)}
      </div>
      <div className="logo-marquee-track flex w-max items-center gap-10 px-4">
        {Array.from({ length: copies }, (_, copyIndex) =>
          renderSet(copyIndex),
        )}
      </div>
    </div>
  )
}
