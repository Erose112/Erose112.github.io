import { educationSection } from '../content.js'

export default function EducationSection() {
  return (
    <section aria-labelledby="education-heading">
      <h2
        id="education-heading"
        tabIndex={-1}
        className="font-display text-base md:text-2xl mt-12 outline-none"
      >
        {educationSection.title}
      </h2>

      <div className="mt-6 space-y-8">
        {educationSection.items.map((item) => (
          <div key={item.title} className="max-w-5xl">
            <p className="section-copy">{item.title}</p>
            <p className="section-meta mt-1 opacity-90">{item.meta}</p>
            {item.description ? (
              <p className="section-copy mt-3">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}