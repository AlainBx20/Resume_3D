import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { subscribeFootsteps, type FootstepEvent } from "../footsteps";

const RIPPLE_COUNT = 24;
const FOOTPRINT_COUNT = 36;

type Trace = FootstepEvent & { born: number; side: number };

export default function FootstepEffects() {
  const rippleRef = useRef<THREE.InstancedMesh>(null);
  const footprintRef = useRef<THREE.InstancedMesh>(null);
  const ripples = useRef<(Trace | null)[]>(Array(RIPPLE_COUNT).fill(null));
  const footprints = useRef<(Trace | null)[]>(Array(FOOTPRINT_COUNT).fill(null));
  const rippleCursor = useRef(0);
  const footprintCursor = useRef(0);
  const footSide = useRef(-1);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const rippleGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(0.12, 0.16, 24);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  const footprintGeometry = useMemo(() => {
    const geometry = new THREE.CircleGeometry(1, 16);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);

  useEffect(
    () =>
      subscribeFootsteps((event) => {
        const trace = { ...event, born: performance.now(), side: footSide.current };
        if (event.surface === "wet") {
          ripples.current[rippleCursor.current] = trace;
          rippleCursor.current = (rippleCursor.current + 1) % RIPPLE_COUNT;
        } else {
          footprints.current[footprintCursor.current] = trace;
          footprintCursor.current = (footprintCursor.current + 1) % FOOTPRINT_COUNT;
          footSide.current *= -1;
        }
      }),
    [],
  );

  useFrame(() => {
    const now = performance.now();
    const rippleMesh = rippleRef.current;
    if (rippleMesh) {
      ripples.current.forEach((trace, index) => {
        if (!trace) {
          dummy.scale.setScalar(0);
        } else {
          const age = (now - trace.born) / 850;
          if (age >= 1) {
            ripples.current[index] = null;
            dummy.scale.setScalar(0);
          } else {
            dummy.position.set(trace.x, 0.065, trace.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.setScalar(0.35 + age * 1.05);
          }
        }
        dummy.updateMatrix();
        rippleMesh.setMatrixAt(index, dummy.matrix);
      });
      rippleMesh.instanceMatrix.needsUpdate = true;
    }

    const footprintMesh = footprintRef.current;
    if (footprintMesh) {
      footprints.current.forEach((trace, index) => {
        if (!trace) {
          dummy.scale.setScalar(0);
        } else {
          const age = (now - trace.born) / 18000;
          if (age >= 1) {
            footprints.current[index] = null;
            dummy.scale.setScalar(0);
          } else {
            const rightX = Math.cos(trace.heading);
            const rightZ = Math.sin(trace.heading);
            const fadeScale = age > 0.82 ? 1 - (age - 0.82) / 0.18 : 1;
            dummy.position.set(
              trace.x + rightX * trace.side * 0.12,
              0.07,
              trace.z + rightZ * trace.side * 0.12,
            );
            dummy.rotation.set(0, trace.heading, 0);
            dummy.scale.set(0.085 * fadeScale, 1, 0.21 * fadeScale);
          }
        }
        dummy.updateMatrix();
        footprintMesh.setMatrixAt(index, dummy.matrix);
      });
      footprintMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={rippleRef}
        args={[rippleGeometry, undefined, RIPPLE_COUNT]}
        frustumCulled={false}
        renderOrder={3}
      >
        <meshBasicMaterial
          color="#76aabe"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={footprintRef}
        args={[footprintGeometry, undefined, FOOTPRINT_COUNT]}
        frustumCulled={false}
        renderOrder={3}
      >
        <meshBasicMaterial
          color="#697d8d"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}
