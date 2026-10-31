import * as THREE from "three";

// ---------------------------------------------------------------------------
// Single mutable atmosphere state, written once per frame by WeatherSystem and
// read inside useFrame by every environment component. Kept outside React so
// continuous values (rain fading in, the sun crawling across the sky) never
// trigger re-renders.
// ---------------------------------------------------------------------------

export type WeatherKind = "clear" | "rain" | "storm" | "snow";
export type WeatherMode = WeatherKind | "auto";

export interface WeatherTargets {
  rain: number;
  snow: number;
  overcast: number;
  wind: number;
}

export const WEATHER_TARGETS: Record<WeatherKind, WeatherTargets> = {
  clear: { rain: 0, snow: 0, overcast: 0.05, wind: 0.25 },
  rain: { rain: 0.7, snow: 0, overcast: 0.65, wind: 0.55 },
  storm: { rain: 1, snow: 0, overcast: 0.92, wind: 0.95 },
  snow: { rain: 0, snow: 0.85, overcast: 0.55, wind: 0.35 },
};

export const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: "Clear",
  rain: "Rain",
  storm: "Storm",
  snow: "Snow",
};

export const DAY_LENGTH_SECONDS = 600; // one full in-game day at 1x speed

export const atm = {
  // clock: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
  time: 0.32,
  timeScale: 1,

  weather: "clear" as WeatherKind,

  // smoothly-lerped intensities (0..1)
  rain: 0,
  snow: 0,
  overcast: 0.05,
  wind: 0.25,

  // slow integrators — the world remembers weather that already happened
  wetness: 0, // wet shiny ground + puddles, rises in rain, dries after
  snowCover: 0, // white ground blanket, accumulates during snowfall

  // lightning: flash decays fast, bolt* tells LightningBolt to draw one
  flash: 0,
  boltAt: 0,
  boltSeed: 0,

  // derived per-frame sky/sun values
  day: 1, // 0 night .. 1 full day
  duskGlow: 0, // 1 right at sunrise/sunset
  sunEl: 0, // sine of sun elevation, -1..1
  sunDir: new THREE.Vector3(0, 1, 0),
  moonDir: new THREE.Vector3(0, -1, 0),
  skyHorizon: new THREE.Color("#f0ad7c"),
  skyZenith: new THREE.Color("#6f7bb8"),
  sunColor: new THREE.Color("#ffb37a"),
};

// --- palette ---------------------------------------------------------------

const DAY_HORIZON = new THREE.Color("#aed9f7");
const DAY_ZENITH = new THREE.Color("#3f74c9");
const DUSK_HORIZON = new THREE.Color("#f0ad7c");
const DUSK_ZENITH = new THREE.Color("#6f7bb8");
const NIGHT_HORIZON = new THREE.Color("#16204a");
const NIGHT_ZENITH = new THREE.Color("#040712");
const GREY_HORIZON = new THREE.Color("#8d99a8");
const GREY_ZENITH = new THREE.Color("#525c6b");
const SUN_NOON = new THREE.Color("#fff3dd");
const SUN_LOW = new THREE.Color("#ffb37a");

const scratchA = new THREE.Color();
const scratchB = new THREE.Color();

/** Recompute every derived value from atm.time / atm.overcast. */
export function updateDerived() {
  const theta = (atm.time - 0.25) * Math.PI * 2;
  atm.sunEl = Math.sin(theta);
  atm.day = THREE.MathUtils.smoothstep(atm.sunEl, -0.08, 0.25);
  // bell curve peaking when the sun sits right on the horizon
  atm.duskGlow = Math.exp(-(atm.sunEl * atm.sunEl) / 0.05);

  atm.sunDir.set(Math.cos(theta) * 0.95, Math.sin(theta), -0.5).normalize();
  atm.moonDir.set(-Math.cos(theta) * 0.95, -Math.sin(theta), 0.5).normalize();

  // horizon: night -> day, warmed at dawn/dusk, greyed by overcast
  scratchA.lerpColors(NIGHT_HORIZON, DAY_HORIZON, atm.day);
  scratchA.lerp(DUSK_HORIZON, atm.duskGlow * 0.85);
  scratchB.copy(GREY_HORIZON).multiplyScalar(0.25 + atm.day * 0.75);
  scratchA.lerp(scratchB, atm.overcast * 0.85);
  atm.skyHorizon.copy(scratchA);

  scratchA.lerpColors(NIGHT_ZENITH, DAY_ZENITH, atm.day);
  scratchA.lerp(DUSK_ZENITH, atm.duskGlow * 0.5);
  scratchB.copy(GREY_ZENITH).multiplyScalar(0.25 + atm.day * 0.75);
  scratchA.lerp(scratchB, atm.overcast * 0.85);
  atm.skyZenith.copy(scratchA);

  atm.sunColor.lerpColors(SUN_LOW, SUN_NOON, THREE.MathUtils.clamp(atm.sunEl, 0, 1));
}

export function formatClock(time: number): string {
  const minutes = Math.floor(((time % 1) + 1) % 1 * 24 * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
