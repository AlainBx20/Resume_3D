import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { TOWN_NAME } from "../content";
import { registerCollider } from "../collision";
import { mulberry32 } from "../rand";
import WorldText from "./WorldText";

// Off the right shoulder of the walking path, a few steps ahead of spawn
const POSITION: [number, number, number] = [3.8, 0, 2.4];
// where the player stands when they first click in (see Player.tsx)
const SPAWN: [number, number] = [0, 8];
// board front is the group's local +z, so spin it to face the spawn point
const FACING = Math.atan2(SPAWN[0] - POSITION[0], SPAWN[1] - POSITION[2]);

const BOARD_WIDTH = 2.15;
const BOARD_BASE_Y = 0.85; // bottom edge of the board
const BOARD_HEIGHT = 0.86; // straight-edge height; the arch rises above this
const ARCH_RISE = 0.22;
const WOOD = "#4e3a28";
const WOOD_LIGHT = "#6b5138";
const GOLD = "#f0d9a2";

const FLOWER_COLORS = ["#e58fd3", "#b98fe5", "#f6f2ff", "#ffd166"];

function useArchBoardGeometry() {
  return useMemo(() => {
    const half = BOARD_WIDTH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-half, 0);
    shape.lineTo(half, 0);
    shape.lineTo(half, BOARD_HEIGHT);
    shape.quadraticCurveTo(0, BOARD_HEIGHT + ARCH_RISE * 2, -half, BOARD_HEIGHT);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.025,
      bevelSegments: 2,
    });
    geo.translate(0, 0, -0.045); // center the slab on the group's z
    return geo;
  }, []);
}

function SignFace({ back = false }: { back?: boolean }) {
  const z = back ? -0.075 : 0.075;
  const flip = back ? Math.PI : 0;
  return (
    <group position={[0, BOARD_BASE_Y, 0]} rotation-y={flip}>
      <WorldText position={[0, 0.76, back ? -z : z]} fontSize={0.14} color={GOLD}>
        Welcome to
      </WorldText>
      <WorldText
        position={[0, 0.47, back ? -z : z]}
        fontSize={0.28}
        maxWidth={BOARD_WIDTH - 0.3}
        textAlign="center"
        color={GOLD}
      >
        {TOWN_NAME}
      </WorldText>
      <WorldText position={[0, 0.18, back ? -z : z]} fontSize={0.1} color={GOLD}>
        Built with Three.js
      </WorldText>
    </group>
  );
}

function LanternPost({ x }: { x: number }) {
  const topY = 1.55;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, topY / 2, 0]} castShadow>
        <boxGeometry args={[0.09, topY, 0.09]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      {/* lantern body with a warm core that blooms */}
      <mesh position={[0, topY + 0.12, 0]}>
        <boxGeometry args={[0.17, 0.22, 0.17]} />
        <meshStandardMaterial color="#2e2620" roughness={0.7} />
      </mesh>
      <mesh position={[0, topY + 0.12, 0]}>
        <sphereGeometry args={[0.062, 8, 8]} />
        <meshStandardMaterial
          color="#ffd98c"
          emissive="#ffb54d"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, topY + 0.27, 0]} castShadow>
        <coneGeometry args={[0.15, 0.12, 4]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.85} />
      </mesh>
    </group>
  );
}

// The town's welcome sign: an arched dark-wood board with golden lettering,
// flanked by lantern posts, with a strip of wildflowers at its feet.
export default function Signpost() {
  const boardGeometry = useArchBoardGeometry();

  const flowers = useMemo(() => {
    const rng = mulberry32(913);
    // tight bed hugging the board's base, blossoms nestled in foliage
    return Array.from({ length: 12 }, (_, i) => ({
      x: -BOARD_WIDTH / 2 + 0.2 + (i / 11) * (BOARD_WIDTH - 0.4) + (rng() - 0.5) * 0.1,
      z: 0.16 + rng() * 0.14,
      y: 0.12 + rng() * 0.05,
      color: FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)],
      size: 0.035 + rng() * 0.025,
    }));
  }, []);

  useEffect(() => {
    const box = new THREE.Box3(
      new THREE.Vector3(POSITION[0] - 1.9, 0, POSITION[2] - 0.6),
      new THREE.Vector3(POSITION[0] + 1.9, 2, POSITION[2] + 0.6)
    );
    return registerCollider(box);
  }, []);

  return (
    <group position={POSITION} rotation-y={FACING}>
      {/* support posts */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (BOARD_WIDTH / 2 - 0.22), 0.9, 0]} castShadow>
          <boxGeometry args={[0.13, 1.8, 0.13]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}

      {/* arched board */}
      <mesh geometry={boardGeometry} position={[0, BOARD_BASE_Y, 0]} castShadow>
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.8} />
      </mesh>

      <SignFace />
      <SignFace back />

      <LanternPost x={-(BOARD_WIDTH / 2 + 0.55)} />
      <LanternPost x={BOARD_WIDTH / 2 + 0.55} />

      {/* wildflowers along the base, each blossom on a leafy tuft */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#4d7a3a" roughness={0.9} />
          </mesh>
          <mesh position={[0, f.y, 0]}>
            <sphereGeometry args={[f.size, 6, 6]} />
            <meshStandardMaterial color={f.color} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
