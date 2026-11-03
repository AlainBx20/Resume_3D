import { WALLPAPERS } from "./apps";

interface Props {
  wallpaper: number;
  scanlines: boolean;
  onWallpaper: (index: number) => void;
  onScanlines: (on: boolean) => void;
}

export default function Settings({ wallpaper, scanlines, onWallpaper, onScanlines }: Props) {
  return (
    <div className="pc-settings">
      <h4>Wallpaper</h4>
      <div className="pc-wallpapers">
        {WALLPAPERS.map((w, i) => (
          <button
            key={w.name}
            type="button"
            className={i === wallpaper ? "active" : ""}
            style={{ background: w.css, "--accent": "#6cc3ff" } as React.CSSProperties}
            onClick={() => onWallpaper(i)}
            aria-label={w.name}
            title={w.name}
          />
        ))}
      </div>
      <h4>Display</h4>
      <label className="pc-check">
        <input type="checkbox" checked={scanlines} onChange={(e) => onScanlines(e.target.checked)} />
        CRT scanlines
      </label>
      <p className="pc-about-os">ResumeOS 1.0 · built for Alaa's résumé town</p>
    </div>
  );
}
