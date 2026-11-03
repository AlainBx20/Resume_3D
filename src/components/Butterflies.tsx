import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const COUNT = 9;
const COLORS = ["#ef7fae", "#f6c445", "#5ca8e6", "#a67ad8", "#f38b4f"];

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

function makeWing(side: -1 | 1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(side * 0.055, 0.11, side * 0.17, 0.15, side * 0.21, 0.06);
  shape.bezierCurveTo(side * 0.24, -0.025, side * 0.16, -0.12, side * 0.055, -0.085);
  shape.bezierCurveTo(side * 0.018, -0.05, 0, -0.018, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

const LEFT_WING = makeWing(-1);
const RIGHT_WING = makeWing(1);

function Butterfly({ fly }: { fly: Fly }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime * fly.speed + fly.phase;
    group.position.set(
      fly.cx + Math.sin(t) * fly.rx,
      fly.baseY + Math.sin(t * 2.1 + fly.phase) * 0.28,
      fly.cz + Math.cos(t * 0.82) * fly.rz,
    );
    group.rotation.y = Math.atan2(
      Math.cos(t) * fly.rx,
      -Math.sin(t * 0.82) * fly.rz * 0.82,
    );
    group.rotation.z = Math.sin(t * 0.55) * 0.12;

    const flap = 0.15 + Math.abs(Math.sin(state.clock.elapsedTime * 13 + fly.phase)) * 0.95;
    if (leftRef.current) leftRef.current.rotation.z = -flap;
    if (rightRef.current) rightRef.current.rotation.z = flap;
  });

  return (
    <group ref={groupRef} scale={0.92} name="butterfly">
      <mesh ref={leftRef} geometry={LEFT_WING}>
        <meshBasicMaterial
          color={fly.color}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={rightRef} geometry={RIGHT_WING}>
        <meshBasicMaterial
          color={fly.color}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0.012, 0]}>
        <capsuleGeometry args={[0.018, 0.13, 3, 6]} />
        <meshStandardMaterial color="#2e2521" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.015, -0.095]}>
        <sphereGeometry args={[0.028, 7, 5]} />
        <meshStandardMaterial color="#211b19" roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Butterflies() {
  const groupRef = useRef<THREE.Group>(null);
  const flies = useMemo<Fly[]>(() => {
    const rng = mulberry32(314);
    return Array.from({ length: COUNT }, (_, index) => {
      const angle = rng() * Math.PI * 2;
      const distance = 7 + rng() * 15;
      return {
        cx: Math.sin(angle) * distance,
        cz: Math.cos(angle) * distance,
        baseY: 0.8 + rng() * 1.25,
        rx: 1.1 + rng() * 2,
        rz: 1.1 + rng() * 2,
        speed: 0.38 + rng() * 0.45,
        phase: rng() * Math.PI * 2,
        color: COLORS[index % COLORS.length],
      };
    });
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = atm.day > 0.35 && atm.rain < 0.25 && atm.snow < 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {flies.map((fly, index) => <Butterfly key={index} fly={fly} />)}
    </group>
  );
}
