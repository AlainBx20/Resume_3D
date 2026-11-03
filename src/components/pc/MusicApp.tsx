import { RADIO_STATIONS } from "../../audio";
import { useTownStore } from "../../store";

export default function MusicApp() {
  const on = useTownStore((s) => s.radioOn);
  const station = useTownStore((s) => s.radioStation);
  const toggle = useTownStore((s) => s.toggleRadio);
  const next = useTownStore((s) => s.nextRadioStation);
  const current = RADIO_STATIONS[station % RADIO_STATIONS.length];

  return (
    <div className="pc-music">
      <div className={`pc-vis ${on ? "on" : ""}`} aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <i key={i} style={{ animationDelay: `${(i * 0.13) % 0.9}s` }} />)}
      </div>
      <h3>{current.name}</h3>
      <p>{on ? "Now playing" : "Paused"}</p>
      <div className="pc-music-controls">
        <button type="button" onClick={toggle}>{on ? "⏸ Pause" : "▶ Play"}</button>
        <button type="button" onClick={next}>⏭ Next station</button>
      </div>
    </div>
  );
}
