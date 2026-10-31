import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { Fn, uniform, positionLocal, length, vec3, mod, clamp, min, smoothstep, float } from "three/tsl";
import { atm } from "../atmosphere";

const INNER = 52;
const OUTER = 64;

// module-scope uniform (one rainbow in the scene) so useFrame can drive it
const uOpacity = uniform(0);

// A shader arc that fades in only when the ground is still wet, the sky has
// cleared and the sun is up — the reward for waiting out a storm.
// Ported from GLSL to a TSL node material for WebGPURenderer.
export default function Rainbow() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const r = length(positionLocal.xy).sub(INNER).div(OUTER - INNER);

    const material = new MeshBasicNodeMaterial();
    material.colorNode = Fn(() => {
      r.lessThan(0).or(r.greaterThan(1)).discard();
      // hue2rgb inline: red on the outside, violet inside
      const h = float(1).sub(r).mul(0.78);
      const k = mod(vec3(0, 4, 2).add(h.mul(6)), 6);
      return float(1).sub(clamp(min(k, float(4).sub(k)), 0, 1));
    })();
    // soft band edges, fading with wetness/clearing opacity
    const edge = smoothstep(0, 0.18, r).mul(smoothstep(1, 0.82, r));
    material.opacityNode = uOpacity.mul(edge).mul(0.5);
    material.transparent = true;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;
    material.blending = THREE.AdditiveBlending;
    material.toneMapped = false;

    return material;
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const clearing = THREE.MathUtils.clamp(1 - atm.rain * 6, 0, 1);
    const opacity = atm.wetness * atm.day * clearing * (1 - atm.overcast);
    uOpacity.value = opacity;
    mesh.visible = opacity > 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, -6, -150]}>
      <ringGeometry args={[INNER, OUTER, 72, 1, 0, Math.PI]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
