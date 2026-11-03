import * as THREE from "three";

type HorizontalCollider = {
  contains: (x: number, z: number) => boolean;
};

const colliders: HorizontalCollider[] = [];

export function registerCollider(box: THREE.Box3) {
  const collider: HorizontalCollider = {
    contains: (x, z) => x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z,
  };
  colliders.push(collider);
  return () => {
    const i = colliders.indexOf(collider);
    if (i !== -1) colliders.splice(i, 1);
  };
}

export function registerOrientedCollider(
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfLength: number,
  rotationY: number,
) {
  const cosine = Math.cos(rotationY);
  const sine = Math.sin(rotationY);
  const collider: HorizontalCollider = {
    contains: (x, z) => {
      const dx = x - centerX;
      const dz = z - centerZ;
      const localX = dx * cosine - dz * sine;
      const localZ = dx * sine + dz * cosine;
      return Math.abs(localX) <= halfWidth && Math.abs(localZ) <= halfLength;
    },
  };
  colliders.push(collider);
  return () => {
    const index = colliders.indexOf(collider);
    if (index !== -1) colliders.splice(index, 1);
  };
}

// A moving oriented box (traffic); call `move` every frame.
export function registerMovingCollider(halfWidth: number, halfLength: number) {
  let cx = 1e6;
  let cz = 1e6;
  let cosine = 1;
  let sine = 0;
  const collider: HorizontalCollider = {
    contains: (x, z) => {
      const dx = x - cx;
      const dz = z - cz;
      return Math.abs(dx * cosine - dz * sine) <= halfWidth && Math.abs(dx * sine + dz * cosine) <= halfLength;
    },
  };
  colliders.push(collider);
  return {
    move(x: number, z: number, rotationY: number) {
      cx = x;
      cz = z;
      cosine = Math.cos(rotationY);
      sine = Math.sin(rotationY);
    },
    dispose() {
      const index = colliders.indexOf(collider);
      if (index !== -1) colliders.splice(index, 1);
    },
  };
}

export function collidesAt(x: number, z: number): boolean {
  for (const box of colliders) {
    if (box.contains(x, z)) return true;
  }
  return false;
}
