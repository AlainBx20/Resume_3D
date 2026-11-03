import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildings } from "../content";
import { atm } from "../atmosphere";
import { registerCollider } from "../collision";

const LAMP_MODEL = "/models/roads/light-square.glb";
const LAMP_SCALE = 5;
// bulb sits at the end of the lamp's arm (model head is at local z=-0.2125, y=0.57)
const BULB_LOCAL: [number, number, number] = [0, 0.57 * LAMP_SCALE, -0.19 * LAMP_SCALE];
const LAMP_RADIUS = 7.2;

function makeGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,214,140,0.9)");
  gradient.addColorStop(0.4, "rgba(255,190,110,0.3)");
  gradient.addColorStop(1, "rgba(255,180,100,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Lamp({ angle, glowMap }: { angle: number; glowMap: THREE.Texture }) {
  const { scene } = useGLTF(LAMP_MODEL);
  const clone = useMemo(() => scene.clone(), [scene]);
  const bulbRef = useRef<THREE.Mesh>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const x = Math.sin(angle) * LAMP_RADIUS;
  const z = Math.cos(angle) * LAMP_RADIUS;

  useEffect(() => {
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [clone]);

  useEffect(() => {
    const box = new THREE.Box3(
      new THREE.Vector3(x - 0.35, 0, z - 0.35),
      new THREE.Vector3(x + 0.35, 3, z + 0.35)
    );
    return registerCollider(box);
  }, [x, z]);

  useFrame((state) => {
    // At dusk each old lamp sputters to life for a moment, then settles into
    // a steady warm pool. The phase is derived from its angle so all six do
    // not flicker in unison.
    const lit = THREE.MathUtils.clamp(1 - atm.day * 1.8, 0, 1);
    const waking = lit > 0.04 && lit < 0.88;
    const flicker = waking
      ? Math.sin(state.clock.elapsedTime * 31 + angle * 11) > -0.15
        ? 1
        : 0.18
      : 1;
    const level = lit * flicker;
    const bulb = bulbRef.current;
    if (bulb) {
      (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = level * 3.2;
    }
    const sprite = spriteRef.current;
    if (sprite) {
      (sprite.material as THREE.SpriteMaterial).opacity = level * 0.55;
    }
    if (lightRef.current) {
      lightRef.current.intensity = level * 1.25;
    }
  });

  return (
    // the head is on the model's local -z side; rotation-y = angle points it
    // back at the plaza so the pool of light lands over the paths
    <group position={[x, 0, z]} rotation-y={angle}>
      <primitive object={clone} scale={LAMP_SCALE} />
      <mesh ref={bulbRef} position={BULB_LOCAL}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ffd68c" emissive="#ffbe5a" emissiveIntensity={0} toneMapped={false} />
      </mesh>
      <sprite ref={spriteRef} position={BULB_LOCAL} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={glowMap} transparent opacity={0} depthWrite={false} />
      </sprite>
      <pointLight
        ref={lightRef}
        position={BULB_LOCAL}
        color="#ffc77b"
        intensity={0}
        distance={8}
        decay={2}
      />
    </group>
  );
}

// Six lamps ringing the plaza, halfway between each pair of pathways.
export default function StreetLamps() {
  const glowMap = useMemo(() => makeGlowTexture(), []);
  const angles = useMemo(() => {
    const buildingAngles = buildings.map((b) => Math.atan2(b.position[0], b.position[2])).sort((a, b) => a - b);
    return buildingAngles.map((a, i) => {
      const next = i + 1 < buildingAngles.length ? buildingAngles[i + 1] : buildingAngles[0] + Math.PI * 2;
      return (a + next) / 2;
    });
  }, []);

  return (
    <>
      {angles.map((angle, i) => (
        <Lamp key={i} angle={angle} glowMap={glowMap} />
      ))}
    </>
  );
}

useGLTF.preload(LAMP_MODEL);
