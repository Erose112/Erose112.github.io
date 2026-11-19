import { skillsSection } from '../content.js'

export default function SkillsSection() {
  return (
    <section aria-labelledby="skills-heading">
      <h2
        id="skills-heading"
        tabIndex={-1}
        className="font-display text-base md:text-2xl mt-12 outline-none"
      >
        {skillsSection.title}
      </h2>

      <div className="skills-copy mt-6 space-y-4">
        {skillsSection.groups.map((group) => (
          <p key={group.label} className="section-copy">
            <span className="font-bold">{group.label}:</span>{' '}
            {group.items.join(', ')}
          </p>
        ))}
      </div>
    </section>
  )
}