import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { mulberry32 } from "../rand";

// "Mountain" by Servin Nissen (CC-BY 3.0) — a downloaded low-poly peak, cloned
// into a dense ring to form a real 3D mountain range around the town.
const PEAK = "/models/nature/mtn_peak.glb";
const PEAK_MIN_Y = -0.33; // model's lowest point, for seating

interface Placement {
  position: [number, number, number];
  scale: number;
  rotationY: number;
  burial: number;
}

export default function MountainRange() {
  const { scene } = useGLTF(PEAK);

  const placements = useMemo<Placement[]>(() => {
    const rng = mulberry32(71);
    const list: Placement[] = [];
    // two overlapping rings (near + far) so the range reads with depth and no
    // sky gaps at the horizon. Pushed clear of the town (roam limit ~34, trees
    // to ~41) and oriented tangentially so the long ridges hug the horizon
    // instead of sweeping toward the plaza.
    const rings = [
      { count: 32, rMin: 68, rMax: 86, sMin: 22, sMax: 40, burial: 4 },
      { count: 24, rMin: 94, rMax: 132, sMin: 40, sMax: 78, burial: 10 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + (rng() - 0.5) * 0.2;
        const radius = ring.rMin + rng() * (ring.rMax - ring.rMin);
        list.push({
          position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
          scale: ring.sMin + rng() * (ring.sMax - ring.sMin),
          rotationY: angle + Math.PI / 2 + (rng() - 0.5) * 0.9,
          burial: ring.burial,
        });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {placements.map((p, i) => (
        <primitive
          key={i}
          object={scene.clone()}
          position={[p.position[0], -PEAK_MIN_Y * p.scale - p.burial, p.position[2]]}
          rotation-y={p.rotationY}
          scale={p.scale}
        />
      ))}
    </group>
  );
}

useGLTF.preload(PEAK);
