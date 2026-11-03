import { useMemo, useState } from "react";
import { contactContent, projectsContent } from "../../content";

interface Site {
  id: string;
  title: string;
  url: string;
  desc: string;
}

const SITES: Site[] = [
  ...projectsContent.entries.map((p) => ({ id: p.name, title: p.name, url: p.link, desc: p.description })),
  { id: "github", title: "GitHub — AlainBx20", url: contactContent.links[0].url, desc: "Source code, experiments and open projects." },
];

export default function BrowserApp() {
  const [tabs, setTabs] = useState<string[]>(["home"]);
  const [active, setActive] = useState("home");
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => SITES.filter((s) => `${s.title} ${s.desc}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const site = SITES.find((s) => s.id === active);

  const open = (id: string) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
  };
  const close = (id: string) => {
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (active === id) setActive(next[next.length - 1] ?? "home");
  };

  return (
    <div className="pc-browser" onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); }}>
      <div className="pc-tabs">
        {tabs.map((id) => (
          <div key={id} className={id === active ? "active" : ""}>
            <button type="button" onClick={() => setActive(id)}>{id === "home" ? "🏠 Home" : SITES.find((s) => s.id === id)?.title.split(" — ")[0]}</button>
            {id !== "home" && <button type="button" aria-label="Close tab" onClick={() => close(id)}>×</button>}
          </div>
        ))}
      </div>
      <div className="pc-url">{site ? site.url : "resume://home"}</div>
      <div className="pc-page">
        {!site ? (
          <>
            <h3>Search Alaa's work</h3>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try “AI”, “maze”, “lung”…" />
            <ul>
              {results.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => open(s.id)}><b>{s.title}</b><span>{s.desc}</span></button>
                </li>
              ))}
              {results.length === 0 && <li className="empty">No results. Try another word.</li>}
            </ul>
          </>
        ) : (
          <>
            <h3>{site.title}</h3>
            <p>{site.desc}</p>
            <a className="pc-visit" href={site.url} target="_blank" rel="noreferrer">Open in a real tab ↗</a>
          </>
        )}
      </div>
    </div>
  );
}
