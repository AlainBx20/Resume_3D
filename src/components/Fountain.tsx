import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { registerCollider } from "../collision";

const SCALE = 0.95;
const COLLIDER_RADIUS = 1.9;
const CROWN_STREAMS = 10;
const OVERFLOW_STREAMS = 14;
const UP = new THREE.Vector3(0, 1, 0);

type Dims = {
  topY: number;
  rimY: number;
  lowerWaterY: number;
  radius: number;
  upperWaterRadius: number;
  overflowRadius: number;
};

function radiusAtTop(mesh: THREE.Mesh, topY: number): number {
  const positions = mesh.geometry.getAttribute("position");
  if (!positions) throw new Error(`Fountain mesh "${mesh.name}" has no position attribute`);

  const point = new THREE.Vector3();
  let radius = 0;
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
    if (Math.abs(point.y - topY) < 0.005) radius = Math.max(radius, Math.hypot(point.x, point.z));
  }
  if (radius === 0) throw new Error(`Could not measure the top surface of fountain mesh "${mesh.name}"`);
  return radius;
}

function makeFlowTexture() {
  const width = 12;
  const height = 96;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const ribbon = Math.pow((Math.sin((y / height) * Math.PI * 12 + x * 0.55) + 1) * 0.5, 4);
      const edge = 1 - Math.abs((x / (width - 1)) * 2 - 1);
      data[index] = 70 + ribbon * 75;
      data[index + 1] = 165 + ribbon * 65;
      data[index + 2] = 214 + ribbon * 41;
      data[index + 3] = 125 + edge * 95;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2.4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function MovingStreams({ topY, rimY, lowerWaterY, upperWaterRadius, overflowRadius }: Dims) {
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const jetMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const pointRef = useRef(new THREE.Vector3());
  const tangentRef = useRef(new THREE.Vector3());
  const flowTexture = useMemo(() => makeFlowTexture(), []);
  const flowTextureRef = useRef(flowTexture);

  const flow = useMemo(() => {
    const pieces: THREE.BufferGeometry[] = [];
    const arcs: THREE.QuadraticBezierCurve3[] = [];
    const fall = rimY - lowerWaterY;

    for (let index = 0; index < CROWN_STREAMS; index += 1) {
      const angle = (index / CROWN_STREAMS) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, topY + 0.025, 0),
        direction.clone().multiplyScalar(upperWaterRadius * 0.5).setY(topY + 0.72),
        direction.clone().multiplyScalar(upperWaterRadius * 0.82).setY(topY + 0.025),
      );
      arcs.push(curve);
      pieces.push(new THREE.TubeGeometry(curve, 22, 0.015, 6, false));
    }

    for (let index = 0; index < OVERFLOW_STREAMS; index += 1) {
      const angle = (index / OVERFLOW_STREAMS) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const start = direction.clone().multiplyScalar(overflowRadius).setY(rimY + 0.02);
      const control = direction.clone().multiplyScalar(overflowRadius * 1.04).setY(rimY - fall * 0.48);
      const end = direction.clone().multiplyScalar(overflowRadius * 0.92).setY(lowerWaterY + 0.025);
      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      pieces.push(new THREE.TubeGeometry(curve, 10, 0.012, 5, false));
    }

    return {
      geometry: mergeGeometries(pieces, false),
      arcs,
      fall,
    };
  }, [lowerWaterY, overflowRadius, rimY, topY, upperWaterRadius]);

  useEffect(() => () => flowTexture.dispose(), [flowTexture]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    flowTextureRef.current.offset.y = -elapsed * 1.35;
    if (jetMaterialRef.current) {
      jetMaterialRef.current.opacity = 0.72 + Math.sin(elapsed * 4.1) * 0.06;
    }

    const drops = dropsRef.current;
    if (!drops) return;
    const dummy = dummyRef.current;
    const point = pointRef.current;
    const tangent = tangentRef.current;
    let instance = 0;

    flow.arcs.forEach((curve, streamIndex) => {
      for (let bead = 0; bead < 4; bead += 1) {
        const progress = (elapsed * 0.58 + bead / 4 + streamIndex * 0.023) % 1;
        curve.getPoint(progress, point);
        curve.getTangent(progress, tangent);
        dummy.position.copy(point);
        dummy.quaternion.setFromUnitVectors(UP, tangent.normalize());
        dummy.scale.set(0.72, 1.45, 0.72);
        dummy.updateMatrix();
        drops.setMatrixAt(instance, dummy.matrix);
        instance += 1;
      }
    });

    for (let streamIndex = 0; streamIndex < OVERFLOW_STREAMS; streamIndex += 1) {
      const angle = (streamIndex / OVERFLOW_STREAMS) * Math.PI * 2;
      for (let bead = 0; bead < 2; bead += 1) {
        const progress = (elapsed * 1.18 + bead / 2 + streamIndex * 0.071) % 1;
        const radial = overflowRadius * (1 - progress * 0.08);
        dummy.position.set(
          Math.sin(angle) * radial,
          rimY + 0.02 - progress * flow.fall,
          Math.cos(angle) * radial,
        );
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(0.58, 1.5 + progress * 0.7, 0.58);
        dummy.updateMatrix();
        drops.setMatrixAt(instance, dummy.matrix);
        instance += 1;
      }
    }
    drops.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <mesh geometry={flow.geometry}>
        <meshBasicMaterial
          ref={jetMaterialRef}
          map={flowTexture}
          color="#71d5f1"
          transparent
          opacity={0.76}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh
        ref={dropsRef}
        args={[undefined, undefined, CROWN_STREAMS * 4 + OVERFLOW_STREAMS * 2]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.022, 7, 6]} />
        <meshBasicMaterial color="#b9f1ff" transparent opacity={0.78} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <CentralJet topY={topY} />
    </>
  );
}

