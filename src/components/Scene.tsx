import { useTownStore } from "../store";
import Outdoor from "./Outdoor";
import Interior from "./Interior";
import Player from "./Player";
import IntroCutscene from "./IntroCutscene";
import Relics from "./Relics";
import TownLife from "./TownLife";
import TownExtras from "./TownExtras";
import Traffic from "./Traffic";
import InteriorGuests from "./NpcGuests";
import WeatherSystem from "./WeatherSystem";

export default function Scene() {
  const insideId = useTownStore((s) => s.insideId);
  const introActive = useTownStore((s) => s.introActive);

  return (
    <>
      {/* always mounted so the clock and weather keep evolving indoors */}
      <WeatherSystem />
      {insideId ? <Interior id={insideId} /> : <Outdoor />}
      {insideId && <InteriorGuests room={insideId} />}
      {!insideId && <IntroCutscene />}
      {!insideId && !introActive && <Relics />}
      {!insideId && !introActive && <TownLife />}
      {!insideId && !introActive && <TownExtras />}
      {!insideId && !introActive && <Traffic />}
      <Player />
    </>
  );
}
