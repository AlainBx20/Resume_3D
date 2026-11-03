import { PLAYER_NAME, PLAYER_ROLE, projectsContent } from "./content";

// Procedural TV "series": every channel is drawn each frame onto a small 2D
// canvas (320x180 design space), so the site still ships no video files.

export const TV_W = 320;
export const TV_H = 180;

export const CHANNELS = [
  { name: "Debug Squad", genre: "Sitcom" },
  { name: "Cosmos Weekly", genre: "Documentary" },
  { name: "Arcade Replay", genre: "Retro" },
  { name: "Résumé News 24", genre: "News" },
];

export function channelIndex(channel: number) {
  return ((channel % CHANNELS.length) + CHANNELS.length) % CHANNELS.length;
}

const frac = (x: number) => x - Math.floor(x);
const tri = (x: number) => {
  const f = frac(x);
  return f < 0.5 ? f * 2 : 2 - f * 2;
};

// ---------------------------------------------------------------- Debug Squad

const EPISODE_SECONDS = 24;
const SQUAD_EPISODES = [
  {
    title: "The Null Pointer",
    lines: [
      ["MAYA", "Why is production on fire?"],
      ["LEO", "It works on my machine."],
      ["MAYA", "Then we ship your machine."],
      ["LEO", "...git blame says Tuesday."],
    ],
  },
  {
    title: "Merge Conflict",
    lines: [
      ["LEO", "I resolved the conflict!"],
      ["MAYA", "By deleting everything?"],
      ["LEO", "Technically, zero bugs."],
      ["MAYA", "Technically, zero app."],
    ],
  },
  {
    title: "Friday Deploy",
    lines: [
      ["MAYA", "It's 4:59 PM. Nobody deploy."],
      ["LEO", "Deploying..."],
      ["MAYA", "LEO."],
      ["LEO", "Rolling back! Mostly."],
    ],
  },
];

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, shirt: string, hair: string, talking: boolean, t: number) {
  const bob = Math.sin(t * 3 + x) * 1.5;
  ctx.fillStyle = shirt;
  ctx.fillRect(x - 24, 112 + bob, 48, 52);
  ctx.fillStyle = "#f0c8a0";
  ctx.beginPath();
  ctx.arc(x, 96 + bob, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, 90 + bob, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b1b1b";
  ctx.fillRect(x - 8, 95 + bob, 3, 4);
  ctx.fillRect(x + 5, 95 + bob, 3, 4);
  if (talking) {
    ctx.fillStyle = "#7a2230";
    ctx.fillRect(x - 5, 104 + bob, 10, 2 + Math.abs(Math.sin(t * 14)) * 5);
  } else {
    ctx.fillStyle = "#7a2230";
    ctx.fillRect(x - 4, 105 + bob, 8, 1.5);
  }
}

function drawSquad(ctx: CanvasRenderingContext2D, t: number) {
  const episode = SQUAD_EPISODES[Math.floor(t / EPISODE_SECONDS) % SQUAD_EPISODES.length];
  const local = t % EPISODE_SECONDS;
  const lineLength = EPISODE_SECONDS / episode.lines.length;
  const lineIndex = Math.min(episode.lines.length - 1, Math.floor(local / lineLength));
  const [who, text] = episode.lines[lineIndex];
  const speaker = who === "MAYA" ? 0 : 1;

  const wall = ctx.createLinearGradient(0, 0, 0, TV_H);
  wall.addColorStop(0, "#6d8fd1");
  wall.addColorStop(1, "#3b5288");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, TV_W, TV_H);
  ctx.fillStyle = "#2a3558";
  ctx.fillRect(0, 150, TV_W, 30);

  // window with a skyline
  ctx.fillStyle = "#a6d4ff";
  ctx.fillRect(122, 14, 76, 50);
  ctx.fillStyle = "#5878a8";
  [0, 14, 30, 46, 58].forEach((offset, i) => ctx.fillRect(124 + offset, 44 - (i % 3) * 8, 11, 20 + (i % 3) * 8));
  ctx.strokeStyle = "#f4f4f4";
  ctx.lineWidth = 2;
  ctx.strokeRect(122, 14, 76, 50);

  // desk + glowing monitor
  ctx.fillStyle = "#7b5a3c";
  ctx.fillRect(0, 150, TV_W, 8);
  ctx.fillStyle = "#14171f";
  ctx.fillRect(138, 118, 44, 30);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? "#ff5a5a" : "#7a1f1f";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ERROR 500", 160, 136);

  drawCharacter(ctx, 78, "#e4572e", "#2b1b10", speaker === 0, t);
  drawCharacter(ctx, 242, "#35a7a0", "#c8902c", speaker === 1, t);

  // speech bubble above the speaker
  ctx.font = "bold 9px sans-serif";
  const lines = wrap(ctx, text, 118);
  const bubbleW = 128;
  const bubbleH = 14 + lines.length * 12;
  const bx = speaker === 0 ? 14 : TV_W - 14 - bubbleW;
  const by = 22;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx, by, bubbleW, bubbleH);
  ctx.beginPath();
  const tailX = speaker === 0 ? 70 : 250;
  ctx.moveTo(tailX - 6, by + bubbleH);
  ctx.lineTo(tailX + 6, by + bubbleH);
  ctx.lineTo(tailX, by + bubbleH + 12);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  lines.forEach((line, i) => ctx.fillText(line, bx + 6, by + 14 + i * 12));

  ctx.textAlign = "left";
  return `S1·E${(Math.floor(t / EPISODE_SECONDS) % SQUAD_EPISODES.length) + 1}  ${episode.title}`;
}

