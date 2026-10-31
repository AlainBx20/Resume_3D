import { useMemo } from "react";
import { type BuildingDef } from "../content";
import WorldText from "./WorldText";

const WOOD = "#4a3524";

const PANEL_WIDTH = 2.3;
const PANEL_HEIGHT = 0.86;
const POST_HEIGHT = 1.5;

// A bold colored sign on a post at the end of each building's pathway, angled
// toward the plaza: the panel wears the building's accent color with crisp
// white lettering, so each section reads clearly from across the square.
export default function BuildingSign({ def }: { def: BuildingDef }) {
  const { position, rotationY } = useMemo(() => {
    const [bx, , bz] = def.position;
    const dist = Math.hypot(bx, bz);
    const dirX = bx / dist;
    const dirZ = bz / dist;
    // set well off the path's right shoulder so no sign sits in the player's face
    const d = dist - 3.4;
    const px = dirX * d + dirZ * 1.9;
    const pz = dirZ * d - dirX * 1.9;
    // panel front (+z) looks back down the path toward the plaza
    return { position: [px, 0, pz] as [number, number, number], rotationY: Math.atan2(-dirX, -dirZ) };
  }, [def.position]);

  const panelY = POST_HEIGHT + PANEL_HEIGHT / 2;

  return (
    <group position={position} rotation-y={rotationY}>
      {/* twin posts */}
      {[-0.82, 0.82].map((x) => (
        <mesh key={x} position={[x, POST_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.1, POST_HEIGHT + 0.1, 0.1]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}

      {/* dark frame behind the colored panel */}
      <mesh position={[0, panelY, -0.03]} castShadow>
        <boxGeometry args={[PANEL_WIDTH + 0.14, PANEL_HEIGHT + 0.14, 0.1]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>

      {/* colored face in the building's accent color, gently glowing at dusk */}
      <mesh position={[0, panelY, 0.04]} castShadow>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, 0.12]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.45} roughness={0.5} />
      </mesh>

      {/* white title on both faces */}
      {[0, Math.PI].map((flip) => (
        <WorldText
          key={flip}
          position={[0, panelY, flip === 0 ? 0.11 : -0.11]}
          rotation-y={flip}
          fontSize={0.34}
          maxWidth={PANEL_WIDTH - 0.3}
          textAlign="center"
          color="#ffffff"
          outlineWidth={0.012}
          outlineColor="#1b2330"
        >
          {def.title}
        </WorldText>
      ))}
    </group>
  );
}
