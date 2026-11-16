import AboutSection from './AboutSection.jsx'
import ExperienceSection from './ExperienceSection.jsx'
import ProjectsSection from './ProjectsSection.jsx'

/** @param {{ onPlayGame: () => void }} props */
export default function PlainPage({ onPlayGame }) {
  return (
    <main className="plain-page h-dvh overflow-y-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="mb-6">
          <button
            type="button"
            className="font-display border-2 border-ink bg-desert px-2 py-2 text-base text-ink hover:bg-ink hover:text-desert"
            onClick={onPlayGame}
          >
            PLAY GAME
          </button>
        </p>
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
      </div>
    </main>
  )
}