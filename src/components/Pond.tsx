import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../rand";
import { POND_CENTER } from "../landmarks";
import { duckWorld, mother } from "../ducks";
import { useTownStore } from "../store";

const POND_POSITION: [number, number, number] = [POND_CENTER.x, 0.035, POND_CENTER.z];

function DuckBody({ color, rippleRef, angry }: { color: string; rippleRef?: React.Ref<THREE.Mesh>; angry?: boolean }) {
  return (
    <>
      <mesh scale={[0.44, 0.27, 0.65]} castShadow>
        <sphereGeometry args={[0.55, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.28, 0.34]} castShadow>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.12, 0.34, 0.49]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshBasicMaterial color="#15191e" />
        </mesh>
      ))}
      {angry &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.1, 0.4, 0.5]} rotation-z={side * -0.5} scale={[0.1, 0.02, 0.03]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#2b1608" />
          </mesh>
        ))}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.23, 0.03, 0]}
          rotation-z={side * 0.3}
          scale={[0.12, 0.05, 0.28]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.26, 0.55]} scale={[0.18, 0.07, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#eaa54f" roughness={0.8} />
      </mesh>
      {rippleRef && (
        <mesh ref={rippleRef} rotation-x={-Math.PI / 2} position={[0, -0.19, 0]}>
          <ringGeometry args={[0.34, 0.39, 24]} />
          <meshBasicMaterial color="#bcecff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}

function MotherDuck() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const active = useTownStore.getState().duckScene !== null;
    g.visible = active;
    if (!active) return;
    const t = state.clock.elapsedTime;
    g.position.set(mother.x - POND_CENTER.x, 0.55 + Math.abs(Math.sin(t * 9)) * 0.12, mother.z - POND_CENTER.z);
    g.lookAt(state.camera.position.x, 0.55, state.camera.position.z);
    g.rotation.z = Math.sin(t * 18) * 0.05;
  });
  return (
    <group ref={ref} visible={false} scale={2}>
      <DuckBody color="#fbf7ea" angry />
    </group>
  );
}

function Duck({ color, radius, speed, phase, index }: { color: string; radius: number; speed: number; phase: number; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const duck = ref.current;
    const ripple = rippleRef.current;
    if (!duck || !ripple) return;
    const t = state.clock.elapsedTime * speed + phase;
    const lx = Math.cos(t) * radius;
    const lz = Math.sin(t) * radius * 0.58;
    const startled = index === 0 && useTownStore.getState().duckScene !== null;
    duck.position.set(lx, 0.22 + Math.sin(t * 3.2) * 0.025 + (startled ? 0.9 + Math.sin(state.clock.elapsedTime * 14) * 0.08 : 0), lz);
    duckWorld[index].x = POND_CENTER.x + lx;
    duckWorld[index].z = POND_CENTER.z + lz;
    duck.rotation.y = -t;
    const pulse = (state.clock.elapsedTime * 0.45 + phase) % 1;
    ripple.scale.setScalar(0.65 + pulse * 1.1);
    (ripple.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.25;
  });

  return (
    <group ref={ref}>
      <DuckBody color={color} rippleRef={rippleRef} />
    </group>
  );
}

export default function Pond() {
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const rocks = useMemo(() => {
    const rng = mulberry32(243);
    return Array.from({ length: 26 }, (_, index) => {
      const angle = (index / 26) * Math.PI * 2 + (rng() - 0.5) * 0.08;
      return {
        x: Math.cos(angle) * (4.15 + rng() * 0.35),
        z: Math.sin(angle) * (3.1 + rng() * 0.28),
        scale: 0.38 + rng() * 0.3,
        rotation: rng() * Math.PI,
      };
    });
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = rockRef.current;
    if (!mesh) return;
    rocks.forEach((rock, index) => {
      dummy.position.set(rock.x, 0.08, rock.z);
      dummy.rotation.set(0.1, rock.rotation, 0.08);
      dummy.scale.set(rock.scale * 1.6, rock.scale * 0.65, rock.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, rocks]);

  useFrame((state) => {
    if (!waterRef.current) return;
    const material = waterRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.84 + Math.sin(state.clock.elapsedTime * 0.8) * 0.035;
  });

  return (
    <group position={POND_POSITION}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.025} scale={[1.35, 0.9, 1]} receiveShadow>
        <circleGeometry args={[3.55, 48]} />
        <meshStandardMaterial color="#607157" roughness={1} />
      </mesh>
      <mesh ref={waterRef} rotation-x={-Math.PI / 2} scale={[1.35, 0.9, 1]}>
        <circleGeometry args={[3.35, 48]} />
        <meshBasicMaterial
          color="#2f8ca2"
          transparent
          opacity={0.86}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#7b7f78" roughness={0.96} flatShading />
      </instancedMesh>
      <Duck color="#f2efe0" radius={1.55} speed={0.32} phase={0} index={0} />
      <Duck color="#d9aa52" radius={2.25} speed={0.24} phase={2.3} index={1} />
      <Duck color="#4f6549" radius={1.1} speed={0.4} phase={4.7} index={2} />
      <MotherDuck />
      <group position={[-3.1, 0.08, -1.7]}>
        {[0, 0.45, 0.88].map((offset, index) => (
          <mesh key={index} position={[offset, index * 0.02, index % 2 ? 0.2 : 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.42 - index * 0.06, 18]} />
            <meshStandardMaterial color={index === 2 ? "#8cbf65" : "#6fa35d"} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
