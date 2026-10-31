import { create } from "zustand";
import type { WeatherKind, WeatherMode } from "./atmosphere";

// Discrete UI-facing weather state only. Continuous per-frame values live in
// atmosphere.ts; this store just drives the HUD widget and cloud styling.
interface WeatherUIState {
  mode: WeatherMode; // what the player asked for ("auto" lets it drift)
  kind: WeatherKind; // what the sky is actually doing right now
  clock: string;
  fastForward: boolean;
  muted: boolean;
  setMode: (mode: WeatherMode) => void;
  setKind: (kind: WeatherKind) => void;
  setClock: (clock: string) => void;
  setFastForward: (fastForward: boolean) => void;
  setMuted: (muted: boolean) => void;
}

export const useWeatherStore = create<WeatherUIState>((set) => ({
  mode: "auto",
  kind: "clear",
  clock: "07:40",
  fastForward: false,
  muted: false,
  setMode: (mode) => set({ mode }),
  setKind: (kind) => set({ kind }),
  setClock: (clock) => set({ clock }),
  setFastForward: (fastForward) => set({ fastForward }),
  setMuted: (muted) => set({ muted }),
}));
