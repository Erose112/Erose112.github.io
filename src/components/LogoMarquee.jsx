import { companyLogos } from '../content.js'

export default function LogoMarquee() {
  return (
    <div className="mt-4 overflow-hidden w-screen relative left-1/2 -translate-x-1/2">
      <div className="logo-marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex min-w-[100vw] shrink-0 list-none m-0 p-0"
            aria-hidden={copy === 1}
          >
            {companyLogos.map((logo) => (
              <li
                key={`${copy}-${logo.src}`}
                className="flex flex-1 items-center justify-center px-8 py-2"
              >
                <img
                  src={logo.src}
                  alt={copy === 0 ? logo.alt : ''}
                  className="h-12 w-auto max-w-[160px] object-contain grayscale hover:grayscale-0 focus:grayscale-0"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}