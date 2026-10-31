import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTownStore } from "../store";

// A real wooden double-door filling the room's exit gap (south wall, z = +4),
// replacing the black void the open doorway used to show. The leaves swing open
// (into the room) as the player approaches the exit, and close again otherwise.
const WALL_Z = 4; // ROOM_DEPTH / 2
const GAP_W = 2.4; // DOORWAY_WIDTH
const ROOM_H = 4;

const FRAME = "#4a3524";
const DOOR = "#7c5a38";
const PANEL = "#6a4c2f";
const HANDLE = "#d9b65a";

function Leaf({ hingeX, dir, innerRef }: { hingeX: number; dir: number; innerRef: React.RefObject<THREE.Group | null> }) {
  // hinge group pivots at the outer edge; the leaf is offset inward from it
  return (
    <group ref={innerRef} position={[hingeX, 1.25, WALL_Z - 0.06]}>
      <group position={[dir * 0.48, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.96, 2.5, 0.08]} />
          <meshStandardMaterial color={DOOR} roughness={0.7} />
        </mesh>
        {[0.55, -0.55].map((py) => (
          <mesh key={py} position={[0, py, -0.05]}>
            <boxGeometry args={[0.62, 0.95, 0.03]} />
            <meshStandardMaterial color={PANEL} roughness={0.8} />
          </mesh>
        ))}
        {/* handle near the inner (center) edge */}
        <mesh position={[dir * 0.36, 0, -0.08]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
          <meshStandardMaterial color={HANDLE} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export default function Doorway({ wallColor }: { wallColor: string }) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const openRef = useRef(0);
  const nearbyItemId = useTownStore((s) => s.nearbyItemId);

  useFrame((_, dt) => {
    const target = nearbyItemId === "__exit__" ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(dt * 6, 1);
    const a = openRef.current * Math.PI * 0.6; // swing up to ~108°, into the room
    if (leftRef.current) leftRef.current.rotation.y = a;
    if (rightRef.current) rightRef.current.rotation.y = -a;
  });

  return (
    <group>
      {/* side jambs */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.35, WALL_Z]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 2.7, 0.18]} />
          <meshStandardMaterial color={FRAME} roughness={0.75} />
        </mesh>
      ))}
      {/* header above the doors */}
      <mesh position={[0, 2.6, WALL_Z]} castShadow receiveShadow>
        <boxGeometry args={[GAP_W, 0.22, 0.18]} />
        <meshStandardMaterial color={FRAME} roughness={0.75} />
      </mesh>
      {/* dim threshold behind the gap so a passage (not a black void) shows when
          the doors swing open */}
      <mesh position={[0, 1.25, WALL_Z + 0.02]} receiveShadow>
        <boxGeometry args={[GAP_W - 0.2, 2.5, 0.1]} />
        <meshStandardMaterial color="#5a4436" roughness={0.9} emissive="#2a2018" emissiveIntensity={0.4} />
      </mesh>
      {/* transom panel between header and ceiling, blended to the wall */}
      <mesh position={[0, (2.7 + ROOM_H) / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[GAP_W, ROOM_H - 2.7, 0.14]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <Leaf hingeX={-0.98} dir={1} innerRef={leftRef} />
      <Leaf hingeX={0.98} dir={-1} innerRef={rightRef} />
    </group>
  );
}
