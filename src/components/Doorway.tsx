import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { buildings, type BuildingDef, type SectionId } from "../content";
import { useTownStore } from "../store";
import Fountain from "./Fountain";
import Ground from "./Ground";
import InstancedTrees from "./InstancedTrees";
import MountainRange from "./MountainRange";
import Pathways from "./Pathways";
import Rain from "./Rain";
import Snow from "./Snow";

// A real wooden double-door filling the room's exit gap (south wall, z = +4).
// Beyond it is a live, 1:1 reconstruction of the outdoor town. The whole
// town is rotated around the current house, so every doorway has the same view
// it would have if the interior physically occupied its exterior building.
const WALL_Z = 4; // ROOM_DEPTH / 2
const GAP_W = 2.4; // DOORWAY_WIDTH
const ROOM_H = 4;
const PORTAL_SCALE = 1;
// Pathways stop four metres short of each building centre, exactly where the
// visible facade/entrance sits. Anchoring that point to the room threshold
// makes the portal a true 1:1 exterior view rather than a decorative diorama.
const FACADE_CLEARANCE = 4;

const FRAME = "#4a3524";
const DOOR = "#7c5a38";
const PANEL = "#6a4c2f";
const HANDLE = "#d9b65a";
const LAMP_MODEL = "/models/roads/light-square.glb";
const PLANTER_MODEL = "/models/suburban/planter.glb";
const LAMP_SCALE = 5;
const LAMP_RADIUS = 7.2;
const BULB_LOCAL: [number, number, number] = [0, 0.57 * LAMP_SCALE, -0.19 * LAMP_SCALE];

