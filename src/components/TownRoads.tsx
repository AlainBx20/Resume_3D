import { useMemo } from "react";
import * as THREE from "three";
import {
  ENTRY_ROAD_END_Z,
  ENTRY_ROAD_START_Z,
  ROAD_HALF_WIDTH,
  townRoadCurve,
} from "../roads";

const ROAD_SEGMENTS = 180;
const DASH_COUNT = 48;

function makeRoadRibbon(halfWidth: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const side = new THREE.Vector3();

  for (let index = 0; index <= ROAD_SEGMENTS; index += 1) {
    const t = index / ROAD_SEGMENTS;
    const point = townRoadCurve.getPointAt(t);
    const tangent = townRoadCurve.getTangentAt(t).normalize();
    side.set(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    positions.push(
      point.x + side.x, 0, point.z + side.z,
      point.x - side.x, 0, point.z - side.z,
    );
    uvs.push(0, t * 24, 1, t * 24);
    if (index < ROAD_SEGMENTS) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function TunnelEntrance() {
  return (
    <group>
      {/* a short visible tunnel bore ends at a dark back wall before the foothill */}
      <mesh position={[0, 1.58, 44.18]}>
        <planeGeometry args={[5.25, 3.15]} />
        <meshBasicMaterial color="#030609" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.1, 44.17]}>
        <circleGeometry args={[2.62, 32, 0, Math.PI]} />
        <meshBasicMaterial color="#030609" side={THREE.DoubleSide} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.02, 1.55, 41.55]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 3.1, 1.05]} />
          <meshStandardMaterial color="#68717c" roughness={0.96} />
        </mesh>
      ))}
      <mesh position={[0, 3.1, 41.55]} castShadow receiveShadow>
        <torusGeometry args={[2.62, 0.42, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#68717c" roughness={0.96} />
      </mesh>

      {/* visible underground continuation beyond the portal */}
      <mesh position={[0, -0.08, 42.8]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[5.15, 2.55]} />
        <meshStandardMaterial color="#252b31" roughness={0.92} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`wall-${side}`} position={[side * 2.72, 1.55, 42.8]} receiveShadow>
          <boxGeometry args={[0.34, 3.1, 2.5]} />
          <meshStandardMaterial color="#303840" roughness={0.98} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) =>
        [42.25, 43.45].map((z) => (
          <mesh key={`${side}-${z}`} position={[side * 2.52, 2.3, z]}>
            <boxGeometry args={[0.09, 0.38, 0.28]} />
            <meshStandardMaterial color="#ffe4a0" emissive="#ffc45a" emissiveIntensity={3.2} />
          </mesh>
        )),
      )}
      <pointLight position={[0, 2.4, 42.75]} color="#ffc36b" intensity={28} distance={7} decay={2} />
      {[42.25, 43.65].map((z) => (
        <mesh key={`tunnel-dash-${z}`} position={[0, -0.045, z]}>
          <boxGeometry args={[0.13, 0.025, 1.3]} />
          <meshBasicMaterial color="#d8c36e" toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`rock-${side}`} position={[side * 4.05, 1.25, 41.9]} scale={[2.1, 1.6, 2.25]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#394650" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function TownRoads() {
  const asphalt = useMemo(() => makeRoadRibbon(ROAD_HALF_WIDTH), []);
  const shoulder = useMemo(() => makeRoadRibbon(ROAD_HALF_WIDTH + 0.32), []);
  const dashes = useMemo(
    () =>
      Array.from({ length: DASH_COUNT }, (_, index) => {
        const t = (index + 0.5) / DASH_COUNT;
        const point = townRoadCurve.getPointAt(t);
        const tangent = townRoadCurve.getTangentAt(t).normalize();
        return {
          position: [point.x, 0.064, point.z] as [number, number, number],
          rotationY: Math.atan2(tangent.x, tangent.z),
        };
      }),
    [],
  );
  const entryLength = ENTRY_ROAD_END_Z - ENTRY_ROAD_START_Z;
  const entryCenter = ENTRY_ROAD_START_Z + entryLength / 2;

  return (
    <group>
      <mesh geometry={shoulder} position-y={0.027} receiveShadow>
        <meshStandardMaterial color="#9aa0a5" roughness={0.95} />
      </mesh>
      <mesh geometry={asphalt} position-y={0.034} receiveShadow>
        <meshStandardMaterial color="#41484e" roughness={0.88} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.026, entryCenter]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[(ROAD_HALF_WIDTH + 0.32) * 2, entryLength]} />
        <meshStandardMaterial color="#9aa0a5" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.038, entryCenter]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, entryLength]} />
        <meshStandardMaterial color="#41484e" roughness={0.88} metalness={0.02} />
      </mesh>

      {dashes.map((dash, index) => (
        <mesh key={`ring-dash-${index}`} position={dash.position} rotation-y={dash.rotationY}>
          <boxGeometry args={[0.13, 0.022, 1.3]} />
          <meshBasicMaterial color="#f5dc78" toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, index) => (
        <mesh
          key={`entry-dash-${index}`}
          position={[0, 0.064, ENTRY_ROAD_START_Z + 1.6 + index * 2.65]}
        >
          <boxGeometry args={[0.13, 0.022, 1.3]} />
          <meshBasicMaterial color="#f5dc78" toneMapped={false} />
        </mesh>
      ))}
      <TunnelEntrance />
    </group>
  );
}
