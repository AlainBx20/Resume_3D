import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";

const RADIUS = 280;

// Gradient dome driven by uniforms so WeatherSystem can repaint the whole sky
// every frame (day/night cycle, overcast grey, lightning flash) for free.
export default function SkyDome() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uHorizon: { value: new THREE.Color("#f0ad7c") },
        uZenith: { value: new THREE.Color("#6f7bb8") },
        uFlash: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying float vHeight;
        void main() {
          vHeight = position.y / ${RADIUS.toFixed(1)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uHorizon;
        uniform vec3 uZenith;
        uniform float uFlash;
        varying float vHeight;
        void main() {
          float t = clamp(vHeight + 0.1, 0.0, 1.0);
          vec3 color = mix(uHorizon, uZenith, t);
          color = mix(color, vec3(0.95, 0.96, 1.0), uFlash * 0.7);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
    []
  );

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    (material.uniforms.uHorizon.value as THREE.Color).copy(atm.skyHorizon);
    (material.uniforms.uZenith.value as THREE.Color).copy(atm.skyZenith);
    material.uniforms.uFlash.value = atm.flash;
  });

  return (
    <mesh renderOrder={-2}>
      <sphereGeometry args={[RADIUS, 32, 20]} />
      <shaderMaterial
        ref={materialRef}
        args={[shaderArgs]}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
