import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureItemDef } from "../content";
import { registerCollider } from "../collision";

// Kenney furniture is ~1 unit tall; scaled up so pieces read at human size
// against the 10x8 room instead of dollhouse scale.
export const EXHIBIT_SCALE = 1.7;

export default function FurnitureItem({ def }: { def: FurnitureItemDef }) {
  const { scene } = useGLTF(def.model);
  const groupRef = useRef<THREE.Group>(null);

  const clone = useMemo(() => {
    const c = scene.clone();
    // Kenney models keep their origin at a corner — recenter the footprint so
    // def.position is the piece's middle (and stacking on surfaces works)
    const box = new THREE.Box3().setFromObject(c);
    c.position.set(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
    return c;
  }, [scene]);

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
    // measured from the real model bounds so the collider hugs each prop's
    // actual footprint instead of a guessed size
    const box = new THREE.Box3().setFromObject(group);
    box.expandByScalar(0.15);
    return registerCollider(box);
  }, []);

  return (
    <group ref={groupRef} position={def.position} rotation-y={def.rotationY ?? 0} scale={def.scale ?? EXHIBIT_SCALE}>
      <primitive object={clone} />
    </group>
  );
}
