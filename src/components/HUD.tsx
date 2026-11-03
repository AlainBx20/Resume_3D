import { useEffect, useState, type CSSProperties } from "react";
import { useTownStore } from "../store";
import { useWeatherStore } from "../weatherStore";
import { buildings, PLAYER_NAME, PLAYER_ROLE, PROFILE_NOTE, TOWN_NAME } from "../content";
import { WEATHER_LABELS, type WeatherKind } from "../atmosphere";
import { POND_CENTER } from "../landmarks";
import { RADIO_STATIONS } from "../audio";
import { ACHIEVEMENTS, TOTAL_STARS } from "../achievements";
import { CHANNELS, channelIndex } from "../tvShows";

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

const MAP_TREES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + 0.08;
  const radius = 19.1 + (index % 3) * 0.7;
  return {
    x: Math.sin(angle) * radius,
    z: Math.cos(angle) * radius,
    scale: 0.75 + (index % 4) * 0.1,
  };
});

function TownMap() {
  const navigation = useTownStore((state) => state.navigation);
  const playerDistance = Math.hypot(navigation.x, navigation.z);
  const playerClamp = playerDistance > 20.5 ? 20.5 / playerDistance : 1;
  const playerX = navigation.x * playerClamp;
  const playerZ = navigation.z * playerClamp;
  const headingDegrees = navigation.heading * (180 / Math.PI);

  return (
    <div className="town-map" aria-label="Map of Résumé Town and your current direction">
      <div className="town-map-header">
        <span><i /> Résumé Town</span>
      </div>
      <div className="town-map-canvas">
        <svg viewBox="-25 -22 50 44" role="img" aria-labelledby="town-map-title town-map-description">
          <title id="town-map-title">Résumé Town map</title>
          <desc id="town-map-description">Six résumé buildings surround the central fountain. The pond is east of town.</desc>
          <defs>
            <radialGradient id="map-terrain" cx="48%" cy="46%" r="62%">
              <stop offset="0" stopColor="#416b5c" />
              <stop offset="0.58" stopColor="#294d43" />
              <stop offset="1" stopColor="#18352f" />
            </radialGradient>
            <filter id="player-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="0.7" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle className="map-land" r="21.8" />
          {[6.5, 11.5, 16.5, 20.3].map((radius) => (
            <circle key={radius} className="map-contour" r={radius} />
          ))}
          {MAP_TREES.map((tree, index) => (
            <path
              key={index}
              className="map-tree"
              d="M 0 -1.35 L 1.05 0.65 L 0.38 0.65 L 0.38 1.35 L -0.38 1.35 L -0.38 0.65 L -1.05 0.65 Z"
              transform={`translate(${tree.x} ${tree.z}) scale(${tree.scale})`}
            />
          ))}

          <g className="map-roads">
            {buildings.map((building) => (
              <line
                key={building.id}
                x1="0"
                y1="0"
                x2={building.position[0]}
                y2={building.position[2]}
              />
            ))}
          </g>

          <g className="map-pond" transform={`translate(${POND_CENTER.x} ${POND_CENTER.z})`}>
            <ellipse rx="3.6" ry="2.7" />
            <path d="M -2.5 0.1 Q -1.1 -1 0.2 -0.1 T 2.6 -0.25" />
            <circle cx="1.3" cy="0.8" r="0.32" />
          </g>

          <g className="map-plaza">
            <circle r="4.8" />
            <circle className="map-plaza-ring" r="3.8" />
            <circle className="map-fountain-pool" r="1.55" />
            <circle className="map-fountain-core" r="0.62" />
          </g>

          {buildings.map((building, index) => {
            const [x, , z] = building.position;
            const distance = Math.hypot(x, z);
            const labelX = x + (x / distance) * 4.1;
            const labelZ = z + (z / distance) * 3.7;
            const labelAnchor = x > 2 ? "start" : x < -2 ? "end" : "middle";
            const rotation = Math.atan2(x, z) * (180 / Math.PI);
            return (
              <g key={building.id} className="town-map-building" style={{ color: building.color }}>
                <g transform={`translate(${x} ${z}) rotate(${rotation})`}>
                  <rect className="map-building-shadow" x="-3.05" y="-1.82" width="6.1" height="3.64" rx="0.6" />
                  <rect className="map-building-footprint" x="-2.8" y="-1.58" width="5.6" height="3.16" rx="0.48" />
                  <path className="map-building-door" d="M -0.55 1.58 L -0.55 0.45 L 0.55 0.45 L 0.55 1.58" />
                </g>
                <circle className="map-building-number-bg" cx={x - 2.25} cy={z - 1.05} r="0.78" />
                <text className="map-building-number" x={x - 2.25} y={z - 0.72}>{index + 1}</text>
                <text className="map-building-label" x={labelX} y={labelZ} textAnchor={labelAnchor}>
                  {building.title}
                </text>
              </g>
            );
          })}

          <g className="map-north" transform="translate(-21 -17)">
            <path d="M 0 -2.2 L 1.15 1.1 L 0 0.45 L -1.15 1.1 Z" />
            <text y="3.2" textAnchor="middle">N</text>
          </g>

          <g
            className="map-player"
            transform={`translate(${playerX} ${playerZ}) rotate(${headingDegrees})`}
            filter="url(#player-glow)"
          >
            <circle r="1.25" />
            <path d="M 0 -2.15 L 1.25 1.25 L 0 0.72 L -1.25 1.25 Z" />
          </g>
        </svg>
      </div>
      <div className="town-map-legend" aria-hidden="true">
        <span><i className="legend-player" /> you</span>
        <span><i className="legend-fountain" /> fountain</span>
        <span><i className="legend-water" /> pond</span>
      </div>
    </div>
  );
}

