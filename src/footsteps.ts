export type FootstepSurface = "dry" | "wet" | "snow";

export type FootstepEvent = {
  x: number;
  z: number;
  heading: number;
  surface: Exclude<FootstepSurface, "dry">;
};

const listeners = new Set<(event: FootstepEvent) => void>();

export function emitFootstepEffect(event: FootstepEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeFootsteps(listener: (event: FootstepEvent) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
