import { useMemo } from "react";
import * as THREE from "three";
import { GROUND_RADIUS } from "./Ground";

// Overlaps slightly under the grass disc so the terrain is continuous, with the
// inner ring near 0 height so there's no visible seam. The player's roam limit
// (TOWN_RADIUS = 34) is well inside the base, so it's never reachable.
const INNER_RADIUS = GROUND_RADIUS - 3;
const OUTER_RADIUS = GROUND_RADIUS + 170;
const ANGULAR_SEGMENTS = 180;
const RADIAL_SEGMENTS = 26;
const PEAK_HEIGHT = 50;

const up = (v: number) => Math.max(0, v);

// Distinct peaks (squared sine humps rising from low valleys) plus jagged
// ridged detail — a real mountain-range silhouette instead of a smooth dome.
function ridgeHeight(angle: number, t: number) {
  const peaks =
    up(Math.sin(angle * 2.0 + 0.5)) ** 2 * 0.62 +
    up(Math.sin(angle * 3.3 + 2.5)) ** 2 * 0.5 +
    up(Math.sin(angle * 5.1 + 4.0)) ** 2 * 0.34;
  const jag =
    (1 - Math.abs(Math.sin(angle * 11 + 1.0))) * 0.11 +
    (1 - Math.abs(Math.sin(angle * 19 + 3.0))) * 0.06;
  const shaped = 0.14 + peaks + jag; // valleys dip low, peaks rise high
  const rise = THREE.MathUtils.smoothstep(t, 0, 0.12) * (1 - 0.15 * THREE.MathUtils.smoothstep(t, 0.7, 1));
  return shaped * rise * PEAK_HEIGHT;
}

export default function Mountains() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const grass = new THREE.Color("#4c7340");
    const rock = new THREE.Color("#6b6660");
    // muted snow kept dim enough that the bloom pass doesn't blow it out
    const snow = new THREE.Color("#b9c2d2");
    const tmp = new THREE.Color();
    const MAX_H = PEAK_HEIGHT * 1.6;

    for (let r = 0; r <= RADIAL_SEGMENTS; r++) {
      const t = r / RADIAL_SEGMENTS;
      const radius = THREE.MathUtils.lerp(INNER_RADIUS, OUTER_RADIUS, t);
      for (let a = 0; a <= ANGULAR_SEGMENTS; a++) {
        const angle = (a / ANGULAR_SEGMENTS) * Math.PI * 2;
        const height = ridgeHeight(angle, t);
        positions.push(Math.sin(angle) * radius, height, Math.cos(angle) * radius);

        const hn = height / MAX_H;
        // green foothills -> rock -> snow only on the top ~20% of the range
        if (hn < 0.4) tmp.copy(grass).lerp(rock, THREE.MathUtils.smoothstep(hn, 0.18, 0.42));
        else tmp.copy(rock).lerp(snow, THREE.MathUtils.smoothstep(hn, 0.6, 0.82));
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
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} envMapIntensity={0.1} fog />
    </mesh>
  );
}
