import { useEffect, useRef } from "react";
import { useTownStore } from "../store";
import {
  buildings,
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

export default function SectionPanel() {
  const activeSection = useTownStore((s) => s.activeSection);
  const activeItemIndex = useTownStore((s) => s.activeItemIndex);
  const closeSection = useTownStore((s) => s.closeSection);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!activeSection) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") closeSection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSection, closeSection]);

  if (!activeSection) return null;
  const def = buildings.find((building) => building.id === activeSection)!;
  const showingOverview = activeItemIndex == null;

  return (
    <div className="overlay panel-backdrop" onMouseDown={closeSection}>
      <section
        className="panel-card"
        style={{ "--section-color": def.color } as React.CSSProperties}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-panel-title"
      >
        <div className="panel-accent" />
        <button ref={closeRef} className="panel-close" onClick={closeSection} aria-label="Close résumé chapter">×</button>
        <span className="panel-kicker">{def.subtitle}</span>
        <h2 id="resume-panel-title">{def.title}</h2>

        {activeSection === "about" && (
          <div className="prose-stack">
            {picked(aboutContent.paragraphs, activeItemIndex).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        )}

        {activeSection === "education" && picked(educationContent.entries, activeItemIndex).map((entry) => (
          <article className="entry" key={entry.school}>
            <div className="entry-row"><strong>{entry.school}</strong><span className="period">{entry.period}</span></div>
            <div className="entry-sub">{entry.degree}</div>
            <p>{entry.details}</p>
          </article>
        ))}

        {activeSection === "experience" && picked(experienceContent.entries, activeItemIndex).map((entry) => (
          <article className="entry" key={entry.company}>
            <div className="entry-row"><strong>{entry.role}</strong><span className="period">{entry.period}</span></div>
            <div className="entry-sub">{entry.company}</div>
            <ul>{entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </article>
        ))}

        {activeSection === "skills" && picked(skillsContent.groups, activeItemIndex).map((group) => (
          <article className="entry skill-entry" key={group.category}>
            <div className="entry-sub">{group.category}</div>
            <div className="tag-row">
              {group.items.map((item) => <span className="tag" key={item}>{item}</span>)}
            </div>
          </article>
        ))}

        {activeSection === "projects" && picked(projectsContent.entries, activeItemIndex).map((project) => (
          <article className="entry project-entry" key={project.name}>
            <div className="entry-row"><strong>{project.name}</strong></div>
            <p>{project.description}</p>
            {project.link && project.link !== "#" && (
              <a className="text-link" href={project.link} target="_blank" rel="noreferrer">View project <span aria-hidden="true">↗</span></a>
            )}
          </article>
        ))}

        {activeSection === "contact" && (
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

        <p className="panel-hint">
          {showingOverview ? "Complete chapter overview" : "Discovered inside the room"} · Press Esc to close
        </p>
      </section>
    </div>
  );
}