// -------------------------------------------------------------- Cosmos Weekly

const COSMOS_EPISODES = [
  {
    title: "Rings of Saturn",
    planet: ["#f0d9a5", "#b98a4c"],
    lines: [
      "Billions of ice particles circle a distant giant.",
      "Each ring is a river of frozen time.",
      "Light needs eighty minutes to reach us here.",
    ],
  },
  {
    title: "The Red Frontier",
    planet: ["#f09a72", "#8e3a24"],
    lines: [
      "Rust-colored dunes stretch past every horizon.",
      "Somewhere below, an ancient ocean once slept.",
      "Tomorrow's explorers will write the next chapter.",
    ],
  },
];

function drawCosmos(ctx: CanvasRenderingContext2D, t: number) {
  const episode = COSMOS_EPISODES[Math.floor(t / EPISODE_SECONDS) % COSMOS_EPISODES.length];
  const local = t % EPISODE_SECONDS;
  const line = episode.lines[Math.min(episode.lines.length - 1, Math.floor(local / (EPISODE_SECONDS / episode.lines.length)))];

  const sky = ctx.createRadialGradient(240, 70, 10, 160, 90, 220);
  sky.addColorStop(0, "#35235f");
  sky.addColorStop(1, "#05030f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, TV_W, TV_H);

  for (let i = 0; i < 80; i += 1) {
    const x = (((i * 97) % 320) - t * (4 + (i % 5) * 3) + 640) % 320;
    const y = (i * 53) % 150;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.6 * Math.abs(Math.sin(t + i))})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }

  const px = 220 + Math.sin(t * 0.3) * 6;
  const py = 74;
  const body = ctx.createRadialGradient(px - 14, py - 14, 4, px, py, 44);
  body.addColorStop(0, episode.planet[0]);
  body.addColorStop(1, episode.planet[1]);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-0.35);
  ctx.strokeStyle = "rgba(240,225,190,0.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 16, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(px, py, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-0.35);
  ctx.strokeStyle = "rgba(240,225,190,0.75)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 16, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  // tiny probe crossing the screen
  const probeX = ((t * 18) % 420) - 50;
  ctx.fillStyle = "#cfd8e6";
  ctx.fillRect(probeX, 122 + Math.sin(t) * 4, 9, 4);
  ctx.fillStyle = "#6fd6f0";
  ctx.fillRect(probeX - 5, 123 + Math.sin(t) * 4, 4, 2);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 146, TV_W, 24);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(line, TV_W / 2, 161);
  ctx.textAlign = "left";
  return `S2·E${(Math.floor(t / EPISODE_SECONDS) % COSMOS_EPISODES.length) + 1}  ${episode.title}`;
}

// -------------------------------------------------------------- Arcade Replay

function drawArcade(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#050a05";
  ctx.fillRect(0, 0, TV_W, TV_H);
  ctx.fillStyle = "#8dff9d";
  for (let y = 8; y < TV_H - 8; y += 12) ctx.fillRect(TV_W / 2 - 1, y, 2, 6);
  ctx.fillRect(8, 6, TV_W - 16, 2);
  ctx.fillRect(8, TV_H - 8, TV_W - 16, 2);

  const ballX = 22 + tri(t * 0.5) * (TV_W - 44);
  const ballY = 16 + tri(t * 0.83 + 0.2) * (TV_H - 40);
  const leftY = Math.min(TV_H - 54, Math.max(12, ballY - 21 + Math.sin(t * 1.7) * 9));
  const rightY = Math.min(TV_H - 54, Math.max(12, ballY - 21 + Math.sin(t * 1.3 + 2) * 9));
  ctx.fillRect(12, leftY, 5, 36);
  ctx.fillRect(TV_W - 17, rightY, 5, 36);
  ctx.fillRect(ballX, ballY, 6, 6);

  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(Math.floor(t / 7) % 10), TV_W / 2 - 34, 34);
  ctx.fillText(String(Math.floor(t / 5) % 10), TV_W / 2 + 34, 34);
  ctx.font = "bold 8px monospace";
  if (Math.floor(t * 1.5) % 2) ctx.fillText("INSERT COIN", TV_W / 2, TV_H - 14);
  ctx.textAlign = "left";
  return `ROUND ${(Math.floor(t / 30) % 99) + 1}  Pong Classics`;
}

