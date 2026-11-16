import { useState } from 'react'

// Add more logos here — they will space evenly and loop automatically.
const companyLogos = [
  { src: '/memotext-logo.png', alt: 'MEMOTEXT' },
  { src: '/queens-logo.png', alt: "Queen's University" },
  { src: '/slr-logo.jpg', alt: 'SLR Consulting' },
  { src: '/u-flourish.png', alt: 'UFlourish' },
]

function LogoMarquee() {
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
                  className="h-12 w-auto max-w-[160px] object-contain"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

function ExpandableDescription({ children }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3">
      <p className={expanded ? undefined : 'truncate'}>{children}</p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 underline text-sm cursor-pointer hover:text-blue-600"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}

function App() {
  return (
    <body className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Ethan Rose</h1>

        <p className="mt-4 max-w-5xl">
          I'm a Queen's University 3rd year Computer Science and Math student.
        </p>

        <p className="mt-2 max-w-5xl">
          <span className="font-bold">A bit about me:</span> I'm on the Queen's
          Rocket Engineering Team and currently working on the redesign of a
          fault injection tool for the launch control stack. I previously redid
          their website. I'm also the co-founder of a course scheduling and
          degree planning tool, Qflow, that has over 5,000 undergraduate users.
          I'm currently working on implementing a degree planning feature that I
          built in my 2nd year.
        </p>

        <p className="mt-8 max-w-5xl">
          Some of my relevant social links are:{' '}
          <a
            href="https://www.linkedin.com/in/ethan-rose-3382b1344/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            LinkedIn
          </a>{' '}
          and{' '}
          <a
            href="https://github.com/Erose112"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            GitHub
          </a>
          .
        </p>

        <p className="mt-4 max-w-5xl">
          Check out my{' '}
          <a
            href="/Ethan_R_Software_Developer_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            Resume
          </a>{' '}
          or{' '}
          <a
            href="https://www.linkedin.com/in/ethan-rose-3382b1344/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            Contact Me
          </a>
          .
        </p>

        <h2 className="text-lg mt-12 font-semibold">Experience:</h2>

        <LogoMarquee />

        <div className="mt-6 max-w-5xl space-y-8">
          <div>
            <p className="font-semibold">
              Software Development Intern — MEMOTEXT Corporation
            </p>
            <p className="text-sm mt-1">
              Toronto, ON (Remote) · May 2026 – August 2026
            </p>
            <ExpandableDescription>
              I was the sole full-stack developer on FORT, a mental health
              platform commissioned by the University Health Network for Queen’s
              students. The product launched in September 2026 through a pilot
              course, IDIS 199. I worked closely with the project manager and
              UHN’s team to integrate a resource recommendation API, and I built
              both the Admin Console and the Student Portal using Laravel,
              React, and Inertia.js. I also rebuilt four pages of the company
              website in Next.js with incremental static regeneration, pulling
              content from WordPress.
            </ExpandableDescription>
          </div>

          <div>
            <p className="font-semibold">
              Software Development Intern (Part-Time) — MEMOTEXT Corporation
            </p>
            <p className="text-sm mt-1">
              Toronto, ON (Remote) · May 2025 – August 2025
            </p>
            <ExpandableDescription>
              I built a Python scraper with BeautifulSoup and Requests that
              monitors new NIH RePORTER grants and posts summaries and Excel
              reports to Slack. The CEO used it weekly to surface around twenty
              grant opportunities. I also implemented the React and Tailwind UI,
              survey logic, and visualizations for a heart-health app used by
              clinical partners.
            </ExpandableDescription>
          </div>

          <div>
            <p className="font-semibold">
              Teaching Assistant — C Programming, Queen’s University
            </p>
            <p className="text-sm mt-1">
              Kingston, ON · September 2025 – November 2025
            </p>
            <ExpandableDescription>
              I led weekly C tutorials covering pointers, memory management, and
              data structures for more than 200 first-year students, and graded
              their assignments throughout the term.
            </ExpandableDescription>
          </div>

          <div>
            <p className="font-semibold">
              Data Automation Intern — SLR Consulting
            </p>
            <p className="text-sm mt-1">
              Toronto, ON (Remote, Part-Time) · June 2025 – August 2025
            </p>
            <ExpandableDescription>
              I created JavaScript Office Scripts to restructure Excel data as
              part of a Power Automate workflow, including error handling so the
              pipeline could run reliably without constant manual fixes.
            </ExpandableDescription>
          </div>
        </div>

        <h2 className="text-lg mt-12 font-semibold">Personal Projects:</h2>

        <div className="mt-4 py-4 px-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border p-4 flex flex-col">
              <a
                href="https://qflow.pooria.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
              >
                Qflow Co-founder
              </a>
              <img
                src="/Screenshot 2026-09-25 104047.png"
                alt="Qflow degree planning dashboard"
                className="mt-3 w-full aspect-video object-cover object-left-top border"
              />
              <p className="mt-4 flex-1">
                I'm the co-founder of Qflow a course scheduling and degree
                planning tool for Queen's University student. I'm in charge of
                implementing and maintaining the degree planning tool, and
                managing the general members.
              </p>
            </div>

            <div className="border p-4 flex flex-col">
              <p className="font-semibold">HAVOC</p>
              <img
                src="/qret_image.webp"
                alt="Queen's Rocket Engineering Team"
                className="mt-3 w-full aspect-video object-cover object-center border"
              />
              <p className="mt-4 flex-1">
                I'm working on a fault injection tool for the Queen's Rocket
                Engineering Team launch control stack.
              </p>
            </div>

            <div className="border p-4 flex flex-col">
              <a
                href="https://github.com/Erose112/seo-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
              >
                SEO-Audit
              </a>
              <img
                src="/seo-audit-screenshot.png"
                alt="SEO-Audit CLI screenshot"
                className="mt-3 w-full aspect-video object-cover object-left border"
              />
              <p className="mt-4 flex-1">
                I built a Go CLI that crawls sites with robots.txt, rate
                limiting, and retry logic. It scores pages from 0 to 100 on 7
                different SEO based checks.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-lg mt-10 font-semibold">Hobbies:</h2>

        <p className="mt-4">
          I enjoy skiing, playing guitar, mountain biking, volleyball, reading,
          and hanging out with friends!
        </p>
      </div>
    </body>
  )
}

export default App
