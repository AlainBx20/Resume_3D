import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, positionLocal, mix, color } from "three/tsl";
import { atm } from "../atmosphere";

const RADIUS = 280;

// Uniform nodes at module scope (one dome in the scene) so WeatherSystem can
// repaint the whole sky every frame from useFrame without the linter flagging
// mutation of a memoized value.
const uHorizon = uniform(new THREE.Color("#f0ad7c"));
const uZenith = uniform(new THREE.Color("#6f7bb8"));
const uFlash = uniform(0);

// Gradient dome driven by the uniform nodes above (day/night cycle, overcast
// grey, lightning flash). Ported from a GLSL ShaderMaterial to a TSL node
// material for WebGPURenderer.
export default function SkyDome() {
  const material = useMemo(() => {
    const t = positionLocal.y.div(RADIUS).add(0.1).clamp(0, 1);
    const gradient = mix(uHorizon, uZenith, t);
    const flashed = mix(gradient, color(0.95, 0.96, 1.0), uFlash.mul(0.7));

    const material = new MeshBasicNodeMaterial();
    material.colorNode = flashed;
    material.side = THREE.BackSide;
    material.depthWrite = false;
    material.fog = false;
    material.toneMapped = false; // flat gradient sky, matching the original raw write
    return material;
  }, []);

  useFrame(() => {
    (uHorizon.value as THREE.Color).copy(atm.skyHorizon);
    (uZenith.value as THREE.Color).copy(atm.skyZenith);
    uFlash.value = atm.flash;
  });

  return (
    <mesh renderOrder={-2}>
      <sphereGeometry args={[RADIUS, 32, 20]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
