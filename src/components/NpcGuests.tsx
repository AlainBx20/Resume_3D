import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ACTIVITIES, HOUSES, SIM, guestSpots } from "../npcWeather";
import type { SectionId } from "../content";
import { NPCS, type Npc } from "../townlife";
import { useTownStore } from "../store";
import { Person } from "./TownLife";

interface Guest {
  npc: Npc;
  activity: number;
  spot: [number, number];
}

function GuestFigure({ guest }: { guest: Guest }) {
  const ref = useRef<THREE.Group>(null);
  const kind = ACTIVITIES[guest.activity].id;
  const [x, z] = guest.spot;
  const faceCentre = Math.atan2(-x, -z);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    let px = x;
    const pz = z;
    let py = 0;
    let yaw = faceCentre;
    let rx = 0;
    let rz = 0;
    if (kind === "dance") {
      py = Math.abs(Math.sin(t * 5)) * 0.18;
      yaw += Math.sin(t * 2.5) * 0.9;
      rz = Math.sin(t * 5) * 0.12;
    } else if (kind === "nap") {
      rx = -Math.PI / 2;
      py = 0.24;
      rz = 0;
    } else if (kind === "shake") {
      yaw += Math.sin(t * 28) * 0.35;
      rz = Math.sin(t * 28) * 0.06;
    } else if (kind === "pace") {
      px = x + Math.sin(t * 0.9) * 0.9;
      yaw = Math.cos(t * 0.9) > 0 ? Math.PI / 2 : -Math.PI / 2;
      py = Math.abs(Math.sin(t * 7)) * 0.05;
    } else if (kind === "stretch") {
      const k = Math.abs(Math.sin(t * 1.4));
      py = k * 0.06;
      g.scale.set(1 - k * 0.05, 1 + k * 0.1, 1 - k * 0.05);
      rx = -k * 0.15;
    } else {
      rx = 0.12 + Math.sin(t * 1.2) * 0.02;
    }
    g.position.set(px, py, pz);
    g.rotation.set(rx, yaw, rz);
  });

  return (
    <group ref={ref} position={[x, 0, z]}>
      <Person npc={guest.npc} spawn={false} groupRef={() => {}} />
      {kind === "read" && (
        <mesh position={[0, 0.95, 0.3]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.22]} />
          <meshStandardMaterial color="#c4452f" roughness={0.7} />
        </mesh>
      )}
      {kind === "nap" && (
        <mesh position={[0, 1.75, 0]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshBasicMaterial color="#9bd1ff" />
        </mesh>
      )}
    </group>
  );
}

// Villagers hiding from a storm, seen from inside the house they ran to.
export default function InteriorGuests({ room }: { room: SectionId }) {
  const list = useMemo<Guest[]>(() => {
    const present = NPCS.filter((n) => SIM[n.id].mode === "inside" && HOUSES[SIM[n.id].house].id === room);
    const spots = guestSpots(room, present.length);
    return present.map((npc, i) => ({ npc, activity: SIM[npc.id].activity, spot: spots[i] }));
  }, [room]);

  useEffect(() => {
    if (!list.length) return;
    const timer = window.setTimeout(() => {
      const town = useTownStore.getState();
      const g = list[0];
      town.showToast(`${g.npc.name} ${ACTIVITIES[g.activity].text}. Waiting out the storm.`, "info");
      town.unlock("storm-guest");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [list]);

  return (
    <>
      {list.map((g) => (
        <GuestFigure key={g.npc.id} guest={g} />
      ))}
    </>
  );
}