import type { SectionId } from "./content";

export interface PartDef {
  id: string;
  label: string;
  color: string;
}

export const PARTS: PartDef[] = [
  { id: "ram", label: "RAM stick", color: "#3ddc84" },
  { id: "gpu", label: "graphics card", color: "#ff6b6b" },
  { id: "psu", label: "power cable", color: "#ffd166" },
  { id: "ssd", label: "solid-state drive", color: "#6bb5ff" },
];

export const BROKEN_PC_ROOM: SectionId = "contact";

// Candidate floor spots, chosen to stay clear of furniture in each room
const SPOTS: Record<SectionId, [number, number][]> = {
  about: [[-3.2, 2.9], [4.2, -1.8], [-4.3, -2.3]],
  education: [[-4.2, 1.6], [0.8, -2.6], [3.0, 3.0]],
  experience: [[0.5, -2.6], [-4.2, 1.5], [1.6, 2.9]],
  skills: [[4.2, 0.0], [-2.0, 2.8], [0.3, -2.4]],
  projects: [[-4.2, 1.5], [4.2, 1.5], [0, 2.6]],
  contact: [[-3.5, -1.0], [3.5, 2.8], [-4.2, 2.4]],
};

export interface PartPlacement {
  room: SectionId;
  x: number;
  z: number;
}

const PLACEMENT_KEY = "resume-town-parts-v1";

function generate(): Record<string, PartPlacement> {
  const rooms = Object.keys(SPOTS) as SectionId[];
  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  }
  const out: Record<string, PartPlacement> = {};
  PARTS.forEach((p, i) => {
    const room = rooms[i];
    const [x, z] = SPOTS[room][Math.floor(Math.random() * SPOTS[room].length)];
    out[p.id] = { room, x, z };
  });
  return out;
}

function load(): Record<string, PartPlacement> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PLACEMENT_KEY) ?? "null");
    if (raw && typeof raw === "object" && PARTS.every((p) => (raw as Record<string, unknown>)[p.id])) {
      return raw as Record<string, PartPlacement>;
    }
  } catch {
    // fall through to a fresh scatter
  }
  const fresh = generate();
  try {
    localStorage.setItem(PLACEMENT_KEY, JSON.stringify(fresh));
  } catch {
    // storage unavailable; placement just won't persist
  }
  return fresh;
}

export const partPlacement = load();

export const partItemId = (id: string) => `part-${id}`;

export function partsInRoom(room: SectionId): (PartDef & PartPlacement)[] {
  return PARTS.filter((p) => partPlacement[p.id].room === room).map((p) => ({ ...p, ...partPlacement[p.id] }));
}
