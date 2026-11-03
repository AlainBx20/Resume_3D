import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { registerCollider } from "../collision";
import { useTownStore } from "../store";
import { PARTS, partsInRoom } from "../parts";
import type { Extra } from "../achievements";
import type { SectionId } from "../content";

function PartChip({ x, z, color }: { x: number; z: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 1.3;
    g.position.y = 0.4 + Math.sin(t * 2.4) * 0.05;
  });
  return (
    <group ref={ref} position={[x, 0.4, z]}>
      <mesh>
        <boxGeometry args={[0.3, 0.04, 0.18]} />
        <meshStandardMaterial color="#14532d" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.12, 0.05, 0.1]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.03, 0.1]}>
        <boxGeometry args={[0.26, 0.03, 0.02]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
      </mesh>
      <pointLight color={color} intensity={0.35} distance={1.3} decay={2} />
    </group>
  );
}

export function RoomParts({ room }: { room: SectionId }) {
  const found = useTownStore((s) => s.parts);
  const here = useMemo(() => partsInRoom(room), [room]);
  return (
    <>
      {here
        .filter((p) => !found.includes(p.id))
        .map((p) => (
          <PartChip key={p.id} x={p.x} z={p.z} color={p.color} />
        ))}
    </>
  );
}

function screenTexture(fixed: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = fixed ? "#04140a" : "#0b0b10";
  ctx.fillRect(0, 0, 256, 160);
  if (fixed) {
    ctx.fillStyle = "#3dff8a";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ONLINE", 128, 70);
    ctx.font = "13px monospace";
    ctx.fillText("press E to open the Vault", 128, 98);
  } else {
    ctx.strokeStyle = "#8fa3c4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(120, 50);
    ctx.lineTo(160, 80);
    ctx.lineTo(110, 160);
    ctx.moveTo(120, 50);
    ctx.lineTo(60, 70);
    ctx.stroke();
    ctx.fillStyle = "#ff5a5a";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("NO BOOT DEVICE", 128, 125);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function BrokenPc({ extra }: { extra: Extra }) {
  const fixed = useTownStore((s) => s.pcFixed);
  const found = useTownStore((s) => s.parts);
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const broken = useMemo(() => screenTexture(false), []);
  const online = useMemo(() => screenTexture(true), []);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    box.expandByScalar(0.05);
    return registerCollider(box);
  }, []);

  useFrame((state) => {
    const l = lightRef.current;
    if (!l) return;
    const t = state.clock.elapsedTime;
    l.intensity = fixed ? 0.5 : Math.random() < 0.06 ? 1.1 : 0.12 + Math.sin(t * 3) * 0.04;
  });

  return (
    <group ref={groupRef} position={[extra.position[0], 0, extra.position[2]]} rotation-y={-Math.PI / 2}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.06, 0.75]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.7} />
      </mesh>
      {[-0.68, 0.68].flatMap((x) => [-0.32, 0.32].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#4a3320" roughness={0.8} />
        </mesh>
      )))}
      <mesh position={[-0.25, 1.02, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.06]} />
        <meshStandardMaterial color="#1c1f26" roughness={0.5} />
      </mesh>
      <mesh position={[-0.25, 1.02, 0.035]}>
        <planeGeometry args={[0.62, 0.42]} />
        <meshBasicMaterial map={fixed ? online : broken} toneMapped={false} />
      </mesh>
      <mesh position={[-0.25, 0.8, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshStandardMaterial color="#1c1f26" />
      </mesh>
      <mesh position={[0.45, 0.98, 0.02]} castShadow>
        <boxGeometry args={[0.32, 0.5, 0.55]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* one glowing slot per part, lit once that part has been found */}
      {PARTS.map((p, i) => (
        <mesh key={p.id} position={[0.45, 1.14 - i * 0.1, 0.3]}>
          <boxGeometry args={[0.22, 0.05, 0.01]} />
          <meshBasicMaterial color={found.includes(p.id) ? p.color : "#3a1010"} toneMapped={false} />
        </mesh>
      ))}
      <pointLight ref={lightRef} position={[0.1, 1.1, 0.5]} color={fixed ? "#3dff8a" : "#ff4a3a"} distance={2.2} decay={2} />
    </group>
  );
}