// ------------------------------------------------------------- Résumé News 24

const HEADLINES = [
  `${PLAYER_NAME} joins SMI as ${PLAYER_ROLE}`,
  "Huda AI goes live: Islamic Q&A, powered by AI",
  "Reinforcement-learning agent escapes the maze",
  "Local developer builds an explorable résumé town",
  "Weather alert: lightning possible, mind the thunder",
];

function drawNews(ctx: CanvasRenderingContext2D, t: number) {
  const bg = ctx.createLinearGradient(0, 0, TV_W, TV_H);
  bg.addColorStop(0, "#0c2d6b");
  bg.addColorStop(1, "#1d5ab0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TV_W, TV_H);

  // rotating globe
  ctx.strokeStyle = "rgba(160,210,255,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(250, 62, 34, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const w = Math.abs(Math.cos(t * 0.6 + (i * Math.PI) / 5)) * 34;
    ctx.beginPath();
    ctx.ellipse(250, 62, w, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // anchor
  ctx.fillStyle = "#222c3d";
  ctx.fillRect(40, 108, 70, 50);
  ctx.fillStyle = "#f0c8a0";
  ctx.beginPath();
  ctx.arc(75, 88, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2a1c";
  ctx.beginPath();
  ctx.arc(75, 82, 17, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a2230";
  ctx.fillRect(70, 96, 10, 2 + Math.abs(Math.sin(t * 9)) * 3);

  ctx.fillStyle = "#d62839";
  ctx.fillRect(10, 8, 74, 16);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("● LIVE 24", 16, 20);
  const now = new Date();
  ctx.textAlign = "right";
  ctx.fillText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), TV_W - 10, 20);
  ctx.textAlign = "left";

  const headline = HEADLINES[Math.floor(t / 6) % HEADLINES.length];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(10, 128, TV_W - 20, 22);
  ctx.fillStyle = "#d62839";
  ctx.fillRect(10, 128, 52, 22);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("BREAKING", 14, 142);
  ctx.fillStyle = "#0c1f44";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText(headline.length > 46 ? `${headline.slice(0, 45)}…` : headline, 68, 142);

  const ticker = `   ${projectsContent.entries.map((p) => p.name).join("   •   ")}   •   ${PLAYER_NAME}   •   ${PLAYER_ROLE}   `;
  ctx.fillStyle = "#07142e";
  ctx.fillRect(0, 156, TV_W, 24);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 10px sans-serif";
  const tickerWidth = ctx.measureText(ticker).width;
  const offset = -((t * 38) % tickerWidth);
  ctx.fillText(ticker, offset, 172);
  ctx.fillText(ticker, offset + tickerWidth, 172);
  return `Live  ${HEADLINES.length} stories today`;
}

// -------------------------------------------------------------------- driver

/**
 * Draws one frame. `since` is the seconds since the last power/channel change
 * (drives the static burst and the channel banner). Returns nothing; the
 * caller uploads the canvas as a texture.
 */
export function drawTv(ctx: CanvasRenderingContext2D, channel: number, t: number, since: number) {
  const index = channelIndex(channel);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  let label: string;
  if (index === 0) label = drawSquad(ctx, t);
  else if (index === 1) label = drawCosmos(ctx, t);
  else if (index === 2) label = drawArcade(ctx, t);
  else label = drawNews(ctx, t);

  // channel banner
  if (since < 3.2) {
    ctx.globalAlpha = Math.min(1, (3.2 - since) * 2);
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(8, 8, 176, 28);
    ctx.fillStyle = "#7dff9c";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`CH ${index + 1}  ${CHANNELS[index].name.toUpperCase()}`, 14, 21);
    ctx.fillStyle = "#e8eefc";
    ctx.font = "9px monospace";
    ctx.fillText(label, 14, 32);
    ctx.globalAlpha = 1;
  }

  // CRT feel: scanlines + vignette
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  for (let y = 0; y < TV_H; y += 2) ctx.fillRect(0, y, TV_W, 1);
  const vignette = ctx.createRadialGradient(TV_W / 2, TV_H / 2, 60, TV_W / 2, TV_H / 2, 200);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TV_W, TV_H);

  // static burst when switching on / changing channel
  if (since < 0.4) {
    for (let i = 0; i < 700; i += 1) {
      const shade = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${(0.4 - since) * 2.2})`;
      ctx.fillRect(Math.random() * TV_W, Math.random() * TV_H, 4, 2);
    }
  }
  ctx.restore();
}
