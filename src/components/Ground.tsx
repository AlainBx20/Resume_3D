import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { atm } from "../atmosphere";
import { isOnTownRoad } from "../roads";
import { insideBenchNook, nearestCarDistance } from "../streetLayout";

const GROUND_RADIUS = 45;
const PLAZA_RADIUS = 5;

// fixed shallow pools that only appear (fade in) while the ground is wet
// Spots under cars, on the driving road or inside bench nooks are dropped.
const PUDDLE_SPOTS = [
  { x: 1.6, z: 5.6, r: 1.3 },
  { x: -2.6, z: 4.8, r: 1.0 },
  { x: -5.8, z: 2.2, r: 1.4 },
  { x: 6.6, z: -3.5, r: 1.1 },
  { x: -2.4, z: -7.1, r: 1.2 },
  { x: 0.8, z: 13.5, r: 1.5 },
].filter(
  (p) =>
    !isOnTownRoad(p.x, p.z, p.r) &&
    !insideBenchNook(p.x, p.z, p.r) &&
    nearestCarDistance(p.x, p.z) > p.r + 3.2,
);

function useTiledTexture(path: string, repeat: number) {
  const tex = useLoader(THREE.TextureLoader, path);
  // clone so we never mutate the loader's shared cache entry
  return useMemo(() => {
    const tiled = tex.clone();
    tiled.wrapS = tiled.wrapT = THREE.RepeatWrapping;
    tiled.repeat.set(repeat, repeat);
    tiled.colorSpace = THREE.SRGBColorSpace;
    tiled.anisotropy = 8;
    return tiled;
  }, [tex, repeat]);
}

export default function Ground() {
  const grassColor = useTiledTexture("/textures/grass-color.jpg", 24);
  const grassNormal = useTiledTexture("/textures/grass-normal.jpg", 24);
  const grassRoughness = useTiledTexture("/textures/grass-roughness.jpg", 24);

  const pavingColor = useTiledTexture("/textures/paving-color.jpg", 5);
  const pavingNormal = useTiledTexture("/textures/paving-normal.jpg", 5);
  const pavingRoughness = useTiledTexture("/textures/paving-roughness.jpg", 5);

  const grassMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pavingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const snowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const puddleGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // rain slicks every surface: darker-feeling, glossier, more reflective
    const wet = atm.wetness;
    const grass = grassMatRef.current;
    if (grass) {
      grass.roughness = 1 - wet * 0.45;
      grass.envMapIntensity = 0.08 + wet * 0.4;
    }
    const paving = pavingMatRef.current;
    if (paving) {
      paving.roughness = 1 - wet * 0.65;
      paving.envMapIntensity = 0.08 + wet * 0.8;
    }

    const snow = snowMatRef.current;
    if (snow) {
      snow.opacity = Math.min(atm.snowCover * 1.3, 1);
      snow.visible = atm.snowCover > 0.02;
    }

    const puddles = puddleGroupRef.current;
    if (puddles) {
      puddles.visible = wet > 0.05;
      puddles.children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = wet * 0.7;
      });
    }
  });

  return (
    <group>
      {/* grass field */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[GROUND_RADIUS, 64]} />
        <meshStandardMaterial
          ref={grassMatRef}
          map={grassColor}
          normalMap={grassNormal}
          normalScale={new THREE.Vector2(0.4, 0.4)}
          roughnessMap={grassRoughness}
          roughness={1}
          envMapIntensity={0.08}
        />
      </mesh>

      {/* town plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 48]} />
        <meshStandardMaterial
          ref={pavingMatRef}
          map={pavingColor}
          normalMap={pavingNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughnessMap={pavingRoughness}
          roughness={1}
          envMapIntensity={0.08}
        />
      </mesh>

      {/* snow blanket that accumulates during snowfall and melts after */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.045, 0]}>
        <circleGeometry args={[GROUND_RADIUS - 0.5, 64]} />
        <meshStandardMaterial
          ref={snowMatRef}
          color="#f4f7fd"
          roughness={0.92}
          transparent
          opacity={0}
          depthWrite={false}
          visible={false}
        />
      </mesh>

      {/* reflective puddles left behind by rain */}
      <group ref={puddleGroupRef} visible={false}>
        {PUDDLE_SPOTS.map((p, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[p.x, 0.05, p.z]}>
            <circleGeometry args={[p.r, 24]} />
            <meshStandardMaterial
              color="#4a6485"
              metalness={1}
              roughness={0.06}
              envMapIntensity={1.6}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export { GROUND_RADIUS, PLAZA_RADIUS };
