import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { buildings } from "../content";
import { mulberry32 } from "../rand";
import { isOnTownRoad } from "../roads";
import { atm } from "../atmosphere";
import { BENCH_SPOTS, PARKED_SPOTS, type StreetPlacement } from "../streetLayout";
import { registerOrientedCollider } from "../collision";

const CITY = "/models/kaykit/city/";

const CAR_LIGHT_DEPTHS: Record<string, { front: number; rear: number }> = {
  "car_hatchback.glb": { front: 1.811, rear: -1.745 },
  "car_sedan.glb": { front: 2.055, rear: -2.084 },
  "car_stationwagon.glb": { front: 2.055, rear: -2.084 },
  "car_taxi.glb": { front: 2.055, rear: -2.084 },
};

const STREET_PROPS: StreetPlacement[] = [
  // Small bits of street life beside the six portfolio buildings.
  { model: "trash_A.glb", position: [3.2, 0, -9.2], rotationY: 0.25, scale: 5 },
  { model: "trash_B.glb", position: [8.9, 0, -1.7], rotationY: 1.2, scale: 7.2 },
  { model: "trash_A.glb", position: [8.9, 0, 9.1], rotationY: 2.1, scale: 5 },
  { model: "trash_B.glb", position: [-3.2, 0, 9.1], rotationY: 2.9, scale: 7.2 },
  { model: "trash_A.glb", position: [-8.9, 0, 1.7], rotationY: 4.2, scale: 5 },
  { model: "trash_B.glb", position: [-8.9, 0, -9.1], rotationY: 5.1, scale: 7.2 },

  { model: "firehydrant.glb", position: [4.1, 0, -12.7], rotationY: 0.1, scale: 3.6 },
  { model: "firehydrant.glb", position: [13.4, 0, -2.1], rotationY: 1.1, scale: 3.6 },
  { model: "firehydrant.glb", position: [12.8, 0, 9.2], rotationY: 2.1, scale: 3.6 },
  { model: "firehydrant.glb", position: [-4.1, 0, 12.7], rotationY: 3.1, scale: 3.6 },
  { model: "firehydrant.glb", position: [-13.4, 0, 2.1], rotationY: 4.1, scale: 3.6 },
  { model: "firehydrant.glb", position: [-12.8, 0, -9.2], rotationY: 5.1, scale: 3.6 },
];

function Model({ url, position, rotationY = 0, scale = 1 }: { url: string; position: [number, number, number]; rotationY?: number; scale?: number }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const result = scene.clone();
    result.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        (object as THREE.Mesh).castShadow = true;
        (object as THREE.Mesh).receiveShadow = true;
      }
    });
    return result;
  }, [scene]);
  return <primitive object={clone} position={position} rotation-y={rotationY} scale={scale} />;
}

function WetCar({ placement }: { placement: StreetPlacement }) {
  const { scene } = useGLTF(`${CITY}${placement.model}`);
  const { clone, materials } = useMemo(() => {
    const result = scene.clone();
    const wetMaterials: { material: THREE.MeshStandardMaterial; roughness: number; env: number }[] = [];
    result.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const copies = source.map((material) => material.clone());
      mesh.material = Array.isArray(mesh.material) ? copies : copies[0];
      copies.forEach((material) => {
        if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const standard = material as THREE.MeshStandardMaterial;
          wetMaterials.push({
            material: standard,
            roughness: standard.roughness,
            env: standard.envMapIntensity,
          });
        }
      });
    });
    return { clone: result, materials: wetMaterials };
  }, [scene]);

  useFrame(() => {
    const wet = Math.max(atm.wetness, atm.rain * 0.75);
    materials.forEach(({ material, roughness, env }) => {
      material.roughness = THREE.MathUtils.lerp(roughness, 0.16, wet);
      material.envMapIntensity = THREE.MathUtils.lerp(env, 1.55, wet);
    });
  });

  useEffect(
    () => registerOrientedCollider(
      placement.position[0],
      placement.position[2],
      1.3,
      2.5,
      placement.rotationY,
    ),
    [placement],
  );

  return (
    <group position={placement.position} rotation-y={placement.rotationY}>
      <primitive object={clone} scale={placement.scale} />
      <CarLights model={placement.model} />
    </group>
  );
}

