import { useEffect, useRef, useState } from "react";
import { useTownStore } from "../../store";
import { downloadFile } from "./files";

const COLORS = ["#ffffff", "#ff5d73", "#ffb84d", "#ffe066", "#5dffb0", "#6cc3ff", "#b388ff", "#1b1b1b"];

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#12182c";
    ctx.fillRect(0, 0, 400, 240);
  }, []);

  const point = (event: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  };

  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const p = point(event);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    useTownStore.getState().unlock("artist");
  };
  const move = (event: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!drawing.current || !ctx) return;
    const p = point(event);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#12182c";
    ctx.fillRect(0, 0, 400, 240);
  };
  const save = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadFile("my-masterpiece.png", blob, "image/png");
    });
  };

  return (
    <div className="pc-paint">
      <div className="pc-paint-tools">
        {COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Color ${c}`} className={c === color ? "active" : ""} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
        <input type="range" min={2} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Brush size" />
        <button type="button" onClick={clear}>Clear</button>
        <button type="button" onClick={save}>Save</button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={240}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }}
      />
    </div>
  );
}
