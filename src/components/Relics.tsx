import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RELICS, useQuestStore, type Relic } from "../questStore";
import { useTownStore } from "../store";
import { audio } from "../audio";

const REACH = 2.3;
const REACH_SQ = REACH * REACH;

function RelicMesh({ relic, meshRef }: { relic: Relic; meshRef: (m: THREE.Group | null) => void }) {
  const found = useQuestStore((s) => s.found.includes(relic.id));
  const secret = relic.kind === "secret";
  return (
    <group ref={meshRef} position={relic.position}>
      <mesh>
        {secret ? <icosahedronGeometry args={[0.32, 0]} /> : <octahedronGeometry args={[0.38, 0]} />}
        <meshStandardMaterial
          color={relic.color}
          emissive={relic.color}
          emissiveIntensity={found ? 0.25 : 1.4}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={found ? 0.55 : 0.95}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.015, 6, 40]} />
        <meshBasicMaterial color={relic.color} transparent opacity={found ? 0.25 : 0.7} />
      </mesh>
      <mesh position={[0, -relic.position[1] + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color={relic.color} transparent opacity={found ? 0.12 : 0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function Relics() {
  const camera = useThree((s) => s.camera);
  const refs = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat) return;
      const q = useQuestStore.getState();
      const town = useTownStore.getState();
      if (q.reading) {
        q.closeReading();
        return;
      }
      if (!q.nearRelic || !town.locked || town.introActive || town.activeSection || town.activeProp) return;
      const id = q.nearRelic;
      const relic = RELICS.find((r) => r.id === id);
      if (!relic) return;
      const isNew = q.collect(id);
      audio.starCollect(Math.min(6, useQuestStore.getState().found.length));
      if (isNew) {
        const found = useQuestStore.getState().found;
        town.unlock("relic-first");
        town.showToast(`${relic.title} recovered (${found.length}/${RELICS.length})`, "star");
        if (found.length >= RELICS.length) town.unlock("archaeologist");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => useQuestStore.getState().setNear(null), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let nearest: string | null = null;
    let best = REACH_SQ;
    const active = !useTownStore.getState().introActive;
    for (const relic of RELICS) {
      const g = refs.current[relic.id];
      if (!g) continue;
      g.rotation.y = t * 0.8 + relic.position[0];
      g.position.y = relic.position[1] + Math.sin(t * 1.6 + relic.position[2]) * 0.12;
      const dx = camera.position.x - relic.position[0];
      const dz = camera.position.z - relic.position[2];
      const d = dx * dx + dz * dz;
      if (d < best) {
        best = d;
        nearest = relic.id;
      }
    }
    useQuestStore.getState().setNear(active ? nearest : null);
  });

  return (
    <>
      {RELICS.map((relic) => (
        <RelicMesh
          key={relic.id}
          relic={relic}
          meshRef={(m) => {
            refs.current[relic.id] = m;
          }}
        />
      ))}
    </>
  );
}
