import { useMemo } from "react";
import * as THREE from "three";
import { type BuildingDef } from "../content";
import WorldText from "./WorldText";

const WOOD = "#4e3a28";
const WOOD_LIGHT = "#6b5138";
const GOLD = "#f0d9a2";

const PLAQUE_WIDTH = 1.75;
const PLAQUE_HEIGHT = 0.62;
const ARCH_RISE = 0.16;
const POST_HEIGHT = 1.05;

// shared across all six plaques
let cachedGeometry: THREE.ExtrudeGeometry | null = null;
function getPlaqueGeometry() {
  if (!cachedGeometry) {
    const half = PLAQUE_WIDTH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-half, 0);
    shape.lineTo(half, 0);
    shape.lineTo(half, PLAQUE_HEIGHT);
    shape.quadraticCurveTo(0, PLAQUE_HEIGHT + ARCH_RISE * 2, -half, PLAQUE_HEIGHT);
    shape.closePath();
    cachedGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    cachedGeometry.translate(0, 0, -0.035);
  }
  return cachedGeometry;
}

// A rounded wooden plaque on a single post at the end of each building's
// pathway, angled toward the plaza — replaces the old floating labels.
export default function BuildingSign({ def }: { def: BuildingDef }) {
  const { position, rotationY } = useMemo(() => {
    const [bx, , bz] = def.position;
    const dist = Math.hypot(bx, bz);
    const dirX = bx / dist;
    const dirZ = bz / dist;
    // just short of the building, set well off the path's right shoulder so
    // no plaque ever sits in the player's face (spawn is on the Skills path)
    const d = dist - 3.4;
    const px = dirX * d + dirZ * 1.9;
    const pz = dirZ * d - dirX * 1.9;
    // plaque front (+z) looks back down the path toward the plaza
    return { position: [px, 0, pz] as [number, number, number], rotationY: Math.atan2(-dirX, -dirZ) };
  }, [def.position]);

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, POST_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.11, POST_HEIGHT, 0.11]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      <mesh geometry={getPlaqueGeometry()} position={[0, POST_HEIGHT, 0]} castShadow>
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.8} />
      </mesh>
      {/* colored accent dot matching the building's beacon */}
      <mesh position={[0, POST_HEIGHT + PLAQUE_HEIGHT + 0.02, 0.045]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {[0, Math.PI].map((flip) => (
        <WorldText
          key={flip}
          position={[0, POST_HEIGHT + PLAQUE_HEIGHT * 0.52, flip === 0 ? 0.065 : -0.065]}
          rotation-y={flip}
          fontSize={0.24}
          maxWidth={PLAQUE_WIDTH - 0.2}
          textAlign="center"
          color={GOLD}
        >
          {def.title}
        </WorldText>
      ))}
    </group>
  );
}
