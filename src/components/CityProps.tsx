import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { buildings } from "../content";
import { mulberry32 } from "../rand";

const CITY = "/models/kaykit/city/";

// Bush clumps around the buildings and across the lawn — stylized KayKit
// greenery to make the town feel lived-in without roadside clutter.
function Model({ url, position, rotationY = 0, scale = 1 }: { url: string; position: [number, number, number]; rotationY?: number; scale?: number }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return <primitive object={clone} position={position} rotation-y={rotationY} scale={scale} />;
}

export default function CityProps() {
  // bush clumps hugging the building bases and scattered on the lawn
  const bushes = useMemo(() => {
    const rng = mulberry32(88);
    const list: { position: [number, number, number]; scale: number; rotationY: number }[] = [];
    for (const b of buildings) {
      const angle = Math.atan2(b.position[0], b.position[2]);
      const r = Math.hypot(b.position[0], b.position[2]);
      for (let i = 0; i < 4; i++) {
        const off = (rng() - 0.5) * 4.5;
        const rr = r + 2.2 + rng() * 0.8;
        list.push({
          position: [Math.sin(angle) * rr + Math.cos(angle) * off, 0, Math.cos(angle) * rr - Math.sin(angle) * off],
          scale: 3 + rng() * 2,
          rotationY: rng() * Math.PI * 2,
        });
      }
    }
    // a ring of clumps further out on the lawn
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rng() * 0.3;
      const rr = 15 + rng() * 2.5;
      list.push({
        position: [Math.sin(a) * rr, 0, Math.cos(a) * rr],
        scale: 3 + rng() * 2.5,
        rotationY: rng() * Math.PI * 2,
      });
    }
    return list;
  }, []);

  return (
    <>
      {bushes.map((b, i) => (
        <Model key={`bush-${i}`} url={`${CITY}bush.glb`} position={b.position} rotationY={b.rotationY} scale={b.scale} />
      ))}
    </>
  );
}

useGLTF.preload(`${CITY}bush.glb`);
