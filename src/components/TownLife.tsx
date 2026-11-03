import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BUGS, NPCS, type Npc } from "../townlife";
import { useQuestStore } from "../questStore";
import { useTownStore } from "../store";
import { audio } from "../audio";
import { mulberry32 } from "../rand";
import { insidePondClearance } from "../landmarks";
import { SIM, stepNpc } from "../npcWeather";

const NPC_REACH = 2.6;
const BUG_REACH = 2.0;

const npcPos = (n: Npc) => [Math.sin((n.angle * Math.PI) / 180) * n.radius, 0, Math.cos((n.angle * Math.PI) / 180) * n.radius] as const;

const UMB_CANOPY = new THREE.SphereGeometry(0.62, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const UMB_POLE = new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6);
const UMB_POLE_MAT = new THREE.MeshStandardMaterial({ color: "#2a2a30", roughness: 0.6 });

export function Person({
  npc,
  groupRef,
  umbRef,
  spawn = true,
}: {
  npc: Npc;
  groupRef: (g: THREE.Group | null) => void;
  umbRef?: (g: THREE.Group | null) => void;
  spawn?: boolean;
}) {
  const [x, , z] = npcPos(npc);
  const talked = useQuestStore((s) => s.talked.includes(npc.id));
  return (
    <group ref={groupRef} position={spawn ? [x, 0, z] : undefined}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.62, 6, 12]} />
        <meshStandardMaterial color={npc.color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.34, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#e8b98f" roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.075, 1.37, 0.17]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshBasicMaterial color="#15191e" />
        </mesh>
      ))}
      {npc.hat && (
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.15, 0.21, 0.16, 14]} />
          <meshStandardMaterial color={npc.hat} roughness={0.7} />
        </mesh>
      )}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.3, 0.7, 0]} rotation={[0, 0, side * 0.15]}>
          <capsuleGeometry args={[0.065, 0.46, 4, 8]} />
          <meshStandardMaterial color={npc.color} roughness={0.8} />
        </mesh>
      ))}
      {umbRef && (
        <group ref={umbRef} position={[0, 1.55, 0]} visible={false}>
          <mesh position={[0, 0.3, 0]} geometry={UMB_POLE} material={UMB_POLE_MAT} />
          <mesh position={[0, 0.58, 0]} scale={[1, 0.6, 1]} geometry={UMB_CANOPY} castShadow>
            <meshStandardMaterial color={npc.color} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {!talked && (
        <mesh position={[0, 1.95, 0]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#ffe066" />
        </mesh>
      )}
    </group>
  );
}

// Shared by all bugs; no per-bug lights (dynamic lights are expensive).
const BUG_SPHERE = new THREE.SphereGeometry(1, 8, 6);
const BUG_BODY_MAT = new THREE.MeshStandardMaterial({ color: "#22402c", emissive: "#35ff7a", emissiveIntensity: 1.6, roughness: 0.4 });
const BUG_HEAD_MAT = new THREE.MeshStandardMaterial({ color: "#18281e", roughness: 0.5 });
const BUG_WING_MAT = new THREE.MeshBasicMaterial({ color: "#baffd5", transparent: true, opacity: 0.55 });
const BUG_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: "#35ff7a",
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

function BugMesh({ groupRef }: { groupRef: (g: THREE.Group | null) => void }) {
  return (
    <group ref={groupRef}>
      <mesh scale={[0.1, 0.07, 0.15]} geometry={BUG_SPHERE} material={BUG_BODY_MAT} />
      <mesh position={[0, 0.02, 0.15]} scale={[0.065, 0.055, 0.065]} geometry={BUG_SPHERE} material={BUG_HEAD_MAT} />
      <mesh scale={0.42} geometry={BUG_SPHERE} material={BUG_GLOW_MAT} />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.1, 0.07, 0]}
          rotation={[0, 0, s * 0.5]}
          scale={[0.1, 0.01, 0.07]}
          geometry={BUG_SPHERE}
          material={BUG_WING_MAT}
        />
      ))}
    </group>
  );
}

