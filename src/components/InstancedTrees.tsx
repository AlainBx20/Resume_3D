import { useMemo, useRef, useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildings } from "../content";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";
import { GROUND_RADIUS } from "./Ground";

const TREE_LARGE = "/models/suburban/tree-large.glb";
const TREE_SMALL = "/models/suburban/tree-small.glb";

// shared across both tree materials, updated once per frame
const uTime = { value: 0 };
const uWind = { value: 0.25 };

interface Placement {
  position: [number, number, number];
  scale: number;
  rotationY: number;
  model: string;
}

function angularDiff(a: number, b: number) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

// Same clumped ring layout the town always had, just generated once and fed
// into two InstancedMeshes instead of hundreds of cloned scene graphs.
function generatePlacements(): Placement[] {
  const rng = mulberry32(42);
  const list: Placement[] = [];
  const models = [TREE_LARGE, TREE_SMALL];

  const buildingAngles = buildings.map((b) => Math.atan2(b.position[0], b.position[2]));
  const pathClearance = THREE.MathUtils.degToRad(11);

  const slotCount = 28;
  const angleStep = (Math.PI * 2) / slotCount;
  const radiusBands = [20, 27, 34, 41];

  for (let i = 0; i < slotCount; i++) {
    const baseAngle = i * angleStep + (rng() - 0.5) * angleStep * 0.5;
    const blocksPath = buildingAngles.some((ba) => angularDiff(baseAngle, ba) < pathClearance);
    if (blocksPath) continue;

    for (const baseRadius of radiusBands) {
      if (rng() < 0.3) continue; // leave organic gaps instead of a solid ring
      const radius = Math.min(baseRadius + (rng() - 0.5) * 5, GROUND_RADIUS - 3);
      const centerX = Math.sin(baseAngle) * radius;
      const centerZ = Math.cos(baseAngle) * radius;
      const clusterSize = 3 + Math.floor(rng() * 4); // 3-6 trees per clump
      for (let j = 0; j < clusterSize; j++) {
        const jitterAngle = rng() * Math.PI * 2;
        const jitterRadius = rng() * 3;
        list.push({
          position: [
            centerX + Math.sin(jitterAngle) * jitterRadius,
            0,
            centerZ + Math.cos(jitterAngle) * jitterRadius,
          ],
          scale: 4 + rng() * 3,
          rotationY: rng() * Math.PI * 2,
          model: models[Math.floor(rng() * models.length)],
        });
      }
    }
  }
  return list;
}

function InstancedTreeModel({ url, placements }: { url: string; placements: Placement[] }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, material } = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    let source: THREE.Material | null = null;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !geometry) {
        geometry = mesh.geometry;
        source = mesh.material as THREE.Material;
      }
    });
    const material = (source as unknown as THREE.MeshStandardMaterial).clone();
    // wind sway in the vertex shader: bend increases with height so trunks
    // stay planted while canopies lean with the current wind strength
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.uniforms.uWind = uWind;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          attribute float aPhase;
          uniform float uTime;
          uniform float uWind;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float swayHeight = smoothstep(0.15, 0.75, transformed.y);
          float sway = sin(uTime * (0.8 + fract(aPhase) * 0.5) + aPhase) * (0.025 + uWind * 0.075);
          transformed.x += sway * swayHeight;
          transformed.z += sway * 0.6 * swayHeight;`
        );
    };
    return { geometry: geometry as unknown as THREE.BufferGeometry, material };
  }, [scene]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const phases = new Float32Array(placements.length);
    placements.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.rotation.set(0, p.rotationY, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      phases[i] = (p.position[0] * 3.7 + p.position[2] * 1.3) % (Math.PI * 2);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
  }, [placements]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, placements.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

export default function InstancedTrees() {
  const placements = useMemo(() => generatePlacements(), []);
  const byModel = useMemo(
    () => ({
      large: placements.filter((p) => p.model === TREE_LARGE),
      small: placements.filter((p) => p.model === TREE_SMALL),
    }),
    [placements]
  );

  useFrame((state) => {
    uTime.value = state.clock.elapsedTime;
    uWind.value = atm.wind;
  });

  return (
    <>
      <InstancedTreeModel url={TREE_LARGE} placements={byModel.large} />
      <InstancedTreeModel url={TREE_SMALL} placements={byModel.small} />
    </>
  );
}

useGLTF.preload(TREE_LARGE);
useGLTF.preload(TREE_SMALL);
