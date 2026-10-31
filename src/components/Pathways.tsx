import { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { buildings } from "../content";
import { PLAZA_RADIUS } from "./Ground";

export default function Pathways() {
  const color = useLoader(THREE.TextureLoader, "/textures/paving-color.jpg");
  const normal = useLoader(THREE.TextureLoader, "/textures/paving-normal.jpg");
  const roughness = useLoader(THREE.TextureLoader, "/textures/paving-roughness.jpg");

  const paths = useMemo(() => {
    return buildings.map((b) => {
      const [x, , z] = b.position;
      const angle = Math.atan2(x, z);
      const dist = Math.hypot(x, z);
      const startRadius = PLAZA_RADIUS;
      const endRadius = dist - 4; // stop short of the building footprint
      const length = Math.max(endRadius - startRadius, 1);
      const mid = startRadius + length / 2;
      const midX = Math.sin(angle) * mid;
      const midZ = Math.cos(angle) * mid;
      return { id: b.id, angle, length, midX, midZ };
    });
  }, []);

  const maps = useMemo(() => {
    return paths.map((p) => {
      const c = color.clone();
      const n = normal.clone();
      const r = roughness.clone();
      for (const t of [c, n, r]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1.2, p.length / 3);
        t.needsUpdate = true;
      }
      c.colorSpace = THREE.SRGBColorSpace;
      return { color: c, normal: n, roughness: r };
    });
  }, [paths, color, normal, roughness]);

  return (
    <group>
      {/* raised stone lip around the plaza, like the reference's ring walk */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.028, 0]} receiveShadow>
        <ringGeometry args={[4.95, 5.3, 48]} />
        <meshStandardMaterial color="#9aa2ae" roughness={0.95} />
      </mesh>

      {paths.map((p, i) => (
        <group key={p.id} position={[p.midX, 0.015, p.midZ]} rotation-y={p.angle}>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[3, p.length]} />
            <meshStandardMaterial
              map={maps[i].color}
              normalMap={maps[i].normal}
              normalScale={new THREE.Vector2(0.6, 0.6)}
              roughnessMap={maps[i].roughness}
              roughness={1}
              envMapIntensity={0.08}
            />
          </mesh>
          {/* low stone curbs along both edges */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 1.57, 0.02, 0]} receiveShadow castShadow>
              <boxGeometry args={[0.14, 0.07, p.length]} />
              <meshStandardMaterial color="#a7adb8" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
