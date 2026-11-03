import { useState } from "react";

const KEY = "resume-town-notes";
const DEFAULT_NOTE = `todo.txt
[x] Ship Huda AI
[x] Learn PL/SQL the hard way
[x] Train an agent to solve a maze
[ ] Build the world's best résumé town
[ ] Hire Alaa  <-- you are here`;

function load() {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT_NOTE;
  } catch {
    return DEFAULT_NOTE;
  }
}

export default function NotesApp() {
  const [text, setText] = useState(load);
  const change = (value: string) => {
    setText(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // notes just won't persist
    }
  };
  return (
    <div className="pc-notes">
      <textarea
        value={text}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); }}
        spellCheck={false}
        aria-label="Notes"
      />
      <footer>
        <span>Saved automatically</span>
        <button type="button" onClick={() => change(DEFAULT_NOTE)}>Reset</button>
      </footer>
    </div>
  );
}
