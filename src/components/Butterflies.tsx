import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const COUNT = 12;
const COLORS = ["#ef7fae", "#f6c445", "#7fb7f2", "#b98fe5", "#ff9b54", "#f2f2f2"];

interface Fly {
  cx: number;
  cz: number;
  baseY: number;
  rx: number;
  rz: number;
  speed: number;
  phase: number;
  color: string;
}

// Daytime butterflies drifting over the lawn in looping paths, wings flapping.
// They fold away in rain, snow and at night (same calm-daylight rule as birds).
function Butterfly({ fly }: { fly: Fly }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime * fly.speed + fly.phase;
    const x = fly.cx + Math.sin(t) * fly.rx;
    const z = fly.cz + Math.cos(t * 0.8) * fly.rz;
    const y = fly.baseY + Math.sin(t * 2.3 + fly.phase) * 0.5;
    g.position.set(x, y, z);
    // face the direction of travel
    g.rotation.y = Math.atan2(Math.cos(t) * fly.rx * fly.speed, -Math.sin(t * 0.8) * fly.rz * 0.8 * fly.speed);
    const flap = Math.sin(state.clock.elapsedTime * 14 + fly.phase) * 1.1 + 0.2;
    if (leftRef.current) leftRef.current.rotation.y = flap;
    if (rightRef.current) rightRef.current.rotation.y = -flap;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={leftRef} position={[-0.001, 0, 0]}>
        <planeGeometry args={[0.16, 0.22]} />
        <meshStandardMaterial color={fly.color} side={THREE.DoubleSide} roughness={0.6} emissive={fly.color} emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={rightRef} position={[0.001, 0, 0]}>
        <planeGeometry args={[0.16, 0.22]} />
        <meshStandardMaterial color={fly.color} side={THREE.DoubleSide} roughness={0.6} emissive={fly.color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export default function Butterflies() {
  const groupRef = useRef<THREE.Group>(null);
  const flies = useMemo<Fly[]>(() => {
    const rng = mulberry32(314);
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = rng() * Math.PI * 2;
      const dist = 6 + rng() * 16;
      return {
        cx: Math.sin(angle) * dist,
        cz: Math.cos(angle) * dist,
        baseY: 0.8 + rng() * 1.6,
        rx: 1.5 + rng() * 2.5,
        rz: 1.5 + rng() * 2.5,
        speed: 0.5 + rng() * 0.7,
        phase: rng() * Math.PI * 2,
        color: COLORS[i % COLORS.length],
      };
    });
  }, []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = atm.day > 0.35 && atm.rain < 0.25 && atm.snow < 0.25;
  });

  return (
    <group ref={groupRef}>
      {flies.map((fly, i) => (
        <Butterfly key={i} fly={fly} />
      ))}
    </group>
  );
}
