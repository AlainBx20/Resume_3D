import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import SkyDome from "./SkyDome";
import StarField from "./StarField";
import Rainbow from "./Rainbow";
import { atm } from "../atmosphere";

const SUN_DISTANCE = 95;
const LIGHT_DISTANCE = 60;
const AMBIENT_NIGHT = new THREE.Color("#33395f");
const AMBIENT_DAY = new THREE.Color("#cdd6f0");

export default function SkyAtmosphere() {
  const sunRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonHaloRef = useRef<THREE.Mesh>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const fogRef = useRef<THREE.Fog>(null);

  useFrame(() => {
    const sun = sunRef.current;
    const moon = moonRef.current;
    const halo = moonHaloRef.current;
    const dirLight = dirLightRef.current;
    const ambient = ambientRef.current;
    const fog = fogRef.current;
    if (!sun || !moon || !halo || !dirLight || !ambient || !fog) return;

    // sun + moon discs ride their sky directions and always face the town
    sun.position.copy(atm.sunDir).multiplyScalar(SUN_DISTANCE);
    sun.lookAt(0, 0, 0);
    sun.visible = atm.sunDir.y > -0.12;
    (sun.material as THREE.MeshBasicMaterial).color.copy(atm.sunColor);
    (sun.material as THREE.MeshBasicMaterial).opacity =
      Math.min(atm.sunDir.y * 6 + 0.7, 1) * (1 - atm.overcast * 0.85);

    moon.position.copy(atm.moonDir).multiplyScalar(SUN_DISTANCE);
    moon.lookAt(0, 0, 0);
    halo.position.copy(moon.position);
    halo.lookAt(0, 0, 0);
    const moonUp = Math.max(atm.moonDir.y, 0);
    moon.visible = halo.visible = moonUp > 0.02;
    (moon.material as THREE.MeshBasicMaterial).opacity =
      Math.min(moonUp * 4, 1) * (1 - atm.overcast * 0.8);
    (halo.material as THREE.MeshBasicMaterial).opacity =
      Math.min(moonUp * 4, 1) * 0.12 * (1 - atm.overcast * 0.8);

    // one directional light plays both sun and moon
    const isDay = atm.day > 0.04;
    if (isDay) {
      dirLight.position.copy(atm.sunDir).multiplyScalar(LIGHT_DISTANCE);
      dirLight.color.copy(atm.sunColor);
      dirLight.intensity = atm.day * 1.6 * (1 - atm.overcast * 0.75);
    } else {
      dirLight.position.copy(atm.moonDir).multiplyScalar(LIGHT_DISTANCE);
      dirLight.color.set("#8fa5d9");
      dirLight.intensity = 0.22 * (1 - atm.overcast * 0.6);
    }

    ambient.intensity = 0.16 + atm.day * 0.32 * (1 - atm.overcast * 0.3) + atm.flash * 2.2;
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

      <mesh ref={moonHaloRef} position={[-40, 22, 70]}>
        <circleGeometry args={[13, 32]} />
        <meshBasicMaterial
          color="#cfd8e8"
          transparent
          opacity={0.12}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh ref={moonRef} position={[-40, 22, 70]}>
        <circleGeometry args={[7.5, 32]} />
        <meshBasicMaterial color="#cfd8e8" transparent toneMapped={false} fog={false} />
      </mesh>

      <directionalLight
        ref={dirLightRef}
        position={[40, 8, -22]}
        intensity={1.5}
        color="#ffb37a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <ambientLight ref={ambientRef} intensity={0.4} color="#9aa0d4" />
    </>
  );
}
