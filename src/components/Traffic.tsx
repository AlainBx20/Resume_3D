import { useEffect, useMemo, useRef } from "react";
import { registerMovingCollider } from "../collision";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { townRoadCurve } from "../roads";
import { atm } from "../atmosphere";
import { audio } from "../audio";

const CITY = "/models/kaykit/city/";
const CAR_SCALE = 4.4;
const CAR_Y = 0.315;
const CAR_LENGTH = 4.4;
const CRUISE = 6;
const ACCEL = 2.4;
const BRAKE = 7;
const FOLLOW_GAP = 11;
const PLAYER_LOOKAHEAD = 10;
const PLAYER_STOP = 4.2;
const LANE = 1.2;
const BEAMS = 4;

const DEPTHS: Record<string, { front: number; rear: number }> = {
  "car_hatchback.glb": { front: 1.811, rear: -1.745 },
  "car_sedan.glb": { front: 2.055, rear: -2.084 },
  "car_stationwagon.glb": { front: 2.055, rear: -2.084 },
  "car_taxi.glb": { front: 2.055, rear: -2.084 },
};

// lane 0 drives with increasing road parameter, lane 1 against it.
const FLEET: { model: string; lane: 0 | 1 }[] = [
  { model: "car_sedan.glb", lane: 0 },
  { model: "car_taxi.glb", lane: 1 },
  { model: "car_hatchback.glb", lane: 0 },
  { model: "car_stationwagon.glb", lane: 1 },
  { model: "car_stationwagon.glb", lane: 0 },
  { model: "car_sedan.glb", lane: 1 },
  { model: "car_taxi.glb", lane: 0 },
  { model: "car_hatchback.glb", lane: 1 },
];

const ROAD_LENGTH = townRoadCurve.getLength();
const SAMPLES = 900;
const tables = [0, 1].map(() => ({
  x: new Float32Array(SAMPLES + 1),
  z: new Float32Array(SAMPLES + 1),
  yaw: new Float32Array(SAMPLES + 1),
}));

// Right-hand traffic: each lane is sampled in its own direction of travel.
(() => {
  for (let i = 0; i <= SAMPLES; i += 1) {
    for (const lane of [0, 1]) {
      const t = lane === 0 ? (i % SAMPLES) / SAMPLES : ((SAMPLES - i) % SAMPLES) / SAMPLES;
      const p = townRoadCurve.getPointAt(t);
      const tan = townRoadCurve.getTangentAt(t).normalize();
      const dir = lane === 0 ? 1 : -1;
      const tx = tan.x * dir;
      const tz = tan.z * dir;
      tables[lane].x[i] = p.x - tz * LANE;
      tables[lane].z[i] = p.z + tx * LANE;
      tables[lane].yaw[i] = Math.atan2(tx, tz);
    }
  }
})();

interface Pose {
  x: number;
  z: number;
  yaw: number;
}

function sampleLane(lane: number, s: number, out: Pose) {
  const tb = tables[lane];
  const f = ((((s / ROAD_LENGTH) % 1) + 1) % 1) * SAMPLES;
  const i = Math.floor(f);
  const k = f - i;
  out.x = tb.x[i] + (tb.x[i + 1] - tb.x[i]) * k;
  out.z = tb.z[i] + (tb.z[i + 1] - tb.z[i]) * k;
  const d = Math.atan2(Math.sin(tb.yaw[i + 1] - tb.yaw[i]), Math.cos(tb.yaw[i + 1] - tb.yaw[i]));
  out.yaw = tb.yaw[i] + d * k;
}

// Module-level so traffic keeps its place when the scene remounts.
const slots = [0, 0];
const cars = FLEET.map((f) => {
  const slot = slots[f.lane]++;
  const count = FLEET.filter((o) => o.lane === f.lane).length;
  return {
    lane: f.lane,
    s: (slot / count) * ROAD_LENGTH + (f.lane === 0 ? 6 : 30),
    v: CRUISE * 0.8,
    blockedFor: 0,
    honkAt: 0,
    dist: 0,
  };
});
const leaders = cars.map((car, i) => {
  let best = i;
  let bestGap = Infinity;
  cars.forEach((o, j) => {
    if (j === i || o.lane !== car.lane) return;
    const gap = (((o.s - car.s) % ROAD_LENGTH) + ROAD_LENGTH) % ROAD_LENGTH;
    if (gap < bestGap) {
      bestGap = gap;
      best = j;
    }
  });
  return best;
});
const pose: Pose = { x: 0, z: 0, yaw: 0 };

const HEAD_GEO = new THREE.PlaneGeometry(0.295, 0.14);
const TAIL_GEO = new THREE.PlaneGeometry(0.28, 0.064);
const headMat = new THREE.MeshBasicMaterial({
  color: "#fff0b0",
  transparent: true,
  opacity: 0,
  depthWrite: false,
  toneMapped: false,
  blending: THREE.AdditiveBlending,
});
const tailMat = new THREE.MeshBasicMaterial({
  color: "#ff241c",
  transparent: true,
  opacity: 0,
  depthWrite: false,
  toneMapped: false,
  blending: THREE.AdditiveBlending,
});

