import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import { useTownStore } from "../store";
import { buildings, type SectionId } from "../content";
import { collidesAt } from "../collision";
import { audio } from "../audio";
import * as THREE from "three";

const WALK_SPEED = 7.5;
const RUN_SPEED = 12.5;
const TOWN_RADIUS = 34;
const INTERACT_DIST = 6;
const INTERACT_DIST_INDOOR = 2.2;
const EYE_HEIGHT = 1.35;
const ROOM_BOUND_X = 4.6;
const ROOM_BOUND_Z = 3.7;
const JUMP_VELOCITY = 4.6;
const GRAVITY = 13;
const BOB_AMPLITUDE = 0.045;

export default function Player() {
  const controlsRef = useRef<PointerLockControlsImpl>(null);
  const { camera } = useThree();
  const keys = useRef({ f: false, b: false, l: false, r: false, sprint: false });
  const prevInsideId = useRef<SectionId | null>(null);
  const jumpOffset = useRef(0);
  const jumpVelocity = useRef(0);
  const bobPhase = useRef(0);
  const stepCount = useRef(0);
  const viewDirection = useRef(new THREE.Vector3());

  const setLocked = useTownStore((s) => s.setLocked);
  const setStarted = useTownStore((s) => s.setStarted);
  const setNearbyId = useTownStore((s) => s.setNearbyId);
  const setNearbyItemId = useTownStore((s) => s.setNearbyItemId);
  const openSection = useTownStore((s) => s.openSection);
  const enterHouse = useTownStore((s) => s.enterHouse);
  const exitHouse = useTownStore((s) => s.exitHouse);
  const insideId = useTownStore((s) => s.insideId);
  const interiorItems = useTownStore((s) => s.interiorItems);

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 8);
    camera.lookAt(0, EYE_HEIGHT, -11);
    if (import.meta.env.DEV) {
      (window as unknown as { __camera: THREE.Camera }).__camera = camera;
    }
  }, [camera]);

  // teleport on house enter/exit, after React has committed the swapped
  // Outdoor/Interior subtree so the new room's geometry actually exists
  useEffect(() => {
    if (insideId) {
      camera.position.set(0, EYE_HEIGHT, 2.5);
      camera.lookAt(0, EYE_HEIGHT, -10);
    } else if (prevInsideId.current) {
      const def = buildings.find((b) => b.id === prevInsideId.current)!;
      const facingY = Math.atan2(def.position[0], def.position[2]);
      const dist = Math.hypot(def.position[0], def.position[2]) - 4;
      camera.position.set(Math.sin(facingY) * dist, EYE_HEIGHT, Math.cos(facingY) * dist);
      camera.lookAt(0, EYE_HEIGHT, 0);
    }
    prevInsideId.current = insideId;
  }, [insideId, camera]);

  useEffect(() => {
    const requestLock = () => controlsRef.current?.lock();
    window.addEventListener("request-town-lock", requestLock);
    return () => window.removeEventListener("request-town-lock", requestLock);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.f = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.b = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.l = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.r = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = true;
          break;
        case "Space":
          if (jumpOffset.current === 0 && controlsRef.current?.isLocked) {
            jumpVelocity.current = JUMP_VELOCITY;
            jumpOffset.current = 0.001;
          }
          break;
        case "KeyE":
        case "Enter": {
          const { nearbyId, activeSection, insideId, nearbyItemId, interiorItems } = useTownStore.getState();
          if (activeSection) break;
          if (insideId) {
            if (nearbyItemId === "__exit__") {
              exitHouse();
            } else if (nearbyItemId) {
              const item = interiorItems.find((it) => it.itemId === nearbyItemId);
              if (item) {
                openSection(insideId, item.index);
                controlsRef.current?.unlock();
              }
            }
          } else if (nearbyId) {
            enterHouse(nearbyId);
          }
          break;
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.f = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.b = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.l = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.r = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = false;
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [openSection, enterHouse, exitHouse]);

  useFrame((state, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls || !controls.isLocked) return;
    const cam = state.camera;
    const k = keys.current;
    const delta = Math.min(rawDelta, 0.05);
    const running = k.sprint;
    const step = (running ? RUN_SPEED : WALK_SPEED) * delta;

    const tryAxis = (move: () => void) => {
      const prevX = cam.position.x;
      const prevZ = cam.position.z;
      // if already inside a collider (clipped in somehow), never block the move —
      // otherwise every small step stays inside and reverts, trapping the player
      const wasStuck = collidesAt(prevX, prevZ);
      move();
      const { x, z } = cam.position;
      const outOfBounds = insideId
        ? Math.abs(x) > ROOM_BOUND_X || Math.abs(z) > ROOM_BOUND_Z
        : Math.hypot(x, z) > TOWN_RADIUS;
      if (outOfBounds || (!wasStuck && collidesAt(x, z))) {
        cam.position.x = prevX;
        cam.position.z = prevZ;
      }
    };

    if (k.f) tryAxis(() => controls.moveForward(step));
    if (k.b) tryAxis(() => controls.moveForward(-step));
    if (k.r) tryAxis(() => controls.moveRight(step));
    if (k.l) tryAxis(() => controls.moveRight(-step));

    // jump arc
    if (jumpOffset.current > 0) {
      jumpVelocity.current -= GRAVITY * delta;
      jumpOffset.current = Math.max(jumpOffset.current + jumpVelocity.current * delta, 0);
      if (jumpOffset.current === 0) {
        jumpVelocity.current = 0;
        audio.footstep(true); // landing thud
      }
    }

    // head bob while walking on the ground, with a footstep at each trough
    const moving = k.f || k.b || k.l || k.r;
    let bob = 0;
    if (moving && jumpOffset.current === 0) {
      bobPhase.current += delta * (running ? 11 : 7.5);
      bob = Math.sin(bobPhase.current) * BOB_AMPLITUDE * (running ? 1.4 : 1);
      const count = Math.floor(bobPhase.current / Math.PI);
      if (count !== stepCount.current) {
        stepCount.current = count;
        audio.footstep(running);
      }
    }

    cam.position.y = EYE_HEIGHT + jumpOffset.current + bob;

    if (import.meta.env.DEV) {
      (window as unknown as { __playerPos: number[] }).__playerPos = [
        cam.position.x,
        cam.position.z,
      ];
    }

    if (insideId) {
      cam.getWorldDirection(viewDirection.current);
      let closest: string | null = null;
      let closestDist = Infinity;
      for (const it of interiorItems) {
        const dx = it.position[0] - cam.position.x;
        const dz = it.position[2] - cam.position.z;
        const dist = Math.hypot(dx, dz);
        const facing = dist > 0 ? (viewDirection.current.x * dx + viewDirection.current.z * dz) / dist : 1;
        if (dist < INTERACT_DIST_INDOOR && facing > 0.15 && dist < closestDist) {
          closestDist = dist;
          closest = it.itemId;
        }
      }
      setNearbyItemId(closest);
    } else {
      cam.getWorldDirection(viewDirection.current);
      let closestId: SectionId | null = null;
      let closestDist = Infinity;
      for (const b of buildings) {
        const dx = b.position[0] - cam.position.x;
        const dz = b.position[2] - cam.position.z;
        const dist = Math.hypot(dx, dz);
        const facing = dist > 0 ? (viewDirection.current.x * dx + viewDirection.current.z * dz) / dist : 1;
        if (dist < INTERACT_DIST && facing > 0.2 && dist < closestDist) {
          closestDist = dist;
          closestId = b.id;
        }
      }
      setNearbyId(closestId);
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      selector="#town-pointer-lock-only"
      onLock={() => {
        audio.ensure(); // browsers only allow audio after a user gesture
        setStarted(true);
        setLocked(true);
      }}
      onUnlock={() => setLocked(false)}
    />
  );
}
