import { useEffect, useMemo, useRef, useState } from "react";
import { audio } from "../../audio";
import { useTownStore } from "../../store";

const BEST_KEY = "resume-town-memory-best";
const SKILLS = ["Java", "React", "Angular", "Spring", "Oracle", "Python", "PyTorch", "TypeScript"];

function shuffled() {
  const deck = [...SKILLS, ...SKILLS].map((label, id) => ({ id, label }));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function Memory() {
  const [round, setRound] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck = useMemo(() => shuffled(), [round]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(readBest);
  const timer = useRef<number | null>(null);
  const won = matched.length === SKILLS.length;

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const flip = (index: number) => {
    if (open.length >= 2 || open.includes(index) || matched.includes(deck[index].label)) return;
    audio.uiClick();
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    const totalMoves = moves + 1;
    setMoves(totalMoves);
    if (deck[next[0]].label === deck[next[1]].label) {
      setMatched((m) => [...m, deck[next[0]].label]);
      setOpen([]);
      if (matched.length + 1 === SKILLS.length) {
        audio.bootChime();
        useTownStore.getState().unlock("elephant-memory");
        const nextBest = best === 0 ? totalMoves : Math.min(best, totalMoves);
        setBest(nextBest);
        try {
          localStorage.setItem(BEST_KEY, String(nextBest));
        } catch {
          // best score just won't persist
        }
      } else {
        audio.uiOpen();
      }
    } else {
      timer.current = window.setTimeout(() => setOpen([]), 750);
    }
  };

  const restart = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setRound((r) => r + 1);
    setOpen([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <div className="pc-game memory-game">
      <div className="pc-game-bar">
        <span>Moves <b>{moves}</b></span>
        <span>Best <b>{best || "–"}</b></span>
        <button type="button" onClick={restart}>New game</button>
      </div>
      <div className="memory-grid">
        {deck.map((card, index) => {
          const faceUp = open.includes(index) || matched.includes(card.label);
          return (
            <button
              key={`${round}-${card.id}`}
              type="button"
              className={`memory-card ${faceUp ? "up" : ""} ${matched.includes(card.label) ? "done" : ""}`}
              onClick={() => flip(index)}
              aria-label={faceUp ? card.label : "Hidden card"}
            >
              <span className="memory-back">?</span>
              <span className="memory-front">{card.label}</span>
            </button>
          );
        })}
      </div>
      {won && <p className="memory-win">Cleared in {moves} moves!</p>}
    </div>
  );
}
