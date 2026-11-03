import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useTownStore } from "../store";
import { audio } from "../audio";
import {
  CROSSWALK_Z,
  S_ARRIVE,
  S_AWAY_END,
  S_STOP,
  crossRoute,
  playerRoute,
  type Pose,
} from "../intro";

const CAR_SCALE = 4.4;
const CAR_Y = 0.315;
const EYE = 1.2;
const CROSS_SPEED = 7;
const CROSS_START = 4.6;
const HONK_AT = [6.4, 7.6];
const GO_AT = 8.6;
const ACCEL = 2.4;
const DECEL = 2.2;
const END_POS = new THREE.Vector3(-4.6, 1.35, 16.4);
const END_LOOK = new THREE.Vector3(-14, 1.35, 19);

type Phase = "idle" | "drive" | "park" | "away" | "done";

function CarModel({ url, refObj }: { url: string; refObj: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(), [scene]);
  return (
    <group ref={refObj} visible={false}>
      <primitive object={model} scale={CAR_SCALE} position={[0, CAR_Y, 0]} />
    </group>
  );
}

function Crosswalk() {
  const stripes = useMemo(() => Array.from({ length: 7 }, (_, i) => -2.1 + i * 0.7), []);
  return (
    <group position={[0, 0.045, CROSSWALK_Z]}>
      {stripes.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 2.4]} />
          <meshStandardMaterial color="#e9e6dc" roughness={0.9} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

const TRIM = "#1a1c21";
const HOOD = "#c97a2a";

// Interior in camera space: +x right, +y up, -z forward. The driver sits left of the car centre.
function Cockpit({ refObj }: { refObj: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={refObj} visible={false}>
      <mesh position={[0.25, -0.42, -1.0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.55]} />
        <meshStandardMaterial color={TRIM} roughness={0.75} />
      </mesh>
      <mesh position={[0.25, -0.62, -0.8]}>
        <boxGeometry args={[1.5, 0.3, 0.3]} />
        <meshStandardMaterial color="#131418" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.33, -0.85]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.06, 0.1]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.355, -0.8]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[0.2, 0.035]} />
        <meshStandardMaterial color="#10261f" emissive="#3dffb0" emissiveIntensity={0.8} />
      </mesh>
      <group position={[0, -0.3, -0.5]} rotation={[-1.2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.13, 0.014, 10, 32]} />
          <meshStandardMaterial color="#0b0b0d" roughness={0.55} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 16]} />
          <meshStandardMaterial color="#26282d" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.24, 0.01, 0.025]} />
          <meshStandardMaterial color="#0b0b0d" />
        </mesh>
      </group>
      <mesh position={[0.62, -0.36, -0.98]} rotation={[0.2, -0.3, 0]}>
        <boxGeometry args={[0.18, 0.1, 0.02]} />
        <meshStandardMaterial color="#0a1620" emissive="#2a6fff" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.25, -0.5, -2.1]}>
        <boxGeometry args={[1.0, 0.04, 1.6]} />
        <meshStandardMaterial color={HOOD} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[-0.42, 0.1, -1.15]} rotation={[0.3, 0, 0.14]}>
        <boxGeometry args={[0.05, 1.1, 0.05]} />
        <meshStandardMaterial color={TRIM} roughness={0.7} />
      </mesh>
      <mesh position={[0.92, 0.1, -1.15]} rotation={[0.3, 0, -0.14]}>
        <boxGeometry args={[0.05, 1.1, 0.05]} />
        <meshStandardMaterial color={TRIM} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.62, -0.95]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.05, 0.5]} />
        <meshStandardMaterial color="#3a3b40" roughness={0.9} />
      </mesh>
      <mesh position={[-0.4, -0.32, -0.6]}>
        <boxGeometry args={[0.1, 0.05, 1.0]} />
        <meshStandardMaterial color="#202228" roughness={0.8} />
      </mesh>
      <mesh position={[0.9, -0.32, -0.6]}>
        <boxGeometry args={[0.1, 0.05, 1.0]} />
        <meshStandardMaterial color="#202228" roughness={0.8} />
      </mesh>
      <mesh position={[0.25, 0.42, -0.85]}>
        <boxGeometry args={[0.2, 0.05, 0.02]} />
        <meshStandardMaterial color="#0d0e11" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.25, 0.5, -0.85]}>
        <boxGeometry args={[0.012, 0.1, 0.012]} />
        <meshStandardMaterial color="#0d0e11" />
      </mesh>
    </group>
  );
}

