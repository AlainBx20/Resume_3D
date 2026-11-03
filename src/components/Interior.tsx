import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { audio } from "../audio";
import TvScreen from "./TvScreen";
import RoomExtras from "./Extras";
import { RoomParts } from "./Repair";
import { partItemId, partsInRoom } from "../parts";
import { extraItemId, interiorExtras } from "../achievements";
import { PAINT_H, PAINT_W, drawPainting } from "../paintings";
import { buildings, interiorLayouts, interiorDecor, type SectionId } from "../content";
import { useTownStore, type InteriorItem } from "../store";
import FurnitureItem from "./FurnitureItem";
import DecorItem from "./DecorItem";
import WorldText from "./WorldText";
import Doorway from "./Doorway";
import WindowGlass from "./WindowGlass";

const ROOM_WIDTH = 10;
const ROOM_DEPTH = 8;
const ROOM_HEIGHT = 4;
const DOORWAY_WIDTH = 2.4;
const SIDE_WALL_WIDTH = (ROOM_WIDTH - DOORWAY_WIDTH) / 2;
const SIDE_WALL_OFFSET = DOORWAY_WIDTH / 2 + SIDE_WALL_WIDTH / 2;
const EXIT_POSITION: [number, number, number] = [0, 0, 3.6];
const LIGHT_POSITION: [number, number, number] = [-1.9, 0, 3.6];
const WOOD = "#5b4632";

const ROOM_THEMES: Record<SectionId, { floor: string; trim: string; rugGlow: string }> = {
  about: { floor: "#b89973", trim: "#4d7692", rugGlow: "#6cc3ff" },
  education: { floor: "#ae987a", trim: "#735da0", rugGlow: "#b388ff" },
  experience: { floor: "#a78c6e", trim: "#9a6834", rugGlow: "#ffb84d" },
  skills: { floor: "#9e9475", trim: "#39785c", rugGlow: "#5dffb0" },
  projects: { floor: "#a58a78", trim: "#94445c", rugGlow: "#ff6e8c" },
  contact: { floor: "#aa9672", trim: "#8d7938", rugGlow: "#ffe066" },
};

function InteractionMarker({ item, color, labelY = 1.7 }: { item: InteriorItem; color: string; labelY?: number }) {
  return (
    <group position={[item.position[0], 0.025, item.position[2]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      <Billboard position={[0, labelY, 0]}>
        <WorldText
          fontSize={0.13}
          maxWidth={3.2}
          textAlign="center"
          color="#ffffff"
          outlineWidth={0.016}
          outlineColor="#111827"
        >
          {item.label}
        </WorldText>
      </Billboard>
    </group>
  );
}

// Fades the room between lit and dim when the wall switch is toggled.
function RoomLights() {
  const on = useTownStore((s) => s.roomLight);
  const party = useTownStore((s) => s.partyOn);
  const ambient = useRef<THREE.AmbientLight>(null);
  const point = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ambient.current) ambient.current.intensity += ((on ? 0.55 : 0.07) - ambient.current.intensity) * 0.12;
    if (point.current) {
      const target = party ? 18 + Math.sin(t * 8) * 8 : on ? 26 : 1.5;
      point.current.intensity += (target - point.current.intensity) * 0.2;
      if (party) point.current.color.setHSL((t * 0.6) % 1, 0.9, 0.6);
      else point.current.color.set("#ffe8c4");
    }
  });
  return (
    <>
      <ambientLight ref={ambient} intensity={0.55} color="#fff7e8" />
      {/* physically-decaying light needs real power to carry a 10m room */}
      <pointLight ref={point} position={[0, ROOM_HEIGHT - 0.75, 0]} intensity={26} color="#ffe8c4" distance={16} decay={2} castShadow />
    </>
  );
}

