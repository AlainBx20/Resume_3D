import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm, type WeatherKind } from "../atmosphere";
import { useWeatherStore } from "../weatherStore";
import { mulberry32 } from "../rand";

const CLOUD_STYLE: Record<WeatherKind, { color: string; opacity: number; scale: number }> = {
  clear: { color: "#fff5e6", opacity: 0.72, scale: 1 },
  rain: { color: "#7d8695", opacity: 0.82, scale: 1.18 },
  storm: { color: "#4d5361", opacity: 0.9, scale: 1.35 },
  snow: { color: "#dfe5ee", opacity: 0.84, scale: 1.2 },
};

const CLOUDS = [
  { z: -80, y: 50, seed: 1, scale: 10, range: 100 },
  { z: -55, y: 54, seed: 4, scale: 8, range: 85 },
  { z: -95, y: 60, seed: 9, scale: 12, range: 115 },
  { z: 35, y: 52, seed: 14, scale: 7, range: 75 },
  { z: 70, y: 57, seed: 21, scale: 11, range: 125 },
  { z: -20, y: 62, seed: 27, scale: 9, range: 95 },
  { z: 15, y: 48, seed: 33, scale: 6, range: 70 },
  { z: 95, y: 63, seed: 41, scale: 13, range: 130 },
  { z: -40, y: 46, seed: 48, scale: 7, range: 80 },
  { z: 50, y: 66, seed: 56, scale: 10, range: 110 },
];

const PUFFS_PER_CLOUD = 13;

function DriftingClouds() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const kind = useWeatherStore((state) => state.kind);
  const style = CLOUD_STYLE[kind];
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const puffs = useMemo(() => {
    return CLOUDS.flatMap((cloud, cloudIndex) => {
      const random = mulberry32(cloud.seed * 991);
      return Array.from({ length: PUFFS_PER_CLOUD }, (_, puffIndex) => {
        // cumulus shape: wide, flat-ish bottom, bumpier domed top; bigger puffs
        // toward the center of the cluster, smaller at the edges
        const spread = (random() - 0.5) * 2;
        const edge = Math.abs(spread);
        return {
          cloudIndex,
          puffIndex,
          x: spread * cloud.scale * 1.5,
          y: (0.1 + random() * 0.45) * cloud.scale * (1 - edge * 0.5),
          z: (random() - 0.5) * cloud.scale * 0.7,
          scale: cloud.scale * (0.32 + (1 - edge) * 0.3 + random() * 0.12),
        };
      });
    });
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = state.clock.elapsedTime;
    for (let index = 0; index < puffs.length; index += 1) {
      const puff = puffs[index];
      const cloud = CLOUDS[puff.cloudIndex];
      const speed = (1.2 + (puff.cloudIndex % 3) * 0.3) * (0.7 + atm.wind * 1.2);
      const travel = (elapsed * speed + cloud.seed * 17) % (cloud.range * 2);
      dummy.position.set(
        travel - cloud.range + puff.x,
        cloud.y + puff.y + Math.sin(elapsed * 0.08 + puff.puffIndex) * 0.25,
        cloud.z + puff.z,
      );
      dummy.scale.set(
        puff.scale * 1.35 * style.scale,
        puff.scale * 0.6 * style.scale,
        puff.scale * style.scale,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, puffs.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial
        color={style.color}
        transparent
        opacity={style.opacity}
        depthWrite={false}
        fog
      />
    </instancedMesh>
  );
}

function Bird({ radius, height, speed, phase }: { radius: number; height: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    ref.current.position.set(Math.sin(t) * radius, height + Math.sin(t * 3) * 0.6, Math.cos(t) * radius);
    ref.current.rotation.y = -t + Math.PI / 2;
    const flap = Math.sin(t * 10) * 0.4;
    ref.current.children[0].rotation.z = flap;
    ref.current.children[1].rotation.z = -flap;
  });

  return (
    <group ref={ref}>
      <mesh position={[-0.15, 0, 0]} rotation-y={0.3}>
        <planeGeometry args={[0.4, 0.08]} />
        <meshBasicMaterial color="#2a2a35" side={THREE.DoubleSide} fog />
      </mesh>
      <mesh position={[0.15, 0, 0]} rotation-y={-0.3}>
        <planeGeometry args={[0.4, 0.08]} />
        <meshBasicMaterial color="#2a2a35" side={THREE.DoubleSide} fog />
      </mesh>
    </group>
  );
}

export default function SkyLife() {
  const birds = useMemo(
    () => [
      { radius: 15, height: 16, speed: 0.35, phase: 0 },
      { radius: 18, height: 18, speed: 0.3, phase: 2.1 },
      { radius: 13, height: 14, speed: 0.4, phase: 4.4 },
    ],
    [],
  );
  const flockRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (flockRef.current) {
      flockRef.current.visible = atm.day > 0.25 && atm.rain < 0.35 && atm.snow < 0.35;
    }
  });

  return (
    <>
      <DriftingClouds />
      <group ref={flockRef}>
        {birds.map((bird, index) => <Bird key={index} {...bird} />)}
      </group>
    </>
  );
}
