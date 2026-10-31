// A real wooden double-door filling the room's exit gap (south wall, z = +4),
// replacing the black void the open doorway used to show. The frame, header and
// transom cover the full 2.4-wide x 4-tall opening so no background leaks through.
const WALL_Z = 4; // ROOM_DEPTH / 2
const GAP_W = 2.4; // DOORWAY_WIDTH
const ROOM_H = 4;

const FRAME = "#4a3524";
const DOOR = "#7c5a38";
const PANEL = "#6a4c2f";
const HANDLE = "#d9b65a";

function Leaf({ x, hingeSign }: { x: number; hingeSign: number }) {
  // one door leaf with two recessed panels and a handle near the inner edge
  return (
    <group position={[x, 1.25, WALL_Z - 0.05]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.96, 2.5, 0.08]} />
        <meshStandardMaterial color={DOOR} roughness={0.7} />
      </mesh>
      {/* recessed panels (upper + lower) */}
      {[0.55, -0.55].map((py) => (
        <mesh key={py} position={[0, py, -0.05]}>
          <boxGeometry args={[0.62, 0.95, 0.03]} />
          <meshStandardMaterial color={PANEL} roughness={0.8} />
        </mesh>
      ))}
      {/* handle near the inner (center) edge */}
      <mesh position={[-hingeSign * 0.34, 0, -0.08]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
        <meshStandardMaterial color={HANDLE} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Doorway({ wallColor }: { wallColor: string }) {
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
      {/* center board at the wall plane, hiding the seam between the two leaves */}
      <mesh position={[0, 1.25, WALL_Z]} receiveShadow>
        <boxGeometry args={[0.14, 2.5, 0.16]} />
        <meshStandardMaterial color={FRAME} roughness={0.75} />
      </mesh>
      {/* transom panel between header and ceiling, blended to the wall */}
      <mesh position={[0, (2.7 + ROOM_H) / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[GAP_W, ROOM_H - 2.7, 0.14]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <Leaf x={-0.5} hingeSign={-1} />
      <Leaf x={0.5} hingeSign={1} />
    </group>
  );
}
