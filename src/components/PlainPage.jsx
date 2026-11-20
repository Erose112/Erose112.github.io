import { useEffect, useRef } from 'react'
import { chromiumAttribution, experienceSection, projectsSection } from '../content.js'
import AboutSection from './AboutSection.jsx'
import EducationSection from './EducationSection.jsx'
import SkillsSection from './SkillsSection.jsx'

/**
 * @param {{
 *   onPlayGame: () => void,
 *   onOpenSection: (id: 'experience' | 'projects') => void,
 *   restoreScrollTop?: number | null,
 * }} props
 */
export default function PlainPage({
  onPlayGame,
  onOpenSection,
  restoreScrollTop = null,
}) {
  const mainRef = useRef(/** @type {HTMLElement | null} */ (null))

  useEffect(() => {
    if (restoreScrollTop == null || !mainRef.current) {
      return
    }
    mainRef.current.scrollTop = restoreScrollTop
  }, [restoreScrollTop])

  return (
    <main ref={mainRef} className="plain-page h-dvh overflow-y-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="mb-6">
          <button
            type="button"
            className="game-action-btn font-display border-2 border-ink bg-desert px-2 py-2 text-base text-ink"
            onClick={onPlayGame}
          >
            ENTER WORLD
          </button>
        </p>
        <AboutSection />
        <EducationSection />
        <SkillsSection />

        <p className="mt-12">
          <button
            type="button"
            className="game-action-btn font-display w-full border-2 border-ink bg-desert px-4 py-5 text-left text-base text-ink md:text-2xl"
            onClick={() => onOpenSection('experience')}
          >
            {experienceSection.title}
          </button>
        </p>

        <p className="mt-6">
          <button
            type="button"
            className="game-action-btn font-display w-full border-2 border-ink bg-desert px-4 py-5 text-left text-base text-ink md:text-2xl"
            onClick={() => onOpenSection('projects')}
          >
            {projectsSection.title}
          </button>
        </p>

        <footer className="mt-12 border-t-2 border-ink pt-6">
          <p>
            {chromiumAttribution.plainFooter}{' '}
            <a
              href={chromiumAttribution.licenseHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:bg-ink hover:text-desert"
            >
              {chromiumAttribution.licenseLabel}
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  )
}
