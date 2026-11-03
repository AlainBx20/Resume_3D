import { create } from "zustand";
import { buildings, type SectionId, type PropKind } from "./content";
import { ACHIEVEMENTS, TOTAL_STARS } from "./achievements";
import { audio } from "./audio";
import { CHANNELS, channelIndex } from "./tvShows";
import { PARTS } from "./parts";
import { DUCK_SCRIPTS } from "./ducks";
import { atm } from "./atmosphere";

export type { PropKind };

export interface InteriorItem {
  itemId: string;
  index: number; // -1 reserved for the exit marker, -2 for the light switch
  position: [number, number, number];
  label: string;
  kind?: PropKind;
}

export interface ActiveProp {
  kind: "book" | "pc";
  section: SectionId;
  index: number;
}

const VISITED_KEY = "resume-town-visited";
const STARS_KEY = "resume-town-stars";
const ACH_KEY = "resume-town-achievements";
const PARTS_KEY = "resume-town-parts-found";
const FIXED_KEY = "resume-town-pc-fixed";

export interface DuckScene {
  attempt: number;
  line: number;
}

function loadList<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveList(key: string, value: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; progress just won't persist
  }
}

function loadVisited(): SectionId[] {
  return loadList<SectionId>(VISITED_KEY);
}

export interface Toast {
  key: number;
  text: string;
  kind: "info" | "achievement" | "star";
}

let toastKey = 0;

interface TownState {
  parts: string[];
  pcFixed: boolean;
  vaultOpen: boolean;
  cosmosSky: boolean;
  introActive: boolean;
  introBlack: boolean;
  introPlayed: boolean;
  startIntro: () => void;
  endIntro: () => void;
  setIntroBlack: (black: boolean) => void;
  duckScene: DuckScene | null;
  duckAttempts: number;
  nearbyDuck: boolean;
  collectPart: (id: string) => void;
  pokeBrokenPc: () => void;
  closeVault: () => void;
  startDuckScene: () => void;
  advanceDuckScene: () => void;
  setNearbyDuck: (near: boolean) => void;
  stars: string[];
  achievements: string[];
  toast: Toast | null;
  fireOn: boolean;
  partyOn: boolean;
  lightFlips: number;
  tvSeen: number[];
  showToast: (text: string, kind?: Toast["kind"]) => void;
  unlock: (id: string) => void;
  collectStar: (id: string) => void;
  toggleFire: () => void;
  toggleParty: () => void;
  visited: SectionId[];
  activeProp: ActiveProp | null;
  tvOn: boolean;
  tvChannel: number;
  radioOn: boolean;
  radioStation: number;
  roomLight: boolean;
  openProp: (prop: ActiveProp) => void;
  closeProp: () => void;
  toggleTv: () => void;
  nextTvChannel: () => void;
  toggleRadio: () => void;
  nextRadioStation: () => void;
  toggleRoomLight: () => void;
  started: boolean;
  locked: boolean;
  nearbyId: SectionId | null;
  activeSection: SectionId | null;
  activeItemIndex: number | null;
  insideId: SectionId | null;
  interiorItems: InteriorItem[];
  nearbyItemId: string | null;
  navigation: { x: number; z: number; heading: number };
  setStarted: (started: boolean) => void;
  setLocked: (locked: boolean) => void;
  setNearbyId: (id: SectionId | null) => void;
  openSection: (id: SectionId, itemIndex?: number) => void;
  closeSection: () => void;
  enterHouse: (id: SectionId) => void;
  exitHouse: () => void;
  setInteriorItems: (items: InteriorItem[]) => void;
  setNearbyItemId: (id: string | null) => void;
  setNavigation: (x: number, z: number, heading: number) => void;
}

