import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, uv, mix, vec3, time, fract, floor, smoothstep, step } from "three/tsl";
import { atm } from "../atmosphere";

// The interior "window" glass shows the real outside: the live sky gradient
// (tracking the day/night cycle and overcast color), with thin rain streaks or
// drifting snow when the weather calls for it. All windows share one material.
const uHorizon = uniform(new THREE.Color("#f0ad7c"));
const uZenith = uniform(new THREE.Color("#6f7bb8"));
const uRain = uniform(0);
const uSnow = uniform(0);

const material = new MeshBasicNodeMaterial();
{
  const vy = uv().y.clamp(0, 1);
  const sky = mix(uHorizon, uZenith, vy);

  // --- rain: thin near-vertical streaks falling at varied speeds ---
  const rCol = floor(uv().x.mul(26));
  const rActive = step(0.45, fract(rCol.mul(0.613)));
  const rCenter = fract(uv().x.mul(26));
  const rLine = smoothstep(0.44, 0.5, rCenter).mul(smoothstep(0.56, 0.5, rCenter));
  const rSpeed = fract(rCol.mul(0.37)).mul(1.0).add(1.8);
  const rFall = fract(uv().y.mul(1.4).add(time.mul(rSpeed)));
  const rDash = smoothstep(0.0, 0.06, rFall).mul(smoothstep(0.45, 0.12, rFall));
  const rainMask = rLine.mul(rActive).mul(rDash).mul(uRain).mul(0.6);

  // --- snow: small soft dots drifting down ---
  const sX = uv().x.mul(13);
  const sCol = floor(sX);
  const sSpeed = fract(sCol.mul(0.53)).mul(0.4).add(0.25);
  const sY = fract(uv().y.mul(9).add(time.mul(sSpeed)).add(fract(sCol.mul(1.7))));
  const sCx = fract(sX);
  const sDotX = smoothstep(0.32, 0.5, sCx).mul(smoothstep(0.68, 0.5, sCx));
  const sDotY = smoothstep(0.0, 0.18, sY).mul(smoothstep(0.36, 0.18, sY));
  const snowMask = sDotX.mul(sDotY).mul(uSnow);

  const withRain = mix(sky, vec3(0.78, 0.85, 0.95), rainMask);
  material.colorNode = mix(withRain, vec3(0.97, 0.98, 1.0), snowMask);
}

export default function WindowGlass() {
  useFrame(() => {
    (uHorizon.value as THREE.Color).copy(atm.skyHorizon);
    (uZenith.value as THREE.Color).copy(atm.skyZenith);
    uRain.value = atm.rain;
    uSnow.value = atm.snow;
  });

  return (
    <mesh>
      <planeGeometry args={[1.3, 0.95]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
