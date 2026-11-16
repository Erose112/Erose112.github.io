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

      <div className="mt-4 py-4 px-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projectsSection.projects.map((project) => (
            <div
              key={project.title}
              className="border-2 border-ink p-4 flex flex-col"
            >
              {project.href ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={titleLinkClass}
                >
                  {project.title}
                </a>
              ) : (
                <p className="section-copy">{project.title}</p>
              )}
              <img
                src={project.imageSrc}
                alt={project.imageAlt}
                loading="lazy"
                decoding="async"
                className="mt-3 w-full aspect-video object-cover border-2 border-ink grayscale hover:grayscale-0 focus:grayscale-0"
                style={{ objectPosition: project.imageObjectPosition }}
              />
              <p className="section-copy mt-4 flex-1">{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}