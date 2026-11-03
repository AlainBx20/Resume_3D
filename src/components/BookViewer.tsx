import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { audio } from "../audio";
import {
  aboutContent,
  buildings,
  contactContent,
  educationContent,
  experienceContent,
  PLAYER_NAME,
  projectsContent,
  skillsContent,
  type SectionId,
} from "../content";
import { useTownStore } from "../store";

function contentPages(section: SectionId): ReactNode[] {
  switch (section) {
    case "about":
      return aboutContent.paragraphs.map((paragraph, i) => (
        <p className={i === 0 ? "book-prose book-dropcap" : "book-prose"}>{paragraph}</p>
      ));
    case "education":
      return educationContent.entries.map((entry) => (
        <>
          <h3>{entry.school}</h3>
          <span className="book-period">{entry.period}</span>
          <p className="book-sub">{entry.degree}</p>
          <p className="book-prose">{entry.details}</p>
        </>
      ));
    case "experience":
      return experienceContent.entries.map((entry) => (
        <>
          <h3>{entry.role}</h3>
          <span className="book-period">{entry.period}</span>
          <p className="book-sub">{entry.company}</p>
          <ul>{entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        </>
      ));
    case "skills":
      return skillsContent.groups.map((group) => (
        <>
          <h3>{group.category}</h3>
          <ul className="book-chips">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </>
      ));
    case "projects":
      return projectsContent.entries.map((project) => (
        <>
          <h3>{project.name}</h3>
          <p className="book-prose">{project.description}</p>
          {project.link && project.link !== "#" && (
            <a className="book-link" href={project.link} target="_blank" rel="noreferrer">Visit ↗</a>
          )}
        </>
      ));
    case "contact":
      return [
        <>
          <h3>Say hello</h3>
          <p className="book-prose">{contactContent.blurb}</p>
          <a className="book-link" href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
          {contactContent.links.map((link) => (
            <a key={link.label} className="book-link" href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
          ))}
        </>,
      ];
  }
}

// Faces alternate front/back of each leaf: F[2i] is leaf i's front (right-hand
// page while closed) and F[2i+1] its back (left-hand page once turned).
function buildFaces(section: SectionId): ReactNode[] {
  const def = buildings.find((b) => b.id === section)!;
  const faces: ReactNode[] = [
    <div className="book-cover-art">
      <span>{def.subtitle}</span>
      <h2>{def.title}</h2>
      <i aria-hidden="true">❦</i>
      <small>{PLAYER_NAME}</small>
    </div>,
    <div className="book-endpaper" />,
    ...contentPages(section).map((page, i) => (
      <div className="book-page-body">
        {page}
        <footer>{i + 1}</footer>
      </div>
    )),
  ];
  if (faces.length % 2 === 1) {
    faces.push(
      <div className="book-page-body book-end">
        <i aria-hidden="true">❦</i>
        <p>The end</p>
      </div>,
    );
  }
  return faces;
}

type Phase = "in" | "open" | "closing" | "out";

export default function BookViewer({ section, index }: { section: SectionId; index: number }) {
  const closeProp = useTownStore((s) => s.closeProp);
  const def = buildings.find((b) => b.id === section)!;
  const faces = useMemo(() => buildFaces(section), [section]);
  const leafCount = faces.length / 2;
  const startSpread = Math.min(leafCount, Math.ceil((2 + index) / 2));

  const [flipped, setFlipped] = useState(0);
  const [phase, setPhase] = useState<Phase>("in");
  const flippedRef = useRef(0);
  const phaseRef = useRef<Phase>("in");
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const flipTo = useCallback(
    (goal: number, interval: number, done?: () => void) => {
      const step = () => {
        const current = flippedRef.current;
        if (current === goal) {
          done?.();
          return;
        }
        const next = current + Math.sign(goal - current);
        flippedRef.current = next;
        setFlipped(next);
        audio.pageTurn();
        later(step, interval);
      };
      step();
    },
    [later],
  );

  useEffect(() => {
    audio.uiOpen();
    later(() => {
      setPhaseBoth("open");
      audio.bookThud();
      flipTo(startSpread, 480);
    }, 800);
    return clearTimers;
  }, [flipTo, later, clearTimers, setPhaseBoth, startSpread]);

  const requestClose = useCallback(() => {
    if (phaseRef.current === "closing" || phaseRef.current === "out") return;
    clearTimers();
    setPhaseBoth("closing");
    flipTo(0, 170, () => {
      audio.bookThud();
      later(() => {
        setPhaseBoth("out");
        audio.uiClose();
        later(closeProp, 520);
      }, 650);
    });
  }, [clearTimers, closeProp, flipTo, later, setPhaseBoth]);

  const turn = useCallback(
    (delta: number) => {
      if (phaseRef.current !== "open") return;
      const goal = Math.max(0, Math.min(leafCount, flippedRef.current + delta));
      if (goal !== flippedRef.current) flipTo(goal, 0);
    },
    [flipTo, leafCount],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") requestClose();
      else if (event.code === "ArrowRight" || event.code === "KeyD") turn(1);
      else if (event.code === "ArrowLeft" || event.code === "KeyA") turn(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, turn]);

  const centred = flipped === 0;
  const spreadLabel =
    flipped === 0 ? "Cover" : `Pages ${Math.max(1, flipped * 2 - 2)}–${Math.min(faces.length - 2, flipped * 2 - 1)}`;

  return (
    <div className="overlay prop-backdrop book-backdrop" data-phase={phase} onMouseDown={requestClose}>
      <div
        className="book-scene"
        style={{ "--accent": def.color } as CSSProperties}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${def.title} book`}
      >
        <div className={`book ${centred ? "is-closed" : "is-open"}`}>
          <div className="book-board book-board-left" />
          <div className="book-board book-board-right" />
          <div className="book-base-page" />
          {Array.from({ length: leafCount }, (_, i) => {
            const isFlipped = i < flipped;
            return (
              <div
                key={i}
                className={`book-leaf ${isFlipped ? "flipped" : ""} ${i === 0 ? "cover-leaf" : ""}`}
                style={{ zIndex: isFlipped ? i + 1 : leafCount - i }}
                onClick={() => (isFlipped ? i === flipped - 1 && turn(-1) : i === flipped && turn(1))}
              >
                <div className={`book-face book-front ${i === 0 ? "book-cover" : "book-paper"}`}>{faces[i * 2]}</div>
                <div className="book-face book-back book-paper">{faces[i * 2 + 1]}</div>
              </div>
            );
          })}
        </div>
        <div className="book-controls">
          <button type="button" onClick={() => turn(-1)} disabled={flipped === 0 || phase !== "open"}>‹ Prev</button>
          <span>{spreadLabel}</span>
          <button type="button" onClick={() => turn(1)} disabled={flipped >= leafCount || phase !== "open"}>Next ›</button>
          <button type="button" className="book-close" onClick={requestClose}>Close book · Esc</button>
        </div>
      </div>
    </div>
  );
}
