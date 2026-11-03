import type { SectionId } from "../content";
import {
  aboutContent,
  educationContent,
  experienceContent,
  skillsContent,
  projectsContent,
  contactContent,
} from "../content";

function picked<T>(items: T[], index: number | null) {
  return index == null ? items : items[index] ? [items[index]] : [];
}

/** Chapter body shared by the plain panel and the PC "document" window. */
export default function SectionContent({ section, index }: { section: SectionId; index: number | null }) {
  return (
    <>
      {section === "about" && (
        <div className="prose-stack">
          {picked(aboutContent.paragraphs, index).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>
      )}

      {section === "education" && picked(educationContent.entries, index).map((entry) => (
        <article className="entry" key={entry.school}>
          <div className="entry-row"><strong>{entry.school}</strong><span className="period">{entry.period}</span></div>
          <div className="entry-sub">{entry.degree}</div>
          <p>{entry.details}</p>
        </article>
      ))}

      {section === "experience" && picked(experienceContent.entries, index).map((entry) => (
        <article className="entry" key={entry.company}>
          <div className="entry-row"><strong>{entry.role}</strong><span className="period">{entry.period}</span></div>
          <div className="entry-sub">{entry.company}</div>
          <ul>{entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        </article>
      ))}

      {section === "skills" && picked(skillsContent.groups, index).map((group) => (
        <article className="entry skill-entry" key={group.category}>
          <div className="entry-sub">{group.category}</div>
          <div className="tag-row">
            {group.items.map((item) => <span className="tag" key={item}>{item}</span>)}
          </div>
        </article>
      ))}

      {section === "projects" && picked(projectsContent.entries, index).map((project) => (
        <article className="entry project-entry" key={project.name}>
          <div className="entry-row"><strong>{project.name}</strong></div>
          <p>{project.description}</p>
          {project.link && project.link !== "#" && (
            <a className="text-link" href={project.link} target="_blank" rel="noreferrer">View project <span aria-hidden="true">↗</span></a>
          )}
        </article>
      ))}

      {section === "contact" && (
        <div className="contact-block">
          <p>{contactContent.blurb}</p>
          <a className="email-link" href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
          <div className="tag-row">
            {contactContent.links.map((link) => (
              <a className="tag" key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
