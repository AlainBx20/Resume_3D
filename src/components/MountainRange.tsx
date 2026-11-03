import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mulberry32 } from "../rand";

const PEAK_MODEL = "/models/nature/mtn_peak.glb";
const PEAK_MIN_Y = -0.33;

type PeakPlacement = {
  position: [number, number, number];
  scale: number;
  rotation: number;
};

function makeFoothills() {
  const rng = mulberry32(902);
  const positions: number[] = [];
  const colors: number[] = [];
  const segments = 72;
  const anchors = Array.from({ length: 16 }, () => 2.2 + rng() * 2.8);
  const radii = [44, 50, 56, 72];
  const heightScale = [0, 0.3, 1, 0];
  const palette = ["#2f4842", "#3d5751", "#536762"];

  const heightAt = (index: number) => {
    const value = (index / segments) * anchors.length;
    const a = Math.floor(value) % anchors.length;
    const b = (a + 1) % anchors.length;
    const f = value - Math.floor(value);
    const eased = f * f * (3 - 2 * f);
    return THREE.MathUtils.lerp(anchors[a], anchors[b], eased);
  };

  const point = (segment: number, row: number) => {
    const angle = (segment / segments) * Math.PI * 2;
    const radius = radii[row] + Math.sin(segment * 0.47) * 0.7;
    return new THREE.Vector3(
      Math.sin(angle) * radius,
      heightAt(segment) * heightScale[row] - 0.3,
      Math.cos(angle) * radius,
    );
  };

  const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let index = 0; index < 3; index += 1) colors.push(color.r, color.g, color.b);
  };

  for (let segment = 0; segment < segments; segment += 1) {
    for (let row = 0; row < radii.length - 1; row += 1) {
      const a = point(segment, row);
      const b = point(segment + 1, row);
      const c = point(segment, row + 1);
      const d = point(segment + 1, row + 1);
      const shade = 0.88 + rng() * 0.16;
      const color = new THREE.Color(palette[row]).multiplyScalar(shade);
      push(a, b, c, color);
      push(b, d, c, color.clone().multiplyScalar(1.035));
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export default function MountainRange() {
  const { scene } = useGLTF(PEAK_MODEL);
  const foothills = useMemo(() => makeFoothills(), []);
  const peakSource = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.Material;
      const snow = original.name === "mat21";
      mesh.material = new THREE.MeshStandardMaterial({
        color: snow ? "#aab4b4" : "#405157",
        roughness: 1,
        metalness: 0,
        flatShading: true,
      });
      mesh.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  const placements = useMemo<PeakPlacement[]>(() => {
    const rng = mulberry32(71);
    const peaks: PeakPlacement[] = [];
    const rings = [
      { count: 20, minRadius: 54, maxRadius: 72, minScale: 15, maxScale: 25, burial: 1.6 },
      { count: 16, minRadius: 80, maxRadius: 110, minScale: 25, maxScale: 40, burial: 4.2 },
    ];
    rings.forEach((ring, ringIndex) => {
      for (let index = 0; index < ring.count; index += 1) {
        const angle =
          (index / ring.count) * Math.PI * 2 +
          ringIndex * 0.13 +
          (rng() - 0.5) * 0.16;
        const radius = THREE.MathUtils.lerp(ring.minRadius, ring.maxRadius, rng());
        const scale = THREE.MathUtils.lerp(ring.minScale, ring.maxScale, rng());
        peaks.push({
          position: [
            Math.sin(angle) * radius,
            -PEAK_MIN_Y * scale - ring.burial,
            Math.cos(angle) * radius,
          ],
          scale,
          rotation: angle + Math.PI / 2 + (rng() - 0.5) * 0.55,
        });
      }
    });
    return peaks;
  }, []);

  return (
    <group>
      <mesh geometry={foothills} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {placements.map((placement, index) => (
        <primitive
          key={index}
          object={peakSource.clone(true)}
          position={placement.position}
          rotation-y={placement.rotation}
          scale={placement.scale}
        />
      ))}
    </group>
  );
}

useGLTF.preload(PEAK_MODEL);
