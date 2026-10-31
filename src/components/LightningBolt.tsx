import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const BOLT_LIFE_MS = 220;
const SEGMENTS = 14;

// Draws a jagged strike out past the mountains whenever WeatherSystem fires a
// flash (atm.boltAt/boltSeed change), visible for a couple hundred ms.
export default function LightningBolt() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const lastBolt = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(SEGMENTS * 2 * 3), 3)
    );
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    return geo;
  }, []);

  useFrame(() => {
    const line = lineRef.current;
    if (!line) return;

    if (atm.boltAt !== lastBolt.current && atm.boltAt > 0) {
      lastBolt.current = atm.boltAt;
      const rng = mulberry32(Math.floor(atm.boltSeed * 100000));
      const angle = rng() * Math.PI * 2;
      const dist = 120 + rng() * 80;
      let x = Math.sin(angle) * dist;
      let z = Math.cos(angle) * dist;
      let y = 90 + rng() * 40;
      const stepY = y / SEGMENTS;

      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < SEGMENTS; i++) {
        pos.setXYZ(i * 2, x, y, z);
        x += (rng() - 0.5) * 14;
        z += (rng() - 0.5) * 14;
        y -= stepY * (0.7 + rng() * 0.6);
        pos.setXYZ(i * 2 + 1, x, Math.max(y, 0), z);
      }
      pos.needsUpdate = true;
    }

    const age = performance.now() - lastBolt.current;
    const alive = lastBolt.current > 0 && age < BOLT_LIFE_MS;
    line.visible = alive;
    if (alive) {
      // flicker while the strike is alive
      (line.material as THREE.LineBasicMaterial).opacity =
        (1 - age / BOLT_LIFE_MS) * (0.6 + Math.random() * 0.4);
    }
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry} visible={false}>
      <lineBasicMaterial
        color="#eef2ff"
        transparent
        opacity={1}
        fog={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
