import { useEffect, useRef, useState } from "react";
import { audio } from "../../audio";
import { useTownStore } from "../../store";

const COLS = 20;
const ROWS = 14;
const CELL = 16;
const BEST_KEY = "resume-town-snake-best";

type Point = { x: number; y: number };

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function spawnFood(snake: Point[]): Point {
  for (;;) {
    const food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((part) => part.x === food.x && part.y === food.y)) return food;
  }
}

export default function Snake({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const activeRef = useRef(active);
  const game = useRef({
    snake: [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }] as Point[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 14, y: 7 },
    state: "ready" as "ready" | "running" | "dead",
    score: 0,
    acc: 0,
  });

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = game.current;

    const reset = () => {
      g.snake = [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }];
      g.dir = { x: 1, y: 0 };
      g.nextDir = { x: 1, y: 0 };
      g.food = spawnFood(g.snake);
      g.score = 0;
      g.acc = 0;
      g.state = "running";
      setScore(0);
    };

    const onKey = (event: KeyboardEvent) => {
      if (!activeRef.current) return;
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
      };
      const dir = map[event.code];
      if (dir) {
        event.preventDefault();
        if (g.state !== "running") return;
        if (dir.x !== -g.dir.x || dir.y !== -g.dir.y) g.nextDir = dir;
      } else if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (g.state !== "running") {
          reset();
          audio.uiClick();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    const step = () => {
      g.dir = g.nextDir;
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      const hitSelf = g.snake.some((part) => part.x === head.x && part.y === head.y);
      if (hitWall || hitSelf) {
        g.state = "dead";
        audio.powerOff();
        setBest((previous) => {
          const next = Math.max(previous, g.score);
          try {
            localStorage.setItem(BEST_KEY, String(next));
          } catch {
            // best score just won't persist
          }
          return next;
        });
        return;
      }
      g.snake.unshift(head);
      if (head.x === g.food.x && head.y === g.food.y) {
        g.score += 1;
        if (g.score === 10) useTownStore.getState().unlock("snake-charmer");
        setScore(g.score);
        g.food = spawnFood(g.snake);
        audio.uiOpen();
      } else {
        g.snake.pop();
      }
    };

    const draw = (time: number) => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      for (let x = 0; x < COLS; x += 1) for (let y = 0; y < ROWS; y += 1) if ((x + y) % 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);

      const pulse = 3 + Math.sin(time / 180) * 1.2;
      ctx.fillStyle = "#ff5d73";
      ctx.shadowColor = "#ff5d73";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(g.food.x * CELL + CELL / 2, g.food.y * CELL + CELL / 2, pulse + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      g.snake.forEach((part, i) => {
        const shade = 1 - i / (g.snake.length + 6);
        ctx.fillStyle = `rgb(${Math.round(90 * shade + 20)},${Math.round(230 * shade + 20)},${Math.round(150 * shade + 30)})`;
        ctx.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
      });

      if (g.state !== "running") {
        ctx.fillStyle = "rgba(5,8,18,0.68)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 18px monospace";
        ctx.fillText(g.state === "dead" ? "GAME OVER" : "SNAKE", canvas.width / 2, canvas.height / 2 - 6);
        ctx.font = "11px monospace";
        ctx.fillText("Space / Enter to play · arrows or WASD", canvas.width / 2, canvas.height / 2 + 16);
        ctx.textAlign = "left";
      }
    };

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (g.state === "running" && activeRef.current) {
        g.acc += dt;
        const interval = Math.max(60, 125 - g.score * 3);
        while (g.acc >= interval && g.state === "running") {
          g.acc -= interval;
          step();
        }
      }
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="pc-game snake-game">
      <div className="pc-game-bar">
        <span>Score <b>{score}</b></span>
        <span>Best <b>{best}</b></span>
      </div>
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} />
    </div>
  );
}