export const useTownStore = create<TownState>((set, get) => ({
  parts: loadList<string>(PARTS_KEY),
  pcFixed: loadList<boolean>(FIXED_KEY).length > 0,
  vaultOpen: false,
  cosmosSky: false,
  introActive: false,
  introBlack: false,
  introPlayed: false,
  startIntro: () => {
    if (get().introPlayed) return;
    set({ introActive: true, introBlack: true, introPlayed: true });
  },
  endIntro: () => set({ introActive: false, introBlack: false }),
  setIntroBlack: (introBlack) => set({ introBlack }),
  duckScene: null,
  duckAttempts: 0,
  nearbyDuck: false,
  collectPart: (id) => {
    if (get().parts.includes(id)) return;
    const parts = [...get().parts, id];
    saveList(PARTS_KEY, parts);
    audio.partFound();
    const label = PARTS.find((p) => p.id === id)?.label ?? "part";
    set({ parts, toast: { key: ++toastKey, text: `Found a ${label}! ${parts.length}/${PARTS.length} PC parts`, kind: "star" } });
    get().unlock("scavenger");
    if (parts.length >= 3) get().unlock("hoarder");
    if (parts.length >= PARTS.length) get().unlock("mechanic");
  },
  pokeBrokenPc: () => {
    const { parts, pcFixed } = get();
    if (pcFixed) {
      set({ vaultOpen: true });
      get().unlock("vault-hacker");
      return;
    }
    if (parts.length < PARTS.length) {
      const missing = PARTS.filter((p) => !parts.includes(p.id)).map((p) => p.label);
      audio.dread();
      get().unlock("wrong-door");
      set({
        toast: {
          key: ++toastKey,
          text: `Dead screen. Missing: ${missing.join(", ")}. Check the other houses.`,
          kind: "info",
        },
      });
      return;
    }
    saveList(FIXED_KEY, [true]);
    audio.repairHit();
    set({ pcFixed: true });
    get().unlock("tech-support");
    get().showToast("It boots! Interact again to open the Vault.");
  },
  closeVault: () => set({ vaultOpen: false }),
  startDuckScene: () => {
    if (get().duckScene) return;
    const attempt = get().duckAttempts;
    set({ duckScene: { attempt, line: 0 }, duckAttempts: attempt + 1 });
    audio.quack(true);
    get().unlock("quack");
    if (attempt >= 2) get().unlock("persistent");
  },
  advanceDuckScene: () => {
    const scene = get().duckScene;
    if (!scene) return;
    const script = DUCK_SCRIPTS[Math.min(scene.attempt, DUCK_SCRIPTS.length - 1)];
    if (scene.line + 1 >= script.length) {
      set({ duckScene: null });
      get().unlock("scolded");
      return;
    }
    audio.quack(true);
    set({ duckScene: { ...scene, line: scene.line + 1 } });
  },
  setNearbyDuck: (nearbyDuck) => {
    if (get().nearbyDuck !== nearbyDuck) set({ nearbyDuck });
  },
  stars: loadList<string>(STARS_KEY),
  achievements: loadList<string>(ACH_KEY),
  toast: null,
  fireOn: false,
  partyOn: false,
  lightFlips: 0,
  tvSeen: [],
  showToast: (text, kind = "info") => set({ toast: { key: ++toastKey, text, kind } }),
  unlock: (id) => {
    const def = ACHIEVEMENTS[id];
    if (!def || get().achievements.includes(id)) return;
    const achievements = [...get().achievements, id];
    saveList(ACH_KEY, achievements);
    audio.achievement();
    set({ achievements, toast: { key: ++toastKey, text: `${def.title} — ${def.desc}`, kind: "achievement" } });
  },
  collectStar: (id) => {
    if (get().stars.includes(id)) return;
    const stars = [...get().stars, id];
    saveList(STARS_KEY, stars);
    audio.starCollect(stars.length);
    set({
      stars,
      toast: { key: ++toastKey, text: `Hidden star found! ${stars.length}/${TOTAL_STARS}`, kind: "star" },
    });
    get().unlock("stargazer");
    if (stars.length >= TOTAL_STARS) get().unlock("constellation");
  },
  toggleFire: () => {
    const fireOn = !get().fireOn;
    audio.setFire(fireOn);
    set({ fireOn });
    if (fireOn) get().unlock("cozy");
  },
  toggleParty: () => {
    const partyOn = !get().partyOn;
    set(partyOn ? { partyOn, radioOn: true, radioStation: 2 } : { partyOn, radioOn: false });
    if (partyOn) {
      get().unlock("cheat-code");
      get().showToast("🎉 Party mode! Enter the code again to stop.");
    }
  },
  visited: loadVisited(),
  activeProp: null,
  tvOn: false,
  tvChannel: 0,
  radioOn: false,
  radioStation: 0,
  roomLight: true,
  openProp: (activeProp) => {
    set((state) => {
      if (state.visited.includes(activeProp.section)) return { activeProp };
      const visited = [...state.visited, activeProp.section];
      saveList(VISITED_KEY, visited);
      return { visited, activeProp };
    });
    get().unlock(activeProp.kind === "book" ? "bookworm" : "power-user");
    if (activeProp.kind === "book" && atm.rain > 0.3) get().unlock("rainy-day-reader");
    if (activeProp.kind === "book" && (activeProp.section === "education" || activeProp.section === "skills")) {
      get().unlock("book-nook");
    }
    if (buildings.every((b) => get().visited.includes(b.id))) get().unlock("completionist");
  },
  closeProp: () => set({ activeProp: null }),
  toggleTv: () => {
    const tvOn = !get().tvOn;
    set({ tvOn, tvSeen: tvOn ? [channelIndex(get().tvChannel)] : get().tvSeen });
    if (tvOn) get().unlock("couch-potato");
    if (tvOn && channelIndex(get().tvChannel) === 1) get().unlock("ring-bearer");
  },
  nextTvChannel: () => {
    const tvChannel = get().tvChannel + 1;
    const seen = channelIndex(tvChannel);
    const tvSeen = get().tvSeen.includes(seen) ? get().tvSeen : [...get().tvSeen, seen];
    set({ tvChannel, tvSeen });
    if (channelIndex(tvChannel) === 1) get().unlock("ring-bearer");
    if (tvSeen.length >= CHANNELS.length) get().unlock("channel-surfer");
  },
  toggleRadio: () => {
    const radioOn = !get().radioOn;
    set({ radioOn });
    if (radioOn) get().unlock("dj");
  },
  nextRadioStation: () => set((s) => ({ radioStation: s.radioStation + 1 })),
  toggleRoomLight: () => {
    const lightFlips = get().lightFlips + 1;
    const roomLight = !get().roomLight;
    set({ roomLight, lightFlips });
    if (lightFlips >= 8) get().unlock("switch-addict");
    if (!roomLight && atm.day < 0.2) get().unlock("lights-out");
  },
  started: false,
  locked: false,
  nearbyId: null,
  activeSection: null,
  activeItemIndex: null,
  insideId: null,
  interiorItems: [],
  nearbyItemId: null,
  navigation: { x: 0, z: 8, heading: 0 },
  setStarted: (started) => set({ started }),
  setLocked: (locked) => set({ locked }),
  setNearbyId: (nearbyId) => set({ nearbyId }),
  openSection: (id, itemIndex) =>
    set((state) => {
      if (state.visited.includes(id)) return { activeSection: id, activeItemIndex: itemIndex ?? null };
      const visited = [...state.visited, id];
      saveList(VISITED_KEY, visited);
      return { visited, activeSection: id, activeItemIndex: itemIndex ?? null };
    }),
  closeSection: () => set({ activeSection: null, activeItemIndex: null }),
  enterHouse: (id) => {
    if (!get().visited.includes(id)) {
      const visited = [...get().visited, id];
      saveList(VISITED_KEY, visited);
      set({ visited });
    }
    set({ insideId: id, nearbyId: null, cosmosSky: false });
    if (get().visited.length >= 3) get().unlock("house-hopper");
    if (buildings.every((building) => get().visited.includes(building.id))) get().unlock("completionist");
  },
  exitHouse: () => {
    audio.setFire(false);
    const { tvOn, tvChannel } = get();
    const cosmosSky = tvOn && channelIndex(tvChannel) === 1;
    if (cosmosSky) get().unlock("cosmic-dread");
    set({
      cosmosSky,
      insideId: null,
      nearbyItemId: null,
      interiorItems: [],
      activeProp: null,
      roomLight: true,
      tvOn: false,
      radioOn: false,
      fireOn: false,
      partyOn: false,
    });
  },
  setInteriorItems: (interiorItems) => set({ interiorItems }),
  setNearbyItemId: (nearbyItemId) => set({ nearbyItemId }),
  setNavigation: (x, z, heading) => set({ navigation: { x, z, heading } }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __townStore: typeof useTownStore }).__townStore = useTownStore;
}
