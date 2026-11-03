import { isOnTownRoad } from "./roads";

export type StreetPlacement = {
  model: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

const BENCH_RADIUS = 6.75;
const BENCH_ANGLES = [30, 90, 150, 210, 270, 330].map((degrees) => (degrees * Math.PI) / 180);

// Benches occupy the six landscaped wedges between paths, never a doorway or
// the center line of a walkway. The model's long axis follows the plaza edge.
export const BENCH_SPOTS: StreetPlacement[] = BENCH_ANGLES.map((angle) => ({
  model: "bench.glb",
  position: [Math.sin(angle) * BENCH_RADIUS, 0.055, Math.cos(angle) * BENCH_RADIUS],
  rotationY: angle,
  scale: 5,
}));

// The model bounds put wheel bottoms 0.269 m below their root at this scale.
// Root y=0.315 therefore leaves the tyres just above the 0.034 m asphalt.
export const CAR_SPOTS: StreetPlacement[] = [
  { model: "car_sedan.glb", position: [10.5, 0.315, -17], rotationY: 1.05, scale: 4.4 },
  { model: "car_hatchback.glb", position: [25.3, 0.315, 3], rotationY: -0.14, scale: 4.4 },
  { model: "car_stationwagon.glb", position: [15, 0.315, 16], rotationY: -1.04, scale: 4.4 },
  { model: "car_taxi.glb", position: [-16, 0.315, 15], rotationY: -2.2, scale: 4.4 },
  { model: "car_sedan.glb", position: [-20.8, 0.315, -3], rotationY: -3.02, scale: 4.4 },
];

export function insideBenchNook(x: number, z: number, padding = 0) {
  return BENCH_SPOTS.some((bench) => {
    const dx = x - bench.position[0];
    const dz = z - bench.position[2];
    return dx * dx + dz * dz < (1.75 + padding) ** 2;
  });
}

// Cars sitting on the ring road would block the moving traffic, so only the
// ones off the asphalt stay parked.
export const PARKED_SPOTS: StreetPlacement[] = CAR_SPOTS.filter(
  (car) => !isOnTownRoad(car.position[0], car.position[2], 1.4),
);

export function nearestCarDistance(x: number, z: number) {
  return Math.min(...PARKED_SPOTS.map((car) => Math.hypot(x - car.position[0], z - car.position[2])));
}
