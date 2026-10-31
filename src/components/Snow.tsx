import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const FLAKE_COUNT = 1100;
const AREA_RADIUS = 28;
const FALL_HEIGHT = 20;

function makeFlakeTexture(): THREE.Texture {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.7)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Same trick as the rain: falling and side-to-side drift both live in the
// vertex shader, so the flurry is a single static draw call following the
// camera.
export default function Snow() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(303);
    const positions = new Float32Array(FLAKE_COUNT * 3);
    const seeds = new Float32Array(FLAKE_COUNT);
    const phases = new Float32Array(FLAKE_COUNT);
    const sizes = new Float32Array(FLAKE_COUNT);

    for (let i = 0; i < FLAKE_COUNT; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * AREA_RADIUS;
      positions[i * 3] = Math.sin(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.cos(angle) * radius;
      seeds[i] = rng() * FALL_HEIGHT;
      phases[i] = rng() * Math.PI * 2;
      sizes[i] = 0.55 + rng() * 0.9;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, FALL_HEIGHT / 2, 0), AREA_RADIUS + FALL_HEIGHT);
    return geo;
  }, []);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uWind: { value: 0 },
        uMap: { value: makeFlakeTexture() },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aPhase;
        attribute float aSize;
        uniform float uTime;
        uniform float uWind;
        void main() {
          vec3 p = position;
          p.y = mod(aSeed - uTime * 1.6, ${FALL_HEIGHT.toFixed(1)});
          p.x += sin(uTime * 0.7 + aPhase) * (0.7 + uWind * 1.6) + uWind * p.y * 0.12;
          p.z += cos(uTime * 0.5 + aPhase * 1.3) * 0.6;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * 130.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform sampler2D uMap;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(0.95, 0.97, 1.0, tex.a * uOpacity);
        }
      `,
    }),
    []
  );

  useFrame((state) => {
    const group = groupRef.current;
    const material = materialRef.current;
    if (!group || !material) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uOpacity.value = atm.snow * 0.9;
    material.uniforms.uWind.value = atm.wind;
    group.visible = atm.snow > 0.02;
    group.position.set(state.camera.position.x, 0, state.camera.position.z);
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry}>
        <shaderMaterial ref={materialRef} args={[shaderArgs]} transparent depthWrite={false} />
      </points>
    </group>
  );
}
