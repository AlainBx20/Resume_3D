export type AppId =
  | "doc"
  | "profile"
  | "browser"
  | "files"
  | "notes"
  | "terminal"
  | "mail"
  | "music"
  | "calc"
  | "paint"
  | "snake"
  | "memory"
  | "tictactoe"
  | "typing"
  | "trophies"
  | "monitor"
  | "settings";

export interface AppMeta {
  title: string;
  icon: string;
  w: number;
  h: number;
}

export const APPS: Record<AppId, AppMeta> = {
  doc: { title: "Document", icon: "📄", w: 520, h: 380 },
  profile: { title: "About Alaa", icon: "👤", w: 500, h: 380 },
  browser: { title: "Browser", icon: "🌐", w: 560, h: 380 },
  files: { title: "Files", icon: "🗂️", w: 540, h: 340 },
  notes: { title: "Notes", icon: "📝", w: 380, h: 320 },
  terminal: { title: "Terminal", icon: "⌨️", w: 480, h: 300 },
  mail: { title: "Mail", icon: "✉️", w: 440, h: 360 },
  music: { title: "Music", icon: "🎧", w: 340, h: 250 },
  calc: { title: "Calculator", icon: "🧮", w: 260, h: 340 },
  paint: { title: "Paint", icon: "🎨", w: 440, h: 360 },
  snake: { title: "Snake", icon: "🐍", w: 360, h: 290 },
  memory: { title: "Memory Match", icon: "🃏", w: 420, h: 360 },
  tictactoe: { title: "Tic-Tac-Toe", icon: "❌", w: 300, h: 360 },
  typing: { title: "Typing Test", icon: "⏱️", w: 460, h: 300 },
  trophies: { title: "Trophies", icon: "🏆", w: 420, h: 380 },
  monitor: { title: "Task Manager", icon: "📊", w: 420, h: 320 },
  settings: { title: "Settings", icon: "⚙️", w: 360, h: 300 },
};

export const APP_ORDER: AppId[] = [
  "doc", "profile", "browser", "files", "notes", "terminal", "mail", "music", "calc",
  "paint", "snake", "memory", "tictactoe", "typing", "trophies", "monitor", "settings",
];

export const WALLPAPERS = [
  { name: "Section tint", css: "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 45%, #0b1226), #070b18 70%)" },
  { name: "Midnight", css: "linear-gradient(160deg, #0b1020, #1b1038 60%, #0b1020)" },
  { name: "Sunset", css: "linear-gradient(160deg, #2b1055, #7597de 140%)" },
  { name: "Forest", css: "linear-gradient(160deg, #06211a, #1d6b4a)" },
  { name: "Ember", css: "linear-gradient(160deg, #1a0b08, #8a2f12)" },
  { name: "Paper", css: "linear-gradient(160deg, #3b3a36, #6b675c)" },
];