function CarLights({ model }: { model: string }) {
  const beamRef = useRef<THREE.SpotLight>(null);
  const tailBeamRef = useRef<THREE.SpotLight>(null);
  const headLeftRef = useRef<THREE.MeshBasicMaterial>(null);
  const headRightRef = useRef<THREE.MeshBasicMaterial>(null);
  const tailLeftRef = useRef<THREE.MeshBasicMaterial>(null);
  const tailRightRef = useRef<THREE.MeshBasicMaterial>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const tailTarget = useMemo(() => new THREE.Object3D(), []);
  const depths = CAR_LIGHT_DEPTHS[model] ?? CAR_LIGHT_DEPTHS["car_sedan.glb"];

  useFrame(() => {
    const night = THREE.MathUtils.clamp(1 - atm.day * 1.85, 0, 1);
    const storm = THREE.MathUtils.clamp(atm.overcast * 0.7 + atm.rain * 0.35 - 0.45, 0, 0.72);
    const level = Math.max(night, storm);
    const headOpacity = THREE.MathUtils.smoothstep(level, 0.06, 0.82) * 0.92;
    const tailOpacity = THREE.MathUtils.smoothstep(level, 0.08, 0.9) * 0.78;

    if (beamRef.current) beamRef.current.intensity = level * 72;
    if (tailBeamRef.current) tailBeamRef.current.intensity = level * 5;
    if (headLeftRef.current) headLeftRef.current.opacity = headOpacity;
    if (headRightRef.current) headRightRef.current.opacity = headOpacity;
    if (tailLeftRef.current) tailLeftRef.current.opacity = tailOpacity;
    if (tailRightRef.current) tailRightRef.current.opacity = tailOpacity;
  });

  return (
    <>
      {[-0.607, 0.607].map((x, index) => (
        <mesh key={`head-${x}`} position={[x, 0.283, depths.front]} renderOrder={3}>
          <planeGeometry args={[0.295, 0.14]} />
          <meshBasicMaterial
            ref={index === 0 ? headLeftRef : headRightRef}
            color="#fff0b0"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {[-0.584, 0.584].map((x, index) => (
        <mesh
          key={`tail-${x}`}
          position={[x, 0.355, depths.rear]}
          rotation-y={Math.PI}
          renderOrder={3}
        >
          <planeGeometry args={[0.28, 0.064]} />
          <meshBasicMaterial
            ref={index === 0 ? tailLeftRef : tailRightRef}
            color="#ff241c"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      <spotLight
        ref={beamRef}
        position={[0, 0.3, depths.front + 0.02]}
        target={target}
        color="#ffe8b2"
        intensity={0}
        distance={15}
        angle={0.4}
        penumbra={0.72}
        decay={2}
      />
      <spotLight
        ref={tailBeamRef}
        position={[0, 0.34, depths.rear - 0.035]}
        target={tailTarget}
        color="#ff3028"
        intensity={0}
        distance={4.5}
        angle={0.62}
        penumbra={0.95}
        decay={2}
      />
      <primitive object={target} position={[0, -0.12, 9]} />
      <primitive object={tailTarget} position={[0, -0.4, -5]} />
    </>
  );
}

function BenchNook({ placement }: { placement: StreetPlacement }) {
  const pavingSource = useLoader(THREE.TextureLoader, "/textures/paving-color.jpg");
  const paving = useMemo(() => {
    const texture = pavingSource.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [pavingSource]);

  return (
    <>
      <group position={[placement.position[0], 0.028, placement.position[2]]} rotation-y={placement.rotationY}>
        <mesh rotation-x={-Math.PI / 2} scale={[1.3, 0.7, 1]} receiveShadow>
          <circleGeometry args={[1.08, 28]} />
          <meshStandardMaterial map={paving} color="#d4d6d4" roughness={0.96} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.012} scale={[1.3, 0.7, 1]}>
          <ringGeometry args={[1.02, 1.12, 28]} />
          <meshStandardMaterial color="#a7adb5" roughness={0.98} />
        </mesh>
      </group>
      <Model
        url={`${CITY}${placement.model}`}
        position={placement.position}
        rotationY={placement.rotationY}
        scale={placement.scale}
      />
    </>
  );
}

export default function CityProps() {
  const bushes = useMemo(() => {
    const rng = mulberry32(88);
    const list: { position: [number, number, number]; scale: number; rotationY: number }[] = [];
    for (const building of buildings) {
      const angle = Math.atan2(building.position[0], building.position[2]);
      const radius = Math.hypot(building.position[0], building.position[2]);
      for (let index = 0; index < 4; index += 1) {
        const offset = (rng() - 0.5) * 4.5;
        const radial = radius + 2.2 + rng() * 0.8;
        list.push({
          position: [Math.sin(angle) * radial + Math.cos(angle) * offset, 0, Math.cos(angle) * radial - Math.sin(angle) * offset],
          scale: 3 + rng() * 2,
          rotationY: rng() * Math.PI * 2,
        });
      }
    }
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2 + rng() * 0.3;
      const radius = 15 + rng() * 2.5;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        if (isOnTownRoad(x, z, 0.5)) continue;
        list.push({
          position: [x, 0, z],
        scale: 3 + rng() * 2.5,
        rotationY: rng() * Math.PI * 2,
      });
    }
    return list;
  }, []);

  return (
    <>
      {bushes.map((bush, index) => (
        <Model key={`bush-${index}`} url={`${CITY}bush.glb`} position={bush.position} rotationY={bush.rotationY} scale={bush.scale} />
      ))}
      {BENCH_SPOTS.map((placement, index) => (
        <BenchNook key={`bench-${index}`} placement={placement} />
      ))}
      {STREET_PROPS.map((placement, index) => (
        <Model
          key={`street-${index}`}
          url={`${CITY}${placement.model}`}
          position={placement.position}
          rotationY={placement.rotationY}
          scale={placement.scale}
        />
      ))}
      {PARKED_SPOTS.map((placement, index) => (
        <WetCar key={`car-${index}`} placement={placement} />
      ))}
    </>
  );
}

[
  "bush.glb",
  "bench.glb",
  "trash_A.glb",
  "trash_B.glb",
  "firehydrant.glb",
  "car_sedan.glb",
  "car_hatchback.glb",
  "car_stationwagon.glb",
  "car_taxi.glb",
].forEach((model) => useGLTF.preload(`${CITY}${model}`));
