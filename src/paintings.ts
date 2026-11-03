import type { SectionId } from "./content";

export const PAINT_W = 520;
export const PAINT_H = 388;

type Ctx = CanvasRenderingContext2D;
type Painter = (c: Ctx) => void;

function sky(c: Ctx, top: string, bottom: string) {
  const g = c.createLinearGradient(0, 0, 0, PAINT_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, PAINT_W, PAINT_H);
}

function circle(c: Ctx, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function caption(c: Ctx, text: string, color = "#ffffff") {
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.fillRect(0, PAINT_H - 44, PAINT_W, 44);
  c.fillStyle = color;
  c.font = "600 24px Georgia, serif";
  c.textAlign = "center";
  c.fillText(text, PAINT_W / 2, PAINT_H - 14);
}

function line(c: Ctx, points: [number, number][], color: string, width: number, close = false) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = "round";
  c.lineCap = "round";
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
  c.stroke();
}

// Tunis medina: white houses with blue doors over the Mediterranean.
const tunis: Painter = (c) => {
  sky(c, "#ffb36b", "#ffe9c2");
  circle(c, 390, 130, 52, "#fff2c4");
  c.fillStyle = "#2f8ca2";
  c.fillRect(0, 250, PAINT_W, 100);
  for (let i = 0; i < 7; i++) line(c, [[20 + i * 75, 275 + (i % 3) * 20], [70 + i * 75, 275 + (i % 3) * 20]], "rgba(255,255,255,0.45)", 3);
  const houses = [[40, 150, 110], [150, 120, 130], [270, 165, 100], [370, 135, 120]];
  houses.forEach(([x, y, w], i) => {
    c.fillStyle = "#fffaf0";
    c.fillRect(x, y, w, 250 - y + 20);
    c.fillStyle = "#1f5fa8";
    c.beginPath();
    c.arc(x + w / 2, 250, 22, Math.PI, 0);
    c.lineTo(x + w / 2 + 22, 270);
    c.lineTo(x + w / 2 - 22, 270);
    c.fill();
    if (i % 2 === 0) {
      c.fillStyle = "#1f5fa8";
      c.beginPath();
      c.arc(x + w / 2, y, w / 2.4, Math.PI, 0);
      c.fill();
    }
    c.fillStyle = "#1f5fa8";
    c.fillRect(x + 14, y + 22, 16, 26);
  });
  caption(c, "Tunis, Tunisia");
};

// Huda AI: crescent over an open book with a chat bubble.
const huda: Painter = (c) => {
  sky(c, "#0b1f3a", "#1c4a6e");
  for (let i = 0; i < 40; i++) circle(c, (i * 137) % PAINT_W, (i * 89) % 220, 1.6, "rgba(255,255,255,0.8)");
  circle(c, 260, 120, 62, "#ffe9a8");
  circle(c, 285, 108, 56, "#14335a");
  circle(c, 330, 90, 7, "#ffe9a8");
  c.fillStyle = "#f6efe0";
  c.beginPath();
  c.moveTo(260, 250); c.lineTo(130, 235); c.lineTo(130, 320); c.lineTo(260, 335); c.fill();
  c.beginPath();
  c.moveTo(260, 250); c.lineTo(390, 235); c.lineTo(390, 320); c.lineTo(260, 335); c.fill();
  for (let i = 0; i < 4; i++) {
    line(c, [[150, 255 + i * 16], [240, 265 + i * 16]], "#b7a98a", 3);
    line(c, [[370, 255 + i * 16], [280, 265 + i * 16]], "#b7a98a", 3);
  }
  c.fillStyle = "#5dffb0";
  c.beginPath();
  c.roundRect(360, 60, 110, 58, 12);
  c.fill();
  c.beginPath();
  c.moveTo(380, 118); c.lineTo(375, 140); c.lineTo(400, 118); c.fill();
  [388, 415, 442].forEach((x) => circle(c, x, 89, 6, "#0b3a2a"));
  caption(c, "Huda AI");
};