interface BugState {
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  sp: number;
  ph: number;
  y: number;
}

function Townsfolk() {
  const camera = useThree((s) => s.camera);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const umbRefs = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat) return;
      const q = useQuestStore.getState();
      const town = useTownStore.getState();
      if (!town.locked || town.introActive || town.activeSection || town.activeProp || town.duckScene) return;
      if (q.dialog) {
        const npc = NPCS.find((n) => n.id === q.dialog!.npc)!;
        q.talk(npc.id, npc.lines.length);
        audio.chirp(480 + NPCS.indexOf(npc) * 40);
      } else if (q.nearNpc) {
        const npc = NPCS.find((n) => n.id === q.nearNpc);
        if (!npc) return;
        q.talk(npc.id, npc.lines.length);
        town.unlock("small-talk");
        audio.chirp(520 + NPCS.indexOf(npc) * 40);
      } else return;
      const talked = useQuestStore.getState().talked;
      if (NPCS.every((n) => talked.includes(n.id))) town.unlock("social-butterfly");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => {
      useQuestStore.getState().setNearNpc(null);
      useQuestStore.getState().closeDialog();
    },
    [],
  );

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const q = useQuestStore.getState();
    const town = useTownStore.getState();
    let nearest: string | null = null;
    let best = NPC_REACH * NPC_REACH;
    for (const npc of NPCS) {
      const g = refs.current[npc.id];
      if (!g) continue;
      const s = SIM[npc.id];
      const walking = stepNpc(npc, Math.min(dt, 0.1), t);
      g.visible = s.mode !== "inside";
      const umb = umbRefs.current[npc.id];
      if (umb) {
        umb.visible = s.umbrella > 0.02;
        umb.scale.setScalar(Math.max(0.001, s.umbrella));
      }
      if (s.mode === "inside") continue;
      g.position.x = s.x;
      g.position.z = s.z;
      const dx = camera.position.x - g.position.x;
      const dz = camera.position.z - g.position.z;
      const d = dx * dx + dz * dz;
      if (s.mode === "idle") {
        if (d < best) {
          best = d;
          nearest = npc.id;
        }
        if (d < 36) {
          const target = Math.atan2(dx, dz);
          const diff = Math.atan2(Math.sin(target - s.yaw), Math.cos(target - s.yaw));
          s.yaw += diff * Math.min(1, dt * 4);
        }
        g.position.y = Math.sin(t * 1.8 + npc.angle) * 0.015;
        g.rotation.x = 0;
      } else {
        g.position.y = walking ? Math.abs(Math.sin(t * 10)) * 0.07 : 0;
        g.rotation.x = walking ? 0.12 : 0;
        if (d < 25 && umb && s.umbrella > 0.9) town.unlock("umbrella-spotted");
      }
      g.rotation.y = s.yaw;
      const marker = g.children[g.children.length - 1];
      if (marker && marker.type === "Mesh" && (marker as THREE.Mesh).geometry.type === "OctahedronGeometry") {
        marker.rotation.y = t * 2;
        marker.position.y = 1.95 + s.umbrella * 0.65 + Math.sin(t * 2.4) * 0.06;
      }
    }
    q.setNearNpc(town.introActive ? null : nearest);
    if (q.dialog && q.dialog.npc !== nearest) {
      const g = refs.current[q.dialog.npc];
      if (!g || !g.visible || SIM[q.dialog.npc].mode !== "idle" || Math.hypot(camera.position.x - g.position.x, camera.position.z - g.position.z) > NPC_REACH + 2) q.closeDialog();
    }
  });

  return (
    <>
      {NPCS.map((npc) => (
        <Person
          key={npc.id}
          npc={npc}
          spawn={false}
          groupRef={(g) => {
            refs.current[npc.id] = g;
          }}
          umbRef={(g) => {
            umbRefs.current[npc.id] = g;
          }}
        />
      ))}
    </>
  );
}

