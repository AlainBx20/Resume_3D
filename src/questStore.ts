import { create } from "zustand";

export interface Relic {
  id: string;
  title: string;
  kind: "skill" | "secret";
  position: [number, number, number];
  color: string;
  clue: string;
  lore: string[];
}

const ring = (deg: number, r: number): [number, number, number] => [
  Math.sin((deg * Math.PI) / 180) * r,
  1.15,
  Math.cos((deg * Math.PI) / 180) * r,
];

export const RELICS: Relic[] = [
  {
    id: "r-languages",
    title: "Relic of Languages",
    kind: "skill",
    position: ring(30, 14),
    color: "#ffb84d",
    clue: "Between the Skills and Experience houses, humming softly.",
    lore: [
      "Java pays the bills: Alaa ships banking backends in Java and Spring Boot at SMI.",
      "Python and TypeScript are the sidekicks: Python for models, TypeScript for everything on screen.",
      "SQL and PL/SQL on Oracle is where the bank's business rules actually live.",
    ],
  },
  {
    id: "r-frontend",
    title: "Relic of Interfaces",
    kind: "skill",
    position: ring(-30, 14),
    color: "#6cc3ff",
    clue: "Between the Skills and Projects houses, glowing blue.",
    lore: [
      "React and Angular: Alaa's first web internship at Smart Team was built on both.",
      "Node.js ties the stack together. Huda AI runs end to end on it.",
      "He cares about software that is a pleasure to use, not just software that works.",
    ],
  },
  {
    id: "r-backend",
    title: "Relic of Services",
    kind: "skill",
    position: ring(150, 14),
    color: "#5dffb0",
    clue: "Behind the Education house, on the far side from the plaza.",
    lore: [
      "Spring Boot, JPA and Hibernate: clean layers, boring in the best way.",
      "Microservices at a bank means reliability and traceability matter more than cleverness.",
      "REST APIs built and consumed daily: contracts first, surprises never.",
    ],
  },
  {
    id: "r-ai",
    title: "Relic of Intelligence",
    kind: "skill",
    position: ring(-150, 14),
    color: "#b388ff",
    clue: "Behind the Contact house, where the neural lights sleep.",
    lore: [
      "TensorFlow, Keras and PyTorch: from energy disaggregation at Dione Protocol to lung-disease classification.",
      "AI Maze teaches an agent to solve mazes with reinforcement learning, no map provided.",
      "Huda AI answers questions with NLP behind a deliberately calm interface.",
    ],
  },
  {
    id: "r-network",
    title: "Relic of Networks",
    kind: "skill",
    position: ring(-90, 14.5),
    color: "#ff6e8c",
    clue: "West of the fountain, between Contact and Projects.",
    lore: [
      "CCNA fundamentals: at Tunisair Alaa built a web app to configure Ethernet ports remotely.",
      "Knowing the network under the code makes him a better debugger of everything above it.",
    ],
  },
  {
    id: "s-origin",
    title: "The Origin Shard",
    kind: "secret",
    position: [0, 1.15, -16.4],
    color: "#ffe066",
    clue: "Directly behind the About Me house.",
    lore: [
      "Alaa studied Computer Science at Lycée Pilote Radhiâ Haddad before his ICT degree at FST.",
      "Origin story: curiosity first, certificates second.",
    ],
  },
  {
    id: "s-pond",
    title: "The Quiet Shard",
    kind: "secret",
    position: [22.4, 1.15, 5.8],
    color: "#7ad7ff",
    clue: "Past the duck pond, where only the persistent go.",
    lore: [
      "Huda AI is a product Alaa created and deployed himself: design, code and hosting.",
      "Side projects are where he learns the things work never has time for.",
    ],
  },
  {
    id: "s-forest",
    title: "The Forest Shard",
    kind: "secret",
    position: [-17.5, 1.15, 5],
    color: "#c6ff7a",
    clue: "Beyond the western houses, close to the tree line.",
    lore: [
      "Ecology Simulation: little AI agents with big opinions about food.",
      "Fun fact: this entire town is React Three Fiber on a WebGPU renderer, built for the joy of it.",
    ],
  },
];

const KEY = "resume-town-relics";
const BUG_KEY = "resume-town-bugs";
const TALK_KEY = "resume-town-talked";

function load(key = KEY): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function save(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // progress just won't persist
  }
}

interface QuestState {
  found: string[];
  bugs: string[];
  talked: string[];
  nearBug: boolean;
  tab: number;
  setTab: (tab: number) => void;
  nearNpc: string | null;
  dialog: { npc: string; line: number } | null;
  journalOpen: boolean;
  nearRelic: string | null;
  reading: string | null;
  collect: (id: string) => boolean;
  catchBug: (id: string) => boolean;
  setNearBug: (near: boolean) => void;
  setNearNpc: (id: string | null) => void;
  talk: (npc: string, lineCount: number) => void;
  closeDialog: () => void;
  setNear: (id: string | null) => void;
  toggleJournal: (open?: boolean) => void;
  closeReading: () => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  found: load(),
  bugs: load(BUG_KEY),
  talked: load(TALK_KEY),
  nearBug: false,
  tab: 0,
  setTab: (tab) => set({ tab }),
  nearNpc: null,
  dialog: null,
  journalOpen: false,
  nearRelic: null,
  reading: null,
  collect: (id) => {
    const isNew = !get().found.includes(id);
    const found = isNew ? [...get().found, id] : get().found;
    if (isNew) save(KEY, found);
    set({ found, reading: id });
    return isNew;
  },
  catchBug: (id) => {
    if (get().bugs.includes(id)) return false;
    const bugs = [...get().bugs, id];
    save(BUG_KEY, bugs);
    set({ bugs });
    return true;
  },
  setNearBug: (nearBug) => {
    if (get().nearBug !== nearBug) set({ nearBug });
  },
  setNearNpc: (nearNpc) => {
    if (get().nearNpc !== nearNpc) set({ nearNpc });
  },
  talk: (npc, lineCount) => {
    const d = get().dialog;
    if (!d || d.npc !== npc) {
      set({ dialog: { npc, line: 0 } });
      return;
    }
    if (d.line + 1 >= lineCount) {
      if (!get().talked.includes(npc)) {
        const talked = [...get().talked, npc];
        save(TALK_KEY, talked);
        set({ talked, dialog: null });
      } else {
        set({ dialog: null });
      }
      return;
    }
    set({ dialog: { npc, line: d.line + 1 } });
  },
  closeDialog: () => set({ dialog: null }),
  setNear: (nearRelic) => {
    if (get().nearRelic !== nearRelic) set({ nearRelic });
  },
  toggleJournal: (open) => set((s) => ({ journalOpen: open ?? !s.journalOpen })),
  closeReading: () => set({ reading: null }),
}));
