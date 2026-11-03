import { useEffect, useRef } from "react";
import { useTownStore } from "../store";
import { buildings } from "../content";
import SectionContent from "./SectionContent";

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

        <SectionContent section={activeSection} index={activeItemIndex} />

        <p className="panel-hint">
          {showingOverview ? "Complete chapter overview" : "Discovered inside the room"} · Press Esc to close
        </p>
      </section>
    </div>
  );
}
