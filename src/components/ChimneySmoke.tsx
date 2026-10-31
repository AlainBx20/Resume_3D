import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { buildings, type BuildingDef } from "../content";
import { atm } from "../atmosphere";

const PUFFS_PER_CHIMNEY = 3;
const RISE_HEIGHT = 2.2;
const CYCLE = 4.5; // seconds for one puff's full rise + fade

function ChimneyPuffs({ def }: { def: BuildingDef }) {
  const { scene } = useGLTF(def.model);
  // measure the model's real (unscaled) height so smoke starts right at the
  // actual roofline instead of a guessed offset
  const baseHeight = useMemo(() => new THREE.Box3().setFromObject(scene).max.y * def.scale, [scene, def.scale]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const phases = useMemo(
    () => Array.from({ length: PUFFS_PER_CHIMNEY }, (_, i) => (i / PUFFS_PER_CHIMNEY) * CYCLE),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    phases.forEach((phase, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const local = (t + phase) % CYCLE;
      const progress = local / CYCLE;
      mesh.position.y = baseHeight + progress * RISE_HEIGHT;
      // wind shears the plume sideways the higher a puff rises
      mesh.position.x =
        Math.sin(t * 0.5 + i + def.position[0]) * 0.35 * progress + atm.wind * progress * 1.6;
      mesh.position.z = Math.cos(t * 0.4 + i + def.position[2]) * 0.25 * progress;
      mesh.scale.setScalar(0.25 + progress * 0.55);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // heavy rain damps the fires
      mat.opacity = 0.5 * (1 - progress) * (1 - atm.rain * 0.7);
    });
  });

  return (
    <group position={def.position}>
      {phases.map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          {/* mid-grey, not near-white — avoids tripping the Bloom
              luminance threshold and ballooning into glowing blobs */}
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#a09c91" transparent opacity={0} fog />
        </mesh>
      ))}
    </group>
  );
}

export default function ChimneySmoke() {
  return (
    <>
      {buildings.map((def) => (
        <ChimneyPuffs key={def.id} def={def} />
      ))}
    </>
  );
}
