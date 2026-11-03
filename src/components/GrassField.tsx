import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { attribute, uniform, time, positionLocal, positionGeometry, vec3, sin, mix, color } from "three/tsl";
import { buildings } from "../content";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";
import { GROUND_RADIUS, PLAZA_RADIUS } from "./Ground";
import { insidePondClearance } from "../landmarks";
import { isOnTownRoad } from "../roads";
import { insideBenchNook } from "../streetLayout";

const BLADE_COUNT = 7000;
const BLADE_HEIGHT = 0.52;

// module-scope wind uniform (one grass field), driven once per frame
const uGrassWind = uniform(0.25);

// A single tapered blade: base at y=0, narrowing to the tip at y=BLADE_HEIGHT.
function makeBladeGeometry(): THREE.BufferGeometry {
  const segs = 4;
  const halfW = 0.032;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = t * BLADE_HEIGHT;
    const w = halfW * (1 - t * 0.85);
    positions.push(-w, y, 0, w, y, 0);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function angularDiff(a: number, b: number) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

// Lush instanced grass with wind sway in the position node — one draw call,
// animated entirely on the GPU like the trees, rain and snow.
export default function GrassField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => makeBladeGeometry(), []);

  const material = useMemo(() => {
    const phase = attribute("aPhase", "float");
    const tint = attribute("aTint", "float");

    // bend grows with the blade's own height so the base stays planted
    const heightFrac = positionGeometry.y.div(BLADE_HEIGHT).clamp(0, 1);
    const lean = heightFrac.mul(heightFrac);
    const sway = sin(time.mul(1.5).add(phase)).mul(uGrassWind.mul(0.22).add(0.05));

    // unlit basic material: thousands of lit blades were the perf hit. The
    // vertical gradient (dark root -> bright tip) fakes enough light/depth.
    const material = new MeshBasicNodeMaterial();
    material.positionNode = positionLocal.add(vec3(sway.mul(lean), 0, sway.mul(0.4).mul(lean)));
    material.colorNode = mix(color("#35602c"), color("#8cba5e"), heightFrac).mul(tint);
    material.side = THREE.DoubleSide;
    return material;
  }, []);

  const placements = useMemo(() => {
    const rng = mulberry32(617);
    const buildingAngles = buildings.map((b) => Math.atan2(b.position[0], b.position[2]));
    const pathClearance = THREE.MathUtils.degToRad(10);
    const list: { x: number; z: number; scale: number; rotY: number; phase: number; tint: number }[] = [];
    while (list.length < BLADE_COUNT) {
      const angle = rng() * Math.PI * 2;
      const radius = PLAZA_RADIUS + 0.6 + Math.sqrt(rng()) * (GROUND_RADIUS - PLAZA_RADIUS - 3);
      // keep the radial pathways clear near the plaza
      if (radius < 13 && buildingAngles.some((ba) => angularDiff(angle, ba) < pathClearance)) continue;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      if (insidePondClearance(x, z, 0.7)) continue;
      if (isOnTownRoad(x, z, 0.35)) continue;
      if (insideBenchNook(x, z, 0.35)) continue;
      list.push({
        x,
        z,
        scale: 0.7 + rng() * 0.8,
        rotY: rng() * Math.PI,
        phase: rng() * Math.PI * 2,
        tint: 0.82 + rng() * 0.3,
      });
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const phases = new Float32Array(placements.length);
    const tints = new Float32Array(placements.length);
    placements.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.rotY, 0);
      dummy.scale.set(p.scale, p.scale * (0.85 + (p.tint - 0.82)), p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      phases[i] = p.phase;
      tints[i] = p.tint;
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
    mesh.geometry.setAttribute("aTint", new THREE.InstancedBufferAttribute(tints, 1));
  }, [placements]);

  useFrame(() => {
    uGrassWind.value = atm.wind;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, BLADE_COUNT]}
      frustumCulled={false}
    />
  );
}
