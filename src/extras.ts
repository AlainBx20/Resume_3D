import { create } from "zustand";
import { insidePondClearance } from "./landmarks";

export interface Coin {
  id: string;
  x: number;
  z: number;
  msg: string;
}

const MESSAGES = [
  "feat: add login page",
  "fix: off-by-one, again",
  "refactor: rename variable",
  "chore: bump Spring Boot",
  "feat: dark mode (finally)",
  "fix: it worked on my machine",
  "docs: explain the docs",
  "test: add the missing test",
  "perf: remove sleep(5000)",
  "feat: huda answers faster",
  "fix: null pointer, politely",
  "style: tabs vs spaces truce",
  "feat: reinforcement learning maze",
  "chore: delete dead code",
  "fix: CORS, the usual",
  "feat: SQL index, 40x faster",
  "revert: revert the revert",
  "ci: green at last",
  "feat: Ethernet config tool",
  "fix: typo in typo fix",
  "feat: energy disaggregation model",
  "refactor: extract service layer",
  "chore: update README",
  "fix: timezone nonsense",
  "feat: pond ducks",
  "wip: do not merge",
  "feat: WebGPU town",
  "fix: cache invalidation",
  "docs: add screenshots",
  "release: v1.0.0",
];

function buildCoins(): Coin[] {
  const spots: [number, number][] = [];
  // Between the plaza and the houses, along the six paths.
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    spots.push([Math.sin(a) * 7.8, Math.cos(a) * 7.8]);
  }
  // Outer ring between the houses and the road, skipping the pond.
  for (let deg = 10; deg < 360; deg += 20) {
    const a = (deg * Math.PI) / 180;
    const x = Math.sin(a) * 16.5;
    const z = Math.cos(a) * 16.5;
    if (!insidePondClearance(x, z, 2.5)) spots.push([x, z]);
  }
  // Along the entry road toward the tunnel.
  for (let z = 26; z <= 42; z += 4) spots.push([0, z]);
  // Out by the pond.
  spots.push([17.5, 6.6], [17.5, -6.6], [23.5, 0]);
  return spots.map(([x, z], i) => ({ id: `c${i}`, x, z, msg: MESSAGES[i % MESSAGES.length] }));
}

export const COINS = buildCoins();

export interface Fish {
  id: string;
  name: string;
  quip: string;
}

export const FISH: Fish[] = [
  { id: "f-trout", name: "Stack Overflow Trout", quip: "Swims upstream to find an answer from 2014." },
  { id: "f-pike", name: "Null Pointer Pike", quip: "Appears only when you least expect it." },
  { id: "f-carp", name: "Merge Conflict Carp", quip: "Two versions of the same fish. Pick one." },
  { id: "f-bass", name: "Spring Boot Bass", quip: "Starts up in four seconds and then refuses to elaborate." },
  { id: "f-flounder", name: "TensorFlounder", quip: "Flat, wide, and trained on a lot of fish." },
  { id: "f-eel", name: "Hibernate Eel", quip: "Lazy-loaded. Slippery in a way that causes N+1 problems." },
  { id: "f-angel", name: "Angular Angelfish", quip: "Beautiful, opinionated, and full of directives." },
  { id: "f-ray", name: "React Ray", quip: "Re-renders every time you look at it." },
];

export interface SecretCode {
  word: string;
  hint: string;
  reply: string;
}

export const CODES: SecretCode[] = [
  { word: "alaa", hint: "The name on the door.", reply: "That's me! Thanks for typing it correctly." },
  { word: "disco", hint: "Every town needs one night.", reply: "Disco mode! The plaza lights are yours for 20 seconds." },
  { word: "boom", hint: "Something loud above the plaza.", reply: "Fireworks over Résumé Town!" },
  { word: "sudo", hint: "Ask nicely, with privileges.", reply: "Alaa is not in the sudoers file. This incident will be reported." },
  { word: "java", hint: "The language of the day job.", reply: "Coffee level restored. Also, public static void main." },
  { word: "huda", hint: "A product made from scratch.", reply: "Huda AI says: 'Good question. Let me think about it.'" },
  { word: "ccna", hint: "Cisco knows this one.", reply: "Packet received. ACK. Have a nice route." },
  { word: "xyzzy", hint: "An old adventure game word.", reply: "Nothing happens. ...Or does it?" },
  { word: "1337", hint: "Numbers that pretend to be letters.", reply: "You are now 7% more elite." },
];

const COIN_KEY = "resume-town-coins";
const CODE_KEY = "resume-town-codes";
const FISH_KEY = "resume-town-fish";

function load(key: string): string[] {
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

export type FishState = "idle" | "wait" | "bite";

interface ExtrasState {
  coins: string[];
  codes: string[];
  fish: string[];
  fishState: FishState;
  nearSpot: boolean;
  discoOn: boolean;
  boomOn: boolean;
  discoUntil: number;
  boomAt: number;
  earlyCasts: number;
  collectCoin: (id: string) => boolean;
  addCode: (word: string) => boolean;
  addFish: (id: string) => boolean;
  setFishState: (s: FishState) => void;
  setNearSpot: (n: boolean) => void;
  startDisco: () => void;
  startBoom: () => void;
  bumpEarly: () => number;
}

export const useExtras = create<ExtrasState>((set, get) => ({
  coins: load(COIN_KEY),
  codes: load(CODE_KEY),
  fish: load(FISH_KEY),
  fishState: "idle",
  nearSpot: false,
  discoOn: false,
  boomOn: false,
  discoUntil: 0,
  boomAt: 0,
  earlyCasts: 0,
  collectCoin: (id) => {
    if (get().coins.includes(id)) return false;
    const coins = [...get().coins, id];
    save(COIN_KEY, coins);
    set({ coins });
    return true;
  },
  addCode: (word) => {
    if (get().codes.includes(word)) return false;
    const codes = [...get().codes, word];
    save(CODE_KEY, codes);
    set({ codes });
    return true;
  },
  addFish: (id) => {
    if (get().fish.includes(id)) return false;
    const fish = [...get().fish, id];
    save(FISH_KEY, fish);
    set({ fish });
    return true;
  },
  setFishState: (fishState) => set({ fishState }),
  setNearSpot: (nearSpot) => {
    if (get().nearSpot !== nearSpot) set({ nearSpot });
  },
  startDisco: () => {
    set({ discoUntil: performance.now() + 20000, discoOn: true });
    window.setTimeout(() => {
      if (performance.now() >= get().discoUntil) set({ discoOn: false });
    }, 20100);
  },
  startBoom: () => {
    set({ boomAt: performance.now(), boomOn: true });
    window.setTimeout(() => {
      if (performance.now() - get().boomAt >= 4000) set({ boomOn: false });
    }, 4100);
  },
  bumpEarly: () => {
    const earlyCasts = get().earlyCasts + 1;
    set({ earlyCasts });
    return earlyCasts;
  },
}));
