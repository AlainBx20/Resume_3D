import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureItemDef } from "../content";
import { useTownStore } from "../store";
import { drawTv, TV_H, TV_W } from "../tvShows";
import { EXHIBIT_SCALE } from "./FurnitureItem";

const CANVAS_SCALE = 1.5;
const FRAME_INTERVAL = 1 / 20;

// Screen proportions measured from televisionModern.glb: the flat screen
// plane spans 97.6% of the width, 81% of the height, starts 17% up and sits
// recessed at one sixth of the depth in front of the model's centre.
const SCREEN_W = 0.9755;
const SCREEN_H = 0.8102;
const SCREEN_BOTTOM = 0.171;
const SCREEN_Z = 1 / 6;

/** Live TV image + glow laid over the television model of a layout item. */
export default function TvScreen({ def }: { def: FurnitureItemDef }) {
  const { scene } = useGLTF(def.model);
  const tvOn = useTownStore((s) => s.tvOn);
  const channel = useTownStore((s) => s.tvChannel);

  const size = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const dimensions = box.getSize(new THREE.Vector3());
    return { w: dimensions.x, h: dimensions.y, d: dimensions.z, minY: box.min.y };
  }, [scene]);

  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = TV_W * CANVAS_SCALE;
    element.height = TV_H * CANVAS_SCALE;
    return element;
  }, []);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [canvas]);
  useEffect(() => () => texture.dispose(), [texture]);

  const switchedAt = useRef<number | null>(0);
  const lastDraw = useRef(0);
  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    switchedAt.current = null; // restamped with the clock on the next frame
  }, [tvOn, channel]);

  /* eslint-disable react-hooks/immutability -- per-frame mutation of refs and GPU texture is intended */
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (switchedAt.current === null) switchedAt.current = now;
    const light = lightRef.current;
    if (light) light.intensity += ((tvOn ? 2.2 : 0) - light.intensity) * 0.15;
    if (!tvOn || now - lastDraw.current < FRAME_INTERVAL) return;
    lastDraw.current = now;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
    drawTv(ctx, channel, now, now - switchedAt.current);
    ctx.restore();
    texture.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  const screenY = size.minY + size.h * (SCREEN_BOTTOM + SCREEN_H / 2);
  const screenZ = size.d * SCREEN_Z + 0.002;

  return (
    <group position={def.position} rotation-y={def.rotationY ?? 0} scale={def.scale ?? EXHIBIT_SCALE}>
      <mesh position={[0, screenY, screenZ]} visible={tvOn}>
        <planeGeometry args={[size.w * SCREEN_W, size.h * SCREEN_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, screenY, screenZ]} visible={!tvOn}>
        <planeGeometry args={[size.w * SCREEN_W, size.h * SCREEN_H]} />
        <meshStandardMaterial color="#06080c" roughness={0.18} metalness={0.4} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, screenY - size.h * 0.1, size.d / 2 + 0.9]}
        color="#9cc8ff"
        intensity={0}
        distance={5}
        decay={2}
      />
    </group>
  );
}
