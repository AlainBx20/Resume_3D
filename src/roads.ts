import * as THREE from "three";

export const ROAD_HALF_WIDTH = 2.35;
export const ENTRY_ROAD_START_Z = 19.7;
export const ENTRY_ROAD_END_Z = 45;

const ROAD_POINTS: [number, number][] = [
  [0, 20.5],
  [-10, 19.5],
  [-19, 13],
  [-21, -4],
  [-18, -13],
  [-8, -19],
  [6, -19],
  [16, -14],
  [25.5, -8],
  [26, 4],
  [23.5, 11],
  [16, 17],
  [8, 20],
];

export const townRoadCurve = new THREE.CatmullRomCurve3(
  ROAD_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true,
  "centripetal",
  0.5,
);

const clearanceSamples = townRoadCurve.getSpacedPoints(180);

function distanceToSegment(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared > 0
    ? THREE.MathUtils.clamp(((x - ax) * dx + (z - az) * dz) / lengthSquared, 0, 1)
    : 0;
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

export function isOnTownRoad(x: number, z: number, padding = 0) {
  const threshold = ROAD_HALF_WIDTH + padding;
  if (
    Math.abs(x) <= threshold &&
    z >= ENTRY_ROAD_START_Z - padding &&
    z <= ENTRY_ROAD_END_Z + padding
  ) {
    return true;
  }
  for (let index = 1; index < clearanceSamples.length; index += 1) {
    const a = clearanceSamples[index - 1];
    const b = clearanceSamples[index];
    if (distanceToSegment(x, z, a.x, a.z, b.x, b.z) <= threshold) return true;
  }
  return false;
}
