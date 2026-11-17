import { chromiumAttribution } from '../content.js'
import AboutSection from './AboutSection.jsx'
import EducationSection from './EducationSection.jsx'
import ExperienceSection from './ExperienceSection.jsx'
import ProjectsSection from './ProjectsSection.jsx'
import SkillsSection from './SkillsSection.jsx'

/** @param {{ onPlayGame: () => void }} props */
export default function PlainPage({ onPlayGame }) {
  return (
    <main className="plain-page h-dvh overflow-y-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="mb-6">
          <button
            type="button"
            className="game-action-btn font-display border-2 border-ink bg-desert px-2 py-2 text-base text-ink"
            onClick={onPlayGame}
          >
            PLAY GAME
          </button>
        </p>
        <AboutSection />
        <EducationSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />

        <footer className="mt-12 border-t-2 border-ink pt-6 font-body text-2xl leading-[1.35]">
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