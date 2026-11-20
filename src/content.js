import { assetUrl } from './assetUrl.js'

export const chromiumAttribution = {
  plainFooter:
    'Desert game sprites, optional sound effects, and reference excerpts from the Chrome offline dinosaur game (Copyright The Chromium Authors).',
  licenseLabel: 'Chromium BSD-style license',
  licenseHref: 'https://chromium.googlesource.com/chromium/src/+/main/LICENSE',
}

const SITE_ORIGIN = 'https://erose112.github.io'

export const seo = {
  title: 'Ethan Rose — Software Developer',
  description:
    'Third-year Computing student at Queen’s University building full-stack web apps and developer tools. Seeking a 12–16 month software development co-op starting May 2027.',
  siteUrl: `${SITE_ORIGIN}/`,
  ogImage: `${SITE_ORIGIN}/og-image.png`,
}

export const site = {
  name: 'Ethan Rose',
  intro:
    'I’m a third-year Computing student at Queen’s University. I’m seeking a 12–16 month software development co-op starting May 2027.',
  socialIntro: 'Find me on LinkedIn and GitHub:',
  linkedIn: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ethan-rose-3382b1344/',
  },
  github: { label: 'GitHub', href: 'https://github.com/Erose112' },
  resume: {
    label: 'Resume',
    href: assetUrl('Ethan_R_Software_Developer_Resume.pdf'),
  },
  email: { label: 'Email', href: 'mailto:ethan.rose.to@gmail.com' },
  contactMe: {
    label: 'Contact Me',
    href: 'mailto:ethan.rose.to@gmail.com',
  },
  hobbiesTitle: 'Outside of work',
  hobbies: [
    'Skiing',
    'Guitar',
    'Mountain biking',
    'Volleyball',
    'Reading',
  ],
}

export const aboutHighlights = [
  { value: '5,000+', label: 'Users Serviced' },
  { value: 'May 2027', label: 'Co-op Target' },
  { value: "Dean's List", label: '2024–2026' },
]

export const aboutCurrently = [
  'Co-founding Qflow and maintaining the degree planning tool',
  'Building HAVOC fault injection for Queen’s Rocket Engineering',
  'Full-stack development on MEMOTEXT’s FORT student mental-health platform',
]

export const aboutMarqueeLogos = [
  {
    src: assetUrl('qflow-image.png'),
    alt: 'Qflow',
    href: 'https://qflow.pooria.dev/',
  },
  {
    src: assetUrl('qret-image.webp'),
    alt: 'Queen’s Rocket Engineering Team',
    href: 'https://github.com/Erose112/ctl-havoc',
  },
  {
    src: assetUrl('favicon.png'),
    alt: 'Ethan Rose',
    href: 'https://github.com/Erose112',
  },
]

export const educationSection = {
  title: 'Education:',
  items: [
    {
      title: 'Queen’s University — Computing',
      meta: 'Kingston, ON · Computing, Mathematics, and Analytics · Expected graduation 2029',
      description:
        'Dean’s Honour List (2024–2025, 2025–2026). Relevant coursework: Software Architecture, Operating Systems, Data Structures, Computer Architecture, Applied Methods in Statistics.',
    },
  ],
}

// Confirm each item. These come from your experience and project text, plus the
// TypeScript listed on your pinned Queens-U-Degree-Planner repo.
export const skillsSection = {
  title: 'Skills:',
  groups: [
    { label: 'Languages', items: ['Python', 'JavaScript', 'TypeScript', 'Go', 'C', 'PHP'] },
    { label: 'Frameworks', items: ['React', 'FastAPI', 'Next.js', 'Laravel', 'Inertia.js', 'Tailwind CSS'] },
    { label: 'Tools & Platforms', items: ['Git', 'GitHub', 'MySQL', 'Docker', 'Azure', 'MongoDB', 'Power Automate'] },
  ],
}

