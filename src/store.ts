import { create } from "zustand";
import type { SectionId } from "./content";

export interface InteriorItem {
  itemId: string;
  index: number; // -1 reserved for the exit marker
  position: [number, number, number];
  label: string;
}

interface TownState {
  started: boolean;
  locked: boolean;
  nearbyId: SectionId | null;
  activeSection: SectionId | null;
  activeItemIndex: number | null;
  insideId: SectionId | null;
  interiorItems: InteriorItem[];
  nearbyItemId: string | null;
  setStarted: (started: boolean) => void;
  setLocked: (locked: boolean) => void;
  setNearbyId: (id: SectionId | null) => void;
  openSection: (id: SectionId, itemIndex?: number) => void;
  closeSection: () => void;
  enterHouse: (id: SectionId) => void;
  exitHouse: () => void;
  setInteriorItems: (items: InteriorItem[]) => void;
  setNearbyItemId: (id: string | null) => void;
}

export const useTownStore = create<TownState>((set) => ({
  started: false,
  locked: false,
  nearbyId: null,
  activeSection: null,
  activeItemIndex: null,
  insideId: null,
  interiorItems: [],
  nearbyItemId: null,
  setStarted: (started) => set({ started }),
  setLocked: (locked) => set({ locked }),
  setNearbyId: (nearbyId) => set({ nearbyId }),
  openSection: (id, itemIndex) => set({ activeSection: id, activeItemIndex: itemIndex ?? null }),
  closeSection: () => set({ activeSection: null, activeItemIndex: null }),
  enterHouse: (id) => set({ insideId: id, nearbyId: null }),
  exitHouse: () => set({ insideId: null, nearbyItemId: null, interiorItems: [] }),
  setInteriorItems: (interiorItems) => set({ interiorItems }),
  setNearbyItemId: (nearbyItemId) => set({ nearbyItemId }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __townStore: typeof useTownStore }).__townStore = useTownStore;
}
