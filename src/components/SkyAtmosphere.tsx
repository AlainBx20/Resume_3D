import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import SkyDome from "./SkyDome";
import StarField from "./StarField";
import Rainbow from "./Rainbow";
import { Moon, CosmosPlanet } from "./SkyBodies";
import { atm } from "../atmosphere";

const SUN_DISTANCE = 95;
const LIGHT_DISTANCE = 60;
const AMBIENT_NIGHT = new THREE.Color("#20284b");
const AMBIENT_DAY = new THREE.Color("#cdd6f0");

export default function SkyAtmosphere() {
  const sunRef = useRef<THREE.Mesh>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const fogRef = useRef<THREE.Fog>(null);

  useFrame(() => {
    const sun = sunRef.current;
    const dirLight = dirLightRef.current;
    const ambient = ambientRef.current;
    const fog = fogRef.current;
    if (!sun || !dirLight || !ambient || !fog) return;

    // sun disc rides its sky direction and always faces the town
    sun.position.copy(atm.sunDir).multiplyScalar(SUN_DISTANCE);
    sun.lookAt(0, 0, 0);
    sun.visible = atm.sunDir.y > -0.12;
    (sun.material as THREE.MeshBasicMaterial).color.copy(atm.sunColor);
    (sun.material as THREE.MeshBasicMaterial).opacity =
      Math.min(atm.sunDir.y * 6 + 0.7, 1) * (1 - atm.overcast * 0.85);

    // one directional light plays both sun and moon
    const isDay = atm.day > 0.04;
    if (isDay) {
      dirLight.position.copy(atm.sunDir).multiplyScalar(LIGHT_DISTANCE);
      dirLight.color.copy(atm.sunColor);
      dirLight.intensity = atm.day * 1.75 * (1 - atm.overcast * 0.72);
      dirLight.shadow.intensity = THREE.MathUtils.lerp(0.58, 0.82, atm.day);
    } else {
      dirLight.position.copy(atm.moonDir).multiplyScalar(LIGHT_DISTANCE);
      dirLight.color.set("#91ace8");
      dirLight.intensity = 0.52 * (1 - atm.overcast * 0.62);
      dirLight.shadow.intensity = 0.64 * (1 - atm.overcast * 0.35);
    }

    ambient.intensity = 0.095 + atm.day * 0.38 * (1 - atm.overcast * 0.3) + atm.flash * 2.4;
    ambient.color.lerpColors(AMBIENT_NIGHT, AMBIENT_DAY, atm.day);

    fog.color.copy(atm.skyHorizon);
    const closeness = Math.max(atm.rain, atm.snow) * atm.overcast;
    fog.near = THREE.MathUtils.lerp(50, 24, closeness);
    fog.far = THREE.MathUtils.lerp(175, 95, closeness);
  });

  return (
    <>
      {/* HDRI drives reflections only — the visible sky is the dynamic dome */}
      <Environment files="/env/sky.hdr" environmentIntensity={0.65} />
      <SkyDome />
      <StarField />
      <Rainbow />
      <fog ref={fogRef} attach="fog" args={["#f0ad7c", 50, 175]} />

      <mesh ref={sunRef} position={[40, 26, -70]}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial color="#ffdca0" transparent toneMapped={false} fog={false} />
      </mesh>

      <Moon />
      <CosmosPlanet />
      <directionalLight
        ref={dirLightRef}
        position={[40, 8, -22]}
        intensity={1.5}
        color="#ffb37a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00018}
        shadow-normalBias={0.032}
        shadow-radius={2.2}
        shadow-camera-far={120}
        shadow-camera-left={-43}
        shadow-camera-right={43}
        shadow-camera-top={43}
        shadow-camera-bottom={-43}
      />
      <ambientLight ref={ambientRef} intensity={0.4} color="#9aa0d4" />
    </>
  );
}
