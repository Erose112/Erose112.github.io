import { experienceSection } from '../content.js'

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

      <div className="experience-list mt-6 space-y-10">
        {experienceSection.roles.map((role) => (
          <article
            key={`${role.role}-${role.company}-${role.dates}`}
            className="experience-role"
          >
            <div className="experience-details">
              <h3 className="experience-title">{role.role}</h3>
              <p className="experience-company">{role.company}</p>
              {role.tech?.length ? (
                <p className="experience-tech">{role.tech.join(' · ')}</p>
              ) : null}
              <p className="experience-description">{role.description}</p>
            </div>

            <div className="experience-when pt-0.5">
              <p className="experience-dates">{role.dates}</p>
              <p className="experience-location">{role.location}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
