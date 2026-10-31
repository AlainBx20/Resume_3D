import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { registerCollider } from "../collision";

const SCALE = 0.95;
const COLLIDER_RADIUS = 1.0;

const STREAMS = 8;
const DROPLETS_PER_STREAM = 4;
const FALL_CYCLE = 1.4; // seconds for one droplet's fall

type Dims = { topY: number; dropHeight: number; radius: number };

function WaterCascade({ topY, dropHeight, radius }: Dims) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const drops = useMemo(() => {
    const list: { x: number; z: number; phase: number }[] = [];
    for (let s = 0; s < STREAMS; s++) {
      const angle = (s / STREAMS) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      for (let d = 0; d < DROPLETS_PER_STREAM; d++) {
        list.push({ x, z, phase: (d / DROPLETS_PER_STREAM) * FALL_CYCLE });
      }
    }
    return list;
  }, [radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    drops.forEach((drop, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const local = (t + drop.phase) % FALL_CYCLE;
      const progress = local / FALL_CYCLE;
      mesh.position.set(drop.x, topY - progress * dropHeight, drop.z);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.7 * Math.sin(progress * Math.PI);
    });
  });

  return (
    <group>
      {drops.map((drop, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[drop.x, topY, drop.z]}>
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshStandardMaterial
            color="#3f7fae"
            transparent
            opacity={0}
            roughness={0.2}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Fountain() {
  const { scene } = useGLTF("/models/decor/fountain.glb");

  // measure the model footprint (normalized to our render scale) so the
  // falling water lines up with the top bowl instead of a guessed height
  const [dims] = useState<Dims>(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const modelScale = scene.scale.x || 1; // cached scene may already be scaled
    const totalHeight = ((box.max.y - box.min.y) / modelScale) * SCALE;
    const footprintRadius =
      (Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / modelScale / 2) * SCALE;
    return {
      topY: totalHeight * 0.74,
      dropHeight: totalHeight * 0.11,
      radius: footprintRadius * 0.27,
    };
  });

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // this model was auto-converted from FBX and the water/leaves meshes
      // don't sample the right part of the shared texture atlas, rendering
      // flat grey — give them their own simple colored materials instead
      if (mesh.name === "fountain_water") {
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#3f7fae",
          transparent: true,
          opacity: 0.85,
          roughness: 0.25,
          metalness: 0.1,
        });
      } else if (mesh.name === "fountain_leaves") {
        mesh.material = new THREE.MeshStandardMaterial({ color: "#4caf50", roughness: 0.8 });
      }
    });
  }, [scene]);

  useEffect(() => {
    const box = new THREE.Box3(
      new THREE.Vector3(-COLLIDER_RADIUS, 0, -COLLIDER_RADIUS),
      new THREE.Vector3(COLLIDER_RADIUS, 2, COLLIDER_RADIUS)
    );
    return registerCollider(box);
  }, []);

  return (
    <group>
      <primitive object={scene} scale={SCALE} />
      <pointLight position={[0, 1.1, 0]} color="#bfe6ff" intensity={0.5} distance={5} />
      <WaterCascade {...dims} />
    </group>
  );
}

useGLTF.preload("/models/decor/fountain.glb");
