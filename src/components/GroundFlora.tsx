import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildings } from "../content";
import { mulberry32 } from "../rand";
import { GROUND_RADIUS, PLAZA_RADIUS } from "./Ground";
import { insidePondClearance } from "../landmarks";
import { isOnTownRoad } from "../roads";
import { insideBenchNook } from "../streetLayout";

const GRASS_COUNT = 700;
const FLOWER_COUNT = 170;

const GRASS_SHADES = ["#5c8f47", "#6b9c52", "#7fae63", "#4d7a3a"];
const FLOWER_SHADES = ["#e58fd3", "#b98fe5", "#f6f2ff", "#ffd166", "#ff8fa3"];

function angularDiff(a: number, b: number) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

interface Sprout {
  x: number;
  z: number;
  scale: number;
  colorIndex: number;
}

// Rejection-sample points on the lawn, keeping the plaza and the radial
// pathways clear.
function scatter(rng: () => number, count: number, shadeCount: number): Sprout[] {
  const buildingAngles = buildings.map((b) => Math.atan2(b.position[0], b.position[2]));
  const pathClearance = THREE.MathUtils.degToRad(10);
  const list: Sprout[] = [];
  while (list.length < count) {
    const angle = rng() * Math.PI * 2;
    const radius = PLAZA_RADIUS + 1 + Math.sqrt(rng()) * (GROUND_RADIUS - PLAZA_RADIUS - 4);
    const onPath =
      radius < 13 && buildingAngles.some((ba) => angularDiff(angle, ba) < pathClearance);
    if (onPath) continue;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    if (insidePondClearance(x, z, 0.7)) continue;
    if (isOnTownRoad(x, z, 0.45)) continue;
    if (insideBenchNook(x, z, 0.35)) continue;
    list.push({
      x,
      z,
      scale: 0.7 + rng() * 0.8,
      colorIndex: Math.floor(rng() * shadeCount),
    });
  }
  return list;
}

function useInstances(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  sprouts: Sprout[],
  shades: string[],
  y: (s: Sprout) => number
) {
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    sprouts.forEach((s, i) => {
      dummy.position.set(s.x, y(s), s.z);
      dummy.scale.setScalar(s.scale);
      dummy.rotation.y = s.x * 7.3; // arbitrary but stable variation
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(shades[s.colorIndex]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [meshRef, sprouts, shades, y]);
}

// Scattered grass tufts and wildflowers, matching the reference's flowering
// lawn — three instanced draw calls in total.
export default function GroundFlora() {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);

  const grass = useMemo(() => scatter(mulberry32(511), GRASS_COUNT, GRASS_SHADES.length), []);
  const flowers = useMemo(() => scatter(mulberry32(733), FLOWER_COUNT, FLOWER_SHADES.length), []);

  useInstances(grassRef, grass, GRASS_SHADES, (s) => 0.15 * s.scale);
  useInstances(stemRef, flowers, ["#4d7a3a"], (s) => 0.09 * s.scale);
  useInstances(blossomRef, flowers, FLOWER_SHADES, (s) => 0.2 * s.scale);

  return (
    <>
      <instancedMesh ref={grassRef} args={[undefined, undefined, GRASS_COUNT]} frustumCulled={false}>
        <coneGeometry args={[0.075, 0.32, 5]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={stemRef} args={[undefined, undefined, FLOWER_COUNT]} frustumCulled={false}>
        <coneGeometry args={[0.016, 0.2, 4]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={blossomRef} args={[undefined, undefined, FLOWER_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </>
  );
}
