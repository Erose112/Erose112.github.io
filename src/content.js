// Verbatim copy from the original App.jsx — do not copy-edit.

export const chromiumAttribution = {
  plainFooter:
    'Desert game sprites, optional sound effects, and reference excerpts from the Chrome offline dinosaur game (Copyright The Chromium Authors).',
  licenseLabel: 'Chromium BSD-style license',
  licenseHref:
    'https://chromium.googlesource.com/chromium/src/+/main/LICENSE',
}

export const companyLogos = [
  { src: '/memotext-logo.png', alt: 'MEMOTEXT' },
  { src: '/queens-logo.png', alt: "Queen's University" },
  { src: '/slr-logo.jpg', alt: 'SLR Consulting' },
  { src: '/u-flourish.png', alt: 'UFlourish' },
]

export const site = {
  name: 'Ethan Rose',
  intro:
    "I'm a Queen's University 3rd year Computer Science and Math student.",
  aboutLabel: 'A bit about me:',
  aboutBody: `I'm on the Queen's Rocket Engineering Team and currently working on the redesign of a fault injection tool for the launch control stack. I previously redid their website. I'm also the co-founder of a course scheduling and degree planning tool, Qflow, that has over 5,000 undergraduate users. I'm currently working on implementing a degree planning feature that I built in my 2nd year.`,
  socialIntro: 'Some of my relevant social links are:',
  linkedIn: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ethan-rose-3382b1344/',
  },
  github: {
    label: 'GitHub',
    href: 'https://github.com/Erose112',
  },
  resume: {
    label: 'Resume',
    href: '/Ethan_R_Software_Developer_Resume.pdf',
  },
  contactMe: {
    label: 'Contact Me',
    href: 'https://www.linkedin.com/in/ethan-rose-3382b1344/',
  },
  hobbiesTitle: 'Hobbies:',
  hobbiesBody:
    'I enjoy skiing, playing guitar, mountain biking, volleyball, reading, and hanging out with friends!',
}

export const experienceSection = {
  title: 'Experience:',
  roles: [
    {
      title: 'Software Development Intern — MEMOTEXT Corporation',
      meta: 'Toronto, ON (Remote) · May 2026 – August 2026',
      description: `I was the sole full-stack developer on FORT, a mental health platform commissioned by the University Health Network for Queen’s students. The product launched in September 2026 through a pilot course, IDIS 199. I worked closely with the project manager and UHN’s team to integrate a resource recommendation API, and I built both the Admin Console and the Student Portal using Laravel, React, and Inertia.js. I also rebuilt four pages of the company website in Next.js with incremental static regeneration, pulling content from WordPress.`,
    },
    {
      title: 'Software Development Intern (Part-Time) — MEMOTEXT Corporation',
      meta: 'Toronto, ON (Remote) · May 2025 – August 2025',
      description: `I built a Python scraper with BeautifulSoup and Requests that monitors new NIH RePORTER grants and posts summaries and Excel reports to Slack. The CEO used it weekly to surface around twenty grant opportunities. I also implemented the React and Tailwind UI, survey logic, and visualizations for a heart-health app used by clinical partners.`,
    },
    {
      title: 'Teaching Assistant — C Programming, Queen’s University',
      meta: 'Kingston, ON · September 2025 – November 2025',
      description: `I led weekly C tutorials covering pointers, memory management, and data structures for more than 200 first-year students, and graded their assignments throughout the term.`,
    },
    {
      title: 'Data Automation Intern — SLR Consulting',
      meta: 'Toronto, ON (Remote, Part-Time) · June 2025 – August 2025',
      description: `I created JavaScript Office Scripts to restructure Excel data as part of a Power Automate workflow, including error handling so the pipeline could run reliably without constant manual fixes.`,
    },
  ],
}

export const projectsSection = {
  title: 'Personal Projects:',
  projects: [
    {
      title: 'Qflow Co-founder',
      href: 'https://qflow.pooria.dev/',
      imageSrc: '/qflow-screenshot.png',
      imageAlt: 'Qflow degree planning dashboard',
      imageObjectPosition: 'left top',
      description: `I'm the co-founder of Qflow a course scheduling and degree planning tool for Queen's University student. I'm in charge of implementing and maintaining the degree planning tool, and managing the general members.`,
    },
    {
      title: 'HAVOC',
      href: null,
      imageSrc: '/qret_image.webp',
      imageAlt: "Queen's Rocket Engineering Team",
      imageObjectPosition: 'center',
      description: `I'm working on a fault injection tool for the Queen's Rocket Engineering Team launch control stack.`,
    },
    {
      title: 'SEO-Audit',
      href: 'https://github.com/Erose112/seo-audit',
      imageSrc: '/seo-audit-screenshot.png',
      imageAlt: 'SEO-Audit CLI screenshot',
      imageObjectPosition: 'left',
      description: `I built a Go CLI that crawls sites with robots.txt, rate limiting, and retry logic. It scores pages from 0 to 100 on 7 different SEO based checks.`,
    },
  ],
}