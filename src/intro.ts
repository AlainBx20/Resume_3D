import * as THREE from "three";
import { townRoadCurve } from "./roads";

// Arrival cutscene geometry: the player's car leaves the tunnel, stops at the
// crosswalk for crossing traffic, then turns left onto the ring road.

export const LANE_OFFSET = 1.05;
export const CROSSWALK_Z = 23.2;
export const STOP_Z = 26.8;
const START_Z = 48.2;
const ENTRY_X = LANE_OFFSET;

export interface Pose {
  x: number;
  z: number;
  yaw: number;
}

export interface Route {
  length: number;
  at: (s: number, out: Pose) => Pose;
}

const ringLength = townRoadCurve.getLength();

function laneAt(u: number) {
  const t = ((u % 1) + 1) % 1;
  const p = townRoadCurve.getPointAt(t);
  const tan = townRoadCurve.getTangentAt(t).normalize();
  // right-hand traffic: offset to the right of the direction of travel
  return new THREE.Vector3(p.x - tan.z * LANE_OFFSET, 0, p.z + tan.x * LANE_OFFSET);
}

function uNear(x: number, z: number) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 4000; i += 1) {
    const p = townRoadCurve.getPointAt(i / 4000);
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bestDist) {
      bestDist = d;
      best = i / 4000;
    }
  }
  return best;
}

function laneSamples(uStart: number, distance: number, step = 1) {
  const count = Math.ceil(distance / step);
  return Array.from({ length: count + 1 }, (_, i) => laneAt(uStart + (i * step) / ringLength));
}

function makeRoute(points: THREE.Vector3[]): Route {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  curve.arcLengthDivisions = 1200;
  const length = curve.getLength();
  return {
    length,
    at: (s, out) => {
      const t = THREE.MathUtils.clamp(s / length, 0, 1);
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      out.x = p.x;
      out.z = p.z;
      out.yaw = Math.atan2(tan.x, tan.z);
      return out;
    },
  };
}

function polylineLength(points: THREE.Vector3[]) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += points[i].distanceTo(points[i - 1]);
  return total;
}

const joinU = uNear(-4.5, 19.5);
const lanePoints = laneSamples(joinU, 140);

const approach: THREE.Vector3[] = [];
for (let z = START_Z; z >= 27; z -= 3) approach.push(new THREE.Vector3(ENTRY_X, 0, z));
const turnEnd = lanePoints[0];
const turn = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(ENTRY_X, 0, 24),
  new THREE.Vector3(ENTRY_X, 0, turnEnd.z),
  turnEnd,
).getPoints(10);

const playerPoints = [...approach, ...turn, ...lanePoints.slice(1)];
export const playerRoute = makeRoute(playerPoints);
export const S_STOP = START_Z - STOP_Z;
export const S_JOIN = polylineLength([...approach, ...turn]);
// stops just after the turn; the lane beyond ~s=42 clips the parked taxi
export const S_ARRIVE = S_JOIN + 1.8;
export const S_AWAY_END = S_JOIN + 9;

// starts past the parked wagon and ends before the parked taxi
const crossStartU = uNear(23.5, 10) + 14 / ringLength;
export const crossRoute = makeRoute(laneSamples(crossStartU, 26));
