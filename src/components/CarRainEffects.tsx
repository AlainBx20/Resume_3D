import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { PARKED_SPOTS as CAR_SPOTS } from "../streetLayout";
import { mulberry32 } from "../rand";

const IMPACTS_PER_CAR = 5;
const SURFACE_LIFT = 0.315 + 0.015;
const PUDDLES_PER_CAR = 3;

// Surface heights measured by raycasting each model (at scale 4.4, relative to the car root).
// [x, z, y]: roof x2, rear roof/trunk, hood, and a second point for the pools.
type Surface = { splash: [number, number, number][]; pools: [number, number, number, number][] };
const SURFACES: Record<string, Surface> = {
  "car_sedan.glb": {
    splash: [[-0.42, -0.1, 1.35], [0.42, 0.0, 1.35], [0, -0.65, 1.35], [0.38, 1.15, 0.63], [0, -1.45, 0.56]],
    pools: [[0.3, -0.35, 1.35, 0.5], [0, 1.1, 0.63, 0.4], [0, -1.45, 0.56, 0.38]],
  },
  "car_hatchback.glb": {
    splash: [[-0.42, -0.1, 1.35], [0.42, 0.0, 1.35], [0, -0.7, 1.35], [0.38, 1.15, 0.56], [0, -1.62, 0.56]],
    pools: [[0.3, -0.35, 1.35, 0.5], [0, 1.15, 0.56, 0.4], [0, -1.62, 0.56, 0.3]],
  },
  "car_stationwagon.glb": {
    splash: [[-0.42, -0.1, 1.35], [0.42, 0.0, 1.35], [0, -1.0, 1.35], [0.4, 1.15, 0.57], [-0.4, 1.2, 0.57]],
    pools: [[0.3, -0.5, 1.35, 0.55], [-0.4, 1.15, 0.57, 0.3], [0.4, 1.15, 0.57, 0.3]],
  },
  "car_taxi.glb": {
    splash: [[-0.42, -0.1, 1.35], [0.42, -0.5, 1.35], [0.42, 0.0, 1.35], [0.38, 1.15, 0.63], [0, -1.45, 0.56]],
    pools: [[-0.4, -0.4, 1.35, 0.4], [0, 1.1, 0.63, 0.4], [0, -1.45, 0.56, 0.38]],
  },
};
const surfaceOf = (model: string) => SURFACES[model] ?? SURFACES["car_sedan.glb"];
const IMPACT_COUNT = CAR_SPOTS.length * IMPACTS_PER_CAR;
const POOL_COUNT = CAR_SPOTS.length * PUDDLES_PER_CAR;
const CYCLE = 0.34;

export default function CarRainEffects() {
  const dropletsRef = useRef<THREE.InstancedMesh>(null);
  const crownsRef = useRef<THREE.InstancedMesh>(null);
  const poolsRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const impacts = useMemo(() => {
    const rng = mulberry32(1207);
    return CAR_SPOTS.flatMap((car) => {
      const cosine = Math.cos(car.rotationY);
      const sine = Math.sin(car.rotationY);
      return surfaceOf(car.model).splash.map(([localX, localZ, localY]) => ({
        position: new THREE.Vector3(
          car.position[0] + localX * cosine + localZ * sine,
          localY + SURFACE_LIFT,
          car.position[2] - localX * sine + localZ * cosine,
        ),
        phase: rng() * CYCLE,
        size: 0.72 + rng() * 0.5,
      }));
    });
  }, []);

  // wet sheen on roof, hood and boot; laid flat once and faded with wetness
  useLayoutEffect(() => {
    const pools = poolsRef.current;
    if (!pools) return;
    const d = new THREE.Object3D();
    let i = 0;
    for (const car of CAR_SPOTS) {
      const cosine = Math.cos(car.rotationY);
      const sine = Math.sin(car.rotationY);
      for (const [lx, lz, ly, r] of surfaceOf(car.model).pools) {
        d.position.set(car.position[0] + lx * cosine + lz * sine, ly + SURFACE_LIFT, car.position[2] - lx * sine + lz * cosine);
        d.rotation.set(-Math.PI / 2, 0, car.rotationY);
        d.scale.set(r, r * 1.35, 1);
        d.updateMatrix();
        pools.setMatrixAt(i++, d.matrix);
      }
    }
    pools.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const pools = poolsRef.current;
    if (pools) {
      pools.visible = atm.wetness > 0.05;
      (pools.material as THREE.MeshStandardMaterial).opacity = Math.min(1, atm.wetness) * 0.75;
    }
    const droplets = dropletsRef.current;
    const crowns = crownsRef.current;
    if (!droplets || !crowns) return;
    const visible = atm.rain > 0.08;
    droplets.visible = crowns.visible = visible;
    if (!visible) return;

    const dummy = dummyRef.current;
    impacts.forEach((impact, index) => {
      const progress = ((state.clock.elapsedTime + impact.phase) % CYCLE) / CYCLE;
      const pulse = Math.sin(progress * Math.PI);
      const sprayAngle = index * 2.399;
      const spread = pulse * 0.12 * impact.size;

      dummy.position.set(
        impact.position.x + Math.cos(sprayAngle) * spread,
        impact.position.y + pulse * 0.16 * impact.size,
        impact.position.z + Math.sin(sprayAngle) * spread,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(Math.max(0.05, 1 - progress) * impact.size);
      dummy.updateMatrix();
      droplets.setMatrixAt(index, dummy.matrix);

      dummy.position.set(impact.position.x, impact.position.y + pulse * 0.075, impact.position.z);
      dummy.rotation.set(0, index * 1.7, 0);
      dummy.scale.set((1 - progress) * 0.42, pulse * 0.3, (1 - progress) * 0.42);
      dummy.updateMatrix();
      crowns.setMatrixAt(index, dummy.matrix);
    });
    droplets.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    (droplets.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.58;
    (crowns.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.38;
  });

  return (
    <>
      <instancedMesh ref={poolsRef} args={[undefined, undefined, POOL_COUNT]} visible={false} frustumCulled={false}>
        <circleGeometry args={[1, 20]} />
        <meshStandardMaterial color="#5f7fa3" metalness={1} roughness={0.05} envMapIntensity={1.8} transparent opacity={0} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </instancedMesh>
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, IMPACT_COUNT]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.04, 5, 4]} />
        <meshBasicMaterial color="#d6edf9" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={crownsRef} args={[undefined, undefined, IMPACT_COUNT]} visible={false} frustumCulled={false}>
        <coneGeometry args={[0.05, 0.15, 5, 1, true]} />
        <meshBasicMaterial color="#e7f7ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>
    </>
  );
}
