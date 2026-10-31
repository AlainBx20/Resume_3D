import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";

const INNER = 52;
const OUTER = 64;

// A shader arc that fades in only when the ground is still wet, the sky has
// cleared and the sun is up — the reward for waiting out a storm.
export default function Rainbow() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const shaderArgs = useMemo(
    () => ({
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vPos;
        void main() {
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying vec2 vPos;

        vec3 hue2rgb(float h) {
          vec3 k = mod(vec3(0.0, 4.0, 2.0) + h * 6.0, 6.0);
          return 1.0 - clamp(min(k, 4.0 - k), 0.0, 1.0);
        }

        void main() {
          float r = (length(vPos) - ${INNER.toFixed(1)}) / ${(OUTER - INNER).toFixed(1)};
          if (r < 0.0 || r > 1.0) discard;
          // red on the outside, violet inside, soft band edges
          vec3 color = hue2rgb((1.0 - r) * 0.78);
          float edge = smoothstep(0.0, 0.18, r) * smoothstep(1.0, 0.82, r);
          gl_FragColor = vec4(color, uOpacity * edge * 0.5);
        }
      `,
    }),
    []
  );

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const clearing = THREE.MathUtils.clamp(1 - atm.rain * 6, 0, 1);
    const opacity = atm.wetness * atm.day * clearing * (1 - atm.overcast);
    material.uniforms.uOpacity.value = opacity;
    mesh.visible = opacity > 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, -6, -150]}>
      <ringGeometry args={[INNER, OUTER, 72, 1, 0, Math.PI]} />
      <shaderMaterial
        ref={materialRef}
        args={[shaderArgs]}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
