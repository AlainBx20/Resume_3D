import * as THREE from "three";

const colliders: THREE.Box3[] = [];

export function registerCollider(box: THREE.Box3) {
  colliders.push(box);
  return () => {
    const i = colliders.indexOf(box);
    if (i !== -1) colliders.splice(i, 1);
  };
}

export function collidesAt(x: number, z: number): boolean {
  for (const box of colliders) {
    if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) {
      return true;
    }
  }
  return false;
}
