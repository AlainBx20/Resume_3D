import { useMemo } from "react";
import * as THREE from "three";
import { mulberry32 } from "../rand";

// shelf surface heights in bookcaseOpen model units (model is ~0.4w x 0.88h x 0.25d)
const SHELF_Y = [0.04, 0.26, 0.48, 0.7];
const HALF_W = 0.17;
const COLORS = ["#8e2f2f", "#2f5d8e", "#3d7a4f", "#b58a2e", "#6a3f8e", "#2e2e3a", "#a4552a", "#2a7f86", "#d9cfb8"];

type Book = { x: number; y: number; w: number; h: number; d: number; tilt: number; color: string };

export default function Books({ seed = 1 }: { seed?: number }) {
  const books = useMemo(() => {
    const rand = mulberry32(seed * 7919);
    const out: Book[] = [];
    for (const base of SHELF_Y) {
      let x = -HALF_W;
      while (x < HALF_W - 0.03) {
        const w = 0.018 + rand() * 0.016;
        const h = 0.13 + rand() * 0.07;
        const d = 0.12 + rand() * 0.05;
        const color = COLORS[Math.floor(rand() * COLORS.length)];
        // leave a small gap on some shelves, with a leaning book at the end
        if (x + w > HALF_W - 0.03) {
          out.push({ x: x + w / 2, y: base, w, h, d, tilt: -0.35, color });
          break;
        }
        out.push({ x: x + w / 2, y: base, w, h, d, tilt: 0, color });
        x += w + 0.002;
        if (rand() < 0.04) x += 0.07;
      }
    }
    return out;
  }, [seed]);

  return (
    <group>
      {books.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y + b.h / 2, -0.01]}
          rotation-z={b.tilt}
          castShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={new THREE.Color(b.color)} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
