import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LineBasicNodeMaterial } from "three/webgpu";
import { attribute, uniform, time, positionLocal, vec3, mod, color } from "three/tsl";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const DROP_COUNT = 1400;
const AREA_RADIUS = 26;
const FALL_HEIGHT = 22;
const DROP_LENGTH = 0.55;
const SPLASH_COUNT = 40;
const SPLASH_CYCLE = 0.55;

// Rain streaks are static line segments whose fall is entirely a vertex
// shader offset (mod over time), so the whole system costs one draw call and
// zero per-frame CPU work. The rig follows the camera on x/z.
// module-scope uniforms (one rain rig) so useFrame can drive them
const uRainOpacity = uniform(0);
const uRainWind = uniform(0);

function RainStreaks() {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(101);
    const positions = new Float32Array(DROP_COUNT * 2 * 3);
    const seeds = new Float32Array(DROP_COUNT * 2); // base fall offset
    const tips = new Float32Array(DROP_COUNT * 2); // 1 = top vertex of streak

    for (let i = 0; i < DROP_COUNT; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * AREA_RADIUS;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const seed = rng() * FALL_HEIGHT;
      for (let v = 0; v < 2; v++) {
        const idx = i * 2 + v;
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;
        seeds[idx] = seed;
        tips[idx] = v;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    geo.setAttribute("aTip", new THREE.Float32BufferAttribute(tips, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, FALL_HEIGHT / 2, 0), AREA_RADIUS + FALL_HEIGHT);
    return geo;
  }, []);

  const material = useMemo(() => {
    const aSeed = attribute("aSeed", "float");
    const aTip = attribute("aTip", "float");

    // falling streak entirely on the GPU: mod over the self-updating time node
    const y = mod(aSeed.sub(time.mul(16.0)), FALL_HEIGHT);
    const px = positionLocal.x.add(uRainWind.mul(aTip.mul(DROP_LENGTH * 2.0).add(y.mul(0.06))));
    const py = y.add(aTip.mul(DROP_LENGTH));

    const material = new LineBasicNodeMaterial();
    material.positionNode = vec3(px, py, positionLocal.z);
    material.colorNode = color(0.62, 0.71, 0.85);
    material.opacityNode = uRainOpacity;
    material.transparent = true;
    material.depthWrite = false;
    material.toneMapped = false;
    return material;
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    uRainOpacity.value = atm.rain * 0.55;
    uRainWind.value = atm.wind * 0.7;
    group.visible = atm.rain > 0.02;
    group.position.set(state.camera.position.x, 0, state.camera.position.z);
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments geometry={geometry}>
        <primitive object={material} attach="material" />
      </lineSegments>
    </group>
  );
}

// A small pool of recycled expanding rings that pop at random spots around
// the player while it rains.
interface Splash {
  x: number;
  z: number;
  phase: number;
  lastCycle: number;
}

function RainSplashes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const splashesRef = useRef<Splash[] | null>(null);
  const dummyRef = useRef<THREE.Object3D | null>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = atm.rain > 0.05;
    if (!mesh.visible) return;

    if (!splashesRef.current) {
      const rng = mulberry32(202);
      splashesRef.current = Array.from({ length: SPLASH_COUNT }, () => ({
        x: 0,
        z: 0,
        phase: rng() * SPLASH_CYCLE,
        lastCycle: -1,
      }));
      dummyRef.current = new THREE.Object3D();
    }
    const splashes = splashesRef.current;
    const dummy = dummyRef.current!;

    const t = state.clock.elapsedTime;
    const cam = state.camera.position;
    splashes.forEach((s, i) => {
      const cycle = Math.floor((t + s.phase) / SPLASH_CYCLE);
      const progress = ((t + s.phase) % SPLASH_CYCLE) / SPLASH_CYCLE;
      // re-seed the splash each time its cycle wraps
      if (cycle !== s.lastCycle) {
        s.lastCycle = cycle;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * 16;
        s.x = cam.x + Math.sin(angle) * radius;
        s.z = cam.z + Math.cos(angle) * radius;
      }
      dummy.position.set(s.x, 0.02, s.z);
      dummy.rotation.x = -Math.PI / 2;
      dummy.scale.setScalar(0.15 + progress * 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    (mesh.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.35;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SPLASH_COUNT]} visible={false}>
      <ringGeometry args={[0.55, 0.75, 12]} />
      <meshBasicMaterial color="#bcd2ec" transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

export default function Rain() {
  return (
    <>
      <RainStreaks />
      <RainSplashes />
    </>
  );
}
