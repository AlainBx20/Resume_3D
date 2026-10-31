import { useRef, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingDef } from "../content";
import { registerCollider } from "../collision";
import { atm } from "../atmosphere";
import BuildingSign from "./BuildingSign";

export default function Building({ def }: { def: BuildingDef }) {
  const { scene } = useGLTF(def.model);
  const clone = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const windowLightRef = useRef<THREE.PointLight>(null);
  // face the plaza at the origin, regardless of where the building is placed;
  // +PI brings the KayKit storefront (local +Z) around toward the plaza
  const facingY = Math.atan2(def.position[0], def.position[2]) + Math.PI;
  // measured from the building's real world bounding box once it's mounted,
  // so the beacon/label sit just above the actual roof instead of a guessed height
  const [roofTop, setRoofTop] = useState(4 * def.scale);

  useEffect(() => {
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [clone]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    setRoofTop(box.max.y);
    box.expandByScalar(0.6);
    return registerCollider(box);
  }, []);

  const beaconBaseY = roofTop + 1.4;

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.position.y =
        beaconBaseY + Math.sin(state.clock.elapsedTime * 1.4 + def.position[0]) * 0.3;
    }
    // warm window light comes on as the sun goes down
    if (windowLightRef.current) {
      windowLightRef.current.intensity = 1.6 * THREE.MathUtils.clamp(1 - atm.day * 1.5, 0.1, 1);
    }
  });

  return (
    <>
      <group ref={groupRef} position={def.position} rotation-y={facingY} scale={def.scale}>
        {/* KayKit buildings have their lowest geometry at y≈0.1 (local); seat them on the ground */}
        <primitive object={clone} position-y={-0.1} />
        <pointLight ref={windowLightRef} position={[0, 2.2, 1.6]} color="#ffcf87" intensity={1.6} distance={14} decay={2} />
      </group>

      <group position={def.position}>
        <mesh ref={beaconRef} position={[0, beaconBaseY, 0]}>
          <icosahedronGeometry args={[0.35, 1]} />
          <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>

      <BuildingSign def={def} />
    </>
  );
}
