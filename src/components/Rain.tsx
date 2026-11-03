import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LineBasicNodeMaterial } from "three/webgpu";
import { attribute, color, mix, mod, positionLocal, time, uniform, vec3 } from "three/tsl";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const SPLASH_COUNT = 96;
const SPLASH_CYCLE = 0.46;
const uRainOpacity = uniform(0);
const uRainWind = uniform(0);

type LayerConfig = {
  count: number;
  radius: number;
  height: number;
  minLength: number;
  maxLength: number;
  minSpeed: number;
  maxSpeed: number;
  seed: number;
  opacity: number;
};

const DISTANT_RAIN: LayerConfig = {
  count: 2600,
  radius: 29,
  height: 25,
  minLength: 0.42,
  maxLength: 0.88,
  minSpeed: 15,
  maxSpeed: 23,
  seed: 101,
  opacity: 0.62,
};

const NEAR_RAIN: LayerConfig = {
  count: 900,
  radius: 9,
  height: 17,
  minLength: 0.85,
  maxLength: 1.65,
  minSpeed: 22,
  maxSpeed: 34,
  seed: 707,
  opacity: 0.95,
};

function RainLayer({ config, anchor }: { config: LayerConfig; anchor?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(config.seed);
    const positions = new Float32Array(config.count * 2 * 3);
    const seeds = new Float32Array(config.count * 2);
    const tips = new Float32Array(config.count * 2);
    const speeds = new Float32Array(config.count * 2);
    const lengths = new Float32Array(config.count * 2);
    const shades = new Float32Array(config.count * 2);

    for (let drop = 0; drop < config.count; drop += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * config.radius;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const seed = rng() * config.height;
      const speed = THREE.MathUtils.lerp(config.minSpeed, config.maxSpeed, rng());
      const length = THREE.MathUtils.lerp(config.minLength, config.maxLength, rng());
      const shade = 0.2 + rng() * 0.8;
      for (let vertex = 0; vertex < 2; vertex += 1) {
        const index = drop * 2 + vertex;
        positions[index * 3] = x;
        positions[index * 3 + 1] = 0;
        positions[index * 3 + 2] = z;
        seeds[index] = seed;
        tips[index] = vertex;
        speeds[index] = speed;
        lengths[index] = length;
        shades[index] = shade;
      }
    }

    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    result.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    result.setAttribute("aTip", new THREE.Float32BufferAttribute(tips, 1));
    result.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1));
    result.setAttribute("aLength", new THREE.Float32BufferAttribute(lengths, 1));
    result.setAttribute("aShade", new THREE.Float32BufferAttribute(shades, 1));
    result.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, config.height * 0.5, 0),
      config.radius + config.height,
    );
    return result;
  }, [config]);

  const material = useMemo(() => {
    const seed = attribute("aSeed", "float");
    const tip = attribute("aTip", "float");
    const speed = attribute("aSpeed", "float");
    const length = attribute("aLength", "float");
    const shade = attribute("aShade", "float");
    const y = mod(seed.sub(time.mul(speed)), config.height);
    const slant = uRainWind.mul(tip.mul(length).mul(1.8).add(y.mul(0.072)));

    const result = new LineBasicNodeMaterial();
    result.positionNode = vec3(
      positionLocal.x.add(slant),
      y.add(tip.mul(length)),
      positionLocal.z.add(slant.mul(0.22)),
    );
    result.colorNode = mix(color(0.38, 0.48, 0.64), color(0.82, 0.9, 1), shade);
    result.opacityNode = uRainOpacity.mul(config.opacity).mul(shade.mul(0.45).add(0.55));
    result.transparent = true;
    result.depthWrite = false;
    result.toneMapped = false;
    return result;
  }, [config]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    uRainOpacity.value = atm.rain * 0.82;
    uRainWind.value = atm.wind * 0.82;
    group.visible = atm.rain > 0.015;
    if (anchor) group.position.set(...anchor);
    else group.position.set(state.camera.position.x, 0, state.camera.position.z);
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <primitive object={material} attach="material" />
      </lineSegments>
    </group>
  );
}

type Splash = {
  x: number;
  z: number;
  phase: number;
  size: number;
  lastCycle: number;
};

