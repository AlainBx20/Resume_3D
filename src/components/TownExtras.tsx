import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CODES, COINS, FISH, useExtras } from "../extras";
import { useQuestStore } from "../questStore";
import { useTownStore } from "../store";
import { audio } from "../audio";

const COIN_REACH_SQ = 1.5 * 1.5;
const SPOT = { x: 20.6, z: -5.4 };
const BOBBER = { x: 19.4, z: -2.4 };
const SPOT_REACH = 2;

function canAct() {
  const t = useTownStore.getState();
  const q = useQuestStore.getState();
  return t.locked && !t.introActive && !t.activeSection && !t.activeProp && !q.dialog && !q.reading && !q.journalOpen;
}

const COIN_GEO = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 14);
const COIN_MAT = new THREE.MeshStandardMaterial({ color: "#ffd24d", emissive: "#ffb300", emissiveIntensity: 1, metalness: 0.7, roughness: 0.25 });
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

// One instanced mesh for every coin; the pickup test is a cheap squared-distance loop.
function Coins() {
  const camera = useThree((s) => s.camera);
  const mesh = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    const im = mesh.current;
    if (!im) return;
    const t = clock.elapsedTime;
    const ex = useExtras.getState();
    const town = useTownStore.getState();
    const canPick = !town.introActive && town.locked && camera.position.y < 4;
    for (let i = 0; i < COINS.length; i++) {
      const c = COINS[i];
      if (ex.coins.includes(c.id)) {
        im.setMatrixAt(i, HIDDEN);
        continue;
      }
      _e.set(Math.PI / 2, 0, t * 2 + c.x);
      _q.setFromEuler(_e);
      _p.set(c.x, 0.95 + Math.sin(t * 2.2 + c.z) * 0.1, c.z);
      im.setMatrixAt(i, _m.compose(_p, _q, _s));
      if (!canPick) continue;
      const dx = camera.position.x - c.x;
      const dz = camera.position.z - c.z;
      if (dx * dx + dz * dz < COIN_REACH_SQ && ex.collectCoin(c.id)) {
        const n = useExtras.getState().coins.length;
        audio.starCollect(n % 6);
        town.showToast(`git commit -m "${c.msg}" (${n}/${COINS.length})`, "star");
        town.unlock("coin-first");
        if (n >= 10) town.unlock("coin-10");
        if (n >= COINS.length) town.unlock("coin-all");
      }
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[COIN_GEO, COIN_MAT, COINS.length]} frustumCulled={false} />;
}

function FishingSpot() {
  const camera = useThree((s) => s.camera);
  const bobber = useRef<THREE.Group>(null);
  const waitUntil = useRef(0);
  const biteUntil = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat || !canAct()) return;
      const ex = useExtras.getState();
      if (!ex.nearSpot) return;
      const town = useTownStore.getState();
      if (ex.fishState === "idle") {
        waitUntil.current = performance.now() + 2200 + Math.random() * 3500;
        ex.setFishState("wait");
        audio.chirp(330);
      } else if (ex.fishState === "wait") {
        ex.setFishState("idle");
        town.showToast("Too early! You scared it off.");
        if (ex.bumpEarly() >= 3) town.unlock("rod-rage");
      } else {
        ex.setFishState("idle");
        const unseen = FISH.filter((f) => !ex.fish.includes(f.id));
        const pool = unseen.length ? unseen : FISH;
        const fish = pool[Math.floor(Math.random() * pool.length)];
        const isNew = ex.addFish(fish.id);
        audio.starCollect(3);
        const n = useExtras.getState().fish.length;
        town.showToast(
          isNew ? `Caught: ${fish.name} (${n}/${FISH.length}). ${fish.quip}` : `Caught ${fish.name} again. Released.`,
          "star",
        );
        town.unlock("fish-first");
        if (n >= 5) town.unlock("fish-5");
        if (n >= FISH.length) town.unlock("fish-all");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => {
      useExtras.getState().setNearSpot(false);
      useExtras.getState().setFishState("idle");
    },
    [],
  );

  useFrame(({ clock }) => {
    const ex = useExtras.getState();
    const near = Math.hypot(camera.position.x - SPOT.x, camera.position.z - SPOT.z) < SPOT_REACH && !useTownStore.getState().introActive;
    ex.setNearSpot(near);
    if (!near && ex.fishState !== "idle") ex.setFishState("idle");
    const now = performance.now();
    if (ex.fishState === "wait" && now > waitUntil.current) {
      ex.setFishState("bite");
      biteUntil.current = now + 1300;
      audio.chirp(880);
    } else if (ex.fishState === "bite" && now > biteUntil.current) {
      ex.setFishState("idle");
      useTownStore.getState().showToast("It got away. Be quicker next time!");
    }
    const b = bobber.current;
    if (b) {
      const t = clock.elapsedTime;
      b.position.y = 0.06 + Math.sin(t * 2) * 0.012 - (ex.fishState === "bite" ? 0.07 + Math.abs(Math.sin(t * 24)) * 0.03 : 0);
      b.visible = ex.fishState !== "idle";
    }
  });

  return (
    <>
      <group position={[SPOT.x, 0, SPOT.z]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshStandardMaterial color="#7a5330" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.8]} />
          <meshStandardMaterial color="#b98a55" roughness={0.9} />
        </mesh>
        <mesh position={[0.07, 1.15, 0]}>
          <boxGeometry args={[0.02, 0.16, 0.5]} />
          <meshBasicMaterial color="#5ec4ff" />
        </mesh>
      </group>
      <group ref={bobber} position={[BOBBER.x, 0.06, BOBBER.z]} visible={false}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#ff4040" emissive="#ff2020" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </>
  );
}