function TrafficCar({ model, groupRef }: { model: string; groupRef: (g: THREE.Group | null) => void }) {
  const { scene } = useGLTF(`${CITY}${model}`);
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });
    return c;
  }, [scene]);
  const d = DEPTHS[model] ?? DEPTHS["car_sedan.glb"];
  return (
    <group ref={groupRef} visible={false}>
      <primitive object={clone} scale={CAR_SCALE} position={[0, CAR_Y, 0]} />
      {[-0.607, 0.607].map((x) => (
        <mesh key={x} position={[x, 0.283 + CAR_Y, d.front]} geometry={HEAD_GEO} material={headMat} renderOrder={3} />
      ))}
      {[-0.584, 0.584].map((x) => (
        <mesh key={x} position={[x, 0.355 + CAR_Y, d.rear]} rotation-y={Math.PI} geometry={TAIL_GEO} material={tailMat} renderOrder={3} />
      ))}
    </group>
  );
}

export default function Traffic() {
  const camera = useThree((s) => s.camera);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const beams = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useMemo(() => Array.from({ length: BEAMS }, () => new THREE.Object3D()), []);
  const order = useRef<number[]>(cars.map((_, i) => i));
  const bodies = useRef<ReturnType<typeof registerMovingCollider>[]>([]);

  useEffect(() => {
    bodies.current = cars.map(() => registerMovingCollider(1.3, 2.5));
    return () => {
      bodies.current.forEach((body) => body.dispose());
      bodies.current = [];
    };
  }, []);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = clock.elapsedTime;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const lowPlayer = camera.position.y < 3.2;

    for (let i = 0; i < cars.length; i += 1) {
      const car = cars[i];
      const lead = cars[leaders[i]];
      const gap = ((((lead.s - car.s) % ROAD_LENGTH) + ROAD_LENGTH) % ROAD_LENGTH) - CAR_LENGTH;
      let target = CRUISE;
      if (gap < FOLLOW_GAP) target = Math.min(target, Math.max(0, (gap - 2) * 0.9));

      sampleLane(car.lane, car.s, pose);
      let blocking = false;
      const dx = cx - pose.x;
      const dz = cz - pose.z;
      car.dist = dx * dx + dz * dz;
      if (lowPlayer) {
        const fx = Math.sin(pose.yaw);
        const fz = Math.cos(pose.yaw);
        const along = dx * fx + dz * fz;
        const side = Math.abs(dx * fz - dz * fx);
        if (along > 0 && along < PLAYER_LOOKAHEAD && side < 2.4) {
          target = Math.min(target, Math.max(0, (along - PLAYER_STOP) * 0.9));
          blocking = along < PLAYER_STOP + 2.5;
        }
      }

      car.v += THREE.MathUtils.clamp(target - car.v, -BRAKE * dt, ACCEL * dt);
      car.s += car.v * dt;

      car.blockedFor = blocking && car.v < 0.2 ? car.blockedFor + dt : 0;
      if (car.blockedFor > 2.5 && now - car.honkAt > 7 && car.dist < 256) {
        car.honkAt = now;
        audio.honk();
      }

      const g = refs.current[i];
      if (!g) continue;
      sampleLane(car.lane, car.s, pose);
      g.visible = true;
      g.position.set(pose.x, 0, pose.z);
      g.rotation.y = pose.yaw;
      bodies.current[i]?.move(pose.x, pose.z, pose.yaw);
    }

    const night = THREE.MathUtils.clamp(1 - atm.day * 1.85, 0, 1);
    const storm = THREE.MathUtils.clamp(atm.overcast * 0.7 + atm.rain * 0.35 - 0.45, 0, 0.72);
    const level = Math.max(night, storm);
    headMat.opacity = THREE.MathUtils.smoothstep(level, 0.06, 0.82) * 0.92;
    tailMat.opacity = THREE.MathUtils.smoothstep(level, 0.08, 0.9) * 0.78;

    // Real beams only on the cars closest to the player.
    const ord = order.current;
    ord.sort((a, b) => cars[a].dist - cars[b].dist);
    for (let k = 0; k < BEAMS; k += 1) {
      const spot = beams.current[k];
      if (!spot) continue;
      spot.intensity = level * 72;
      if (level <= 0.01) continue;
      const car = cars[ord[k]];
      sampleLane(car.lane, car.s, pose);
      const fx = Math.sin(pose.yaw);
      const fz = Math.cos(pose.yaw);
      spot.position.set(pose.x + fx * 2.1, 0.6, pose.z + fz * 2.1);
      targets[k].position.set(pose.x + fx * 11, 0.18, pose.z + fz * 11);
    }
  });

  return (
    <>
      {FLEET.map((f, i) => (
        <TrafficCar
          key={i}
          model={f.model}
          groupRef={(g) => {
            refs.current[i] = g;
          }}
        />
      ))}
      {targets.map((t, k) => (
        <group key={k}>
          <spotLight
            ref={(s) => {
              beams.current[k] = s;
            }}
            target={t}
            color="#ffe8b2"
            intensity={0}
            distance={15}
            angle={0.4}
            penumbra={0.72}
            decay={2}
          />
          <primitive object={t} />
        </group>
      ))}
    </>
  );
}
