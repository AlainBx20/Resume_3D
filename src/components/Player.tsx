import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import { useTownStore } from "../store";
import { buildings, type SectionId } from "../content";
import { collidesAt } from "../collision";
import { audio } from "../audio";
import { ART_QUOTES } from "../achievements";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { emitFootstepEffect, type FootstepSurface } from "../footsteps";
import { duckWorld, mother } from "../ducks";
import { POND_CENTER } from "../landmarks";

const WALK_SPEED = 7.5;
const RUN_SPEED = 12.5;
const TOWN_RADIUS = 42;
const INTERACT_DIST = 6;
const INTERACT_DIST_INDOOR = 2.2;
const EYE_HEIGHT = 1.35;
const ROOM_BOUND_X = 4.6;
const ROOM_BOUND_Z = 3.7;
const JUMP_VELOCITY = 4.6;
const GRAVITY = 13;
const BOB_AMPLITUDE = 0.045;
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

function nearestDuck(cam: THREE.Camera, view: THREE.Vector3) {
  for (const d of duckWorld) {
    const dx = d.x - cam.position.x;
    const dz = d.z - cam.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0 && dist < 6.5 && (view.x * dx + view.z * dz) / dist > 0.8) return true;
  }
  return false;
}

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
  const moveForward = useRef(new THREE.Vector3());
  const moveRight = useRef(new THREE.Vector3());
  const moveDelta = useRef(new THREE.Vector3());
  const navigationTimer = useRef(0);
  const moonGaze = useRef(0);
  const lookMatrix = useRef(new THREE.Matrix4());
  const lookQuat = useRef(new THREE.Quaternion());
  const lookTarget = useRef(new THREE.Vector3());
  const konami = useRef<string[]>([]);
  const distanceWalked = useRef(0);
  const sprintDistance = useRef(0);
  const jumpCount = useRef(0);
  const fountainTime = useRef(0);
  const plazaTime = useRef(0);
  const moonBathTime = useRef(0);

  const setLocked = useTownStore((s) => s.setLocked);
  const setStarted = useTownStore((s) => s.setStarted);
  const setNearbyId = useTownStore((s) => s.setNearbyId);
  const setNearbyItemId = useTownStore((s) => s.setNearbyItemId);
  const setNavigation = useTownStore((s) => s.setNavigation);
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
      if (useTownStore.getState().introActive) {
        if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") window.dispatchEvent(new Event("skip-intro"));
        return;
      }
      konami.current = [...konami.current, e.code].slice(-KONAMI.length);
      if (konami.current.join() === KONAMI.join() && useTownStore.getState().insideId) {
        konami.current = [];
        useTownStore.getState().toggleParty();
      }
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
            jumpCount.current += 1;
            if (jumpCount.current >= 12) useTownStore.getState().unlock("bunny-hopper");
          }
          break;
        case "KeyE":
        case "Enter": {
          const { nearbyId, activeSection, activeProp, insideId, nearbyItemId, interiorItems } = useTownStore.getState();
          if (useTownStore.getState().duckScene) {
            useTownStore.getState().advanceDuckScene();
            break;
          }
          if (useTownStore.getState().vaultOpen) break;
          if (activeSection || activeProp) break;
          if (!insideId && useTownStore.getState().nearbyDuck) {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            mother.x = camera.position.x + dir.x * 3.4;
            mother.z = camera.position.z + dir.z * 3.4;
            useTownStore.getState().startDuckScene();
            break;
          }
          if (insideId) {
            if (nearbyItemId === "__exit__") {
              exitHouse();
            } else if (nearbyItemId) {
              const item = interiorItems.find((it) => it.itemId === nearbyItemId);
              const store = useTownStore.getState();
              if (item?.kind === "part") {
                store.collectPart(item.itemId.replace("part-", ""));
              } else if (item?.kind === "brokenpc") {
                store.pokeBrokenPc();
                if (useTownStore.getState().vaultOpen) controlsRef.current?.unlock();
              } else if (item?.kind === "tv") {
                audio.tvSwitch(!store.tvOn);
                store.toggleTv();
              } else if (item?.kind === "radio") {
                store.toggleRadio();
                audio.uiClick();
              } else if (item?.kind === "light") {
                audio.lightSwitch();
                store.toggleRoomLight();
              } else if (item?.kind === "clock") {
                const now = new Date();
                audio.chime(now.getHours() % 12 || 12);
                store.showToast(`🕒 It's ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
                store.unlock("punctual");
              } else if (item?.kind === "fire") {
                store.toggleFire();
                audio.uiClick();
              } else if (item?.kind === "star") {
                store.collectStar(item.itemId);
              } else if (item?.kind === "art") {
                store.showToast(`🖼 ${ART_QUOTES[Math.floor(Math.random() * ART_QUOTES.length)]}`);
                store.unlock("art-critic");
              } else if (item?.kind === "book" || item?.kind === "pc") {
                store.openProp({ kind: item.kind, section: insideId, index: item.index });
                controlsRef.current?.unlock();
              } else if (item) {
                openSection(insideId, item.index);
                controlsRef.current?.unlock();
              }
            }
          } else if (nearbyId) {
            enterHouse(nearbyId);
          }
          break;
        }
        case "KeyC": {
          const store = useTownStore.getState();
          if (!store.insideId || store.activeProp || store.activeSection) break;
          const near = store.interiorItems.find((it) => it.itemId === store.nearbyItemId);
          if (near?.kind === "tv" && store.tvOn) {
            store.nextTvChannel();
            audio.tvSwitch(true);
          } else if (near?.kind === "radio" && store.radioOn) {
            store.nextRadioStation();
            audio.uiClick();
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
  }, [openSection, enterHouse, exitHouse, camera]);

  useFrame((state, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls || !controls.isLocked) return;
    // the arrival cutscene owns the camera until it ends
    if (useTownStore.getState().introActive) return;
    const cam = state.camera;
    if (useTownStore.getState().duckScene) {
      // cutscene: no walking, the camera turns to face the angry mother
      lookTarget.current.set(mother.x, 0.9, mother.z);
      lookMatrix.current.lookAt(cam.position, lookTarget.current, THREE.Object3D.DEFAULT_UP);
      lookQuat.current.setFromRotationMatrix(lookMatrix.current);
      cam.quaternion.slerp(lookQuat.current, 1 - Math.exp(-6 * Math.min(rawDelta, 0.05)));
      return;
    }
    const k = keys.current;
    const delta = Math.min(rawDelta, 0.05);
    const running = k.sprint;
    const step = (running ? RUN_SPEED : WALK_SPEED) * delta;
    const surface: FootstepSurface = insideId
      ? "dry"
      : atm.snow > 0.16 || atm.snowCover > 0.08
        ? "snow"
        : atm.rain > 0.18 || atm.wetness > 0.12
          ? "wet"
          : "dry";
    const leaveSurfaceTrace = () => {
      if (insideId || surface === "dry") return;
      cam.getWorldDirection(viewDirection.current);
      emitFootstepEffect({
        x: cam.position.x,
        z: cam.position.z,
        heading: Math.atan2(viewDirection.current.x, -viewDirection.current.z),
        surface,
      });
      useTownStore.getState().unlock(surface === "wet" ? "wet-feet" : "fresh-powder");
    };

    // Build one horizontal movement vector, then resolve X and Z separately.
    // The old controls moved both axes at once and reverted the whole step on
    // contact, which made diagonal approaches feel like broad invisible walls.
    cam.getWorldDirection(moveForward.current);
    moveForward.current.y = 0;
    moveForward.current.normalize();
    moveRight.current.crossVectors(moveForward.current, THREE.Object3D.DEFAULT_UP).normalize();
    moveDelta.current
      .set(0, 0, 0)
      .addScaledVector(moveForward.current, Number(k.f) - Number(k.b))
      .addScaledVector(moveRight.current, Number(k.r) - Number(k.l));

    const beforeMoveX = cam.position.x;
    const beforeMoveZ = cam.position.z;
    if (moveDelta.current.lengthSq() > 0) {
      moveDelta.current.normalize().multiplyScalar(step);
      const startedInsideCollider = collidesAt(cam.position.x, cam.position.z);
      const canStandAt = (x: number, z: number) => {
        const tunnelApproach = !insideId && Math.abs(x) < 2.15 && z > 38 && z < 44;
        const outOfBounds = insideId
          ? Math.abs(x) > ROOM_BOUND_X || Math.abs(z) > ROOM_BOUND_Z
          : Math.hypot(x, z) > TOWN_RADIUS && !tunnelApproach;
        return !outOfBounds && (startedInsideCollider || !collidesAt(x, z));
      };

      const nextX = cam.position.x + moveDelta.current.x;
      if (canStandAt(nextX, cam.position.z)) cam.position.x = nextX;
      const nextZ = cam.position.z + moveDelta.current.z;
      if (canStandAt(cam.position.x, nextZ)) cam.position.z = nextZ;
    }
    if (!insideId) {
      const travelled = Math.hypot(cam.position.x - beforeMoveX, cam.position.z - beforeMoveZ);
      distanceWalked.current += travelled;
      if (running) sprintDistance.current += travelled;
      const town = useTownStore.getState();
      if (distanceWalked.current >= 250) town.unlock("wanderer");
      if (distanceWalked.current >= 1000) town.unlock("globetrotter");
      if (sprintDistance.current >= 120) town.unlock("sprinter");
      if (Math.hypot(cam.position.x, cam.position.z) > 38) town.unlock("edge-of-town");
    }

    // jump arc
    if (jumpOffset.current > 0) {
      jumpVelocity.current -= GRAVITY * delta;
      jumpOffset.current = Math.max(jumpOffset.current + jumpVelocity.current * delta, 0);
      if (jumpOffset.current === 0) {
        jumpVelocity.current = 0;
        audio.footstep(true, surface);
        leaveSurfaceTrace();
        if (!insideId && surface === "wet") useTownStore.getState().unlock("puddle-jumper");
        if (!insideId && surface === "snow") useTownStore.getState().unlock("snow-hopper");
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
        audio.footstep(running, surface);
        leaveSurfaceTrace();
      }
    }

    cam.position.y = EYE_HEIGHT + jumpOffset.current + bob;

    navigationTimer.current += delta;
    if (navigationTimer.current >= 0.1) {
      navigationTimer.current = 0;
      cam.getWorldDirection(viewDirection.current);
      setNavigation(
        cam.position.x,
        cam.position.z,
        Math.atan2(viewDirection.current.x, -viewDirection.current.z),
      );
    }

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
      useTownStore.getState().setNearbyDuck(nearestDuck(cam, viewDirection.current));

      if (Math.hypot(cam.position.x - POND_CENTER.x, cam.position.z - POND_CENTER.z) < 9) {
        useTownStore.getState().unlock("pond-visitor");
      }
      if (atm.day < 0.15) useTownStore.getState().unlock("night-owl");
      const plazaDistance = Math.hypot(cam.position.x, cam.position.z);
      fountainTime.current = plazaDistance < 5.8 ? fountainTime.current + delta : 0;
      if (plazaDistance < 9.5) plazaTime.current += delta;
      if (fountainTime.current > 12) useTownStore.getState().unlock("fountain-friend");
      if (plazaTime.current > 30) useTownStore.getState().unlock("plaza-regular");
      if (atm.day < 0.15 && atm.moonDir.y > 0.15 && atm.overcast < 0.4) {
        moonBathTime.current += delta;
        if (moonBathTime.current > 12) useTownStore.getState().unlock("moonbather");
      } else {
        moonBathTime.current = 0;
      }
      const toMoon = atm.moonDir;
      if (toMoon.y > 0.15 && atm.overcast < 0.6 && viewDirection.current.dot(toMoon) > 0.96) {
        moonGaze.current += delta;
        if (moonGaze.current > 4) useTownStore.getState().unlock("moon-gazer");
      } else {
        moonGaze.current = 0;
      }
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      selector="#town-pointer-lock-only"
      onLock={() => {
        audio.ensure(); // browsers only allow audio after a user gesture
        const town = useTownStore.getState();
        if (!town.started && !new URLSearchParams(window.location.search).has("nointro")) town.startIntro();
        setStarted(true);
        setLocked(true);
      }}
      onUnlock={() => setLocked(false)}
    />
  );
}
