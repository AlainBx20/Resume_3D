import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointsNodeMaterial } from "three/webgpu";
import { attribute, uniform, time, positionLocal, positionView, vec3, mod, sin, cos, color } from "three/tsl";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const FLAKE_COUNT = 1100;
const AREA_RADIUS = 28;
const FALL_HEIGHT = 20;

// module-scope uniforms (one snow rig) so useFrame can drive them
const uSnowOpacity = uniform(0);
const uSnowWind = uniform(0);

// Same trick as the rain: falling and side-to-side drift both live in the
// position node, so the flurry is a single static draw call following the
// camera. Ported from GLSL points to a TSL PointsNodeMaterial for WebGPU.
export default function Snow() {
  const groupRef = useRef<THREE.Group>(null);

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

  const material = useMemo(() => {
    const aSeed = attribute("aSeed", "float");
    const aPhase = attribute("aPhase", "float");
    const aSize = attribute("aSize", "float");

    const py = mod(aSeed.sub(time.mul(1.6)), FALL_HEIGHT);
    const windAmp = uSnowWind.mul(1.6).add(0.7);
    const px = positionLocal.x
      .add(sin(time.mul(0.7).add(aPhase)).mul(windAmp))
      .add(uSnowWind.mul(py).mul(0.12));
    const pz = positionLocal.z.add(cos(time.mul(0.5).add(aPhase.mul(1.3))).mul(0.6));

    const material = new PointsNodeMaterial();
    material.positionNode = vec3(px, py, pz);
    // perspective-attenuated point size, matching gl_PointSize = aSize*130/-mvZ.
    // WebGPU has no textured point sprites (pointUV compiles to the GLSL-only
    // gl_PointCoord), so flakes are small solid points instead of soft discs.
    material.sizeNode = aSize.mul(95.0).div(positionView.z.negate());
    material.colorNode = color(0.95, 0.97, 1.0);
    material.opacityNode = uSnowOpacity;
    material.transparent = true;
    material.depthWrite = false;
    material.toneMapped = false;
    return material;
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    uSnowOpacity.value = atm.snow * 0.9;
    uSnowWind.value = atm.wind;
    group.visible = atm.snow > 0.02;
    group.position.set(state.camera.position.x, 0, state.camera.position.z);
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry}>
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}