// Reverse-chronological.
export const experienceSection = {
  title: 'Experience',
  roles: [
    {
      role: 'Software Development Intern',
      company: 'MEMOTEXT Corporation',
      location: 'Toronto, ON (Remote)',
      dates: 'May 2026 – August 2026',
      tech: ['Laravel', 'React', 'Inertia.js', 'Next.js', 'WordPress'],
      description: `Sole full-stack developer on FORT, a UHN-commissioned mental health platform for Queen’s students that launched in a September 2026 pilot (IDIS 199). Built the Admin Console and Student Portal, integrated a resource recommendation API with UHN’s team, and rebuilt four company site pages in Next.js with ISR from WordPress.`,
    },
    {
      role: 'Avionics Team',
      company: 'Queen’s Rocket Engineering Team',
      location: 'Kingston, ON',
      dates: 'September 2026 – Present',
      tech: ['Docker', 'Go', 'Network Fault Simulation'],
      description: `Redesigning a fault-injection tool for the team’s launch control stack. Previously rebuilt the team website.`,
    },
    {
      role: 'Teaching Assistant — C Programming',
      company: 'Queen’s University',
      location: 'Kingston, ON',
      dates: 'September 2025 – November 2025',
      description: `Led weekly C tutorials on pointers, memory, and data structures for 200+ first-years, and graded assignments through the term.`,
    },
    {
      role: 'Data Automation Intern',
      company: 'SLR Consulting',
      location: 'Toronto, ON (Remote, Part-Time)',
      dates: 'June 2025 – August 2025',
      tech: ['JavaScript', 'Office Scripts', 'Power Automate', 'Excel'],
      description: `Built Office Scripts that restructure Excel data inside a Power Automate pipeline, with error handling so the workflow runs without constant manual fixes.`,
    },
    {
      role: 'Software Development Intern',
      company: 'MEMOTEXT Corporation',
      location: 'Toronto, ON (Remote, Part-Time)',
      dates: 'May 2025 – August 2025',
      tech: ['Python', 'React', 'Tailwind CSS'],
      description: `Built a Python NIH RePORTER grant scraper that posts Slack summaries and Excel reports—used weekly by the CEO to surface ~20 opportunities. Also shipped React/Tailwind UI, survey logic, and visualizations for a clinical heart-health app.`,
    },
  ],
}

export const projectsSection = {
  title: 'Personal Projects',
  projects: [
    {
      title: 'Qflow Co-founder',
      links: [
        { label: 'Live site', href: 'https://qflow.pooria.dev/' },
      ],
      tech: ['Python', 'MySQL', 'MongoDB', 'FastAPI', 'React'], 
      imageSrc: assetUrl('qflow-image.png'),
      imageAlt: 'Qflow degree planning dashboard',
      imageObjectPosition: 'center',
      description: `I’m the co-founder of Qflow, a course scheduling and degree planning tool for Queen’s University students with over 5,000 undergraduate users. I’m in charge of implementing and maintaining the degree planning tool, and managing the general members.`,
    },
    {
      title: 'HAVOC',
      links: [
        { label: 'Code', href: 'https://github.com/Erose112/ctl-havoc' },
      ],
      tech: ['Docker', 'Go', 'Network Fault Simulation'],
      imageSrc: assetUrl('qret-image.webp'),
      imageAlt: 'Queen’s Rocket Engineering Team',
      imageObjectPosition: 'center',
      description: `Currently working on a fault injection tool for the Queen’s Rocket Engineering Team launch control stack. The launch control stack is a distributed system. The control server, MediaMTX, and network each have failure boundaries. I’m building a fault-injection tool to see how the stack fails and whether it recovers cleanly. I previously redid their website.`,
    },
    {
      title: 'SEO-Audit',
      links: [{ label: 'Code', href: 'https://github.com/Erose112/seo-audit' }],
      tech: ['Go', 'Cobra', 'GitHub Actions'],
      imageSrc: assetUrl('seo-audit-screenshot.png'),
      imageAlt: 'SEO-Audit CLI screenshot',
      imageObjectPosition: 'left',
      description: `I built a Go CLI that crawls sites with robots.txt support, rate limiting, and retry logic. It scores pages from 0 to 100 on 7 SEO-based checks and can gate CI on score and regressions.`,
    },
  ],
}