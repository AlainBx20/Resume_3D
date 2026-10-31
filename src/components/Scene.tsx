import { useTownStore } from "../store";
import Outdoor from "./Outdoor";
import Interior from "./Interior";
import Player from "./Player";
import WeatherSystem from "./WeatherSystem";

export default function Scene() {
  const insideId = useTownStore((s) => s.insideId);

  return (
    <>
      {/* always mounted so the clock and weather keep evolving indoors */}
      <WeatherSystem />
      {insideId ? <Interior id={insideId} /> : <Outdoor />}
      <Player />
    </>
  );
}
