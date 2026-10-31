import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, uv, mix, vec3, time, fract, floor, smoothstep } from "three/tsl";
import { atm } from "../atmosphere";

// The interior "window" glass shows the real outside: the live sky gradient
// (so it tracks the day/night cycle and overcast color) with rain streaks
// running down the pane when it's raining. All windows share one material.
const uHorizon = uniform(new THREE.Color("#f0ad7c"));
const uZenith = uniform(new THREE.Color("#6f7bb8"));
const uRain = uniform(0);

const material = new MeshBasicNodeMaterial();
{
  const vy = uv().y.clamp(0, 1);
  const sky = mix(uHorizon, uZenith, vy);
  // per-column rain streaks sliding down the glass at varied speeds
  const col = floor(uv().x.mul(16));
  const speed = fract(col.mul(0.37)).mul(0.6).add(0.5);
  const d = fract(uv().y.add(time.mul(speed.negate())).mul(3.0));
  const streak = smoothstep(0, 0.1, d).mul(smoothstep(1.0, 0.72, d));
  material.colorNode = mix(sky, vec3(0.82, 0.88, 0.97), streak.mul(0.45).mul(uRain));
}

export default function WindowGlass() {
  useFrame(() => {
    (uHorizon.value as THREE.Color).copy(atm.skyHorizon);
    (uZenith.value as THREE.Color).copy(atm.skyZenith);
    uRain.value = Math.max(atm.rain, atm.snow * 0.4);
  });

  return (
    <mesh>
      <planeGeometry args={[1.3, 0.95]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
