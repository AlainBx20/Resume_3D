import type { CSSProperties } from "react";
import { useTownStore } from "../store";
import { useWeatherStore } from "../weatherStore";
import { buildings, PLAYER_NAME, PLAYER_ROLE, PROFILE_NOTE, TOWN_NAME } from "../content";
import { WEATHER_LABELS, type WeatherKind } from "../atmosphere";

const WEATHER_ICONS: Record<WeatherKind, string> = {
  clear: "☀",
  rain: "🌧",
  storm: "⛈",
  snow: "❄",
};

function WeatherWidget() {
  const kind = useWeatherStore((s) => s.kind);
  const mode = useWeatherStore((s) => s.mode);
  const clock = useWeatherStore((s) => s.clock);
  const fastForward = useWeatherStore((s) => s.fastForward);
  const muted = useWeatherStore((s) => s.muted);

  return (
    <div className="weather-widget" aria-label={`${WEATHER_LABELS[kind]} weather at ${clock}`}>
      <div className="ww-main">
        <span className="ww-clock">{clock}{fastForward && <span className="ww-ff"> »</span>}</span>
        <span className="ww-kind">
          {WEATHER_ICONS[kind]} {WEATHER_LABELS[kind]}
          {mode === "auto" && <span className="ww-auto">auto</span>}
        </span>
      </div>
      <div className="ww-hint">
        <kbd>1</kbd>–<kbd>4</kbd> weather · <kbd>T</kbd> time · <kbd>M</kbd> {muted ? "sound off" : "sound"}
      </div>
    </div>
  );
}

function ResumeMenu({ firstVisit }: { firstVisit: boolean }) {
  const openSection = useTownStore((s) => s.openSection);

  return (
    <div className={`menu-card ${firstVisit ? "intro-card" : "pause-card"}`}>
      <span className="eyebrow">{PROFILE_NOTE}</span>
      <h1>{TOWN_NAME}</h1>
      <p className="role">{PLAYER_NAME} · {PLAYER_ROLE}</p>
      <p className="hint">
        {firstVisit
          ? "Walk through a living résumé town, or open any chapter directly."
          : "Exploration paused. Continue walking or jump straight to a résumé chapter."}
      </p>

      <button
        className="primary-action"
        type="button"
        onClick={() => window.dispatchEvent(new Event("request-town-lock"))}
      >
        {firstVisit ? "Enter the town" : "Continue exploring"}
        <span>Start exploring</span>
      </button>

      <div className="resume-grid" aria-label="Résumé chapters">
        {buildings.map((building, index) => (
          <button
            key={building.id}
            type="button"
            className="resume-link"
            style={{ "--accent": building.color } as CSSProperties}
            onClick={(event) => {
              event.stopPropagation();
              openSection(building.id);
            }}
          >
            <span className="resume-link-number">0{index + 1}</span>
            <span><strong>{building.title}</strong><small>{building.subtitle}</small></span>
          </button>
        ))}
      </div>

      <div className="controls-summary">
        <span><kbd>WASD</kbd> move</span>
        <span><kbd>Shift</kbd> run</span>
        <span><kbd>Space</kbd> jump</span>
        <span><kbd>E</kbd> interact</span>
        <span><kbd>Esc</kbd> menu</span>
      </div>
    </div>
  );
}

export default function HUD() {
  const started = useTownStore((s) => s.started);
  const locked = useTownStore((s) => s.locked);
  const nearbyId = useTownStore((s) => s.nearbyId);
  const activeSection = useTownStore((s) => s.activeSection);
  const insideId = useTownStore((s) => s.insideId);
  const nearbyItemId = useTownStore((s) => s.nearbyItemId);
  const interiorItems = useTownStore((s) => s.interiorItems);

  const nearbyTitle = buildings.find((b) => b.id === nearbyId)?.title;
  const nearbyItem = interiorItems.find((it) => it.itemId === nearbyItemId);

  if (activeSection) return null;

  if (!locked) {
    return (
      <div className={`overlay menu-overlay ${started ? "paused" : "intro"}`}>
        <ResumeMenu firstVisit={!started} />
      </div>
    );
  }

  return (
    <div className="overlay hud">
      <div className="identity-chip">
        <strong>{PLAYER_NAME}</strong>
        <span>{insideId ? buildings.find((b) => b.id === insideId)?.title : "Résumé Town"}</span>
      </div>
      <div className="crosshair" />
      {!insideId && <WeatherWidget />}
      <div className="menu-hint"><kbd>Esc</kbd> résumé menu</div>
      {insideId
        ? nearbyItem && (
            <div className="interact-prompt">
              <kbd>E</kbd>{" "}
              {nearbyItem.itemId === "__exit__"
                ? "Leave this room"
                : <>Open <strong>{nearbyItem.label}</strong></>}
            </div>
          )
        : nearbyTitle && (
            <div className="interact-prompt"><kbd>E</kbd> Enter <strong>{nearbyTitle}</strong></div>
          )}
    </div>
  );
}
