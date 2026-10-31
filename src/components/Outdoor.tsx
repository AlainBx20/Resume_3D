import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import SkyAtmosphere from "./SkyAtmosphere";
import SkyLife from "./SkyLife";
import Ground from "./Ground";
import GroundFlora from "./GroundFlora";
import GrassField from "./GrassField";
import InstancedTrees from "./InstancedTrees";
import Mountains from "./Mountains";
import Pathways from "./Pathways";
import CityProps from "./CityProps";
import Building from "./Building";
import ChimneySmoke from "./ChimneySmoke";
import Fountain from "./Fountain";
import StreetLamps from "./StreetLamps";
import Signpost from "./Signpost";
import Rain from "./Rain";
import Snow from "./Snow";
import LightningBolt from "./LightningBolt";
import Fireflies from "./Fireflies";
import DecorItem from "./DecorItem";
import { buildings, type DecorItemDef } from "../content";

// three benches around the plaza ring, each turned to face the fountain
const BENCHES: DecorItemDef[] = [0, 2, 4].map((i) => {
  const sorted = buildings
    .map((b) => Math.atan2(b.position[0], b.position[2]))
    .sort((a, b) => a - b);
  const next = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + Math.PI * 2;
  const angle = (sorted[i] + next) / 2 + 0.42; // beside the lamp, not inside it
  return {
    model: "/models/furniture/bench.glb",
    position: [Math.sin(angle) * 6.4, 0, Math.cos(angle) * 6.4],
    rotationY: angle + Math.PI,
    scale: 1.7,
  };
});

function PlazaGarden() {
  const { scene } = useGLTF("/models/suburban/planter.glb");
  const planters = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return { x: Math.sin(angle) * 3.6, z: Math.cos(angle) * 3.6, rot: angle };
      }),
    []
  );

  return (
    <>
      {planters.map((p, i) => (
        <primitive
          key={i}
          object={scene.clone()}
          position={[p.x, 0, p.z]}
          rotation-y={p.rot}
          scale={1.6}
        />
      ))}
    </>
  );
}

export default function Outdoor() {
  return (
    <>
      <SkyAtmosphere />
      <SkyLife />
      <Mountains />
      <Ground />
      <GroundFlora />
      <GrassField />
      <InstancedTrees />
      <Pathways />
      <CityProps />
      <PlazaGarden />
      <Fountain />
      <ChimneySmoke />
      <StreetLamps />
      <Signpost />
      {BENCHES.map((def, i) => (
        <DecorItem key={`bench-${i}`} def={def} />
      ))}
      <Rain />
      <Snow />
      <LightningBolt />
      <Fireflies />
      {buildings.map((def) => (
        <Building key={def.id} def={def} />
      ))}
    </>
  );
}

useGLTF.preload("/models/suburban/planter.glb");