function RainImpacts() {
  const ringsRef = useRef<THREE.InstancedMesh>(null);
  const crownsRef = useRef<THREE.InstancedMesh>(null);
  const splashesRef = useRef<Splash[]>([]);
  const dummyRef = useRef(new THREE.Object3D());
  const rngRef = useRef(mulberry32(202));

  useFrame((state) => {
    const rings = ringsRef.current;
    const crowns = crownsRef.current;
    if (!rings || !crowns) return;
    const visible = atm.rain > 0.045;
    rings.visible = crowns.visible = visible;
    if (!visible) return;

    if (splashesRef.current.length === 0) {
      const rng = rngRef.current;
      splashesRef.current = Array.from({ length: SPLASH_COUNT }, () => ({
        x: 0,
        z: 0,
        phase: rng() * SPLASH_CYCLE,
        size: 0.55 + rng() * 0.8,
        lastCycle: -1,
      }));
    }

    const elapsed = state.clock.elapsedTime;
    const camera = state.camera.position;
    const dummy = dummyRef.current;
    const rng = rngRef.current;
    splashesRef.current.forEach((splash, index) => {
      const cycle = Math.floor((elapsed + splash.phase) / SPLASH_CYCLE);
      const progress = ((elapsed + splash.phase) % SPLASH_CYCLE) / SPLASH_CYCLE;
      if (cycle !== splash.lastCycle) {
        splash.lastCycle = cycle;
        const angle = rng() * Math.PI * 2;
        const radius = Math.sqrt(rng()) * 18;
        splash.x = camera.x + Math.sin(angle) * radius;
        splash.z = camera.z + Math.cos(angle) * radius;
      }

      dummy.position.set(splash.x, 0.028, splash.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar((0.12 + progress * 0.62) * splash.size);
      dummy.updateMatrix();
      rings.setMatrixAt(index, dummy.matrix);

      const lift = Math.sin(progress * Math.PI);
      dummy.position.set(splash.x, 0.035 + lift * 0.075 * splash.size, splash.z);
      dummy.rotation.set(0, index * 1.73, 0);
      dummy.scale.set(
        (1 - progress) * splash.size * 0.7,
        lift * splash.size * 0.58,
        (1 - progress) * splash.size * 0.7,
      );
      dummy.updateMatrix();
      crowns.setMatrixAt(index, dummy.matrix);
    });
    rings.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    (rings.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.19;
    (crowns.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.22;
  });

  return (
    <>
      <instancedMesh ref={ringsRef} args={[undefined, undefined, SPLASH_COUNT]} visible={false} frustumCulled={false}>
        <ringGeometry args={[0.42, 0.58, 16]} />
        <meshBasicMaterial color="#9db8ca" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={crownsRef} args={[undefined, undefined, SPLASH_COUNT]} visible={false} frustumCulled={false}>
        <coneGeometry args={[0.06, 0.18, 5, 1, true]} />
        <meshBasicMaterial
          color="#aac5d5"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}

function makeMistTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);
  const rng = mulberry32(919);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - size / 2) / (size / 2);
      const dy = (y - size / 2) / (size / 2);
      const edge = Math.max(0, 1 - Math.hypot(dx, dy));
      const noise = 0.35 + rng() * 0.65;
      const index = (y * size + x) * 4;
      image.data[index] = 176;
      image.data[index + 1] = 194;
      image.data[index + 2] = 211;
      image.data[index + 3] = Math.floor(edge * edge * noise * 120);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function GroundMist() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => makeMistTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = atm.rain > 0.08;
    mesh.position.set(state.camera.position.x, 0.075, state.camera.position.z);
    mesh.rotation.z = state.clock.elapsedTime * 0.018;
    (mesh.material as THREE.MeshBasicMaterial).opacity = atm.rain * 0.12;
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} visible={false} renderOrder={1}>
      <circleGeometry args={[19, 48]} />
      <meshBasicMaterial
        map={texture}
        color="#a9bdcf"
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Rain({
  anchor,
  splashes = true,
}: {
  anchor?: [number, number, number];
  splashes?: boolean;
} = {}) {
  return (
    <>
      <RainLayer config={DISTANT_RAIN} anchor={anchor} />
      <RainLayer config={NEAR_RAIN} anchor={anchor} />
      {splashes && <RainImpacts />}
      {splashes && <GroundMist />}
    </>
  );
}