function CentralJet({ topY }: { topY: number }) {
  const jetRef = useRef<THREE.Mesh>(null);
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (jetRef.current) {
      const pulse = 1 + Math.sin(elapsed * 5.2) * 0.055;
      jetRef.current.scale.y = pulse;
      jetRef.current.position.y = topY + 0.29 * pulse;
    }
    const drops = dropsRef.current;
    if (!drops) return;
    const dummy = dummyRef.current;
    for (let index = 0; index < 4; index += 1) {
      const progress = (elapsed * 0.9 + index / 4) % 1;
      dummy.position.set(
        Math.sin(elapsed * 2.2 + index) * 0.018 * progress,
        topY + 0.12 + progress * 0.56,
        Math.cos(elapsed * 1.8 + index) * 0.018 * progress,
      );
      dummy.scale.setScalar(0.65 + progress * 0.28);
      dummy.updateMatrix();
      drops.setMatrixAt(index, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={jetRef} position={[0, topY + 0.29, 0]}>
        <cylinderGeometry args={[0.018, 0.035, 0.58, 9]} />
        <meshBasicMaterial color="#8ae1f5" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={dropsRef} args={[undefined, undefined, 4]} frustumCulled={false}>
        <sphereGeometry args={[0.024, 7, 6]} />
        <meshBasicMaterial color="#d1f8ff" transparent opacity={0.82} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function ImpactRipples({
  y,
  placementRadius,
  streams,
  speed,
}: {
  y: number;
  placementRadius: number;
  streams: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummyRef = useRef(new THREE.Object3D());

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = state.clock.elapsedTime;
    const dummy = dummyRef.current;
    for (let index = 0; index < streams * 2; index += 1) {
      const stream = index % streams;
      const layer = Math.floor(index / streams);
      const angle = (stream / streams) * Math.PI * 2;
      const progress = (elapsed * speed + layer * 0.5 + stream * 0.037) % 1;
      dummy.position.set(
        Math.sin(angle) * placementRadius,
        y,
        Math.cos(angle) * placementRadius,
      );
      dummy.rotation.set(-Math.PI / 2, 0, angle);
      dummy.scale.setScalar(0.28 + progress * 1.15);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.2 + Math.sin(elapsed * 3.3) * 0.035;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, streams * 2]} frustumCulled={false}>
      <ringGeometry args={[0.055, 0.08, 18]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#b9edf6"
        transparent
        opacity={0.22}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function BasinWater({ y, radius }: { y: number; radius: number }) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (surfaceRef.current) {
      surfaceRef.current.rotation.z = elapsed * 0.08;
      const material = surfaceRef.current.material as THREE.MeshPhysicalMaterial;
      material.opacity = 0.32 + Math.sin(elapsed * 1.7) * 0.035;
    }
    ringsRef.current.forEach((ring, index) => {
      if (!ring) return;
      const progress = (elapsed * 0.32 + index / ringsRef.current.length) % 1;
      ring.scale.setScalar(0.4 + progress * 1.25);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.16;
    });
  });

  return (
    <group position-y={y}>
      <mesh ref={surfaceRef} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius * 2.15, 48]} />
        <meshPhysicalMaterial
          color="#3f9cba"
          emissive="#0e4052"
          emissiveIntensity={0.12}
          transparent
          opacity={0.34}
          roughness={0.12}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            ringsRef.current[index] = mesh;
          }}
          rotation-x={-Math.PI / 2}
          position-y={0.008}
        >
          <ringGeometry args={[radius * 0.78, radius * 0.82, 42]} />
          <meshBasicMaterial color="#9dddea" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Fountain({ collidable = true }: { collidable?: boolean }) {
  const { scene } = useGLTF("/models/decor/fountain.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  const [dims] = useState<Dims>(() => {
    clone.updateMatrixWorld(true);
    const fountainRoot = clone.getObjectByName("fountain");
    const waterMesh = clone.getObjectByName("fountain_water");
    if (!fountainRoot || !(waterMesh instanceof THREE.Mesh)) {
      throw new Error("Fountain model is missing its fountain or fountain_water mesh");
    }

    const fountainMeshes: THREE.Mesh[] = [];
    fountainRoot.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name !== "fountain_water" && object.name !== "fountain_leaves") {
        fountainMeshes.push(object);
      }
    });
    if (fountainMeshes.length === 0) throw new Error("Fountain model has no structural mesh");

    const fountainBox = new THREE.Box3();
    fountainMeshes.forEach((mesh) => fountainBox.expandByObject(mesh));
    const waterBox = new THREE.Box3().setFromObject(waterMesh);
    const box = new THREE.Box3().setFromObject(clone);
    const rimRadius = Math.max(...fountainMeshes.map((mesh) => radiusAtTop(mesh, fountainBox.max.y)));
    const upperWaterRadius = radiusAtTop(waterMesh, waterBox.max.y);
    return {
      topY: waterBox.max.y * SCALE,
      rimY: fountainBox.max.y * SCALE,
      lowerWaterY: waterBox.min.y * SCALE,
      radius: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.135 * SCALE,
      upperWaterRadius: upperWaterRadius * SCALE,
      overflowRadius: rimRadius * SCALE + 0.025,
    };
  });
  const basinY = dims.lowerWaterY + 0.015;

  useEffect(() => {
    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.name === "fountain_water") {
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#2f8ca9",
          emissive: "#123b4d",
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.76,
          roughness: 0.16,
          metalness: 0.04,
        });
      } else if (mesh.name === "fountain_leaves") {
        mesh.material = new THREE.MeshStandardMaterial({ color: "#4caf50", roughness: 0.8 });
      }
    });
  }, [clone]);

  useEffect(() => {
    if (!collidable) return;
    const box = new THREE.Box3(
      new THREE.Vector3(-COLLIDER_RADIUS, 0, -COLLIDER_RADIUS),
      new THREE.Vector3(COLLIDER_RADIUS, 2, COLLIDER_RADIUS),
    );
    return registerCollider(box);
  }, [collidable]);

  return (
    <group>
      <primitive object={clone} scale={SCALE} />
      <pointLight position={[0, 1.1, 0]} color="#69c6ea" intensity={0.42} distance={5} />
      <BasinWater y={basinY} radius={dims.radius} />
      <MovingStreams {...dims} />
      <ImpactRipples
        y={dims.topY + 0.035}
        placementRadius={dims.upperWaterRadius * 0.82}
        streams={CROWN_STREAMS}
        speed={0.58}
      />
      <ImpactRipples
        y={basinY + 0.018}
        placementRadius={dims.overflowRadius * 0.92}
        streams={OVERFLOW_STREAMS}
        speed={1.18}
      />
    </group>
  );
}

useGLTF.preload("/models/decor/fountain.glb");
