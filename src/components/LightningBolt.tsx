import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";

const BOLT_LIFE_MS = 680;
const MAX_SEGMENTS = 48;
const SPARK_COUNT = 24;
const UP = new THREE.Vector3(0, 1, 0);

type Segment = { a: THREE.Vector3; b: THREE.Vector3; width: number };
type Spark = { direction: THREE.Vector3; speed: number; delay: number };

function applySegment(
  mesh: THREE.InstancedMesh,
  index: number,
  segment: Segment,
  radius: number,
  dummy: THREE.Object3D,
  direction: THREE.Vector3,
) {
  direction.subVectors(segment.b, segment.a);
  const length = direction.length();
  dummy.position.copy(segment.a).add(segment.b).multiplyScalar(0.5);
  dummy.quaternion.setFromUnitVectors(UP, direction.normalize());
  dummy.scale.set(radius * segment.width, length, radius * segment.width);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function flashEnvelope(age: number) {
  const first = Math.max(0, 1 - age / 105);
  const second = age > 115 && age < 250 ? Math.sin(((age - 115) / 135) * Math.PI) * 0.68 : 0;
  const third = age > 275 && age < 430 ? Math.sin(((age - 275) / 155) * Math.PI) * 0.34 : 0;
  return Math.max(first, second, third) * Math.max(0, 1 - age / BOLT_LIFE_MS);
}

export default function LightningBolt() {
  const camera = useThree((state) => state.camera);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const sparksRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const impactRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lastBolt = useRef(0);
  const strikePoint = useRef(new THREE.Vector3());
  const sparkData = useRef<Spark[]>([]);
  const dummyRef = useRef(new THREE.Object3D());
  const directionRef = useRef(new THREE.Vector3());
  const forwardRef = useRef(new THREE.Vector3());
  const rightRef = useRef(new THREE.Vector3());
  const sparkPositionRef = useRef(new THREE.Vector3());

  useFrame(() => {
    const core = coreRef.current;
    const glow = glowRef.current;
    const sparks = sparksRef.current;
    const light = lightRef.current;
    const impact = impactRef.current;
    const ring = ringRef.current;
    if (!core || !glow || !sparks || !light || !impact || !ring) return;
    const dummy = dummyRef.current;
    const direction = directionRef.current;
    const forward = forwardRef.current;
    const right = rightRef.current;
    const sparkPosition = sparkPositionRef.current;

    if (atm.boltAt !== lastBolt.current && atm.boltAt > 0) {
      lastBolt.current = atm.boltAt;
      const rng = mulberry32(Math.floor(atm.boltSeed * 100000));
      const distance = 36 + rng() * 23;
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.01) forward.set(0, 0, -1);
      forward.normalize();
      right.crossVectors(forward, UP).normalize();
      strikePoint.current
        .copy(camera.position)
        .addScaledVector(forward, distance)
        .addScaledVector(right, (rng() - 0.5) * 32)
        .setY(0.1);

      const top = new THREE.Vector3(
        strikePoint.current.x + (rng() - 0.5) * 8,
        66 + rng() * 9,
        strikePoint.current.z + (rng() - 0.5) * 8,
      );
      let cursor = top.clone();
      const segments: Segment[] = [];
      const mainSegments = 20;

      for (let index = 0; index < mainSegments; index += 1) {
        const progress = (index + 1) / mainSegments;
        const pull = progress * progress;
        const next = new THREE.Vector3(
          THREE.MathUtils.lerp(top.x, strikePoint.current.x, pull) + (rng() - 0.5) * (5.2 - progress * 3.5),
          THREE.MathUtils.lerp(top.y, strikePoint.current.y, progress),
          THREE.MathUtils.lerp(top.z, strikePoint.current.z, pull) + (rng() - 0.5) * (5.2 - progress * 3.5),
        );
        if (index === mainSegments - 1) next.copy(strikePoint.current);
        segments.push({ a: cursor.clone(), b: next.clone(), width: 1 - progress * 0.52 });

        if ([4, 8, 12, 15].includes(index)) {
          let branchCursor = next.clone();
          const branchDirection = new THREE.Vector3(
            (rng() > 0.5 ? 1 : -1) * (2.5 + rng() * 2.5),
            -(1.8 + rng() * 1.8),
            (rng() - 0.5) * 5,
          );
          for (let branch = 0; branch < 4; branch += 1) {
            branchDirection.x += (rng() - 0.5) * 1.4;
            branchDirection.z += (rng() - 0.5) * 1.4;
            const branchNext = branchCursor.clone().add(branchDirection);
            segments.push({
              a: branchCursor.clone(),
              b: branchNext.clone(),
              width: Math.max(0.23, (0.58 - branch * 0.1) * (1 - progress * 0.3)),
            });
            branchCursor = branchNext;
          }
        }
        cursor = next;
      }

      core.count = segments.length;
      glow.count = segments.length;
      segments.forEach((segment, index) => {
        applySegment(core, index, segment, 0.082, dummy, direction);
        applySegment(glow, index, segment, 0.31, dummy, direction);
      });
      core.instanceMatrix.needsUpdate = true;
      glow.instanceMatrix.needsUpdate = true;
      light.position.copy(strikePoint.current).setY(7);
      impact.position.copy(strikePoint.current);
      ring.position.copy(strikePoint.current).setY(0.13);

      sparkData.current = Array.from({ length: SPARK_COUNT }, () => {
        const angle = rng() * Math.PI * 2;
        const lift = 0.25 + rng() * 0.9;
        return {
          direction: new THREE.Vector3(Math.cos(angle), lift, Math.sin(angle)).normalize(),
          speed: 5 + rng() * 13,
          delay: rng() * 0.09,
        };
      });
    }

    const age = performance.now() - lastBolt.current;
    const alive = lastBolt.current > 0 && age < BOLT_LIFE_MS;
    const envelope = alive ? flashEnvelope(age) : 0;
    core.visible = glow.visible = impact.visible = ring.visible = sparks.visible = alive;
    if (!alive) {
      light.intensity = 0;
      return;
    }

    const flicker = 0.76 + Math.sin(age * 0.21) * 0.18 + Math.sin(age * 0.067) * 0.06;
    (core.material as THREE.MeshBasicMaterial).opacity = envelope * flicker;
    (glow.material as THREE.MeshBasicMaterial).opacity = envelope * 0.32 * flicker;
    light.intensity = envelope * 14500;

    const progress = age / BOLT_LIFE_MS;
    impact.scale.setScalar(0.8 + progress * 4.8);
    (impact.material as THREE.MeshBasicMaterial).opacity = envelope * 0.72;
    ring.scale.setScalar(0.65 + progress * 13);
    (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - progress * 1.9) * 0.64);

    sparkData.current.forEach((spark, index) => {
      const sparkAge = Math.max(0, age / 1000 - spark.delay);
      const sparkLife = Math.max(0, 1 - sparkAge / 0.46);
      sparkPosition
        .copy(strikePoint.current)
        .addScaledVector(spark.direction, spark.speed * sparkAge)
        .addScaledVector(UP, -7.5 * sparkAge * sparkAge);
      dummy.position.copy(sparkPosition);
      dummy.scale.setScalar(sparkLife * (0.55 + (index % 4) * 0.12));
      dummy.updateMatrix();
      sparks.setMatrixAt(index, dummy.matrix);
    });
    sparks.instanceMatrix.needsUpdate = true;
    (sparks.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 500);
  });

  return (
    <group>
      <instancedMesh ref={glowRef} args={[undefined, undefined, MAX_SEGMENTS]} visible={false} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 7]} />
        <meshBasicMaterial color="#779cff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </instancedMesh>
      <instancedMesh ref={coreRef} args={[undefined, undefined, MAX_SEGMENTS]} visible={false} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 7]} />
        <meshBasicMaterial color="#f8fdff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </instancedMesh>
      <mesh ref={impactRef} visible={false}>
        <sphereGeometry args={[0.52, 12, 8]} />
        <meshBasicMaterial color="#b9d5ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.28, 0.52, 24]} />
        <meshBasicMaterial color="#91b6ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={sparksRef} args={[undefined, undefined, SPARK_COUNT]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.07, 5, 4]} />
        <meshBasicMaterial color="#d9e8ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <pointLight ref={lightRef} color="#b5c9ff" intensity={0} distance={115} decay={2} />
    </group>
  );
}
