import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import SkyAtmosphere from "./SkyAtmosphere";
import SkyLife from "./SkyLife";
import Ground from "./Ground";
import TownRoads from "./TownRoads";
import GroundFlora from "./GroundFlora";
import GrassField from "./GrassField";
import InstancedTrees from "./InstancedTrees";
import MountainRange from "./MountainRange";
import Pathways from "./Pathways";
import CityProps from "./CityProps";
import Building from "./Building";
import ChimneySmoke from "./ChimneySmoke";
import Fountain from "./Fountain";
import Pond from "./Pond";
import StreetLamps from "./StreetLamps";
import Rain from "./Rain";
import CarRainEffects from "./CarRainEffects";
import Snow from "./Snow";
import LightningBolt from "./LightningBolt";
import Fireflies from "./Fireflies";
import Butterflies from "./Butterflies";
import FootstepEffects from "./FootstepEffects";
import { buildings } from "../content";

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
      <MountainRange />
      <Ground />
      <TownRoads />
      <GroundFlora />
      <GrassField />
      <InstancedTrees />
      <Pathways />
      <CityProps />
      <PlazaGarden />
      <Fountain />
      <Pond />
      <ChimneySmoke />
      <StreetLamps />
      <Rain />
      <CarRainEffects />
      <Snow />
      <LightningBolt />
      <Fireflies />
      <Butterflies />
      <FootstepEffects />
      {buildings.map((def) => (
        <Building key={def.id} def={def} />
      ))}
    </>
  );
}

useGLTF.preload("/models/suburban/planter.glb");
