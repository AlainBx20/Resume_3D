import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { buildings } from "../content";
import { mulberry32 } from "../rand";

const CITY = "/models/kaykit/city/";
const CARS = [`${CITY}car_hatchback.glb`, `${CITY}car_sedan.glb`, `${CITY}car_taxi.glb`, `${CITY}car_stationwagon.glb`];

// A few parked cars beside buildings, plus bush clumps and a couple of fire
// hydrants — stylized KayKit city props to make the town feel lived-in.
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
  // parked cars beside three buildings, pulled off to the grass shoulder
  const cars = useMemo(() => {
    const rng = mulberry32(2024);
    return buildings
      .filter((_, i) => i % 2 === 0)
      .map((b, i) => {
        const angle = Math.atan2(b.position[0], b.position[2]);
        const side = i % 2 === 0 ? 1 : -1;
        // sit just outside the building, parallel to the facade
        const r = Math.hypot(b.position[0], b.position[2]) + 3.4;
        const px = Math.sin(angle) * r + Math.cos(angle) * side * 2.6;
        const pz = Math.cos(angle) * r - Math.sin(angle) * side * 2.6;
        return {
          url: CARS[Math.floor(rng() * CARS.length)],
          position: [px, 0.21, pz] as [number, number, number],
          rotationY: angle + Math.PI / 2 + (rng() - 0.5) * 0.3,
        };
      });
  }, []);

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
      {cars.map((c, i) => (
        <Model key={`car-${i}`} url={c.url} position={c.position} rotationY={c.rotationY} scale={3.4} />
      ))}
      {bushes.map((b, i) => (
        <Model key={`bush-${i}`} url={`${CITY}bush.glb`} position={b.position} rotationY={b.rotationY} scale={b.scale} />
      ))}
      <Model url={`${CITY}firehydrant.glb`} position={[5.5, 0, 3.2]} scale={4} />
      <Model url={`${CITY}firehydrant.glb`} position={[-5.5, 0, 3.2]} scale={4} />
    </>
  );
}

CARS.forEach((u) => useGLTF.preload(u));
useGLTF.preload(`${CITY}bush.glb`);
useGLTF.preload(`${CITY}firehydrant.glb`);
