import { experienceSection } from '../content.js'
import ExpandableDescription from './ExpandableDescription.jsx'

export default function ExperienceSection() {
  return (
    <section aria-labelledby="experience-heading">
      <h2
        id="experience-heading"
        className="font-display text-2xl mt-12"
      >
        {experienceSection.title}
      </h2>

      <div className="mt-6 max-w-5xl space-y-8">
        {experienceSection.roles.map((role) => (
          <div key={role.title}>
            <p className="font-body text-2xl leading-[1.35]">{role.title}</p>
            <p className="font-body text-2xl leading-[1.35] mt-1 opacity-90">
              {role.meta}
            </p>
            <ExpandableDescription>{role.description}</ExpandableDescription>
          </div>
        ))}
      </div>
    </section>
  )
}