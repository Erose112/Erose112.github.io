import { site } from '../content.js'

const linkClassName =
  'underline hover:bg-ink hover:text-desert px-0.5'

export default function AboutSection({ showHeading = true }) {
  return (
    <section aria-labelledby={showHeading ? 'about-heading' : undefined}>
      {showHeading ? (
        <h1
          id="about-heading"
          tabIndex={-1}
          className="font-display text-base lg:text-[32px] leading-tight outline-none"
        >
          {site.name}
        </h1>
      ) : null}

      <p className="mt-4 max-w-5xl font-body text-2xl leading-[1.35]">
        {site.intro}
      </p>

      <p className="mt-2 max-w-5xl font-body text-2xl leading-[1.35]">
        <span className="font-bold">{site.aboutLabel}</span>{' '}
        {site.aboutBody}
      </p>

      <p className="mt-8 max-w-5xl font-body text-2xl leading-[1.35]">
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

      <p className="mt-4 max-w-5xl font-body text-2xl leading-[1.35]">
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

      <h2 className="font-display text-2xl mt-10">{site.hobbiesTitle}</h2>

      <p className="mt-4 max-w-5xl font-body text-2xl leading-[1.35]">
        {site.hobbiesBody}
      </p>
    </section>
  )
}