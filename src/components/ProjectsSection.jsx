import { projectsSection } from '../content.js'

const titleLinkClass =
  'section-copy underline hover:bg-ink hover:text-desert'

export default function ProjectsSection() {
  return (
    <section aria-labelledby="projects-heading">
      <h2
        id="projects-heading"
        tabIndex={-1}
        className="font-display text-base md:text-2xl mt-12 outline-none"
      >
        {projectsSection.title}
      </h2>

      <div className="mt-4 py-4 px-2 flex flex-col gap-12 md:gap-16">
        {projectsSection.projects.map((project, index) => {
          const cardOnRight = index % 2 === 1

          return (
            <article
              key={project.title}
              className={`flex flex-col gap-6 md:gap-8 md:items-center ${
                cardOnRight ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              <div className="border-2 border-ink p-4 flex flex-col md:w-1/2 shrink-0">
                <p className="section-copy">
                  <span>{project.title}</span>
                  {project.links.length > 0 ? (
                    <>
                      {' - '}
                      {project.links.map((link, linkIndex) => (
                        <span key={link.href}>
                          {linkIndex > 0 ? ' · ' : null}
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={titleLinkClass}
                          >
                            {link.label}
                          </a>
                        </span>
                      ))}
                    </>
                  ) : null}
                </p>
                {project.note ? (
                  <p className="section-meta mt-1 opacity-90">{project.note}</p>
                ) : null}
                {project.tech?.length ? (
                  <p className="section-meta mt-1 opacity-90">
                    {project.tech.join(' · ')}
                  </p>
                ) : null}
                <img
                  src={project.imageSrc}
                  alt={project.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="mt-3 w-full aspect-video object-cover border-2 border-ink grayscale hover:grayscale-0 focus:grayscale-0"
                  style={{ objectPosition: project.imageObjectPosition }}
                />
              </div>

              <p className="section-copy md:w-1/2">{project.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
