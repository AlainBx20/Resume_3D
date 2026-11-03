import { ACHIEVEMENTS, TOTAL_STARS } from "../../achievements";
import { useTownStore } from "../../store";

export default function Trophies() {
  const unlocked = useTownStore((s) => s.achievements);
  const stars = useTownStore((s) => s.stars.length);
  const total = Object.keys(ACHIEVEMENTS).length;

  return (
    <div className="pc-trophies">
      <div className="pc-trophy-head">
        <b>{unlocked.length}/{total}</b> unlocked · ✦ {stars}/{TOTAL_STARS} stars
        <div className="pc-trophy-bar"><i style={{ width: `${(unlocked.length / total) * 100}%` }} /></div>
      </div>
      <ul>
        {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
          const got = unlocked.includes(id);
          return (
            <li key={id} className={got ? "got" : ""}>
              <span>{got ? "🏆" : "🔒"}</span>
              <div>
                <b>{got || !a.hidden ? a.title : "???"}</b>
                <small>{got || !a.hidden ? a.desc : "Hidden — keep exploring"}</small>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
