import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { DecorItemDef } from "../content";
import { registerCollider } from "../collision";

// Non-interactive interior prop. Kenney furniture models keep their origin at
// a corner, so the clone is re-centered to make def.position the piece's
// middle — placement stays intuitive in content.ts.
export default function DecorItem({ def }: { def: DecorItemDef }) {
  const { scene } = useGLTF(def.model);
  const groupRef = useRef<THREE.Group>(null);

  const clone = useMemo(() => {
    const c = scene.clone();
    const box = new THREE.Box3().setFromObject(c);
    c.position.set(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  useEffect(() => {
    if (def.noCollide) return;
    const group = groupRef.current;
    if (!group) return;
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    box.expandByScalar(0.1);
    return registerCollider(box);
  }, [def.noCollide]);

  return (
    <group
      ref={groupRef}
      position={def.position}
      rotation-y={def.rotationY ?? 0}
      scale={def.scale ?? 1}
    >
      <primitive object={clone} />
    </group>
  );
}
