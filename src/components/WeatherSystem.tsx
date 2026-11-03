import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  atm,
  updateDerived,
  formatClock,
  WEATHER_TARGETS,
  DAY_LENGTH_SECONDS,
  type WeatherKind,
} from "../atmosphere";
import { useWeatherStore } from "../weatherStore";
import { useTownStore } from "../store";
import { audio } from "../audio";

const FAST_FORWARD = 60;
const WEATHER_SEEN_KEY = "resume-town-weather-seen";
const AUTO_KINDS: [WeatherKind, number][] = [
  ["clear", 0.45],
  ["rain", 0.2],
  ["storm", 0.15],
  ["snow", 0.2],
];

function pickAutoWeather(current: WeatherKind): WeatherKind {
  const pool = AUTO_KINDS.filter(([k]) => k !== current);
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [kind, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return "clear";
}

export default function WeatherSystem() {
  const nextAutoChange = useRef(60);
  const nextBolt = useRef(3);
  const lastClock = useRef("");
  const lastWeather = useRef<WeatherKind>(atm.weather);
  const lightningSeen = useRef(0);
  const weatherSeen = useRef<Set<WeatherKind>>(
    new Set<WeatherKind>(
      (() => {
        try {
          const value: unknown = JSON.parse(localStorage.getItem(WEATHER_SEEN_KEY) ?? "[]");
          return Array.isArray(value) ? (value as WeatherKind[]) : [];
        } catch {
          return [];
        }
      })(),
    ),
  );

  useEffect(() => {
    // lets the headless verify script pin the clock/weather deterministically
    if (import.meta.env.DEV) {
      (window as unknown as { __atm: typeof atm }).__atm = atm;
    }
  }, []);

  // weather / time / sound hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const store = useWeatherStore.getState();
      switch (e.code) {
        case "Digit1":
          store.setMode("clear");
          break;
        case "Digit2":
          store.setMode("rain");
          break;
        case "Digit3":
          store.setMode("storm");
          break;
        case "Digit4":
          store.setMode("snow");
          break;
        case "Digit0":
          store.setMode("auto");
          break;
        case "KeyT":
          store.setFastForward(!store.fastForward);
          break;
        case "KeyM": {
          const muted = !store.muted;
          store.setMuted(muted);
          audio.setMuted(muted);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const store = useWeatherStore.getState();
    const insideId = useTownStore.getState().insideId;
    const town = useTownStore.getState();
    const outside = insideId === null;

    // --- clock ---
    atm.timeScale = store.fastForward ? FAST_FORWARD : 1;
    atm.time = (atm.time + (dt * atm.timeScale) / DAY_LENGTH_SECONDS) % 1;
    const clock = formatClock(atm.time);
    if (clock !== lastClock.current) {
      lastClock.current = clock;
      store.setClock(clock);
    }

    // --- weather selection ---
    if (store.mode === "auto") {
      nextAutoChange.current -= dt;
      if (nextAutoChange.current <= 0) {
        nextAutoChange.current = 50 + Math.random() * 70;
        atm.weather = pickAutoWeather(atm.weather);
      }
    } else {
      atm.weather = store.mode;
    }
    if (store.kind !== atm.weather) store.setKind(atm.weather);

    if (outside && !weatherSeen.current.has(atm.weather)) {
      weatherSeen.current.add(atm.weather);
      try {
        localStorage.setItem(WEATHER_SEEN_KEY, JSON.stringify([...weatherSeen.current]));
      } catch {
        // Progress remains valid for this session when storage is unavailable.
      }
      if (weatherSeen.current.size >= 4) town.unlock("weather-master");
    }
    if (
      outside &&
      atm.weather === "clear" &&
      (lastWeather.current === "rain" || lastWeather.current === "storm") &&
      atm.wetness > 0.2
    ) {
      town.unlock("after-the-rain");
    }
    lastWeather.current = atm.weather;

    // --- ease intensities toward the active weather's targets ---
    const target = WEATHER_TARGETS[atm.weather];
    const ease = Math.min(dt / 4, 1);
    atm.rain += (target.rain - atm.rain) * ease;
    atm.snow += (target.snow - atm.snow) * ease;
    atm.overcast += (target.overcast - atm.overcast) * ease;
    atm.wind += (target.wind - atm.wind) * ease;

    // --- slow world integrators ---
    if (atm.rain > 0.3) atm.wetness = Math.min(atm.wetness + dt / 18, 1);
    else atm.wetness = Math.max(atm.wetness - dt / 45, 0);
    if (atm.snow > 0.3) atm.snowCover = Math.min(atm.snowCover + dt / 25, 1);
    else atm.snowCover = Math.max(atm.snowCover - dt / 35, 0);

    if (outside && atm.rain > 0.32) town.unlock("first-drops");
    if (outside && atm.weather === "storm" && atm.rain > 0.68) town.unlock("storm-chaser");
    if (outside && atm.snow > 0.35) town.unlock("snow-day");
    if (outside && atm.weather === "storm" && atm.day < 0.16) town.unlock("storm-at-midnight");
    if (outside && atm.time > 0.238 && atm.time < 0.272) town.unlock("dawn-patrol");
    if (outside && atm.time > 0.728 && atm.time < 0.772) town.unlock("golden-hour");
    if (outside && (atm.time < 0.025 || atm.time > 0.975)) town.unlock("midnight-walker");
    if (store.fastForward) town.unlock("time-traveler");

    // --- lightning ---
    atm.flash *= Math.exp(-dt * 7);
    if (atm.weather === "storm" && atm.rain > 0.6) {
      nextBolt.current -= dt;
      if (nextBolt.current <= 0) {
        nextBolt.current = 2.5 + Math.random() * 7;
        atm.flash = 1;
        atm.boltAt = performance.now();
        atm.boltSeed = Math.random() * 1000;
        lightningSeen.current += 1;
        town.unlock("thunder-witness");
        if (lightningSeen.current >= 5) town.unlock("electric-sky");
        audio.thunder(0.3 + Math.random() * 2.2);
      }
    }

    updateDerived();

    // environment (HDR) lighting follows daylight, dimmed under heavy cloud
    state.scene.environmentIntensity = THREE.MathUtils.lerp(
      0.1,
      0.65,
      atm.day * (1 - atm.overcast * 0.6)
    );

    audio.update(
      atm.wind,
      Math.max(atm.rain, atm.snow * 0.25),
      insideId !== null,
      dt,
      state.camera.position.x,
      state.camera.position.z,
      atm.day,
    );
  });

  return null;
}
