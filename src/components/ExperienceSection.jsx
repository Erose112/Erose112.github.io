import { experienceSection } from '../content.js'
import ExpandableDescription from './ExpandableDescription.jsx'

export default function ExperienceSection() {
  return (
    <section aria-labelledby="experience-heading">
      <h2
        id="experience-heading"
        tabIndex={-1}
        className="font-display text-base md:text-2xl mt-12 outline-none"
      >
        {experienceSection.title}
      </h2>

      <div className="mt-6 space-y-8">
        {experienceSection.roles.map((role) => (
          <div key={role.title} className="max-w-5xl">
            <p className="section-copy">{role.title}</p>
            <p className="section-meta mt-1 opacity-90">{role.meta}</p>
            <ExpandableDescription>{role.description}</ExpandableDescription>
          </div>
        ))}
      </div>
    </section>
  )
}