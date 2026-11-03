import { buildings, interiorDecor, interiorLayouts, type SectionId } from "./content";
import { atm } from "./atmosphere";
import { NPCS, type Npc } from "./townlife";

// Villagers carry umbrellas in the rain and, in a storm, each runs to a house
// and does something inside until the weather clears.

export const WALK_SPEED = 2.3;
const DOOR_R = 9.2;

export const HOUSES = buildings.map((b) => {
  const angle = Math.atan2(b.position[0], b.position[2]);
  return { id: b.id as SectionId, x: Math.sin(angle) * DOOR_R, z: Math.cos(angle) * DOOR_R };
});

export const ACTIVITIES = [
  { id: "read", text: "is curled up reading a book" },
  { id: "dance", text: "is dancing to the thunder" },
  { id: "nap", text: "is taking a nap on the floor" },
  { id: "shake", text: "is shaking the rain off" },
  { id: "pace", text: "is pacing and muttering about deadlines" },
  { id: "stretch", text: "is doing stretches" },
] as const;

export type NpcMode = "idle" | "to-door" | "inside" | "returning";

export interface NpcSim {
  x: number;
  z: number;
  yaw: number;
  mode: NpcMode;
  house: number;
  activity: number;
  leaveAt: number;
  umbrella: number;
  homeX: number;
  homeZ: number;
}

export const SIM: Record<string, NpcSim> = Object.fromEntries(
  NPCS.map((n) => {
    const a = (n.angle * Math.PI) / 180;
    const homeX = Math.sin(a) * n.radius;
    const homeZ = Math.cos(a) * n.radius;
    return [n.id, { x: homeX, z: homeZ, yaw: 0, mode: "idle", house: 0, activity: 0, leaveAt: 0, umbrella: 0, homeX, homeZ } as NpcSim];
  }),
);

export const isRaining = () => atm.rain > 0.25 && atm.weather !== "snow";
export const isStorm = () => atm.weather === "storm";

function pickHouse(id: string) {
  const taken = new Set(
    NPCS.filter((n) => n.id !== id && SIM[n.id].mode !== "idle" && SIM[n.id].mode !== "returning").map((n) => SIM[n.id].house),
  );
  const free = HOUSES.map((_, i) => i).filter((i) => !taken.has(i));
  const pool = free.length ? free : HOUSES.map((_, i) => i);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Advance one villager; returns true while it is walking. */
export function stepNpc(npc: Npc, dt: number, now: number) {
  const s = SIM[npc.id];
  const storm = isStorm();

  if (storm && (s.mode === "idle" || s.mode === "returning")) {
    s.house = pickHouse(npc.id);
    s.activity = Math.floor(Math.random() * ACTIVITIES.length);
    s.mode = "to-door";
  } else if (!storm && s.mode === "to-door") {
    s.mode = "returning";
  } else if (!storm && s.mode === "inside") {
    if (!s.leaveAt) s.leaveAt = now + 1 + Math.random() * 6;
    else if (now > s.leaveAt) {
      s.leaveAt = 0;
      s.x = HOUSES[s.house].x;
      s.z = HOUSES[s.house].z;
      s.mode = "returning";
    }
  }

  const wantUmbrella = isRaining() && s.mode !== "inside";
  s.umbrella += ((wantUmbrella ? 1 : 0) - s.umbrella) * Math.min(1, dt * 4);

  if (s.mode !== "to-door" && s.mode !== "returning") return false;
  const tx = s.mode === "to-door" ? HOUSES[s.house].x : s.homeX;
  const tz = s.mode === "to-door" ? HOUSES[s.house].z : s.homeZ;
  const dx = tx - s.x;
  const dz = tz - s.z;
  const d = Math.hypot(dx, dz);
  const speed = WALK_SPEED * (s.mode === "to-door" && storm ? 1.6 : 1);
  if (d < 0.15) {
    s.x = tx;
    s.z = tz;
    s.mode = s.mode === "to-door" ? "inside" : "idle";
    return false;
  }
  // steer around other villagers so nobody walks through anyone
  let ax = dx / d;
  let az = dz / d;
  let px = 0;
  let pz = 0;
  for (const other of NPCS) {
    if (other.id === npc.id) continue;
    const o = SIM[other.id];
    if (o.mode === "inside") continue;
    const ox = s.x - o.x;
    const oz = s.z - o.z;
    const od = Math.hypot(ox, oz);
    if (od > 1.6 || od < 1e-4) continue;
    const push = (1.6 - od) / 1.6;
    // slide sideways, on the side we already lean to, so two walkers pass instead of deadlocking
    const side = ox * az - oz * ax >= 0 ? 1 : -1;
    px += (ox / od) * push * 1.4 + -az * side * push * 0.9;
    pz += (oz / od) * push * 1.4 + ax * side * push * 0.9;
  }
  ax += px;
  az += pz;
  const al = Math.hypot(ax, az) || 1;
  const step = Math.min(d, speed * dt);
  s.x += (ax / al) * step;
  s.z += (az / al) * step;
  // hard separation as a final guard against clipping
  for (const other of NPCS) {
    if (other.id === npc.id) continue;
    const o = SIM[other.id];
    if (o.mode === "inside") continue;
    const ox = s.x - o.x;
    const oz = s.z - o.z;
    const od = Math.hypot(ox, oz);
    if (od < 0.7 && od > 1e-4) {
      s.x += (ox / od) * (0.7 - od) * 0.5;
      s.z += (oz / od) * (0.7 - od) * 0.5;
    }
  }
  const target = Math.atan2(ax, az);
  const diff = Math.atan2(Math.sin(target - s.yaw), Math.cos(target - s.yaw));
  s.yaw += diff * Math.min(1, dt * 8);
  return true;
}

// Free floor spots for villagers sheltering in a room, away from furniture and the door.
export function guestSpots(room: SectionId, count: number) {
  const items = [...interiorLayouts[room], ...interiorDecor[room]].filter((i) => !("noCollide" in i && i.noCollide));
  const used: [number, number][] = [];
  const out: [number, number][] = [];
  for (let k = 0; k < count; k += 1) {
    let best: [number, number] = [-3.6, -2.4];
    let bestScore = -1;
    for (let x = -4; x <= 4; x += 0.8) {
      for (let z = -3.2; z <= 2; z += 0.8) {
        let m = Infinity;
        for (const it of items) m = Math.min(m, Math.hypot(x - it.position[0], z - it.position[2]));
        for (const u of used) m = Math.min(m, Math.hypot(x - u[0], z - u[1]) * 0.8);
        if (m > bestScore) {
          bestScore = m;
          best = [x, z];
        }
      }
    }
    used.push(best);
    out.push(best);
  }
  return out;
}

if (import.meta.env.DEV) {
  (window as unknown as { __npcSim: typeof SIM }).__npcSim = SIM;
}