function ResumeMenu({ firstVisit }: { firstVisit: boolean }) {
  const openSection = useTownStore((s) => s.openSection);
  const visited = useTownStore((s) => s.visited);

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
            <span className="resume-link-number">{visited.includes(building.id) ? "✓" : `0${index + 1}`}</span>
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

function ExploreProgress() {
  const visited = useTownStore((s) => s.visited);
  const ach = useTownStore((s) => s.achievements);
  const stars = useTownStore((s) => s.stars);
  const total = buildings.length;
  const count = buildings.filter((b) => visited.includes(b.id)).length;

  return (
    <div className="explore-progress" aria-label={`${count} of ${total} chapters explored`}>
      <div className="explore-progress-track">
        <i style={{ width: `${(count / total) * 100}%` }} />
      </div>
      <span>{count}/{total} explored</span>
      <span className="trophy-line" title={`${ach.length}/${Object.keys(ACHIEVEMENTS).length} achievements`}>
        🏆 {ach.length}/{Object.keys(ACHIEVEMENTS).length} · ✦ {stars.length}/{TOTAL_STARS}
      </span>
    </div>
  );
}

function CompletionToast() {
  const visited = useTownStore((s) => s.visited);
  const complete = buildings.every((b) => visited.includes(b.id));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => setDismissed(true), 6000);
    return () => window.clearTimeout(timer);
  }, [complete]);

  if (!complete || dismissed) return null;
  return <div className="completion-toast">✦ You explored every chapter — thanks for visiting!</div>;
}

export default function HUD() {
  const started = useTownStore((s) => s.started);
  const locked = useTownStore((s) => s.locked);
  const nearbyId = useTownStore((s) => s.nearbyId);
  const activeSection = useTownStore((s) => s.activeSection);
  const insideId = useTownStore((s) => s.insideId);
  const nearbyItemId = useTownStore((s) => s.nearbyItemId);
  const interiorItems = useTownStore((s) => s.interiorItems);
  const activeProp = useTownStore((s) => s.activeProp);
  const tvOn = useTownStore((s) => s.tvOn);
  const tvChannel = useTownStore((s) => s.tvChannel);
  const radioOn = useTownStore((s) => s.radioOn);
  const radioStation = useTownStore((s) => s.radioStation);
  const roomLight = useTownStore((s) => s.roomLight);
  const fireOn = useTownStore((s) => s.fireOn);
  const pcFixed = useTownStore((s) => s.pcFixed);
  const nearbyDuck = useTownStore((s) => s.nearbyDuck);
  const duckScene = useTownStore((s) => s.duckScene);
  const vaultOpen = useTownStore((s) => s.vaultOpen);
  const introActive = useTownStore((s) => s.introActive);

  const nearbyTitle = buildings.find((b) => b.id === nearbyId)?.title;
  const nearbyItem = interiorItems.find((it) => it.itemId === nearbyItemId);

  if (activeSection || activeProp || vaultOpen) return null;
  if (introActive && locked) return null;

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
        <ExploreProgress />
      </div>
      <CompletionToast />
      <div className="crosshair" />
      {!insideId && (
        <>
          <WeatherWidget />
          <TownMap />
        </>
      )}
      <div className="menu-hint"><kbd>Esc</kbd> résumé menu</div>
      {insideId
        ? nearbyItem && (
            <div className="interact-prompt">
              <kbd>E</kbd>{" "}
              {nearbyItem.itemId === "__exit__" ? (
                "Leave this room"
              ) : nearbyItem.kind === "part" ? (
                <>Pick up the <strong>{nearbyItem.label}</strong></>
              ) : nearbyItem.kind === "brokenpc" ? (
                <>{pcFixed ? "Open the" : "Inspect the"} <strong>{pcFixed ? "Vault" : "broken computer"}</strong></>
              ) : nearbyItem.kind === "tv" ? (
                <>
                  {tvOn ? "Turn off" : "Turn on"} <strong>TV</strong>
                  {tvOn && (
                    <>
                      {" · "}<kbd>C</kbd> channel — <strong>{CHANNELS[channelIndex(tvChannel)].name}</strong>
                    </>
                  )}
                </>
              ) : nearbyItem.kind === "radio" ? (
                <>
                  {radioOn ? "Turn off" : "Turn on"} <strong>Radio</strong>
                  {radioOn && (
                    <>
                      {" · "}<kbd>C</kbd> station — <strong>{RADIO_STATIONS[radioStation % RADIO_STATIONS.length].name}</strong>
                    </>
                  )}
                </>
              ) : nearbyItem.kind === "light" ? (
                <>Flip the <strong>lights {roomLight ? "off" : "on"}</strong></>
              ) : nearbyItem.kind === "clock" ? (
                <>Check the <strong>time</strong></>
              ) : nearbyItem.kind === "fire" ? (
                <>{fireOn ? "Put out" : "Light"} the <strong>fire</strong></>
              ) : nearbyItem.kind === "star" ? (
                <>Grab the <strong>✦ shiny thing</strong></>
              ) : nearbyItem.kind === "art" ? (
                <>Take a closer look at the <strong>painting</strong></>
              ) : nearbyItem.kind === "book" ? (
                <>Open <strong>{nearbyItem.label}</strong> book</>
              ) : nearbyItem.kind === "pc" ? (
                <>Power on <strong>{nearbyItem.label}</strong></>
              ) : (
                <>Open <strong>{nearbyItem.label}</strong></>
              )}
            </div>
          )
        : nearbyDuck && !duckScene ? (
            <div className="interact-prompt"><kbd>E</kbd> Pick up a <strong>duckling</strong></div>
          )
        : nearbyTitle && (
            <div className="interact-prompt"><kbd>E</kbd> Enter <strong>{nearbyTitle}</strong></div>
          )}
    </div>
  );
}
