import { useMemo, useRef, useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { attribute, uniform, time, positionLocal, positionGeometry, vec3, sin, fract, smoothstep } from "three/tsl";
import { buildings } from "../content";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";
import { GROUND_RADIUS } from "./Ground";
import { isOnTownRoad } from "../roads";

const TREE_LARGE = "/models/suburban/tree-large.glb";
const TREE_SMALL = "/models/suburban/tree-small.glb";

// shared wind uniform across both tree materials, updated once per frame;
// the time node updates itself
const uWind = uniform(0.25);

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
        const x = centerX + Math.sin(jitterAngle) * jitterRadius;
        const z = centerZ + Math.cos(jitterAngle) * jitterRadius;
        if (isOnTownRoad(x, z, 1.3)) continue;
        list.push({
          position: [x, 0, z],
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
    let source: THREE.MeshStandardMaterial | null = null;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !geometry) {
        geometry = mesh.geometry;
        source = mesh.material as THREE.MeshStandardMaterial;
      }
    });

    // Rebuild the GLTF material as a node material so WebGPURenderer can drive
    // the wind sway through positionNode (onBeforeCompile never runs on WebGPU).
    const src = source as unknown as THREE.MeshStandardMaterial;
    const material = new MeshStandardNodeMaterial();
    material.color.copy(src.color);
    material.map = src.map;
    material.roughness = src.roughness;
    material.metalness = src.metalness;
    material.vertexColors = src.vertexColors;
    material.flatShading = src.flatShading;
    material.transparent = src.transparent;
    material.opacity = src.opacity;
    material.alphaTest = src.alphaTest;
    material.side = src.side;
    material.normalMap = src.normalMap;
    material.emissive.copy(src.emissive);
    material.emissiveMap = src.emissiveMap;
    material.emissiveIntensity = src.emissiveIntensity;
    material.aoMap = src.aoMap;

    // Wind sway: bend grows with the tree's object-space height so trunks stay
    // planted while canopies lean with the current wind strength. The height
    // mask reads positionGeometry (object space); the offset is applied in
    // positionLocal (post-instance) and scaled to cover the instance scale.
    const phase = attribute("aPhase", "float");
    const swayHeight = smoothstep(0.15, 0.75, positionGeometry.y);
    const sway = sin(time.mul(fract(phase).mul(0.5).add(0.8)).add(phase)).mul(uWind.mul(0.375).add(0.125));
    material.positionNode = positionLocal.add(
      vec3(sway.mul(swayHeight), 0, sway.mul(0.6).mul(swayHeight))
    );

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

  useFrame(() => {
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
