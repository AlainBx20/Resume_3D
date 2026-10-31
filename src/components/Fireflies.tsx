import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const COUNT = 42;

interface Fly {
  cx: number;
  cz: number;
  baseY: number;
  radius: number;
  speed: number;
  phase: number;
}

// Warm drifting motes that only come out on calm nights — they hide from
// rain, snow and daylight.
export default function Fireflies() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const flies = useMemo<Fly[]>(() => {
    const rng = mulberry32(77);
    return Array.from({ length: COUNT }, () => {
      const angle = rng() * Math.PI * 2;
      const dist = 4 + rng() * 16;
      return {
        cx: Math.sin(angle) * dist,
        cz: Math.cos(angle) * dist,
        baseY: 0.4 + rng() * 1.4,
        radius: 0.6 + rng() * 1.8,
        speed: 0.3 + rng() * 0.6,
        phase: rng() * Math.PI * 2,
      };
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    return geo;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    const mat = materialRef.current;
    if (!points || !mat) return;

    const night = THREE.MathUtils.clamp(1 - atm.day * 1.6, 0, 1);
    const calm = (1 - atm.rain) * (1 - atm.snow);
    mat.opacity = night * calm * 0.9;
    points.visible = mat.opacity > 0.03;
    if (!points.visible) return;

    const t = state.clock.elapsedTime;
    const pos = points.geometry.attributes.position as THREE.BufferAttribute;
    flies.forEach((f, i) => {
      const a = t * f.speed + f.phase;
      pos.setXYZ(
        i,
        f.cx + Math.sin(a) * f.radius,
        f.baseY + Math.sin(a * 1.7 + f.phase) * 0.35,
        f.cz + Math.cos(a * 0.8) * f.radius
      );
    });
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color="#ffd76e"
        size={0.14}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
