import AboutSection from './AboutSection.jsx'
import ExitButton from './ExitButton.jsx'
import ExperienceSection from './ExperienceSection.jsx'
import ProjectsSection from './ProjectsSection.jsx'

const SECTION_CONTENT = {
  about: AboutSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
}

/**
 * @param {{
 *   section: 'about' | 'experience' | 'projects' | null,
 *   dialogRef: import('react').RefObject<HTMLDialogElement | null>,
 *   onClose: () => void,
 * }} props
 */
export default function SectionFrame({ section, dialogRef, onClose }) {
  const Content = section ? SECTION_CONTENT[section] : null

  return (
    <dialog
      ref={dialogRef}
      className="section-dialog font-body text-night-ink"
      onClose={onClose}
    >
      <ExitButton
        onPress={() => {
          dialogRef.current?.close()
        }}
      />
      <div className="section-dialog-body overflow-y-auto px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
          {Content ? <Content /> : null}
        </div>
      </div>
    </dialog>
  )
}