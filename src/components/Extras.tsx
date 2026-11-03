import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { audio } from "../audio";
import { extraItemId, interiorExtras, type Extra } from "../achievements";
import type { SectionId } from "../content";
import { useTownStore } from "../store";
import { BrokenPc } from "./Repair";

function WallClock({ extra }: { extra: Extra }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  const lastChime = useRef(-1);

  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    if (second.current) second.current.rotation.z = -(Math.floor(s) / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2;
    if (now.getMinutes() === 0 && now.getSeconds() === 0 && lastChime.current !== now.getHours()) {
      lastChime.current = now.getHours();
      audio.chime(now.getHours() % 12 || 12);
    }
  });

  return (
    <group position={extra.position} rotation-y={extra.rotationY ?? 0}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 40]} />
        <meshStandardMaterial color="#5b4632" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <circleGeometry args={[0.28, 40]} />
        <meshStandardMaterial color="#fbf6e8" roughness={0.7} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.235, Math.cos((i / 12) * Math.PI * 2) * 0.235, 0.036]}>
          <boxGeometry args={[0.02, i % 3 === 0 ? 0.05 : 0.025, 0.004]} />
          <meshStandardMaterial color="#2b2118" />
        </mesh>
      ))}
      <group ref={hour} position={[0, 0, 0.04]}>
        <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.025, 0.14, 0.006]} /><meshStandardMaterial color="#1c1c1c" /></mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.046]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.016, 0.2, 0.006]} /><meshStandardMaterial color="#1c1c1c" /></mesh>
      </group>
      <group ref={second} position={[0, 0, 0.052]}>
        <mesh position={[0, 0.11, 0]}><boxGeometry args={[0.008, 0.22, 0.004]} /><meshStandardMaterial color="#c0392b" /></mesh>
      </group>
      <mesh position={[0, 0, 0.056]}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
    </group>
  );
}

const STONE = "#7b7770";

function Fireplace({ extra }: { extra: Extra }) {
  const on = useTownStore((s) => s.fireOn);
  const light = useRef<THREE.PointLight>(null);
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const glow = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    glow.current += ((on ? 1 : 0) - glow.current) * 0.08;
    flames.current.forEach((flame, i) => {
      if (!flame) return;
      const flicker = 0.75 + Math.sin(t * (9 + i * 3) + i) * 0.18 + Math.sin(t * 23 + i * 2) * 0.08;
      flame.scale.set(1, glow.current * flicker, 1);
      flame.visible = glow.current > 0.02;
    });
    if (light.current) {
      light.current.intensity = glow.current * (7 + Math.sin(t * 13) * 1.3 + Math.sin(t * 31) * 0.8);
    }
  });

  return (
    <group position={extra.position} rotation-y={extra.rotationY ?? 0}>
      {/* chimney breast up to the ceiling */}
      <mesh position={[0, 2, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 4, 0.36]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.65, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.3, 0.5]} />
        <meshStandardMaterial color="#6a665f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.34, -0.2]} castShadow>
        <boxGeometry args={[1.9, 0.09, 0.6]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
      </mesh>
      {/* firebox */}
      <mesh position={[0, 0.42, 0.003]}>
        <boxGeometry args={[0.95, 0.62, 0.04]} />
        <meshStandardMaterial color="#0c0a09" roughness={1} />
      </mesh>
      <mesh position={[0, 0.16, 0.02]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#3a2616" roughness={1} />
      </mesh>
      <mesh position={[0, 0.24, 0.03]} rotation-z={Math.PI / 2 + 0.2}>
        <cylinderGeometry args={[0.045, 0.045, 0.5, 8]} />
        <meshStandardMaterial color="#2c1c10" roughness={1} />
      </mesh>
      {[-0.17, 0, 0.17].map((x, i) => (
        <mesh
          key={x}
          ref={(m) => {
            flames.current[i] = m;
          }}
          position={[x, 0.3, 0.05]}
          visible={false}
        >
          <coneGeometry args={[0.11, 0.42 - Math.abs(x), 8]} />
          <meshBasicMaterial color={i === 1 ? "#ffd36a" : "#ff8a2a"} toneMapped={false} />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 0.5, 0.6]} color="#ff9a4a" intensity={0} distance={9} decay={2} />
    </group>
  );
}

function HiddenStar({ extra, id }: { extra: Extra; id: string }) {
  const collected = useTownStore((s) => s.stars.includes(id));
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 1.6;
    g.position.y = extra.position[1] + Math.sin(t * 2) * 0.06;
    g.scale.setScalar(0.9 + Math.sin(t * 3.2) * 0.12);
  });
  if (collected) return null;
  return (
    <group ref={ref} position={extra.position}>
      <mesh>
        <octahedronGeometry args={[0.09, 0]} />
        <meshBasicMaterial color="#ffe066" toneMapped={false} />
      </mesh>
      <mesh scale={[1.9, 0.35, 1.9]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshBasicMaterial color="#fff3b0" toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <pointLight color="#ffe066" intensity={0.3} distance={1} decay={2} />
    </group>
  );
}

export default function RoomExtras({ id }: { id: SectionId }) {
  const extras = useMemo(() => interiorExtras[id], [id]);
  return (
    <>
      {extras.map((extra, i) => {
        if (extra.kind === "clock") return <WallClock key={i} extra={extra} />;
        if (extra.kind === "fire") return <Fireplace key={i} extra={extra} />;
        if (extra.kind === "star") return <HiddenStar key={i} extra={extra} id={extraItemId(id, i)} />;
        if (extra.kind === "brokenpc") return <BrokenPc key={i} extra={extra} />;
        return null;
      })}
    </>
  );
}