function LightSwitchPlate() {
  const on = useTownStore((s) => s.roomLight);
  return (
    <group position={[LIGHT_POSITION[0], 1.3, ROOM_DEPTH / 2 - 0.12]} rotation-y={Math.PI}>
      <mesh>
        <boxGeometry args={[0.14, 0.22, 0.02]} />
        <meshStandardMaterial color="#f2efe8" roughness={0.6} />
      </mesh>
      <mesh position={[0, on ? 0.035 : -0.035, 0.02]}>
        <boxGeometry args={[0.04, 0.07, 0.02]} />
        <meshStandardMaterial color={on ? "#ffd24d" : "#b9b5ab"} emissive={on ? "#ffd24d" : "#000000"} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// A framed picture on the wall, painted to represent its room's story.
function WallArt({ room, side, position, rotationY }: { room: SectionId; side: 0 | 1; position: [number, number, number]; rotationY: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = PAINT_W;
    canvas.height = PAINT_H;
    const ctx = canvas.getContext("2d");
    if (ctx) drawPainting(ctx, room, side);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [room, side]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[1.15, 0.9, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.98, 0.73]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

// A glowing "window" set into a side wall — fakes daylight and gives the
// windowless box rooms some depth.
function Window({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[1.5, 1.15, 0.06]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      <group position={[0, 0, 0.035]}>
        <WindowGlass />
      </group>
      {/* cross mullions */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.05, 0.95, 0.02]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.3, 0.05, 0.02]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  );
}

export default function Interior({ id }: { id: SectionId }) {
  const def = buildings.find((b) => b.id === id)!;
  const items = interiorLayouts[id];
  const decor = interiorDecor[id];
  const theme = ROOM_THEMES[id];
  const { scene: ceilingLamp } = useGLTF("/models/furniture/lampSquareCeiling.glb");
  const setInteriorItems = useTownStore((s) => s.setInteriorItems);

  const wallColor = useMemo(
    () => `#${new THREE.Color(def.color).lerp(new THREE.Color("#ffffff"), 0.85).getHexString()}`,
    [def.color]
  );

  const lampClone = useMemo(() => ceilingLamp.clone(), [ceilingLamp]);

  const radioOn = useTownStore((s) => s.radioOn);
  const stars = useTownStore((s) => s.stars);
  const foundParts = useTownStore((s) => s.parts);
  const radioStation = useTownStore((s) => s.radioStation);
  useEffect(() => {
    audio.setRadio(radioOn, radioStation);
  }, [radioOn, radioStation]);
  useEffect(() => () => audio.setRadio(false, 0), []);

  useEffect(() => {
    const list: InteriorItem[] = items.map((it, i) => ({
      itemId: `${id}-${i}`,
      index: i,
      position: it.position,
      label: it.label,
      kind: it.kind,
    }));
    list.push({ itemId: "__exit__", index: -1, position: EXIT_POSITION, label: "Exit" });
    list.push({ itemId: "__light__", index: -2, position: LIGHT_POSITION, label: "Light switch", kind: "light" });
    interiorExtras[id].forEach((extra, i) => {
      const itemId = extraItemId(id, i);
      if (extra.kind === "star" && stars.includes(itemId)) return;
      list.push({ itemId, index: -10 - i, position: extra.position, label: extra.label, kind: extra.kind });
    });
    partsInRoom(id).forEach((p) => {
      if (foundParts.includes(p.id)) return;
      list.push({ itemId: partItemId(p.id), index: -30, position: [p.x, 0.4, p.z], label: p.label, kind: "part" });
    });
    setInteriorItems(list);
    return () => setInteriorItems([]);
  }, [id, items, setInteriorItems, stars, foundParts]);

  return (
    <group>
      <RoomExtras id={id} />
      <RoomParts room={id} />
      <RoomLights />
      <LightSwitchPlate />

      <mesh position={[0, 0, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={theme.floor} roughness={0.82} />
      </mesh>

      {/* inset floor field gives each room a deliberate gallery-like layout */}
      <mesh position={[0, 0.008, -0.1]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8.9, 6.9]} />
        <meshStandardMaterial color={theme.floor} roughness={0.94} metalness={0.02} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#fffaf0" roughness={1} />
      </mesh>

      {/* hanging light fixture under the main point light */}
      <primitive
        object={lampClone}
        position={[-0.16, ROOM_HEIGHT - 0.6, 0.16]}
        scale={2.6}
      />

      {/* north wall (back of the room) */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* colored wainscot ties the room to its building and differentiates all six interiors */}
      <mesh position={[0, 0.62, -ROOM_DEPTH / 2 + 0.12]} receiveShadow>
        <boxGeometry args={[ROOM_WIDTH - 0.25, 1.15, 0.08]} />
        <meshStandardMaterial color={theme.trim} roughness={0.8} />
      </mesh>
      <mesh position={[ROOM_WIDTH / 2 - 0.12, 0.62, 0]} receiveShadow>
        <boxGeometry args={[0.08, 1.15, ROOM_DEPTH - 0.25]} />
        <meshStandardMaterial color={theme.trim} roughness={0.8} />
      </mesh>
      <mesh position={[-ROOM_WIDTH / 2 + 0.12, 0.62, 0]} receiveShadow>
        <boxGeometry args={[0.08, 1.15, ROOM_DEPTH - 0.25]} />
        <meshStandardMaterial color={theme.trim} roughness={0.8} />
      </mesh>

      <WorldText
        position={[0, 3.3, -ROOM_DEPTH / 2 + 0.13]}
        fontSize={0.5}
        color={def.color}
        outlineWidth={0.012}
        outlineColor="#ffffff"
      >
        {def.title}
      </WorldText>
      <WorldText
        position={[0, 2.88, -ROOM_DEPTH / 2 + 0.135]}
        fontSize={0.16}
        color="#5d6470"
      >
        {def.subtitle}
      </WorldText>

      {/* east / west walls */}
      <mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* south wall, split to leave an open doorway */}
      <mesh position={[-SIDE_WALL_OFFSET, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[SIDE_WALL_WIDTH, ROOM_HEIGHT, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <mesh position={[SIDE_WALL_OFFSET, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[SIDE_WALL_WIDTH, ROOM_HEIGHT, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* windows on the side walls, art on the back wall */}
      <Window position={[-ROOM_WIDTH / 2 + 0.12, 2.15, -1.2]} rotationY={Math.PI / 2} />
      <Window position={[ROOM_WIDTH / 2 - 0.12, 2.15, -1.2]} rotationY={-Math.PI / 2} />
      <WallArt room={id} side={0} position={[-2.9, 2.5, -ROOM_DEPTH / 2 + 0.13]} rotationY={0} />
      <WallArt room={id} side={1} position={[2.9, 2.5, -ROOM_DEPTH / 2 + 0.13]} rotationY={0} />

      <mesh position={[EXIT_POSITION[0], 0.02, EXIT_POSITION[2]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.5, 0.7, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* real door filling the exit opening (was a black void) */}
      <Doorway wallColor={wallColor} sectionId={id} />

      {decor.map((it, i) => (
        <DecorItem key={`decor-${id}-${i}`} def={it} />
      ))}

      {items.map((it, i) => (
        <FurnitureItem key={`${id}-${i}`} def={it} />
      ))}

      {items.map((it, i) =>
        it.kind === "tv" ? <TvScreen key={`tv-${id}-${i}`} def={it} /> : null
      )}

      {items.map((it, i) => (
        <InteractionMarker
          key={`marker-${id}-${i}`}
          item={{ itemId: `${id}-${i}`, index: i, position: it.position, label: it.label }}
          color={theme.rugGlow}
          labelY={it.kind === "tv" ? 2.35 : 1.7}
        />
      ))}
    </group>
  );
}

const allInteriorModels = new Set<string>(["/models/furniture/lampSquareCeiling.glb"]);
Object.values(interiorLayouts).forEach((items) => items.forEach((it) => allInteriorModels.add(it.model)));
Object.values(interiorDecor).forEach((items) => items.forEach((it) => allInteriorModels.add(it.model)));
allInteriorModels.forEach((path) => useGLTF.preload(path));
