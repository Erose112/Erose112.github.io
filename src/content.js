import { assetUrl } from './assetUrl.js'

export const chromiumAttribution = {
  plainFooter:
    'Desert game sprites, optional sound effects, and reference excerpts from the Chrome offline dinosaur game (Copyright The Chromium Authors).',
  licenseLabel: 'Chromium BSD-style license',
  licenseHref: 'https://chromium.googlesource.com/chromium/src/+/main/LICENSE',
}

export const seo = {
  title: 'Ethan Rose — Software Developer',
  description:
    'Third-year Computer Science and Math student at Queen’s University building full-stack web apps and developer tools. Looking for software development internships starting May 2027.',
  ogImage: 'og-image.png',
}

export const site = {
  name: 'Ethan Rose',
  intro: 'I’m a third-year Computer Science and Math student at Queen’s University. I’m looking for software development internships starting May 2027.',
  aboutLabel: 'About',
  aboutItems: [
    'I like building software that real people use, and finding interesting problems that sit at the intersection of systems building and applied math.',
    'Right now I’m working on Qflow, a platform I co-founded with over 5,000 undergraduate Queen’s users.',
    'I’m also on the Queen’s Rocket Engineering Team building HAVOC.',
  ],
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
  hobbiesBody:
    'I enjoy skiing, playing guitar, mountain biking, volleyball, reading, and hanging out with friends!',
}

export const educationSection = {
  title: 'Education:',
  items: [
    {
      title: 'Queen’s University — Computer Science and Math',
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

// Reverse-chronological. Move the two TODO roles to match their start dates.
export const experienceSection = {
  title: 'Experience:',
  roles: [
    {
      title: 'Software Development Intern — MEMOTEXT Corporation',
      meta: 'Toronto, ON (Remote) · May 2026 – August 2026',
      tech: ['Laravel', 'React', 'Inertia.js', 'Next.js', 'WordPress'],
      description: `I was the sole full-stack developer on FORT, a mental health platform commissioned by the University Health Network for Queen’s students. The product launched in September 2026 through a pilot course, IDIS 199. I worked closely with the project manager and UHN’s team to integrate a resource recommendation API, and I built both the Admin Console and the Student Portal using Laravel, React, and Inertia.js. I also rebuilt four pages of the company website in Next.js with incremental static regeneration, pulling content from WordPress.`,
    },
    {
      title: 'Qflow', 
      meta: 'Kingston, ON · August 2026 - Present',
      tech: ['Python', 'MySQL', 'MongoDB', 'FastAPI', 'React'],
      description: `I co-founded Qflow, a course scheduling and degree planning tool used by over 5,000 Queen’s undergraduates. I implement and maintain the degree planning tool and manage the general members.`,
    },
    {
      title: 'Avionics Team — Queen’s Rocket Engineering Team', 
      meta: 'Kingston, ON · September 2026 - Present',
      tech: ['Docker', 'Go', 'Network Fault Simulation'],
      description: `I’m working on the redesign of a fault injection tool for the team’s launch control stack. I previously redid the team’s website.`,
    },
    {
      title: 'Teaching Assistant — C Programming, Queen’s University',
      meta: 'Kingston, ON · September 2025 – November 2025',
      tech: ['C'],
      description: `I led weekly C tutorials covering pointers, memory management, and data structures for more than 200 first-year students, and graded their assignments throughout the term.`,
    },
    {
      title: 'Data Automation Intern — SLR Consulting',
      meta: 'Toronto, ON (Remote, Part-Time) · June 2025 – August 2025',
      tech: ['JavaScript', 'Office Scripts', 'Power Automate', 'Excel'],
      description: `I created JavaScript Office Scripts to restructure Excel data as part of a Power Automate workflow, including error handling so the pipeline could run reliably without constant manual fixes.`,
    },
    {
      title: 'Software Development Intern — MEMOTEXT Corporation',
      meta: 'Toronto, ON (Remote, Part-Time) · May 2025 – August 2025',
      tech: ['Python', 'React', 'Tailwind CSS'],
      description: `I built a Python scraper with BeautifulSoup and Requests that monitors new NIH RePORTER grants and posts summaries and Excel reports to Slack. The CEO used it weekly to surface around twenty grant opportunities. I also implemented the React and Tailwind UI, survey logic, and visualizations for a heart-health app used by clinical partners.`,
    },
  ],
}

export const projectsSection = {
  title: 'Personal Projects:',
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
        { label: 'Website', href: 'https://www.qret.ca/' },
      ],
      note: 'HAVOC is private. Happy to walk through it.',
      tech: ['Docker', 'Go', 'Network Fault Simulation'],
      imageSrc: assetUrl('qret-image.png'),
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