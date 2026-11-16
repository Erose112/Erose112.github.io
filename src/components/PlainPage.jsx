import AboutSection from './AboutSection.jsx'
import ExperienceSection from './ExperienceSection.jsx'
import ProjectsSection from './ProjectsSection.jsx'

export default function PlainPage() {
  return (
    <main className="plain-page h-dvh overflow-y-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
      </div>
    </main>
  )
}