function PortalSky() {
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  const colorRef = useRef<THREE.BufferAttribute>(null);
  const mixedRef = useRef(new THREE.Color());
  const colorValues = useMemo(() => new Float32Array(34 * 3), []);

  useFrame(() => {
    const geometry = geometryRef.current;
    const colors = colorRef.current;
    if (!geometry || !colors) return;
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const mixed = mixedRef.current;
    for (let index = 0; index < positions.count; index += 1) {
      const height = THREE.MathUtils.clamp(positions.getY(index) / 142 + 0.5, 0, 1);
      mixed.copy(atm.skyHorizon).lerp(atm.skyZenith, height);
      colors.setXYZ(index, mixed.r, mixed.g, mixed.b);
    }
    colors.needsUpdate = true;
  });

  return (
    <mesh position={[0, 28, WALL_Z + 146]}>
      <planeGeometry ref={geometryRef} args={[390, 142, 1, 16]}>
        <bufferAttribute ref={colorRef} attach="attributes-color" args={[colorValues, 3]} />
      </planeGeometry>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function PortalWeather() {
  // The outdoor particle rigs are compressed into a volume beginning just
  // beyond the threshold. Walls occlude that volume, so weather is visible
  // through the opening without rain or snow ever appearing inside the room.
  return (
    <group position={[0, 0, WALL_Z + 5.2]} scale={[0.28, 0.32, 0.18]}>
      <Rain anchor={[0, 0, 0]} splashes={false} />
      <Snow anchor={[0, 0, 0]} />
    </group>
  );
}

function PortalBuilding({ def }: { def: BuildingDef }) {
  const { scene } = useGLTF(def.model);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const windowLightRef = useRef<THREE.PointLight>(null);
  const facingY = Math.atan2(def.position[0], def.position[2]) + Math.PI;

  useEffect(() => {
    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [clone]);

  useFrame(() => {
    if (!windowLightRef.current) return;
    windowLightRef.current.intensity =
      1.6 * THREE.MathUtils.clamp(1 - atm.day * 1.5, 0.08, 1);
  });

  return (
    <group position={def.position} rotation-y={facingY} scale={def.scale}>
      <primitive object={clone} position-y={-0.1} />
      <pointLight
        ref={windowLightRef}
        position={[0, 2.2, 1.6]}
        color="#ffcf87"
        intensity={0.2}
        distance={14}
        decay={2}
      />
    </group>
  );
}

function PortalLamp({ angle }: { angle: number }) {
  const { scene } = useGLTF(LAMP_MODEL);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const bulbRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [clone]);

  useFrame((state) => {
    if (!bulbRef.current) return;
    const lit = THREE.MathUtils.clamp(1 - atm.day * 1.8, 0, 1);
    const waking = lit > 0.04 && lit < 0.88;
    const flicker = waking && Math.sin(state.clock.elapsedTime * 31 + angle * 11) < -0.15 ? 0.18 : 1;
    bulbRef.current.emissiveIntensity = lit * flicker * 3.2;
  });

  const x = Math.sin(angle) * LAMP_RADIUS;
  const z = Math.cos(angle) * LAMP_RADIUS;

  return (
    <group position={[x, 0, z]} rotation-y={angle}>
      <primitive object={clone} scale={LAMP_SCALE} />
      <mesh position={BULB_LOCAL}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          ref={bulbRef}
          color="#ffd68c"
          emissive="#ffbe5a"
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function PortalLamps() {
  const angles = useMemo(() => {
    const buildingAngles = buildings
      .map((building) => Math.atan2(building.position[0], building.position[2]))
      .sort((a, b) => a - b);
    return buildingAngles.map((angle, index) => {
      const next =
        index + 1 < buildingAngles.length
          ? buildingAngles[index + 1]
          : buildingAngles[0] + Math.PI * 2;
      return (angle + next) / 2;
    });
  }, []);

  return angles.map((angle, index) => <PortalLamp key={index} angle={angle} />);
}

function PortalGarden() {
  const { scene } = useGLTF(PLANTER_MODEL);
  const planters = useMemo(
    () =>
      [0, 1, 2, 3].map((index) => {
        const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
        return {
          object: scene.clone(true),
          position: [Math.sin(angle) * 3.6, 0, Math.cos(angle) * 3.6] as [number, number, number],
          rotation: angle,
        };
      }),
    [scene],
  );

  return planters.map((planter, index) => (
    <primitive
      key={index}
      object={planter.object}
      position={planter.position}
      rotation-y={planter.rotation}
      scale={1.6}
    />
  ));
}

function ExteriorView({ sectionId }: { sectionId: SectionId }) {
  const current = buildings.find((building) => building.id === sectionId)!;
  const distanceToPlaza = Math.hypot(current.position[0], current.position[2]);
  // Rotate the real world so the vector from this house to the plaza becomes
  // the interior's +Z direction (straight through the open doorway).
  const townRotation = Math.atan2(current.position[0], -current.position[2]);

  return (
    <group>
      <PortalSky />
      <PortalWeather />

      {/* Plaza-origin world, translated so this house's true front step lands
          exactly behind the threshold. The tiny negative Y keeps the room's
          own floor above any part of the outdoor ground that extends inward. */}
      <group
        position={[
          0,
          -0.055,
          WALL_Z + 0.12 + (distanceToPlaza - FACADE_CLEARANCE) * PORTAL_SCALE,
        ]}
        rotation-y={townRotation}
        scale={PORTAL_SCALE}
      >
        <Ground />
        <Pathways />
        <MountainRange />
        <InstancedTrees />
        <PortalGarden />
        <PortalLamps />
        <Fountain collidable={false} />
        {buildings
          .filter((building) => building.id !== sectionId)
          .map((building) => (
            <PortalBuilding key={building.id} def={building} />
          ))}
      </group>
    </group>
  );
}

function Leaf({
  hingeX,
  dir,
  innerRef,
}: {
  hingeX: number;
  dir: number;
  innerRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={innerRef} position={[hingeX, 1.25, WALL_Z - 0.06]}>
      <group position={[dir * 0.48, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.96, 2.5, 0.08]} />
          <meshStandardMaterial color={DOOR} roughness={0.7} />
        </mesh>
        {[0.55, -0.55].map((py) => (
          <mesh key={py} position={[0, py, -0.05]}>
            <boxGeometry args={[0.62, 0.95, 0.03]} />
            <meshStandardMaterial color={PANEL} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[dir * 0.36, 0, -0.08]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
          <meshStandardMaterial color={HANDLE} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export default function Doorway({ wallColor, sectionId }: { wallColor: string; sectionId: SectionId }) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const openRef = useRef(0);
  const nearbyItemId = useTownStore((state) => state.nearbyItemId);

  useFrame((_, delta) => {
    const target = nearbyItemId === "__exit__" ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(delta * 6, 1);
    const angle = openRef.current * Math.PI * 0.6;
    if (leftRef.current) leftRef.current.rotation.y = angle;
    if (rightRef.current) rightRef.current.rotation.y = -angle;
  });

  return (
    <group>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.35, WALL_Z]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 2.7, 0.18]} />
          <meshStandardMaterial color={FRAME} roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 2.6, WALL_Z]} castShadow receiveShadow>
        <boxGeometry args={[GAP_W, 0.22, 0.18]} />
        <meshStandardMaterial color={FRAME} roughness={0.75} />
      </mesh>
      <ExteriorView sectionId={sectionId} />
      <mesh position={[0, (2.7 + ROOM_H) / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[GAP_W, ROOM_H - 2.7, 0.14]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <Leaf hingeX={-0.98} dir={1} innerRef={leftRef} />
      <Leaf hingeX={0.98} dir={-1} innerRef={rightRef} />
    </group>
  );
}

useGLTF.preload(LAMP_MODEL);
useGLTF.preload(PLANTER_MODEL);