export default function IntroCutscene() {
  const camera = useThree((s) => s.camera);
  const playerCar = useRef<THREE.Group>(null);
  const crossCar = useRef<THREE.Group>(null);
  const cockpit = useRef<THREE.Group>(null);
  const state = useRef({
    phase: "idle" as Phase,
    t: 0,
    s: 0,
    speed: 0,
    honks: 0,
    parkT: 0,
    ry: 0,
    pose: { x: 0, z: 0, yaw: 0 } as Pose,
    cpose: { x: 0, z: 0, yaw: 0 } as Pose,
    placed: false,
  });

  const finish = () => {
    const st = state.current;
    if (st.placed) return;
    st.placed = true;
    camera.position.copy(END_POS);
    camera.lookAt(END_LOOK);
    if (cockpit.current) cockpit.current.visible = false;
    useTownStore.getState().endIntro();
  };

  useEffect(() => {
    const skip = () => {
      const st = state.current;
      if (st.phase === "idle" || st.phase === "done") return;
      finish();
      audio.setEngine(null);
      st.phase = "done";
      if (playerCar.current) playerCar.current.visible = false;
      if (crossCar.current) crossCar.current.visible = false;
    };
    window.addEventListener("skip-intro", skip);
    return () => window.removeEventListener("skip-intro", skip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      audio.setEngine(null);
    },
    [],
  );

  useFrame((_, rawDelta) => {
    const st = state.current;
    const town = useTownStore.getState();
    const dt = Math.min(rawDelta, 0.1);

    if (st.phase === "idle") {
      if (!town.introActive) return;
      st.phase = "drive";
      st.t = 0;
      st.s = 0;
      st.speed = 4;
      st.honks = 0;
      st.placed = false;
      playerRoute.at(0, st.pose);
      st.ry = st.pose.yaw + Math.PI;
    }
    if (st.phase === "done") return;

    st.t += dt;
    const pose = st.pose;

    if (st.phase === "drive") {
      if (st.t > 0.5) town.setIntroBlack(false);
      const goal = st.t < GO_AT ? S_STOP : S_ARRIVE;
      const remaining = Math.max(0, goal - st.s);
      const turnZone = st.t >= GO_AT && st.s > S_ARRIVE - 14;
      const vmax = turnZone ? 5 : 8;
      const vBrake = Math.sqrt(2 * DECEL * remaining);
      st.speed = Math.max(0, Math.min(st.speed + ACCEL * dt, vmax, vBrake));
      st.s = Math.min(st.s + st.speed * dt, goal);
      if (st.t >= GO_AT && st.s >= S_ARRIVE - 0.02) {
        st.phase = "park";
        st.parkT = 0;
        st.speed = 0;
      }
      if (st.honks < 2 && st.t >= HONK_AT[st.honks]) {
        audio.honk(st.honks === 1);
        st.honks += 1;
      }
    } else if (st.phase === "park") {
      st.parkT += dt;
      if (st.parkT > 0.5) town.setIntroBlack(true);
      if (st.parkT > 1.5) {
        finish();
        st.phase = "away";
      }
    } else if (st.phase === "away") {
      st.speed = Math.min(st.speed + 1.8 * dt, 6);
      st.s += st.speed * dt;
      if (st.s >= S_AWAY_END) {
        st.phase = "done";
        audio.setEngine(null);
        if (playerCar.current) playerCar.current.visible = false;
        if (crossCar.current) crossCar.current.visible = false;
        return;
      }
    }

    audio.setEngine(st.phase === "park" ? 0.1 : Math.min(1, st.speed / 8) * (st.phase === "away" ? 0.7 : 1));

    playerRoute.at(st.s, pose);
    const car = playerCar.current;
    if (car) {
      car.position.set(pose.x, 0, pose.z);
      car.rotation.y = pose.yaw;
      car.visible = st.phase === "away";
    }

    const cc = crossCar.current;
    if (cc) {
      const cs = (st.t - CROSS_START) * CROSS_SPEED;
      const show = st.phase === "drive" && cs > 0 && cs < crossRoute.length - 0.5;
      cc.visible = show;
      if (show) {
        crossRoute.at(cs, st.cpose);
        cc.position.set(st.cpose.x, 0, st.cpose.z);
        cc.rotation.y = st.cpose.yaw;
      }
    }

    if (st.phase === "drive" || st.phase === "park") {
      const sin = Math.sin(pose.yaw);
      const cos = Math.cos(pose.yaw);
      const bob = Math.sin(st.t * 12) * 0.003 * Math.min(1, st.speed / 5);
      camera.position.set(pose.x + cos * 0.25 + sin * 0.1, EYE + bob, pose.z - sin * 0.25 + cos * 0.1);
      let target = pose.yaw + Math.PI;
      target += Math.round((st.ry - target) / (Math.PI * 2)) * Math.PI * 2;
      st.ry += (target - st.ry) * Math.min(1, dt * 6);
      camera.rotation.set(-0.04, st.ry, 0, "YXZ");
      const ck = cockpit.current;
      if (ck) {
        ck.visible = true;
        ck.position.copy(camera.position);
        ck.quaternion.copy(camera.quaternion);
      }
    }
  });

  return (
    <>
      <Crosswalk />
      <CarModel url="/models/kaykit/city/car_sedan.glb" refObj={playerCar} />
      <CarModel url="/models/kaykit/city/car_taxi.glb" refObj={crossCar} />
      <Cockpit refObj={cockpit} />
    </>
  );
}
