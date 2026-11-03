export const POND_CENTER = { x: 17.5, z: 0 };

export function insidePondClearance(x: number, z: number, padding = 0) {
  const radiusX = 5.3 + padding;
  const radiusZ = 4 + padding;
  const dx = (x - POND_CENTER.x) / radiusX;
  const dz = (z - POND_CENTER.z) / radiusZ;
  return dx * dx + dz * dz < 1;
}
