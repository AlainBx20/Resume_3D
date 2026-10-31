import { useMemo } from "react";
import * as THREE from "three";
import { GROUND_RADIUS } from "./Ground";

// Overlaps slightly under the grass disc so the terrain is continuous, with the
// inner ring at ~0 height so there's no visible seam. The player's roam limit
// (TOWN_RADIUS = 34) is well inside the base, so it's never reachable.
const INNER_RADIUS = GROUND_RADIUS - 3;
const OUTER_RADIUS = GROUND_RADIUS + 150;
const ANGULAR_SEGMENTS = 150;
const RADIAL_SEGMENTS = 22;
const PEAK_HEIGHT = 44;

// A few bold peaks around the ring (macro), medium ridges, and sharp ridged
// detail — a dramatic stylized skyline instead of uniform cones.
function ridgeHeight(angle: number, t: number) {
  const macro = Math.sin(angle * 1.5 + 0.4) * 0.52 + Math.sin(angle * 2.6 + 2.0) * 0.34;
  const med = Math.sin(angle * 5.2 + 1.0) * 0.18 + Math.sin(angle * 8.1 + 3.3) * 0.1;
  const sharp = (1 - Math.abs(Math.sin(angle * 3.3 + 0.7))) * 0.4; // ridged
  let shaped = 0.5 + macro + med + sharp;
  shaped = Math.max(shaped, 0.06);
  // rise quickly from the inner seam; far ridges a touch lower for depth
  const rise = THREE.MathUtils.smoothstep(t, 0, 0.1) * (1 - 0.18 * THREE.MathUtils.smoothstep(t, 0.65, 1));
  return shaped * rise * PEAK_HEIGHT;
}

export default function Mountains() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const grass = new THREE.Color("#4f7a44");
    const rock = new THREE.Color("#746d63");
    const snow = new THREE.Color("#f3f6ff");
    const tmp = new THREE.Color();
    const MAX_H = PEAK_HEIGHT * 1.7;

    for (let r = 0; r <= RADIAL_SEGMENTS; r++) {
      const t = r / RADIAL_SEGMENTS;
      const radius = THREE.MathUtils.lerp(INNER_RADIUS, OUTER_RADIUS, t);
      for (let a = 0; a <= ANGULAR_SEGMENTS; a++) {
        const angle = (a / ANGULAR_SEGMENTS) * Math.PI * 2;
        const height = ridgeHeight(angle, t);
        positions.push(Math.sin(angle) * radius, height, Math.cos(angle) * radius);

        const hn = height / MAX_H;
        // green base -> rock -> strong white snow caps on the upper slopes
        if (hn < 0.3) tmp.copy(grass).lerp(rock, THREE.MathUtils.smoothstep(hn, 0.12, 0.3));
        else tmp.copy(rock).lerp(snow, THREE.MathUtils.smoothstep(hn, 0.32, 0.52));
        colors.push(tmp.r, tmp.g, tmp.b);
      }
    }

    const rowLength = ANGULAR_SEGMENTS + 1;
    for (let r = 0; r < RADIAL_SEGMENTS; r++) {
      for (let a = 0; a < ANGULAR_SEGMENTS; a++) {
        const i0 = r * rowLength + a;
        indices.push(i0, i0 + rowLength, i0 + 1, i0 + 1, i0 + rowLength, i0 + rowLength + 1);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={0.96} metalness={0} envMapIntensity={0.2} fog />
    </mesh>
  );
}
