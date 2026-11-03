import { useEffect, useRef } from "react";
import { RELICS, useQuestStore } from "../questStore";
import { CODES, COINS, FISH, useExtras } from "../extras";
import { QUESTLINES, questProgress, type QuestCtx } from "../quests";
import { BUGS, NPCS, LEVELS, levelFor } from "../townlife";
import { useTownStore } from "../store";

function useQuestCtx(): QuestCtx {
  const achievements = useTownStore((s) => s.achievements);
  const visited = useTownStore((s) => s.visited);
  const stars = useTownStore((s) => s.stars);
  const parts = useTownStore((s) => s.parts);
  const relics = useQuestStore((s) => s.found);
  const bugs = useQuestStore((s) => s.bugs);
  const talked = useQuestStore((s) => s.talked);
  return { achievements, visited, stars, parts, relics, bugs, talked };
}

function computeXp(c: QuestCtx) {
  return c.achievements.length * 10 + c.relics.length * 15 + c.bugs.length * 8 + c.talked.length * 10 + c.stars.length * 10;
}

// Grants quest/level rewards and handles the journal keys.
export function QuestWatcher() {
  const ctx = useQuestCtx();
  const prevLevel = useRef<number | null>(null);

  useEffect(() => {
    const town = useTownStore.getState();
    for (const q of QUESTLINES) {
      if (questProgress(q, ctx).complete) town.unlock(q.reward);
    }
    if (QUESTLINES.every((q) => ctx.achievements.includes(q.reward))) town.unlock("quest-master");

    const lvl = levelFor(computeXp(ctx));
    if (prevLevel.current !== null && lvl.index > prevLevel.current) {
      town.showToast(`Rank up: ${lvl.title}`, "info");
    }
    prevLevel.current = lvl.index;
    if (lvl.index >= 2) town.unlock("level-up");
    if (lvl.index >= LEVELS.length - 1) town.unlock("max-level");
  }, [ctx]);

  useEffect(() => {
    let hinted = false;
    let timer = 0;
    const unsub = useTownStore.subscribe((s) => {
      if (hinted || !s.locked || s.introActive) return;
      hinted = true;
      timer = window.setTimeout(
        () => useTownStore.getState().showToast("Press J for your Town Journal: quests, relics, bugs and locals"),
        6000,
      );
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const q = useQuestStore.getState();
      if (e.code === "KeyJ" && !e.repeat) {
        const town = useTownStore.getState();
        if (!town.locked || town.introActive || town.activeSection || town.activeProp) return;
        q.toggleJournal();
        town.unlock("diary-keeper");
      } else if (e.code === "Escape") {
        q.toggleJournal(false);
      } else if (q.journalOpen && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
        q.setTab(Number(e.code.slice(5)) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}

export function RelicPrompt() {
  const near = useQuestStore((s) => s.nearRelic);
  const reading = useQuestStore((s) => s.reading);
  const nearNpc = useQuestStore((s) => s.nearNpc);
  const dialog = useQuestStore((s) => s.dialog);
  const nearBug = useQuestStore((s) => s.nearBug);
  const locked = useTownStore((s) => s.locked);
  const found = useQuestStore((s) => s.found);
  if (!locked) return null;

  if (dialog) {
    const npc = NPCS.find((n) => n.id === dialog.npc);
    if (!npc) return null;
    return (
      <div className="relic-card" role="dialog" aria-live="polite" style={{ borderColor: npc.color }}>
        <div className="relic-title" style={{ color: npc.color }}>
          {npc.name} <small style={{ opacity: 0.6, fontWeight: 400 }}>· {npc.role}</small>
        </div>
        <p>{npc.lines[dialog.line]}</p>
        <div className="relic-hint">
          <kbd>E</kbd> {dialog.line + 1 >= npc.lines.length ? "goodbye" : "continue"} · {dialog.line + 1}/{npc.lines.length}
        </div>
      </div>
    );
  }

  const relic = RELICS.find((r) => r.id === (reading ?? near));
  if (reading && relic) {
    return (
      <div className="relic-card" role="dialog" aria-live="polite" style={{ borderColor: relic.color }}>
        <div className="relic-title" style={{ color: relic.color }}>
          {relic.title}
        </div>
        {relic.lore.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <div className="relic-hint">
          <kbd>E</kbd> close · <kbd>J</kbd> journal
        </div>
      </div>
    );
  }

  const npc = NPCS.find((n) => n.id === nearNpc);
  if (npc) {
    return (
      <div className="relic-prompt">
        <kbd>E</kbd> talk to {npc.name}
      </div>
    );
  }
  if (nearBug) {
    return (
      <div className="relic-prompt">
        <kbd>E</kbd> catch the bug!
      </div>
    );
  }
  if (relic) {
    return (
      <div className="relic-prompt">
        <kbd>E</kbd> {found.includes(relic.id) ? "re-read" : "touch the"} {relic.title.toLowerCase()}
      </div>
    );
  }
  return null;
}

export function Journal() {
  const open = useQuestStore((s) => s.journalOpen);
  const tab = useQuestStore((s) => s.tab);
  const locked = useTownStore((s) => s.locked);
  const ctx = useQuestCtx();
  const coins = useExtras((s) => s.coins);
  const fish = useExtras((s) => s.fish);
  const codes = useExtras((s) => s.codes);
  if (!open || !locked) return null;

  const xp = computeXp(ctx);
  const lvl = levelFor(xp);
  const pct = lvl.next ? Math.min(100, ((xp - lvl.base) / (lvl.next - lvl.base)) * 100) : 100;
  const tabs = ["Questlines", "Relics", "Bugs & Locals", "Collection"];

  return (
    <aside className="journal" aria-label="Quest journal">
      <header>
        <div>
          <h2>Town Journal</h2>
          <div className="rank">
            <strong>{lvl.title}</strong>
            <span>{lvl.next ? `${xp}/${lvl.next} XP` : `${xp} XP · max rank`}</span>
            <i>
              <b style={{ width: `${pct}%` }} />
            </i>
          </div>
        </div>
        <span>
          <kbd>J</kbd> close
        </span>
      </header>
      <nav className="journal-tabs">
        {tabs.map((label, i) => (
          <span key={label} className={tab === i ? "on" : ""}>
            <kbd>{i + 1}</kbd> {label}
          </span>
        ))}
      </nav>
      <div className="journal-body">
        {tab === 0 &&
          QUESTLINES.map((q) => {
            const p = questProgress(q, ctx);
            return (
              <div key={q.id} className={`quest ${p.complete ? "complete" : ""}`}>
                <div className="quest-head">
                  <strong>{q.title}</strong>
                  <span>
                    {p.done}/{p.total}
                  </span>
                </div>
                <p>{q.blurb}</p>
                <ul>
                  {q.steps.map((s) => (
                    <li key={s.text} className={s.done(ctx) ? "done" : ""}>
                      {s.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        {tab === 1 &&
          RELICS.map((r) => {
            const got = ctx.relics.includes(r.id);
            return (
              <div key={r.id} className={`codex ${got ? "got" : ""}`}>
                <strong style={{ color: got ? r.color : undefined }}>{got ? r.title : "???"}</strong>
                {got ? r.lore.map((l) => <p key={l}>{l}</p>) : <p className="clue">Clue: {r.clue}</p>}
              </div>
            );
          })}
        {tab === 2 && (
          <>
            <div className="codex got">
              <strong>
                Bug Jar {ctx.bugs.length}/{BUGS.length}
              </strong>
              {BUGS.map((b) => (
                <p key={b.id} className={ctx.bugs.includes(b.id) ? "" : "clue"}>
                  {ctx.bugs.includes(b.id) ? `${b.name}: ${b.joke}` : "???"}
                </p>
              ))}
            </div>
            <div className="codex got">
              <strong>
                Locals {ctx.talked.length}/{NPCS.length}
              </strong>
              {NPCS.map((n) => (
                <p key={n.id} className={ctx.talked.includes(n.id) ? "" : "clue"}>
                  {ctx.talked.includes(n.id) ? `${n.name}, ${n.role}` : `??? (somewhere in the plaza, angle ${n.angle}°)`}
                </p>
              ))}
            </div>
          </>
        )}
        {tab === 3 && (
          <>
            <div className="codex got">
              <strong>
                Commits {coins.length}/{COINS.length}
              </strong>
              <p>Golden commits float around the houses, the road and the pond. Walk through them.</p>
            </div>
            <div className="codex got">
              <strong>
                Fish Log {fish.length}/{FISH.length}
              </strong>
              {FISH.map((f) => (
                <p key={f.id} className={fish.includes(f.id) ? "" : "clue"}>
                  {fish.includes(f.id) ? `${f.name}: ${f.quip}` : "???"}
                </p>
              ))}
              <p className="clue">Fishing sign on the south-east bank of the pond.</p>
            </div>
            <div className="codex got">
              <strong>
                Secret Words {codes.length}/{CODES.length}
              </strong>
              {CODES.map((c) => (
                <p key={c.word} className={codes.includes(c.word) ? "" : "clue"}>
                  {codes.includes(c.word) ? `${c.word}: ${c.reply}` : `${"?".repeat(c.word.length)} (${c.hint})`}
                </p>
              ))}
              <p className="clue">Type them while walking outside.</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
