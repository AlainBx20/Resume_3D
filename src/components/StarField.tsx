import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";
import { useTownStore } from "../store";

const STAR_COUNT = 650;
const DOME_RADIUS = 255;

function ShootingStar({
  start,
  delay,
  period,
}: {
  start: [number, number, number];
  delay: number;
  period: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const streakRef = useRef<THREE.MeshBasicMaterial>(null);
  const headRef = useRef<THREE.MeshBasicMaterial>(null);
  const wished = useRef(false);

  useFrame((state) => {
    const group = ref.current;
    const streak = streakRef.current;
    const head = headRef.current;
    if (!group || !streak || !head) return;
    const night = THREE.MathUtils.clamp(1 - atm.day * 1.5, 0, 1) * (1 - atm.overcast);
    const cycle = (state.clock.elapsedTime + delay) % period;
    const active = cycle < 1.15 && night > 0.2;
    group.visible = active;
    if (!active) return;
    if (!wished.current) {
      wished.current = true;
      useTownStore.getState().unlock("meteor-wish");
    }
    const progress = cycle / 1.15;
    group.position.set(start[0] + progress * 42, start[1] - progress * 13, start[2]);
    const alpha = Math.sin(progress * Math.PI) * night;
    streak.opacity = alpha * 0.72;
    head.opacity = alpha;
  });

  return (
    <group ref={ref} position={start} rotation-z={-0.3} visible={false}>
      <mesh position={[-5.5, 0, 0]}>
        <planeGeometry args={[11, 0.12]} />
        <meshBasicMaterial
          ref={streakRef}
          color="#ddecff"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[0.22, 12]} />
        <meshBasicMaterial
          ref={headRef}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

// Point stars scattered on the upper sky hemisphere, fading in as the sun
// sets and hiding behind overcast weather.
export default function StarField() {
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(55);
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      // bias toward the zenith so stars don't crowd the horizon fog band
      const elevation = Math.asin(0.08 + rng() * 0.9);
      const azimuth = rng() * Math.PI * 2;
      positions[i * 3] = Math.cos(elevation) * Math.cos(azimuth) * DOME_RADIUS;
      positions[i * 3 + 1] = Math.sin(elevation) * DOME_RADIUS;
      positions[i * 3 + 2] = Math.cos(elevation) * Math.sin(azimuth) * DOME_RADIUS;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const mat = materialRef.current;
    const points = pointsRef.current;
    if (!mat || !points) return;
    const night = THREE.MathUtils.clamp(1 - atm.day * 1.4, 0, 1);
    const twinkle = 0.85 + Math.sin(state.clock.elapsedTime * 2.3) * 0.15;
    mat.opacity = night * (1 - atm.overcast) * twinkle;
    points.visible = mat.opacity > 0.02;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} renderOrder={-1}>
        <pointsMaterial
          ref={materialRef}
          color="#dfe8ff"
          size={1.7}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </points>
      <ShootingStar start={[-38, 73, -118]} delay={2} period={18} />
      <ShootingStar start={[-12, 58, -126]} delay={11} period={27} />
    </>
  );
}