function SecretCodes() {
  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || !/[a-z0-9]/i.test(e.key) || !useTownStore.getState().locked) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-8);
      const code = CODES.find((c) => buffer.endsWith(c.word));
      if (!code) return;
      buffer = "";
      const town = useTownStore.getState();
      const ex = useExtras.getState();
      const isNew = ex.addCode(code.word);
      town.showToast(`${code.reply}${isNew ? "" : " (already known)"}`, "info");
      audio.achievement();
      if (code.word === "disco") {
        ex.startDisco();
        town.unlock("disco");
      }
      if (code.word === "boom") {
        ex.startBoom();
        town.unlock("boom");
      }
      const n = useExtras.getState().codes.length;
      town.unlock("code-first");
      if (n >= 5) town.unlock("code-5");
      if (n >= CODES.length) town.unlock("code-all");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

function Disco() {
  const light = useRef<THREE.PointLight>(null);
  const color = useRef(new THREE.Color());
  useFrame(({ clock }) => {
    const l = light.current;
    if (!l) return;
    const left = useExtras.getState().discoUntil - performance.now();
    if (left <= 0) {
      l.intensity = 0;
      return;
    }
    const t = clock.elapsedTime;
    color.current.setHSL((t * 0.6) % 1, 1, 0.55);
    l.color.copy(color.current);
    l.intensity = 260 * Math.min(1, left / 1500);
    l.position.set(Math.sin(t * 1.7) * 6, 4 + Math.sin(t * 5) * 0.6, Math.cos(t * 1.3) * 6);
  });
  return <pointLight ref={light} intensity={0} distance={32} decay={2} />;
}

const BURSTS = 3;
const PER = 70;
const SPARKS = BURSTS * PER;
const positions = new Float32Array(SPARKS * 3);
const colors = new Float32Array(SPARKS * 3);
const velocities = new Float32Array(SPARKS * 3);
const origins = [
  [0, 14, 0],
  [-7, 12, 5],
  [7, 13, -4],
];
const delays = [0, 0.6, 1.2];
const hues = [0.02, 0.58, 0.13];
(() => {
  const c = new THREE.Color();
  for (let b = 0; b < BURSTS; b++) {
    c.setHSL(hues[b], 1, 0.6);
    for (let i = 0; i < PER; i++) {
      const k = (b * PER + i) * 3;
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const speed = 4 + Math.random() * 3;
      velocities[k] = s * Math.cos(th) * speed;
      velocities[k + 1] = u * speed;
      velocities[k + 2] = s * Math.sin(th) * speed;
      colors[k] = c.r;
      colors[k + 1] = c.g;
      colors[k + 2] = c.b;
    }
  }
})();

function Fireworks() {
  const points = useRef<THREE.Points>(null);
  useFrame(() => {
    const p = points.current;
    if (!p) return;
    const since = (performance.now() - useExtras.getState().boomAt) / 1000;
    const on = since >= 0 && since < 4;
    p.visible = on;
    if (!on) return;
    for (let b = 0; b < BURSTS; b++) {
      const t = since - delays[b];
      for (let i = 0; i < PER; i++) {
        const k = (b * PER + i) * 3;
        const tt = Math.max(0, t);
        positions[k] = origins[b][0] + velocities[k] * tt;
        positions[k + 1] = t < 0 ? -100 : origins[b][1] + velocities[k + 1] * tt - 2.2 * tt * tt;
        positions[k + 2] = origins[b][2] + velocities[k + 2] * tt;
      }
    }
    p.geometry.attributes.position.needsUpdate = true;
    (p.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - since / 4);
  });
  return (
    <points ref={points} visible={false} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function TownExtras() {
  const disco = useExtras((s) => s.discoOn);
  const boom = useExtras((s) => s.boomOn);
  return (
    <>
      <Coins />
      <FishingSpot />
      <SecretCodes />
      {disco && <Disco />}
      {boom && <Fireworks />}
    </>
  );
}

export function ExtrasUI() {
  const nearSpot = useExtras((s) => s.nearSpot);
  const state = useExtras((s) => s.fishState);
  const coins = useExtras((s) => s.coins.length);
  const locked = useTownStore((s) => s.locked);
  const intro = useTownStore((s) => s.introActive);
  const inside = useTownStore((s) => s.insideId);
  if (!locked || intro || inside) return null;
  return (
    <>
      <div className="coin-pill" title="Commits collected">
        ◎ {coins}/{COINS.length}
      </div>
      {nearSpot && (
        <div className={`relic-prompt ${state === "bite" ? "bite" : ""}`}>
          {state === "idle" && (
            <>
              <kbd>E</kbd> cast a fishing line
            </>
          )}
          {state === "wait" && (
            <>
              Waiting for a bite… (<kbd>E</kbd> reels too early)
            </>
          )}
          {state === "bite" && (
            <>
              <kbd>E</kbd> REEL IT IN!
            </>
          )}
        </div>
      )}
    </>
  );
}