function buildBugStates() {
  const rng = mulberry32(20241);
  const out: Record<string, BugState> = {};
  BUGS.forEach((bug, i) => {
    let cx = 0;
    let cz = 0;
    for (let tries = 0; tries < 30; tries += 1) {
      const inner = i % 3 === 0;
      const r = inner ? 3.8 + rng() * 1.6 : 15.8 + rng() * 3;
      const a = rng() * Math.PI * 2;
      cx = Math.sin(a) * r;
      cz = Math.cos(a) * r;
      if (!insidePondClearance(cx, cz, 2)) break;
    }
    out[bug.id] = { cx, cz, rx: 1.2 + rng() * 1.4, rz: 1.0 + rng() * 1.4, sp: 0.5 + rng() * 0.5, ph: rng() * 6.28, y: 0.55 + rng() * 0.6 };
  });
  return out;
}

const BUG_STATES = buildBugStates();

function BugHunt() {
  const camera = useThree((s) => s.camera);
  const caught = useQuestStore((s) => s.bugs);
  const refs = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat) return;
      const q = useQuestStore.getState();
      const town = useTownStore.getState();
      if (!q.nearBug || q.dialog || !town.locked || town.introActive || town.activeSection || town.activeProp || town.duckScene) return;
      let target: string | null = null;
      let best = BUG_REACH * BUG_REACH;
      for (const bug of BUGS) {
        const g = refs.current[bug.id];
        if (!g || !g.visible) continue;
        const d = (camera.position.x - g.position.x) ** 2 + (camera.position.z - g.position.z) ** 2;
        if (d < best) {
          best = d;
          target = bug.id;
        }
      }
      if (!target) return;
      const def = BUGS.find((b) => b.id === target)!;
      if (!q.catchBug(target)) return;
      const n = useQuestStore.getState().bugs.length;
      audio.starCollect(Math.min(6, n));
      town.showToast(`Caught: ${def.name} (${n}/${BUGS.length}). ${def.joke}`, "star");
      town.unlock("bug-first");
      if (n >= 6) town.unlock("exterminator");
      if (n >= BUGS.length) town.unlock("zero-bugs");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera]);

  useEffect(() => () => useQuestStore.getState().setNearBug(false), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    let near = false;
    for (const bug of BUGS) {
      const g = refs.current[bug.id];
      if (!g) continue;
      const isCaught = caught.includes(bug.id);
      g.visible = !isCaught;
      if (isCaught) continue;
      const s = BUG_STATES[bug.id];
      const dx = camera.position.x - g.position.x;
      const dz = camera.position.z - g.position.z;
      const d = Math.hypot(dx, dz);
      s.ph += dt * s.sp * (d < 4.5 ? 2.4 : 1);
      const px = s.cx + Math.sin(s.ph) * s.rx;
      const pz = s.cz + Math.cos(s.ph * 0.7) * s.rz;
      g.rotation.y = Math.atan2(Math.cos(s.ph) * s.rx, -Math.sin(s.ph * 0.7) * 0.7 * s.rz);
      g.position.set(px, s.y + Math.sin(t * 3 + s.ph) * 0.08, pz);
      g.rotation.z = Math.sin(t * 14 + s.ph) * 0.08;
      if (d < BUG_REACH) near = true;
    }
    useQuestStore.getState().setNearBug(!useTownStore.getState().introActive && near);
  });

  return (
    <>
      {BUGS.map((bug) => (
        <BugMesh
          key={bug.id}
          groupRef={(g) => {
            refs.current[bug.id] = g;
          }}
        />
      ))}
    </>
  );
}

export default function TownLife() {
  return (
    <>
      <Townsfolk />
      <BugHunt />
    </>
  );
}
