import { useEffect, useRef, useState } from "react";
import { audio } from "../../audio";
import { useTownStore } from "../../store";

type Cell = "X" | "O" | null;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function result(board: Cell[]): Cell | "draw" | null {
  for (const [a, b, c] of LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? "draw" : null;
}

function minimax(board: Cell[], turn: "X" | "O"): number {
  const r = result(board);
  if (r === "O") return 1;
  if (r === "X") return -1;
  if (r === "draw") return 0;
  const scores = board.flatMap((cell, i) => {
    if (cell) return [];
    const next = [...board];
    next[i] = turn;
    return [minimax(next, turn === "O" ? "X" : "O")];
  });
  return turn === "O" ? Math.max(...scores) : Math.min(...scores);
}

// The bot plays perfectly most of the time but slips now and then, so it can be beaten.
function botMove(board: Cell[]): number {
  const empty = board.flatMap((c, i) => (c ? [] : [i]));
  if (Math.random() < 0.3) return empty[Math.floor(Math.random() * empty.length)];
  let best = empty[0];
  let bestScore = -2;
  for (const i of empty) {
    const next = [...board];
    next[i] = "O";
    const score = minimax(next, "X");
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [thinking, setThinking] = useState(false);
  const [score, setScore] = useState({ you: 0, bot: 0, draw: 0 });
  const timer = useRef<number | null>(null);
  const outcome = result(board);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const record = (r: Cell | "draw") => {
    setScore((s) => ({ you: s.you + (r === "X" ? 1 : 0), bot: s.bot + (r === "O" ? 1 : 0), draw: s.draw + (r === "draw" ? 1 : 0) }));
    if (r === "X") useTownStore.getState().unlock("outsmarted");
  };

  const play = (i: number) => {
    if (board[i] || outcome || thinking) return;
    audio.uiClick();
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    const r = result(next);
    if (r) { record(r); return; }
    setThinking(true);
    timer.current = window.setTimeout(() => {
      const after = [...next];
      after[botMove(next)] = "O";
      setBoard(after);
      setThinking(false);
      const r2 = result(after);
      if (r2) record(r2);
    }, 400);
  };

  const reset = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setBoard(Array(9).fill(null));
    setThinking(false);
  };

  return (
    <div className="pc-game ttt">
      <div className="pc-game-bar">
        <span>You <b>{score.you}</b></span>
        <span>Draw <b>{score.draw}</b></span>
        <span>Bot <b>{score.bot}</b></span>
      </div>
      <div className="ttt-grid">
        {board.map((cell, i) => (
          <button key={i} type="button" className={cell ?? ""} onClick={() => play(i)} aria-label={`Cell ${i + 1}`}>{cell}</button>
        ))}
      </div>
      <p className="ttt-status">
        {outcome === "draw" ? "It's a draw." : outcome === "X" ? "You win! 🎉" : outcome === "O" ? "Bot wins." : thinking ? "Bot is thinking…" : "Your move (X)"}
      </p>
      <button type="button" className="ttt-reset" onClick={reset}>New round</button>
    </div>
  );
}