// Graduation cap over a diploma scroll.
const graduation: Painter = (c) => {
  sky(c, "#4a3a86", "#b388ff");
  c.fillStyle = "#1c1630";
  c.beginPath();
  c.moveTo(260, 80); c.lineTo(410, 140); c.lineTo(260, 200); c.lineTo(110, 140); c.fill();
  c.fillRect(185, 170, 150, 55);
  c.fillStyle = "#2a2148";
  c.beginPath();
  c.ellipse(260, 225, 75, 20, 0, 0, Math.PI);
  c.fill();
  line(c, [[410, 140], [410, 225]], "#ffd24d", 4);
  circle(c, 410, 232, 9, "#ffd24d");
  c.fillStyle = "#fff7e3";
  c.beginPath();
  c.roundRect(130, 270, 260, 52, 26);
  c.fill();
  line(c, [[170, 296], [350, 296]], "#b9a98a", 4);
  circle(c, 390, 296, 16, "#c0392b");
  caption(c, "Education");
};

// Atom orbits for the baccalaureate / science background.
const atom: Painter = (c) => {
  sky(c, "#1a1240", "#32207a");
  c.save();
  c.translate(260, 175);
  for (let i = 0; i < 3; i++) {
    c.rotate(Math.PI / 3);
    c.strokeStyle = "#b388ff";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(0, 0, 130, 46, 0, 0, Math.PI * 2);
    c.stroke();
    circle(c, 130, 0, 10, "#ffe066");
  }
  c.restore();
  circle(c, 260, 175, 22, "#ff6e8c");
  caption(c, "Baccalaureate");
};

// Bank building with columns: banking software at SMI.
const bank: Painter = (c) => {
  sky(c, "#27406b", "#ffb84d");
  c.fillStyle = "#f4ecda";
  c.beginPath();
  c.moveTo(90, 150); c.lineTo(260, 70); c.lineTo(430, 150); c.fill();
  c.fillRect(100, 150, 320, 18);
  for (let i = 0; i < 5; i++) c.fillRect(120 + i * 66, 172, 26, 128);
  c.fillRect(80, 300, 360, 22);
  c.fillRect(60, 322, 400, 18);
  circle(c, 260, 128, 14, "#d49a2e");
  c.fillStyle = "#d49a2e";
  c.font = "700 20px Georgia, serif";
  c.textAlign = "center";
  c.fillText("$", 260, 135);
  caption(c, "Banking software");
};

// Network graph: the networking internship.
const network: Painter = (c) => {
  sky(c, "#10223d", "#18406a");
  const nodes: [number, number][] = [[260, 110], [120, 170], [400, 170], [190, 270], [330, 270], [60, 80], [460, 90]];
  const links = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [0, 3], [0, 4], [1, 5], [2, 6]];
  links.forEach(([a, b]) => line(c, [nodes[a], nodes[b]], "#ffb84d", 3));
  nodes.forEach(([x, y], i) => circle(c, x, y, i === 0 ? 24 : 15, i === 0 ? "#ffb84d" : "#6cc3ff"));
  caption(c, "Networking");
};

// Code brackets.
const code: Painter = (c) => {
  sky(c, "#0b2a22", "#124c3c");
  c.font = "700 150px 'Courier New', monospace";
  c.textAlign = "center";
  c.fillStyle = "#5dffb0";
  c.fillText("</>", 260, 230);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = i % 2 ? "rgba(93,255,176,0.35)" : "rgba(255,255,255,0.25)";
    c.fillRect(60 + (i % 3) * 20, 40 + i * 12, 60 + ((i * 37) % 80), 5);
  }
  caption(c, "Java · TypeScript · Python");
};

// Neural network layers.
const neural: Painter = (c) => {
  sky(c, "#1a0f2e", "#34206a");
  const layers = [3, 5, 5, 2];
  const pts = layers.map((n, li) => Array.from({ length: n }, (_, i): [number, number] => [90 + li * 113, 50 + ((i + 0.5) * 240) / n]));
  for (let l = 0; l < pts.length - 1; l++) pts[l].forEach((a) => pts[l + 1].forEach((b) => line(c, [a, b], "rgba(93,255,176,0.35)", 1.5)));
  pts.flat().forEach(([x, y]) => circle(c, x, y, 11, "#5dffb0"));
  caption(c, "AI & Machine Learning");
};

