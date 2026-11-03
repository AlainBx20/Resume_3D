import { useState } from "react";
import {
  aboutContent,
  educationContent,
  experienceContent,
  PLAYER_NAME,
  PLAYER_ROLE,
  projectsContent,
  skillsContent,
} from "../../content";

type Tab = "overview" | "timeline" | "stack";

const STATS = [
  { label: "Roles", value: experienceContent.entries.length },
  { label: "Projects", value: projectsContent.entries.length },
  { label: "Technologies", value: skillsContent.groups.reduce((n, g) => n + g.items.length, 0) },
  { label: "Education", value: educationContent.entries.length },
];

const FACTS = ["🏦 Banking software by day", "🤖 AI & full-stack by night", "📍 Tunis, Tunisia", "🎓 FST · ICT"];

export default function ProfileApp() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="pc-profile">
      <header>
        <div className="pc-avatar" aria-hidden="true">AB</div>
        <div>
          <h2>{PLAYER_NAME}</h2>
          <p>{PLAYER_ROLE} · SMI</p>
        </div>
      </header>
      <nav>
        {(["overview", "timeline", "stack"] as Tab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      {tab === "overview" && (
        <section>
          <div className="pc-stats">
            {STATS.map((s) => (
              <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
            ))}
          </div>
          <ul className="pc-facts">{FACTS.map((f) => <li key={f}>{f}</li>)}</ul>
          {aboutContent.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </section>
      )}
      {tab === "timeline" && (
        <section>
          <ol className="pc-timeline">
            {experienceContent.entries.map((e) => (
              <li key={e.role + e.period}><time>{e.period}</time><b>{e.role}</b><span>{e.company}</span></li>
            ))}
            {educationContent.entries.map((e) => (
              <li key={e.school} className="study"><time>{e.period}</time><b>{e.degree}</b><span>{e.school}</span></li>
            ))}
          </ol>
        </section>
      )}
      {tab === "stack" && (
        <section>
          {skillsContent.groups.map((g) => (
            <div key={g.category} className="pc-stack-group">
              <h4>{g.category}</h4>
              <div>{g.items.map((i) => <span key={i}>{i}</span>)}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
