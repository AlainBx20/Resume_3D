import { useMemo, useSyncExternalStore } from "react";
import * as THREE from "three";
import { WORLD_FONT } from "../content";

// troika's <Text> (drei) injects its SDF shader through onBeforeCompile, which
// WebGPURenderer cannot compile — it draws a blank quad. This label renders the
// same pixel font to a CanvasTexture on a plane, so it looks identical on the
// WebGPU backend and the WebGL2 fallback. Same layout props as the old <Text>.

const FAMILY = "KenWorld";
const PX_PER_UNIT = 240; // canvas resolution per world unit — crisp at sign distance
const PAD = 0.12; // world-unit padding baked around the text so outlines/edges fit

// --- one shared font load, surfaced to React without re-rendering on every frame
let fontState: "pending" | "ready" = "pending";
const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}
if (typeof document !== "undefined" && "fonts" in document) {
  const face = new FontFace(FAMILY, `url(${WORLD_FONT})`);
  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      fontState = "ready";
      notify();
    })
    .catch(() => {
      // fall back to the canvas default family; still legible
      fontState = "ready";
      notify();
    });
} else {
  fontState = "ready";
}
function useFontReady() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => fontState === "ready",
    () => true
  );
}

export interface WorldTextProps {
  children: string;
  fontSize: number; // world units, line height
  color?: string;
  maxWidth?: number; // world units; wraps words to fit
  textAlign?: "left" | "center" | "right";
  outlineWidth?: number; // world units
  outlineColor?: string;
  position?: [number, number, number];
  "rotation-y"?: number;
  renderOrder?: number;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string[] {
  if (!maxPx || maxPx === Infinity) return text.split("\n");
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxPx && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

export default function WorldText({
  children,
  fontSize,
  color = "#ffffff",
  maxWidth,
  textAlign = "center",
  outlineWidth = 0,
  outlineColor = "#000000",
  position,
  "rotation-y": rotationY,
  renderOrder,
}: WorldTextProps) {
  const ready = useFontReady();

  const { texture, width, height } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fontPx = fontSize * PX_PER_UNIT;
    const outlinePx = outlineWidth * PX_PER_UNIT;
    const padPx = PAD * PX_PER_UNIT + outlinePx;
    const setFont = () => (ctx.font = `${fontPx}px "${FAMILY}", monospace`);
    setFont();

    const maxPx = maxWidth ? maxWidth * PX_PER_UNIT : Infinity;
    const lines = wrap(ctx, children, maxPx);
    const lineHeightPx = fontPx * 1.18;

    let textWidthPx = 0;
    for (const line of lines) textWidthPx = Math.max(textWidthPx, ctx.measureText(line).width);

    canvas.width = Math.max(2, Math.ceil(textWidthPx + padPx * 2));
    canvas.height = Math.max(2, Math.ceil(lines.length * lineHeightPx + padPx * 2));

    // canvas resets state on resize — restore and draw
    setFont();
    ctx.textBaseline = "middle";
    ctx.textAlign = textAlign;
    ctx.lineJoin = "round";
    const anchorX =
      textAlign === "left" ? padPx : textAlign === "right" ? canvas.width - padPx : canvas.width / 2;

    lines.forEach((line, i) => {
      const y = padPx + (i + 0.5) * lineHeightPx;
      if (outlinePx > 0) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlinePx * 2;
        ctx.strokeText(line, anchorX, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, anchorX, y);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    return {
      texture: tex,
      width: canvas.width / PX_PER_UNIT,
      height: canvas.height / PX_PER_UNIT,
    };
    // `ready` forces one rebuild once the pixel font has loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, fontSize, color, maxWidth, textAlign, outlineWidth, outlineColor, ready]);

  return (
    <mesh position={position} rotation-y={rotationY} renderOrder={renderOrder}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        toneMapped={false}
        depthWrite={false}
        alphaTest={0.04}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
