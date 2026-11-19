import {
  aboutCurrently,
  aboutHighlights,
  aboutMarqueeLogos,
  site,
} from '../content.js'
import LogoMarquee from './LogoMarquee.jsx'

const linkClassName =
  'underline hover:bg-ink hover:text-desert px-0.5'

export default function AboutSection({ showHeading = true }) {
  return (
    <section aria-labelledby={showHeading ? 'about-heading' : undefined}>
      {showHeading ? (
        <h1
          id="about-heading"
          tabIndex={-1}
          className="font-display text-base md:text-2xl leading-tight outline-none"
        >
          {site.name}
        </h1>
      ) : null}

      <p className="section-copy mt-4">{site.intro}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {aboutHighlights.map((item) => (
          <li
            key={item.label}
            className="border-2 border-ink bg-desert px-3 py-3 text-center"
          >
            <p className="font-display text-sm md:text-base">{item.value}</p>
            <p className="section-meta mt-1 opacity-90">{item.label}</p>
          </li>
        ))}
      </ul>

      <LogoMarquee logos={aboutMarqueeLogos} />

      <div className="border-2 border-ink bg-desert px-4 py-4">
        <h2 className="font-display text-sm md:text-base">Currently</h2>
        <ul className="section-copy mt-3 list-disc space-y-2 pl-6">
          {aboutCurrently.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="section-copy mt-8">
        {site.socialIntro}{' '}
        <a
          href={site.linkedIn.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {site.linkedIn.label}
        </a>{' '}
        and{' '}
        <a
          href={site.github.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {site.github.label}
        </a>
        .
      </p>

      <p className="section-copy mt-4">
        Check out my{' '}
        <a
          href={site.resume.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {site.resume.label}
        </a>{' '}
        or{' '}
        <a
          href={site.contactMe.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {site.contactMe.label}
        </a>
        .
      </p>

      <h2 className="font-display text-base md:text-2xl mt-10">
        {site.hobbiesTitle}
      </h2>

      <ul className="mt-4 flex flex-wrap gap-2">
        {site.hobbies.map((hobby) => (
          <li key={hobby}>
            <span className="inline-block border-2 border-ink bg-desert px-3 py-1 font-plain text-sm md:text-base">
              {hobby}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}