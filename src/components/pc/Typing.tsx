import { useEffect, useRef, useState } from "react";
import { useTownStore } from "../../store";

const BEST_KEY = "resume-town-typing-best";
const POOL = [
  "java", "spring", "react", "angular", "oracle", "python", "pytorch", "keras", "tensorflow", "hibernate",
  "typescript", "javascript", "node", "banking", "microservice", "network", "query", "deploy", "refactor",
  "commit", "branch", "merge", "cache", "thread", "socket", "render", "state", "agent", "model", "train",
];
const DURATION = 30;

function makeWords() {
  return Array.from({ length: 80 }, () => POOL[Math.floor(Math.random() * POOL.length)]);
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function Typing() {
  const [words, setWords] = useState(makeWords);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [left, setLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(readBest);
  const correct = useRef(0);
  const [correctShown, setCorrectShown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = left === 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        window.clearInterval(id);
        setRunning(false);
        const wpm = correct.current * (60 / DURATION);
        if (wpm >= 30) useTownStore.getState().unlock("typist");
        setBest((b) => {
          const next = Math.max(b, wpm);
          try {
            localStorage.setItem(BEST_KEY, String(next));
          } catch {
            // best score just won't persist
          }
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const change = (value: string) => {
    if (done) return;
    if (!running) setRunning(true);
    if (value.endsWith(" ")) {
      if (value.trim() === words[idx]) {
        correct.current += 1;
        setCorrectShown(correct.current);
      }
      setIdx((i) => i + 1);
      setInput("");
    } else {
      setInput(value);
    }
  };

  const restart = () => {
    setWords(makeWords());
    setIdx(0);
    setInput("");
    setLeft(DURATION);
    setRunning(false);
    correct.current = 0;
    setCorrectShown(0);
    inputRef.current?.focus();
  };

  return (
    <div className="pc-typing">
      <div className="pc-game-bar">
        <span>Time <b>{left}s</b></span>
        <span>Words <b>{correctShown}</b></span>
        <span>Best <b>{best} WPM</b></span>
      </div>
      <p className="pc-words">
        {words.slice(idx, idx + 14).map((w, i) => (
          <span key={idx + i} className={i === 0 ? (w.startsWith(input) ? "cur" : "cur bad") : ""}>{w} </span>
        ))}
      </p>
      {done ? (
        <div className="pc-typing-result">
          <b>{correctShown * (60 / DURATION)} WPM</b>
          <button type="button" onClick={restart}>Try again</button>
        </div>
      ) : (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); }}
          placeholder="Start typing — space submits a word"
          spellCheck={false}
          autoComplete="off"
          aria-label="Typing input"
        />
      )}
    </div>
  );
}