// Lungs with scan sparkle: the lung-disease ML project.
const lungs: Painter = (c) => {
  sky(c, "#2a0f1f", "#6b2142");
  line(c, [[260, 60], [260, 170]], "#f5c6cf", 10);
  line(c, [[260, 170], [200, 215]], "#f5c6cf", 8);
  line(c, [[260, 170], [320, 215]], "#f5c6cf", 8);
  c.fillStyle = "#ff8aa5";
  c.beginPath();
  c.ellipse(180, 240, 70, 100, -0.15, 0, Math.PI * 2);
  c.ellipse(340, 240, 70, 100, 0.15, 0, Math.PI * 2);
  c.fill();
  [[160, 220], [200, 260], [330, 230], [360, 270]].forEach(([x, y]) => circle(c, x, y, 7, "#fff3b0"));
  line(c, [[40, 330], [120, 330], [150, 300], [180, 350], [215, 320], [480, 320]], "#5dffb0", 3);
  caption(c, "Lung Disease ML");
};

// Maze: the AI Maze project.
const maze: Painter = (c) => {
  sky(c, "#241020", "#4a1a3a");
  const walls: [number, number][][] = [
    [[80, 60], [440, 60], [440, 300], [80, 300], [80, 110]],
    [[130, 110], [390, 110], [390, 250], [180, 250], [180, 160], [340, 160], [340, 200]],
    [[230, 200], [290, 200]],
  ];
  walls.forEach((w) => line(c, w, "#ff6e8c", 6));
  circle(c, 108, 85, 11, "#5dffb0");
  circle(c, 268, 225, 11, "#ffe066");
  line(c, [[108, 85], [108, 135], [360, 135], [360, 225], [268, 225]], "rgba(255,255,255,0.6)", 3);
  caption(c, "AI Maze");
};

// Envelope with an @.
const mail: Painter = (c) => {
  sky(c, "#4a3b0f", "#ffe066");
  c.fillStyle = "#fff9e0";
  c.beginPath();
  c.roundRect(90, 90, 340, 210, 12);
  c.fill();
  line(c, [[90, 100], [260, 220], [430, 100]], "#d9b84a", 6);
  circle(c, 260, 235, 28, "#c0392b");
  c.fillStyle = "#fff";
  c.font = "700 32px sans-serif";
  c.textAlign = "center";
  c.fillText("@", 260, 247);
  caption(c, "Say hello", "#2b2411");
};

// Paper plane.
const plane: Painter = (c) => {
  sky(c, "#5fb0ff", "#e8f5ff");
  [[90, 90, 50], [400, 70, 40], [330, 250, 60]].forEach(([x, y, r]) => {
    circle(c, x, y, r, "rgba(255,255,255,0.85)");
    circle(c, x + r * 0.7, y + 8, r * 0.7, "rgba(255,255,255,0.85)");
  });
  line(c, [[70, 300], [160, 280], [200, 230], [300, 200]], "rgba(255,255,255,0.8)", 3);
  c.fillStyle = "#fff";
  c.beginPath();
  c.moveTo(440, 90); c.lineTo(200, 210); c.lineTo(290, 235); c.fill();
  c.fillStyle = "#c9d8ea";
  c.beginPath();
  c.moveTo(440, 90); c.lineTo(290, 235); c.lineTo(285, 300); c.lineTo(255, 245); c.fill();
  caption(c, "Let's connect", "#16406b");
};

const PAINTINGS: Record<SectionId, [Painter, Painter]> = {
  about: [tunis, huda],
  education: [graduation, atom],
  experience: [bank, network],
  skills: [code, neural],
  projects: [lungs, maze],
  contact: [mail, plane],
};

export function drawPainting(c: Ctx, room: SectionId, side: 0 | 1) {
  PAINTINGS[room][side](c);
}
